import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Platform, Modal, Animated, PanResponder, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import { callSupabaseFunction } from '@lib/supabase';
import { ProcessingWithAdView } from '@components/processing/ProcessingWithAdView';
import { TransactionRepository, StudentRepository } from '@lib/repository';
import { recordScan, hasScansRemaining, getScansRemaining } from '@lib/usageTracking';
import { useUploadStore } from '@lib/stores/uploadStore';

const isAndroid = Platform.OS === 'android';

// On Android, delay (ms) after onCameraReady before allowing capture. Some devices need the preview to stabilize.
const ANDROID_READY_DELAY_MS = 450;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>((Platform.OS as any) === 'web' ? 'front' : 'back' as any);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [cameraReady, setCameraReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false); // Separate flag to prevent multiple captures without unmounting camera
  const [processingResults, setProcessingResults] = useState<{ data: any; uri: string } | null>(null);
  const readyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const cameraRef = useRef<any>(null);
  const cameraContainerRef = useRef<View>(null);
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

  // Handle upload mode from router params
  const { mode } = useLocalSearchParams();
  useEffect(() => {
    if (mode === 'upload') {
      // Small delay to ensure navigation is complete before opening picker
      setTimeout(() => {
        pickDocument();
      }, 500);
    }
  }, [mode]);

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
    const captureStartTime = Date.now();
    // Reduced logging: Only log key milestones and errors to avoid log spam
    // Full verbose logging can be re-enabled if issues recur
    
    if (!cameraReady || isProcessing || isCapturing) {
      if (!cameraReady) {
        console.warn('[Scan] ❌ BLOCKED: Camera not ready yet');
      } else if (isCapturing) {
        console.warn('[Scan] ❌ BLOCKED: Already capturing');
      } else {
        console.warn('[Scan] ❌ BLOCKED: Already processing');
      }
      return;
    }
    
    // Capture camera ref before any async operations
    const currentCameraRef = cameraRef.current;
    
    if (!currentCameraRef) {
      console.error('[Scan] ❌ ERROR: Camera ref not available');
      Alert.alert('Camera Error', 'Camera is not ready. Please try again.');
      return;
    }
    
    // Set capturing flag to prevent multiple captures, but don't unmount camera yet
    // This keeps the camera view mounted so screenshot fallback can work
    setIsCapturing(true);
    
    // Progressive quality reduction: try higher quality first, then reduce if it fails
    const qualityLevels = isAndroid ? [0.6, 0.4, 0.2, 0.1] : [0.8, 0.6, 0.4, 0.2];
    let lastError: Error | null = null;
    const attemptDetails: Array<{ quality: number; error?: string; duration?: number }> = [];
    
    // Try camera capture with progressive quality reduction
    for (let i = 0; i < qualityLevels.length; i++) {
      const quality = qualityLevels[i];
      const attemptStartTime = Date.now();
      
      // Re-check camera ref before each attempt (it might have changed or become null)
      let activeCameraRef = cameraRef.current;
      
      // If ref became null, wait a bit and check again (camera might be remounting)
      if (!activeCameraRef) {
        console.warn(`[Scan] ⚠️ Camera ref is null (attempt ${i + 1}), waiting 300ms for camera to remount...`);
        await new Promise(resolve => setTimeout(resolve, 300));
        activeCameraRef = cameraRef.current;
        
        if (!activeCameraRef) {
          console.error(`[Scan] ❌ Camera ref still null after wait, skipping attempt ${i + 1}`);
          attemptDetails.push({ quality, error: 'Camera ref became null', duration: Date.now() - attemptStartTime });
          if (i < qualityLevels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
            continue;
          }
          break;
        }
      } else if (activeCameraRef !== currentCameraRef) {
        console.warn(`[Scan] ⚠️ Camera ref changed (remounted), using new ref for attempt ${i + 1}`);
      }
      
      // Verify the ref has takePictureAsync
      if (!activeCameraRef || typeof activeCameraRef.takePictureAsync !== 'function') {
        console.error(`[Scan] ❌ Camera ref invalid or missing takePictureAsync (attempt ${i + 1})`);
        attemptDetails.push({ quality, error: 'Camera ref invalid', duration: Date.now() - attemptStartTime });
        if (i < qualityLevels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
        break;
      }
      
      try {
        const photoPromise = activeCameraRef.takePictureAsync({
          quality,
          base64: true,
          skipProcessing: false,
        });
        
        const photo = await photoPromise;
        const attemptDuration = Date.now() - attemptStartTime;
        
        if (!photo) {
          console.error(`[Scan] ❌ takePictureAsync returned null/undefined (quality ${quality}, attempt ${i + 1})`);
          attemptDetails.push({ quality, error: 'takePictureAsync returned null', duration: attemptDuration });
          throw new Error('takePictureAsync returned null');
        }

        if (!photo.uri) {
          console.error(`[Scan] ❌ Photo has no URI (quality ${quality}, attempt ${i + 1})`);
          attemptDetails.push({ quality, error: 'Photo has no uri', duration: attemptDuration });
          throw new Error('takePictureAsync returned no uri');
        }

        // Get base64 - prefer from photo, fallback to reading file
        let base64 = photo.base64;
        
        if (!base64 && photo.uri) {
          try {
            base64 = await readAsStringAsync(photo.uri, { encoding: EncodingType.Base64 });
          } catch (e) {
            console.error('[Scan] ❌ Base64 fallback error:', e instanceof Error ? e.message : String(e));
            attemptDetails.push({ quality, error: `File read failed: ${e instanceof Error ? e.message : String(e)}`, duration: attemptDuration });
            throw new Error(`Failed to read image data: ${e instanceof Error ? e.message : String(e)}`);
          }
        }

        if (!base64) {
          console.error(`[Scan] ❌ No base64 data available (quality ${quality}, attempt ${i + 1})`);
          attemptDetails.push({ quality, error: 'No base64 data', duration: attemptDuration });
          throw new Error('Could not get image data (no base64 and file read failed)');
        }

        // Success! Log key info and process
        const totalDuration = Date.now() - captureStartTime;
        console.log(`[Scan] ✅ Capture successful: quality ${quality}, ${totalDuration}ms, ${(base64.length / 1024).toFixed(1)}KB`);
        attemptDetails.push({ quality, duration: attemptDuration });
        
        // Now set processing state and process the image
        setIsProcessing(true);
        await processImage(photo.uri, base64);
        return; // Success - exit function
      } catch (e) {
        const attemptDuration = Date.now() - attemptStartTime;
        lastError = e instanceof Error ? e : new Error(String(e));
        
        // Only log errors (warnings for retries, errors for final failure)
        if (i < qualityLevels.length - 1) {
          console.warn(`[Scan] ⚠️ Attempt ${i + 1} failed (quality ${quality}): ${lastError.message} - retrying...`);
        } else {
          console.error(`[Scan] ❌ Attempt ${i + 1} failed (quality ${quality}): ${lastError.message}`);
        }
        
        attemptDetails.push({ 
          quality, 
          error: `${lastError.name}: ${lastError.message}`, 
          duration: attemptDuration 
        });
        
        // If this isn't the last attempt, continue to next quality level
        if (i < qualityLevels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
          continue;
        }
      }
    }
    
    // Log failure summary with attempt details
    const totalDuration = Date.now() - captureStartTime;
    console.error(`[Scan] ❌ All ${attemptDetails.length} camera attempts failed (${totalDuration}ms)`);
    console.error(`[Scan] Attempt summary:`, JSON.stringify(attemptDetails, null, 2));
    
    // If all camera capture attempts failed, try screenshot fallback
    console.log('[Scan] Trying screenshot fallback...');
    try {
      const containerRef = cameraContainerRef.current;
      
      if (containerRef) {
        const uri = await captureRef(containerRef, {
          format: 'jpg',
          quality: 0.8,
          result: 'tmpfile',
        });
        
        const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
        
        if (base64) {
          console.log(`[Scan] ✅ Screenshot fallback successful (${(base64.length / 1024).toFixed(1)}KB)`);
          
          // Now set processing state and process the image
          setIsProcessing(true);
          await processImage(uri, base64);
          return; // Success - exit function
        } else {
          console.error(`[Scan] ❌ Screenshot captured but base64 read returned empty`);
        }
      } else {
        console.error(`[Scan] ❌ Container ref is null, cannot take screenshot`);
      }
    } catch (screenshotError) {
      console.error('[Scan] ❌ Screenshot fallback failed:', screenshotError instanceof Error ? screenshotError.message : String(screenshotError));
    }
    
    // All attempts failed
    const errorMessage = lastError?.message || 'Unknown error';
    console.error(`[Scan] ❌ All capture methods failed. Last error: ${errorMessage}`);
    
    // Reset capturing flag so user can try again
    setIsCapturing(false);
    
    Alert.alert(
      'Capture Failed', 
      `Failed to capture image after trying multiple methods: ${errorMessage}\n\nPlease try again or use the Upload button to select an image from your gallery.`,
      [{ text: 'OK' }]
    );
    setIsProcessing(false);
    setProcessingResults(null);
  };

  const { addItems: addToBulkUpload } = useUploadStore();

  const pickDocument = async () => {
    try {
      // Check remaining scans first
      const remaining = await getScansRemaining();
      if (remaining <= 0) {
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

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
        multiple: true, // Enable multi-select
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      // Single image: use existing flow for immediate feedback
      if (result.assets.length === 1) {
        const asset = result.assets[0];
        const base64 = await readAsStringAsync(asset.uri, {
          encoding: EncodingType.Base64,
        });
        await processImage(asset.uri, base64);
        return;
      }

      // Multiple images: use bulk upload queue
      const imageUris = result.assets.map(asset => asset.uri);

      // Cap to remaining scans and show feedback
      if (imageUris.length > remaining) {
        Alert.alert(
          'Selection Limited',
          `You have ${remaining} scans remaining this week. Only the first ${remaining} images will be processed.\n\nWatch an ad to get more scans.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: `Process ${remaining}`,
              onPress: async () => {
                const { added, rejected } = await addToBulkUpload(imageUris);
                if (rejected > 0) {
                  console.log(`[Scan] Bulk upload: ${added} added, ${rejected} rejected due to quota`);
                }
                // Navigate back so user can see the progress modal
                handleGoBack();
              },
              style: 'default'
            },
            {
              text: 'Get More Scans',
              onPress: () => router.push('/get-more-scans'),
            }
          ]
        );
        return;
      }

      // All images fit within quota
      const { added } = await addToBulkUpload(imageUris);
      console.log(`[Scan] Bulk upload started: ${added} images`);
      // Navigate back so user can see the progress modal
      handleGoBack();
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

      // Fetch existing people for name/instrument matching
      const existingPeople = await StudentRepository.getAllForPrompt();
      console.log(`[Scan] Found ${existingPeople.length} existing people for matching`);

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
        existingStudents: existingPeople.map((s: { name: string; instrument: string | null }) => ({
          name: s.name,
          instrument: s.instrument || null,
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
        <View 
          ref={cameraContainerRef}
          className='flex-1 bg-black' 
          style={{ paddingTop: insets.top }}
        >
          {/* CameraView must have no children: it can cause capture to fail on Android. Overlay is absolutely positioned on top. */}
          <CameraView
            style={{ flex: 1 }}
            facing={facing}
            flash={flash}
            ref={cameraRef}
            onCameraReady={() => {
              // Reduced logging: Only log if there's an issue or on first ready
              // On Android, delay before allowing capture so the preview can stabilize (avoids "Failed to capture image" on some devices).
              if (isAndroid) {
                if (readyTimeoutRef.current) {
                  clearTimeout(readyTimeoutRef.current);
                }
                readyTimeoutRef.current = setTimeout(() => {
                  readyTimeoutRef.current = null;
                  setCameraReady(true);
                  // Only log if camera ref is missing (indicates a problem)
                  if (!cameraRef.current) {
                    console.warn('[Scan] ⚠️ Camera ready but ref is null');
                  }
                }, ANDROID_READY_DELAY_MS);
              } else {
                setCameraReady(true);
                if (!cameraRef.current) {
                  console.warn('[Scan] ⚠️ Camera ready but ref is null');
                }
              }
            }}
            onMountError={(error) => {
              console.error('[Scan] ❌ Camera mount error:', error);
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
