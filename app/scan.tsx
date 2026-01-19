import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useState, useRef } from 'react';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ReceiptRepository } from '../lib/repository';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../lib/supabase';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<any>(null); // Type 'any' used to bypass strict ref typing issues for now
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View className='flex-1 justify-center items-center bg-gray-950 p-6'>
        <Text className='text-white text-center mb-4'>We need camera access to scan receipts.</Text>
        <TouchableOpacity onPress={requestPermission} className='bg-blue-600 px-6 py-3 rounded-full'>
          <Text className='text-white font-bold'>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
      // 1. Call Edge Function to analyze
      const { data, error } = await supabase.functions.invoke('analyze-receipt', {
        body: { image: base64 },
      });

      if (error) throw error;
      
      const receiptData = data?.ui_preview; // Assuming edge function returns this shape
      
      if (!receiptData) throw new Error('No data returned');

      // 2. Save to local DB
      const receiptId = crypto.randomUUID();
      await ReceiptRepository.create({
        id: receiptId,
        merchant: receiptData.merchant || 'Unknown Merchant',
        date: receiptData.date || new Date().toISOString(),
        total: receiptData.total || 0,
        subtotal: receiptData.subtotal,
        tax: receiptData.tax,
        imageUrl: uri,
        rawOcr: JSON.stringify(receiptData),
        syncStatus: 'pending',
      }, receiptData.lineItems?.map((item: any) => ({
        id: crypto.randomUUID(),
        receiptId: receiptId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        category: item.type || 'other',
      })) || []);

      setIsProcessing(false);
      router.replace('/'); // Go back home
      
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to process receipt. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <View className='flex-1 bg-black'>
      <CameraView 
        style={{ flex: 1 }} 
        facing={facing} 
        flash={flash}
        ref={cameraRef}
      >
        <View className='flex-1 bg-transparent'>
          {/* Header Controls */}
          <View className='flex-row justify-between p-6 mt-10'>
             <TouchableOpacity onPress={() => router.back()} className='bg-black/40 p-3 rounded-full'>
                <Feather name='x' size={24} color='white' />
             </TouchableOpacity>
             <TouchableOpacity 
               onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')} 
               className='bg-black/40 p-3 rounded-full'
             >
                <Feather name={flash === 'on' ? 'zap' : 'zap-off'} size={24} color={flash === 'on' ? '#fbbf24' : 'white'} />
             </TouchableOpacity>
          </View>

          {/* Capture Controls */}
          <View className='flex-1 justify-end pb-20 items-center'>
            {isProcessing ? (
              <View className='bg-black/80 p-6 rounded-2xl items-center'>
                <ActivityIndicator size='large' color='#3b82f6' />
                <Text className='text-white mt-4 font-semibold'>Analyzing Receipt...</Text>
              </View>
            ) : (
                <View className='flex-row items-center w-full justify-evenly px-10'>
                    <TouchableOpacity onPress={pickImage} className='bg-black/40 p-4 rounded-full'>
                         <Feather name='image' size={28} color='white' />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        onPress={handleCapture}
                        className='w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg'
                    />

                    <View className='w-14' /> {/* Spacer for symmetry */}
                </View>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}
