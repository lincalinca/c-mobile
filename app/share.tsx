import { useEffect, useState } from 'react';
import { View, Text, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { callSupabaseFunction } from '@lib/supabase';
import { TransactionRepository } from '@lib/repository';
import { ProcessingView } from '@components/processing/ProcessingView';
import * as Linking from 'expo-linking';

/**
 * Share handler for receiving images from other apps via share intent.
 * This screen processes the shared image and redirects to the review screen.
 *
 * Android: Uses intent launcher to get shared image URI
 * iOS: Uses URL scheme to receive shared images
 */
export default function ShareScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    handleSharedContent();
  }, []);

  const handleSharedContent = async () => {
    try {
      let imageUri: string | null = null;

      if (Platform.OS === 'android') {
        // Android: Get the intent that started the app
        const intent = await Linking.getInitialURL();

        if (!intent) {
          Alert.alert(
            'No Content',
            'No shared content found.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
          return;
        }

        // Extract the image URI from the intent
        // The intent should contain the image URI in the data field
        imageUri = intent;
      } else {
        // iOS: Handle URL scheme or other methods
        Alert.alert(
          'Not Yet Supported',
          'iOS share functionality is coming soon.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
        return;
      }

      if (!imageUri) {
        Alert.alert(
          'Invalid Content',
          'The shared content is not a valid image.',
          [{ text: 'OK', onPress: () => router.replace('/') }]
        );
        return;
      }

      // Show confirmation dialog
      Alert.alert(
        'Process Receipt?',
        'Do you want Crescender to read this receipt image using AI?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => router.replace('/')
          },
          {
            text: 'Analyse',
            onPress: () => processSharedImage(imageUri)
          }
        ]
      );
    } catch (error) {
      console.error('Error handling shared content:', error);
      Alert.alert(
        'Error',
        'Failed to process shared content.',
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    }
  };

  const processSharedImage = async (uri: string) => {
    setIsProcessing(true);

    try {
      // Read the image as base64
      const base64 = await readAsStringAsync(uri, {
        encoding: EncodingType.Base64,
      });

      // Fetch existing merchants for matching
      const existingMerchants = await TransactionRepository.getUniqueMerchants();
      console.log(`[Share] Found ${existingMerchants.length} existing merchants for matching`);

      // Call the analysis function
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

      if (!receiptData || !receiptData.financial) {
        throw new Error('Incomplete data from analysis');
      }

      setIsProcessing(false);

      // Navigate to review screen with the processed data
      router.replace({
        pathname: '/review' as any,
        params: {
          data: JSON.stringify(receiptData),
          uri: uri
        }
      });
    } catch (error) {
      console.error('Processing error:', error);
      setIsProcessing(false);
      Alert.alert(
        'Analysis Failed',
        "We couldn't process this receipt. Please try again.",
        [{ text: 'OK', onPress: () => router.replace('/') }]
      );
    }
  };

  if (isProcessing) {
    return <ProcessingView />;
  }

  return (
    <View className="flex-1 bg-crescender-950 justify-center items-center">
      <ActivityIndicator size="large" color="#f5c518" />
      <Text className="text-white mt-4">Preparing shared image...</Text>
    </View>
  );
}
