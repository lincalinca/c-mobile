import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, Animated, PanResponder, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { callSupabaseFunction } from '../lib/supabase';
import { ProcessingWithAdView } from '../components/processing/ProcessingWithAdView';
import { TransactionRepository } from '../lib/repository';
import { recordScan, hasScansRemaining } from '../lib/usageTracking';

const isAndroid = Platform.OS === 'android';

// On Android, delay (ms) after onCameraReady before allowing capture. Some devices need the preview to stabilize.
const ANDROID_READY_DELAY_MS = 450;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>((Platform.OS as any) === 'web' ? 'front' : 'back' as any);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingResults, setProcessingResults] = useState<{ data: any; uri: string } | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Clear ready delay on unmount
  useEffect(() => {
    return () => {
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    };
  }, []);

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
    if (!cameraReady || isProcessing) {
      if (!cameraReady) {
        console.warn('[Scan] Camera not ready yet');
      }
      return;
    }
    
    // Capture camera ref before any async operations
    const currentCameraRef = cameraRef.current;
    if (!currentCameraRef) {
      console.warn('[Scan] Camera ref not available');
      Alert.alert('Camera Error', 'Camera is not ready. Please try again.');
      return;
    }
    
    setIsProcessing(true);
    try {
      // Use the captured ref directly - don't check cameraRef.current again as it might change
      // On Android: request base64 directly (more reliable than reading from file)
      // On iOS: also request base64 directly
      const photo = await currentCameraRef.takePictureAsync({
        quality: isAndroid ? 0.6 : 0.8,
        base64: true, // Request base64 directly for all platforms
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('takePictureAsync returned null');
      }

      if (!photo.uri) {
        throw new Error('takePictureAsync returned no uri');
      }

      // Get base64 - prefer from photo, fallback to reading file
      let base64 = photo.base64;
      
      if (!base64 && photo.uri) {
        console.log('[Scan] Base64 not in photo, reading from file...');
        try {
          base64 = await readAsStringAsync(photo.uri, { encoding: EncodingType.Base64 });
        } catch (e) {
          console.error('[Scan] Base64 fallback error:', e);
          throw new Error(`Failed to read image data: ${e instanceof Error ? e.message : String(e)}`);
        }
      }

      if (!base64) {
        throw new Error('Could not get image data (no base64 and file read failed)');
      }

      console.log('[Scan] Image captured successfully, processing...');
      await processImage(photo.uri, base64);
    } catch (e) {
      console.error('[Scan] Capture error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      Alert.alert(
        'Capture Failed', 
        `Failed to capture image: ${errorMessage}\n\nPlease try again or use the Upload button to select an image from your gallery.`,
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      setProcessingResults(null);
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
    if (!base64) {
      setIsProcessing(false);
      setProcessingResults(null);
      return;
    }
    
    // Check if user has scans remaining (including bonus scans)
    const hasQuota = await hasScansRemaining();
    if (!hasQuota) {
      setIsProcessing(false);
      setProcessingResults(null);
      Alert.alert(
        'No Scans Remaining',
        'You\'ve used all your scans for this week. Watch an ad to get 10 more scans.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Get More Scans', 
            onPress: () => router.push('/get-more-scans'),
            style: 'default'
          }
        ]
      );
      return;
    }

    setIsProcessing(true);
    setProcessingResults(null); // Clear previous results
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

      // Record successful scan
      await recordScan();

      // Store results - this will enable the Review button
      setProcessingResults({
        data: receiptData,
        uri: uri
      });
    } catch (e) {
      console.error('Processing error:', e);
      setIsProcessing(false);
      setProcessingResults(null);
      Alert.alert('Analysis Failed', 'We couldn\'t process this receipt.');
    }
  };

  const handleReview = () => {
    if (!processingResults) return;
    
    setIsProcessing(false);
    router.push({
      pathname: '/review' as any,
      params: {
        data: JSON.stringify(processingResults.data),
        uri: processingResults.uri
      }
    });
    // Clear results after navigation
    setProcessingResults(null);
  };

  if (!permission) {
    return (
      <View className='flex-1 bg-crescender-950 justify-center items-center' style={{ paddingTop: insets.top }}>
        <ActivityIndicator size='large' color='#8b5cf6' />
      </View>
    );
  }

  const shouldShowCamera = (Platform.OS === 'web' ? hasWebPermission : permission?.granted) && !showPermissionModal;

  if (isProcessing) {
    return (
      <ProcessingWithAdView 
        onReview={handleReview}
        resultsReady={processingResults !== null}
      />
    );
  }

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
            onCameraReady={() => {
              console.log('[Scan] Camera ready');
              // On Android, delay before allowing capture so the preview can stabilize (avoids "Failed to capture image" on some devices).
              if (isAndroid) {
                if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
                readyTimeoutRef.current = setTimeout(() => {
                  readyTimeoutRef.current = null;
                  setCameraReady(true);
                  console.log('[Scan] Camera ready (Android delay complete)');
                }, ANDROID_READY_DELAY_MS);
              } else {
                setCameraReady(true);
                console.log('[Scan] Camera ready (iOS/Web)');
              }
            }}
            onMountError={(error) => {
              console.error('[Scan] Camera mount error:', error);
              Alert.alert('Camera Error', 'Failed to initialize camera. Please try restarting the app.');
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
