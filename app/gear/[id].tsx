import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { ReceiptRepository, Receipt, type LineItemWithDetails } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
const FS = FileSystem as any;
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { callSupabaseFunction } from '../../lib/supabase';
import { ProcessingView } from '../../components/processing/ProcessingView';
import { DatePickerModal } from '../../components/calendar/DatePickerModal';
import { StatePickerModal } from '../../components/common/StatePickerModal';

import { useTransactionEdit } from './useTransactionEdit';
import { TransactionEditForm } from './TransactionEditForm';
import { TransactionHeroView } from './TransactionHeroView';
import { TransactionItemsView } from './TransactionItemsView';
import { TransactionFooterActions } from './TransactionFooterActions';
import { TransactionImageModal } from './TransactionImageModal';

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<LineItemWithDetails[]>([]);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    const r = await ReceiptRepository.getById(id);
    if (r) {
      const i = await ReceiptRepository.getLineItems(id);
      setReceipt(r);
      setItems(i);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadData()
      .catch((e) => console.error('Failed to load receipt details', e))
      .finally(() => setLoading(false));
  }, [id, loadData]);

  const {
    isEditing,
    setIsEditing,
    isSaving,
    editState,
    setEditState,
    handleSave,
    handleCancelEdit,
  } = useTransactionEdit(id, receipt, loadData);

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Record',
      'Are you sure you want to delete this receipt and all its items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await ReceiptRepository.delete(id);
              handleBack();
            }
          },
        },
      ]
    );
  };

  const handleReplaceImage = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      await ReceiptRepository.updateImageUrl(id, uri);
      setReceipt((prev) => (prev ? { ...prev, imageUrl: uri } : null));
      Alert.alert('Done', 'Image replaced. You can tap Reprocess to re-analyse it.');
    } catch (e) {
      console.error('Replace image error:', e);
      Alert.alert('Error', 'Failed to replace image. Please try again.');
    }
  };

  // Helper to prepare image for saving/sharing
  const prepareImageForSave = async (): Promise<{ uri: string; filename: string }> => {
    if (!receipt?.imageUrl) throw new Error('No image available');

    const date = receipt.transactionDate
      ? new Date(receipt.transactionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const description = receipt.summary
      ? receipt.summary.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      : receipt.merchant?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) || 'receipt';

    const merchant = receipt.merchant
      ? receipt.merchant.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      : 'merchant';

    const filename = `${date}_${description}_${merchant}.jpg`;

    let imageUri = receipt.imageUrl;

    if (receipt.imageUrl.startsWith('data:')) {
      const base64 = receipt.imageUrl.split(',')[1] || '';
      const fileUri = `${FS.documentDirectory}${filename}`;
      await FS.writeAsStringAsync(fileUri, base64, { encoding: FS.EncodingType.Base64 });
      imageUri = fileUri;
    } else if (receipt.imageUrl.startsWith('file://') || !receipt.imageUrl.startsWith('http')) {
      imageUri = receipt.imageUrl;
    } else {
      const fileUri = `${FS.documentDirectory}${filename}`;
      const downloadResult = await FS.downloadAsync(receipt.imageUrl, fileUri);
      imageUri = downloadResult.uri;
    }

    return { uri: imageUri, filename };
  };

  const handleSaveImage = async () => {
    if (!receipt?.imageUrl) {
      Alert.alert('Error', 'No image available to save');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your device.');
        return;
      }

      const { uri, filename } = await prepareImageForSave();

      if (Platform.OS === 'android') {
        try {
          const downloadsPath = `${FS.documentDirectory}../Downloads/`;
          const downloadsUri = `${downloadsPath}${filename}`;
          const dirInfo = await FS.getInfoAsync(downloadsPath);
          if (!dirInfo.exists) {
            await FS.makeDirectoryAsync(downloadsPath, { intermediates: true });
          }
          await FS.copyAsync({ from: uri, to: downloadsUri });
          await MediaLibrary.createAssetAsync(uri);
          Alert.alert('Saved', `Receipt saved as "${filename}" to Downloads`);
          return;
        } catch {
          // Fall through to media library save
        }
      }

      const asset = await MediaLibrary.createAssetAsync(uri);
      const album = await MediaLibrary.getAlbumAsync('Downloads');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('Downloads', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      Alert.alert('Saved', `Receipt saved as "${filename}"`);
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Save Failed', `Could not save image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleShareImage = async () => {
    if (!receipt?.imageUrl) {
      Alert.alert('Error', 'No image available to share');
      return;
    }

    try {
      const { uri } = await prepareImageForSave();
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Receipt Image',
          UTI: 'public.jpeg',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Share Failed', `Could not share image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleReprocess = async () => {
    if (!id || typeof id !== 'string' || !receipt?.imageUrl) {
      Alert.alert('No image', 'Reprocess requires an image. Use Replace Image to add one first.');
      return;
    }

    let base64: string;
    try {
      if (receipt.imageUrl.startsWith('data:')) {
        base64 = receipt.imageUrl.split(',')[1] || '';
      } else if (receipt.imageUrl.startsWith('file://') || !receipt.imageUrl.startsWith('http')) {
        base64 = await FS.readAsStringAsync(receipt.imageUrl, { encoding: FS.EncodingType.Base64 });
      } else {
        Alert.alert('Unsupported', 'Reprocess is not available for remote images.');
        return;
      }
      if (!base64) throw new Error('Could not read image');
    } catch (e) {
      console.error('Read image error:', e);
      Alert.alert('Error', 'Could not read the receipt image.');
      return;
    }

    setIsReprocessing(true);
    try {
      const existingMerchants = await ReceiptRepository.getUniqueMerchants();
      const receiptData = await callSupabaseFunction<any>('analyze-receipt', {
        imageBase64: base64,
        existingMerchants: existingMerchants.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          suburb: m.suburb,
          abn: m.abn,
        })),
      });
      if (!receiptData?.financial) throw new Error('Incomplete data from analysis');

      const f = receiptData.financial;
      const md = f.merchantDetails || {};
      await ReceiptRepository.update(id, {
        merchant: md.name || f.merchant || receipt.merchant,
        merchantAbn: md.abn ?? receipt.merchantAbn ?? null,
        merchantPhone: md.phone ?? receipt.merchantPhone ?? null,
        merchantEmail: md.email ?? receipt.merchantEmail ?? null,
        merchantWebsite: md.website ?? receipt.merchantWebsite ?? null,
        merchantAddress: md.address ?? receipt.merchantAddress ?? null,
        merchantSuburb: md.suburb ?? receipt.merchantSuburb ?? null,
        merchantState: md.state ?? receipt.merchantState ?? null,
        merchantPostcode: md.postcode ?? receipt.merchantPostcode ?? null,
        transactionDate: f.date || receipt.transactionDate,
        invoiceNumber: f.invoiceNumber ?? receipt.invoiceNumber ?? null,
        documentType: receiptData.documentType || receipt.documentType || 'receipt',
        summary: receiptData.summary ?? receipt.summary ?? null,
        subtotal: f.subtotal != null ? Math.round(parseFloat(String(f.subtotal)) * 100) : receipt.subtotal,
        tax: f.tax != null ? Math.round(parseFloat(String(f.tax)) * 100) : receipt.tax,
        total: f.total != null ? Math.round(parseFloat(String(f.total)) * 100) : receipt.total,
        paymentStatus: f.paymentStatus || receipt.paymentStatus || 'paid',
        paymentMethod: f.paymentMethod ?? receipt.paymentMethod ?? null,
        rawOcrData: JSON.stringify(receiptData),
      });

      const newLineItems = (receiptData.items || []).map((item: any) => ({
        id: Crypto.randomUUID(),
        transactionId: id,
        description: item.description || 'Unnamed',
        category: item.category || 'other',
        brand: item.brand ?? null,
        model: item.model ?? null,
        instrumentType: item.instrumentType ?? null,
        gearCategory: item.gearCategory ?? null,
        serialNumber: item.serialNumber ?? null,
        quantity: item.quantity ?? 1,
        originalUnitPrice:
          item.originalUnitPrice != null ? Math.round(parseFloat(String(item.originalUnitPrice)) * 100) : null,
        unitPrice: Math.round(parseFloat(String(item.unitPrice || 0)) * 100),
        discountAmount:
          item.discountAmount != null ? Math.round(parseFloat(String(item.discountAmount)) * 100) : null,
        discountPercentage: item.discountPercentage != null ? parseFloat(String(item.discountPercentage)) : null,
        totalPrice: Math.round(parseFloat(String(item.totalPrice || 0)) * 100),
        gearDetails: item.gearDetails ? JSON.stringify(item.gearDetails) : null,
        educationDetails: item.educationDetails ? JSON.stringify(item.educationDetails) : null,
        notes: item.notes ?? null,
        confidence: item.confidence != null ? parseFloat(String(item.confidence)) : null,
      }));
      await ReceiptRepository.replaceLineItems(id, newLineItems);
      await loadData();
      Alert.alert('Done', 'Receipt has been re-analysed and the record updated.');
    } catch (e) {
      console.error('Reprocess error:', e);
      Alert.alert('Analysis Failed', "We couldn't re-process this receipt. Please try again.");
    } finally {
      setIsReprocessing(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center">
        <ActivityIndicator size="large" color="#f5c518" />
      </View>
    );
  }

  if (isReprocessing) return <ProcessingView />;

  if (!receipt) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-2xl font-bold mb-4">Receipt not found</Text>
        <TouchableOpacity onPress={handleBack} className="bg-gold px-6 py-3 rounded-full">
          <Text className="text-crescender-950 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={isEditing ? handleCancelEdit : handleBack} className="p-2 -ml-2">
          <Feather name={isEditing ? 'x' : 'arrow-left'} size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">
          {isEditing ? 'Edit Record' : 'Record Details'}
        </Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
            <Feather name="edit-2" size={24} color="#f5c518" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
            <Feather name={isSaving ? 'loader' : 'check'} size={24} color="#f5c518" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Receipt Image */}
        {receipt.imageUrl && (
          <TouchableOpacity
            onPress={() => setShowImageModal(true)}
            activeOpacity={0.9}
            className="bg-black/40 h-64 w-full"
          >
            <Image source={{ uri: receipt.imageUrl }} className="w-full h-full" resizeMode="contain" />
          </TouchableOpacity>
        )}

        {isEditing ? (
          <TransactionEditForm
            editState={editState}
            onUpdateField={(field, value) => setEditState({ ...editState, [field]: value })}
            onDatePress={() => setShowDatePicker(true)}
            onStatePress={() => setShowStatePicker(true)}
            onDelete={handleDelete}
          />
        ) : (
          <>
            <TransactionHeroView receipt={receipt} />
            <TransactionItemsView items={items} receipt={receipt} />
          </>
        )}
      </ScrollView>

      {/* Footer Actions - Only show in view mode */}
      {!isEditing && (
        <TransactionFooterActions
          hasImage={!!receipt.imageUrl}
          onReplaceImage={handleReplaceImage}
          onReprocess={handleReprocess}
          onDelete={handleDelete}
        />
      )}

      {/* Modals */}
      <TransactionImageModal
        visible={showImageModal}
        imageUrl={receipt.imageUrl}
        onClose={() => setShowImageModal(false)}
        onSave={handleSaveImage}
        onShare={handleShareImage}
      />

      <DatePickerModal
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
        selectedDate={editState.date || null}
        onDateSelect={(date) => {
          setEditState({ ...editState, date });
          setShowDatePicker(false);
        }}
        showFutureWarning
      />

      <StatePickerModal
        visible={showStatePicker}
        onClose={() => setShowStatePicker(false)}
        selectedState={editState.merchantState}
        onSelect={(code) => setEditState({ ...editState, merchantState: code })}
      />
    </View>
  );
}
