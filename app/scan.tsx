import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, Animated, PanResponder, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { callSupabaseFunction } from '../lib/supabase';
import { ProcessingView } from '../components/processing/ProcessingView';
import { TransactionRepository } from '../lib/repository';

const isAndroid = Platform.OS === 'android';

// Cap capture at ~1080p to reduce memory, disk, and bandwidth. Receipt OCR is fine at 720p–1080p.
const MAX_PIXELS = 1920 * 1080; // 2,073,600
const MIN_PIXELS = 640 * 480;   // 307,200 — minimum usable for receipt text

function choosePictureSize(sizes: string[]): string | null {
  if (!sizes.length) return null;
  const parsed = sizes
    .map((s) => {
      const m = s.match(/^(\d+)\s*[x×]\s*(\d+)$/i);
      return m ? { s, w: parseInt(m[1], 10), h: parseInt(m[2], 10) } : null;
    })
    .filter((p): p is { s: string; w: number; h: number } => p != null);
  if (!parsed.length) return null;
  const under = parsed.filter((p) => p.w * p.h <= MAX_PIXELS && p.w * p.h >= MIN_PIXELS);
  if (under.length) return under.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b)).s;
  const over = parsed.filter((p) => p.w * p.h > MAX_PIXELS);
  if (over.length) return over.reduce((a, b) => (a.w * a.h <= b.w * b.h ? a : b)).s;
  return parsed.reduce((a, b) => (a.w * a.h >= b.w * b.h ? a : b)).s;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>((Platform.OS as any) === 'web' ? 'front' : 'back' as any);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [cameraReady, setCameraReady] = useState(false);
  const [pictureSize, setPictureSize] = useState<string | null>(null);
  const pictureSizeChosenRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Safe navigation back - goes to home if no history
  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const [hasWebPermission, setHasWebPermission] = useState(false);

  // Adjustable Frame Logic
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 50 })).current; // Default lower on screen
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: () => {
        pan.flattenOffset();
      },
    })
  ).current;

  // Check permission on mount and show modal if needed
  useEffect(() => {
    if (permission && !permission.granted && !showPermissionModal && Platform.OS !== 'web') {
      setShowPermissionModal(true);
    }
    if (Platform.OS === 'web' && !hasWebPermission && !showPermissionModal) {
      setShowPermissionModal(true);
    }
  }, [permission, showPermissionModal, hasWebPermission]);

  // Reset cameraReady when facing or flash changes so we only capture after onCameraReady fires again
  useEffect(() => {
    setCameraReady(false);
  }, [facing, flash]);

  const handleRequestPermission = async () => {
    if (Platform.OS === 'web') {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          Alert.alert('Camera Unavailable', 'Camera is not supported in this browser.');
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } }
        });
        stream.getTracks().forEach(track => track.stop());
        setHasWebPermission(true);
        setShowPermissionModal(false);
      } catch (error: any) {
        console.error('Camera permission error:', error);
        Alert.alert('Camera Error', 'Unable to access camera.');
      }
    } else {
      const result = await requestPermission();
      if (result.granted) setShowPermissionModal(false);
      else Alert.alert('Camera Permission', 'Camera access is required.');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current || !cameraReady || isProcessing) return;
    setIsProcessing(true);
    try {
      // On Android: lower quality + resolution cap (pictureSize) to reduce memory, disk, and bandwidth.
      // On iOS: quality 0.7; we fall back to readAsStringAsync if base64 missing.
      const photo = await cameraRef.current.takePictureAsync({
        quality: isAndroid ? 0.4 : 0.7,
        base64: !isAndroid,
      });
      if (!photo?.uri) {
        console.error('[Scan] takePictureAsync returned no uri');
        Alert.alert('Error', 'Capture failed—no image was saved. Try again or use Upload.');
        return;
      }
      let base64 = photo.base64;
      if (!base64 && photo.uri) {
        try {
          base64 = await readAsStringAsync(photo.uri, { encoding: EncodingType.Base64 });
        } catch (e) {
          console.error('[Scan] Base64 fallback error:', e);
        }
      }
      if (!base64) {
        Alert.alert('Error', 'Could not get image data. Try again or use Upload.');
        return;
      }
      await processImage(photo.uri, base64);
    } catch (e) {
      console.error('[Scan] Capture error:', e);
      Alert.alert('Error', 'Failed to capture image. Try again or use Upload.');
    } finally {
      setIsProcessing(false);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      // Read file as base64
      const base64 = await readAsStringAsync(asset.uri, {
        encoding: EncodingType.Base64,
      });

      await processImage(asset.uri, base64);
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processImage = async (uri: string, base64: string | null | undefined) => {
    if (!base64) return;
    setIsProcessing(true);
    try {
      // Fetch existing merchants for matching
      const existingMerchants = await TransactionRepository.getUniqueMerchants();
      console.log(`[Scan] Found ${existingMerchants.length} existing merchants for matching`);

      const receiptData = await callSupabaseFunction<any>('analyze-receipt', {
        imageBase64: base64,
        existingMerchants: existingMerchants.map(m => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          suburb: m.suburb,
          abn: m.abn,
        })),
      });
      if (!receiptData || !receiptData.financial) throw new Error('Incomplete data');

      setIsProcessing(false);
      router.push({
        pathname: '/review' as any,
        params: {
          data: JSON.stringify(receiptData),
          uri: uri
        }
      });
    } catch (e) {
      console.error('Processing error:', e);
      Alert.alert('Analysis Failed', 'We couldn\'t process this receipt.');
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View className='flex-1 bg-crescender-950 justify-center items-center' style={{ paddingTop: insets.top }}>
        <ActivityIndicator size='large' color='#8b5cf6' />
      </View>
    );
  }

  const shouldShowCamera = (Platform.OS === 'web' ? hasWebPermission : permission?.granted) && !showPermissionModal;

  if (isProcessing) return <ProcessingView />;

  return (
    <>
      {/* Permission Modal */}
      <Modal visible={showPermissionModal} transparent={true} animationType="fade">
        <View className='flex-1 bg-black/80 justify-center items-center p-6' style={{ paddingTop: insets.top }}>
          <View className='bg-crescender-800/90 rounded-2xl p-8 items-center max-w-sm border border-crescender-700/50'>
            <Feather name='camera' size={64} color='#f5c518' className="mb-6" />
            <Text className='text-white text-center mb-2 text-2xl font-bold'>Camera Access Required</Text>
            <Text className='text-crescender-200 text-center mb-6 text-lg'>Grant camera access to scan receipts.</Text>
            <View className='flex-row gap-3 w-full'>
              <TouchableOpacity onPress={handleGoBack} className='flex-1 bg-crescender-800/50 px-6 py-4 rounded-full'><Text className='text-white font-semibold text-center'>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleRequestPermission} className='flex-1 bg-gold px-6 py-4 rounded-full'><Text className='text-crescender-950 font-bold text-center'>Grant</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {shouldShowCamera ? (
        <View className='flex-1 bg-black' style={{ paddingTop: insets.top }}>
          {/* CameraView must have no children: it can cause capture to fail on Android. Overlay is absolutely positioned on top. */}
          <CameraView
            style={{ flex: 1 }}
            facing={facing}
            flash={flash}
            ref={cameraRef}
            {...(isAndroid && pictureSize ? { pictureSize } : {})}
            onCameraReady={async () => {
              setCameraReady(true);
              if (isAndroid && !pictureSizeChosenRef.current && cameraRef.current?.getAvailablePictureSizesAsync) {
                pictureSizeChosenRef.current = true;
                try {
                  const sizes = await cameraRef.current.getAvailablePictureSizesAsync();
                  if (Array.isArray(sizes) && sizes.length) {
                    const chosen = choosePictureSize(sizes);
                    if (chosen) setPictureSize(chosen);
                  }
                } catch (e) {
                  console.warn('[Scan] getAvailablePictureSizesAsync failed:', e);
                }
              }
            }}
          />

          {/* Overlay: header, aperture frame, controls — positioned on top of camera */}
          <View
            pointerEvents="box-none"
            style={[StyleSheet.absoluteFill, { paddingTop: insets.top }]}
          >
            <View className="flex-1">
              {/* Header */}
              <View className="flex-row justify-between p-6 items-center">
                <TouchableOpacity onPress={handleGoBack} className='bg-black/40 p-3 rounded-full border border-white/20'>
                  <Feather name='x' size={24} color='white' />
                </TouchableOpacity>
                <Text className="text-white font-bold text-xl" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>SCAN RECEIPT</Text>
                {Platform.OS !== 'web' && (
                  <TouchableOpacity onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} className='bg-black/40 p-3 rounded-full border border-white/20'>
                    <Feather name={flash === 'on' ? 'zap' : 'zap-off'} size={24} color={flash === 'on' ? '#f5c518' : 'white'} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Adjustable Aperture */}
              <View className="flex-1 items-center px-6">
                <Animated.View
                  {...(panResponder.panHandlers as any)}
                  style={[
                    { transform: [{ translateX: pan.x }, { translateY: pan.y }] },
                    { width: '100%', aspectRatio: 3 / 4 }
                  ]}
                  className="border-2 border-gold rounded-3xl overflow-hidden relative"
                >
                  <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold m-4 rounded-tl-lg" />
                  <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold m-4 rounded-tr-lg" />
                  <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold m-4 rounded-bl-lg" />
                  <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold m-4 rounded-br-lg" />
                  <View className="absolute top-12 left-0 right-0 items-center">
                    <Text className="text-gold font-bold text-xs uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">ADJUST FRAME</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Controls */}
              <View className='justify-end items-center' style={{ paddingBottom: insets.bottom + 20 }}>
                <View className='flex-row items-center w-full justify-evenly px-10'>
                  <TouchableOpacity onPress={pickDocument} className='bg-black/40 p-4 rounded-full border border-white/20'><Feather name='upload' size={28} color='white' /></TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleCapture}
                    disabled={!cameraReady}
                    style={{ opacity: cameraReady ? 1 : 0.5 }}
                    className='w-20 h-20 bg-white rounded-full border-4 border-gold shadow-lg shadow-gold/30'
                  />
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} className='bg-black/40 p-4 rounded-full border border-white/20'><Feather name='refresh-cw' size={28} color='white' /></TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View className='flex-1 bg-crescender-950 justify-center items-center' style={{ paddingTop: insets.top }}>
          <ActivityIndicator size='large' color='#f5c518' />
        </View>
      )}
    </>
  );
}
