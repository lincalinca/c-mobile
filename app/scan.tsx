import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, Animated, PanResponder } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { ProcessingView } from '../components/processing/ProcessingView';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>((Platform.OS as any) === 'web' ? 'front' : 'back' as any);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const cameraRef = useRef<any>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      await processImage(photo.uri, photo.base64);
    } catch (e) {
      Alert.alert('Error', 'Failed to capture image');
      setIsProcessing(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0].base64) {
      await processImage(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const processImage = async (uri: string, base64: string | null | undefined) => {
    if (!base64) return;
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      const receiptData = data;
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
            <Text className='text-white text-center mb-2 text-xl font-bold'>Camera Access Required</Text>
            <Text className='text-crescender-200 text-center mb-6 text-base'>Grant camera access to scan receipts.</Text>
            <View className='flex-row gap-3 w-full'>
              <TouchableOpacity onPress={() => router.back()} className='flex-1 bg-crescender-800/50 px-6 py-4 rounded-full'><Text className='text-white font-semibold text-center'>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleRequestPermission} className='flex-1 bg-gold px-6 py-4 rounded-full'><Text className='text-crescender-950 font-bold text-center'>Grant</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {shouldShowCamera ? (
        <View className='flex-1 bg-black' style={{ paddingTop: insets.top }}>
          <CameraView style={{ flex: 1 }} facing={facing} flash={flash} ref={cameraRef}>
            <View className='flex-1 bg-transparent'>
              {/* Header */}
              <View className='flex-row justify-between p-6 items-center'>
                 <TouchableOpacity onPress={() => router.back()} className='bg-black/40 p-3 rounded-full border border-white/20'>
                    <Feather name='x' size={24} color='white' />
                 </TouchableOpacity>
                 <Text className="text-white font-bold text-lg" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>SCAN RECORD</Text>
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
                    { width: '100%', aspectRatio: 3/4 }
                  ]}
                  className="border-2 border-gold rounded-3xl overflow-hidden relative"
                >
                  <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gold m-4 rounded-tl-lg" />
                  <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gold m-4 rounded-tr-lg" />
                  <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gold m-4 rounded-bl-lg" />
                  <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gold m-4 rounded-br-lg" />
                  <View className="absolute top-12 left-0 right-0 items-center">
                    <Text className="text-gold font-bold text-[10px] uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">Drag Frame to Adjust</Text>
                  </View>
                </Animated.View>
              </View>

              {/* Controls */}
              <View className='flex-1 justify-end items-center' style={{ paddingBottom: insets.bottom + 20 }}>
                <View className='flex-row items-center w-full justify-evenly px-10'>
                    <TouchableOpacity onPress={pickImage} className='bg-black/40 p-4 rounded-full border border-white/20'><Feather name='image' size={28} color='white' /></TouchableOpacity>
                    <TouchableOpacity onPress={handleCapture} className='w-20 h-20 bg-white rounded-full border-4 border-gold shadow-lg shadow-gold/30' />
                    {Platform.OS !== 'web' && (
                      <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} className='bg-black/40 p-4 rounded-full border border-white/20'><Feather name='refresh-cw' size={28} color='white' /></TouchableOpacity>
                    )}
                </View>
              </View>
            </View>
          </CameraView>
        </View>
      ) : (
        <View className='flex-1 bg-crescender-950 justify-center items-center' style={{ paddingTop: insets.top }}>
          <ActivityIndicator size='large' color='#f5c518' />
        </View>
      )}
    </>
  );
}
