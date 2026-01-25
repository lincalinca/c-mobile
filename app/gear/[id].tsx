import { View, Text, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, Alert, TextInput, Linking, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import * as Crypto from 'expo-crypto';
import { ReceiptRepository, Receipt, type LineItemWithDetails } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatABN } from '../../lib/formatUtils';
import { ITEM_CATEGORIES } from '../../constants/categories';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { readAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { callSupabaseFunction } from '../../lib/supabase';
import { ProcessingView } from '../../components/processing/ProcessingView';
import { SimpleGearCard } from '../../components/results/SimpleGearCard';
import { SimpleServiceCard } from '../../components/results/SimpleServiceCard';
import { SimpleEducationCard } from '../../components/results/SimpleEducationCard';
import type { ResultItem } from '../../lib/results';
import { DatePickerModal } from '../../components/calendar/DatePickerModal';

// Helper to convert line item to ResultItem format for card rendering
function lineItemToResultItem(item: LineItemWithDetails, receipt: Receipt): ResultItem {
  const metadata: any = {};

  if (item.category === 'service' && item.serviceDetailsParsed) {
    metadata.serviceType = item.serviceDetailsParsed.serviceType;
    metadata.technician = item.serviceDetailsParsed.technicianName || item.serviceDetailsParsed.providerName;
    metadata.warranty = item.serviceDetailsParsed.warrantyDetails;
    metadata.notes = item.serviceDetailsParsed.notes;
  }

  if (item.category === 'education' && item.educationDetailsParsed) {
    metadata.studentName = item.educationDetailsParsed.studentName;
    metadata.teacherName = item.educationDetailsParsed.teacherName;
    metadata.frequency = item.educationDetailsParsed.frequency;
    metadata.duration = item.educationDetailsParsed.duration;
    metadata.startDate = item.educationDetailsParsed.startDate;
    metadata.endDate = item.educationDetailsParsed.endDate;
    metadata.daysOfWeek = item.educationDetailsParsed.daysOfWeek;
    metadata.times = item.educationDetailsParsed.times;
  }
  
  if (item.category === 'gear' && item.gearDetailsParsed) {
      // Pass through gear details if needed by SimpleGearCard in future, 
      // currently SimpleGearCard relies on default SimpleCard behavior + specific styling
  }

  return {
    id: item.id,
    type: item.category as any,
    title: item.description,
    subtitle: item.category === 'gear' ? item.brand + (item.model ? ` ${item.model}` : '') : undefined,
    amount: item.totalPrice,
    date: receipt.transactionDate, // Not used in SimpleCard footer but part of type
    metadata: metadata,
    receiptId: receipt.id,
    links: [], // Empty links array - SimpleCard doesn't show footer chips
  };
}

// Document type options
const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'tax_invoice', label: 'Tax Invoice' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'quote', label: 'Quote' },
  { value: 'layby', label: 'Layby' },
] as const;

// Payment status options
const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'bg-green-600' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-600' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-600' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-600' },
] as const;

// Payment method options
const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'eftpos', label: 'EFTPOS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'afterpay', label: 'Afterpay' },
  { value: 'other', label: 'Other' },
] as const;

export default function GearDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<LineItemWithDetails[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);

  // Edit state
  const [editMerchant, setEditMerchant] = useState('');
  const [editDocumentType, setEditDocumentType] = useState('receipt');
  const [editDate, setEditDate] = useState('');
  const [editInvoiceNumber, setEditInvoiceNumber] = useState('');
  const [editAbn, setEditAbn] = useState('');
  const [editSubtotal, setEditSubtotal] = useState('');
  const [editTax, setEditTax] = useState('');
  const [editTotal, setEditTotal] = useState('');
  const [editPaymentStatus, setEditPaymentStatus] = useState('paid');
  const [editPaymentMethod, setEditPaymentMethod] = useState('card');
  const [editSummary, setEditSummary] = useState('');
  const [editMerchantPhone, setEditMerchantPhone] = useState('');
  const [editMerchantEmail, setEditMerchantEmail] = useState('');
  const [editMerchantWebsite, setEditMerchantWebsite] = useState('');
  const [editMerchantAddress, setEditMerchantAddress] = useState('');
  const [editMerchantSuburb, setEditMerchantSuburb] = useState('');
  const [editMerchantState, setEditMerchantState] = useState('');
  const [editMerchantPostcode, setEditMerchantPostcode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const loadData = useCallback(async () => {
    if (!id || typeof id !== 'string') return;
    const r = await ReceiptRepository.getById(id);
    if (r) {
      const i = await ReceiptRepository.getLineItems(id);
      setReceipt(r);
      setItems(i);
      setEditMerchant(r.merchant || '');
      setEditDocumentType(r.documentType || 'receipt');
      setEditDate(r.transactionDate || new Date().toISOString().split('T')[0]);
      setEditInvoiceNumber(r.invoiceNumber || '');
      setEditAbn(r.merchantAbn || '');
      setEditSubtotal(r.subtotal ? (r.subtotal / 100).toString() : '');
      setEditTax(r.tax ? (r.tax / 100).toString() : '');
      setEditTotal(r.total ? (r.total / 100).toString() : '0');
      setEditPaymentStatus(r.paymentStatus || 'paid');
      setEditPaymentMethod(r.paymentMethod || 'card');
      setEditSummary(r.summary || '');
      setEditMerchantPhone(r.merchantPhone || '');
      setEditMerchantEmail(r.merchantEmail || '');
      setEditMerchantWebsite(r.merchantWebsite || '');
      setEditMerchantAddress(r.merchantAddress || '');
      setEditMerchantSuburb(r.merchantSuburb || '');
      setEditMerchantState(r.merchantState || '');
      setEditMerchantPostcode(r.merchantPostcode || '');
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadData().catch((e) => console.error('Failed to load receipt details', e)).finally(() => setLoading(false));
  }, [id, loadData]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
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
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!receipt || !id) return;
    setIsSaving(true);
    try {
      await ReceiptRepository.update(id, {
        merchant: editMerchant,
        documentType: editDocumentType,
        transactionDate: editDate,
        invoiceNumber: editInvoiceNumber || null,
        merchantAbn: editAbn || null,
        subtotal: editSubtotal ? Math.round(parseFloat(editSubtotal) * 100) : null,
        tax: editTax ? Math.round(parseFloat(editTax) * 100) : null,
        total: Math.round(parseFloat(editTotal) * 100),
        paymentStatus: editPaymentStatus,
        paymentMethod: editPaymentMethod,
        summary: editSummary || null,
        merchantPhone: editMerchantPhone || null,
        merchantEmail: editMerchantEmail || null,
        merchantWebsite: editMerchantWebsite || null,
        merchantAddress: editMerchantAddress || null,
        merchantSuburb: editMerchantSuburb || null,
        merchantState: editMerchantState || null,
        merchantPostcode: editMerchantPostcode || null,
      });
      await loadData();
      setIsEditing(false);
      Alert.alert('Saved!', 'Changes saved successfully');
    } catch (e) {
      console.error('Failed to save changes', e);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplaceImage = async () => {
    if (!id || typeof id !== 'string') return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*'], copyToCacheDirectory: true });
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

  // Helper function to get the image file URI and generate filename
  const prepareImageForSave = async (): Promise<{ uri: string; filename: string }> => {
    if (!receipt?.imageUrl) {
      throw new Error('No image available');
    }

    // Generate unique filename: isodate_description_merchant
    const date = receipt.transactionDate 
      ? new Date(receipt.transactionDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    
    // Create a safe description from receipt summary or merchant name
    const description = receipt.summary 
      ? receipt.summary.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      : receipt.merchant?.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30) || 'receipt';
    
    const merchant = receipt.merchant 
      ? receipt.merchant.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)
      : 'merchant';
    
    const filename = `${date}_${description}_${merchant}.jpg`;
    
    // Read the image and prepare file URI
    let imageUri = receipt.imageUrl;
    
    if (receipt.imageUrl.startsWith('data:')) {
      // For data URIs, we need to save to a file first
      const base64 = receipt.imageUrl.split(',')[1] || '';
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory!, { intermediates: true });
      }
      // Write base64 to file
      await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
      imageUri = fileUri;
    } else if (receipt.imageUrl.startsWith('file://') || !receipt.imageUrl.startsWith('http')) {
      imageUri = receipt.imageUrl;
    } else {
      // For remote URLs, download first
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadResult = await FileSystem.downloadAsync(receipt.imageUrl, fileUri);
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
      // Request media library permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your device.');
        return;
      }

      const { uri, filename } = await prepareImageForSave();
      
      // On Android, try to save directly to Downloads folder first
      if (Platform.OS === 'android') {
        try {
          // Get Downloads directory path
          const downloadsPath = `${FileSystem.documentDirectory}../Downloads/`;
          const downloadsUri = `${downloadsPath}${filename}`;
          
          // Ensure Downloads directory exists
          const dirInfo = await FileSystem.getInfoAsync(downloadsPath);
          if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(downloadsPath, { intermediates: true });
          }
          
          // Copy file to Downloads with proper filename
          await FileSystem.copyAsync({
            from: uri,
            to: downloadsUri,
          });
          
          // Also save to media library so it appears in gallery
          await MediaLibrary.createAssetAsync(uri);
          
          Alert.alert('Saved', `Receipt saved as "${filename}" to Downloads`);
          return;
        } catch (androidError) {
          console.log('Android Downloads save failed, falling back to media library:', androidError);
          // Fall through to media library save
        }
      }
      
      // Fallback: Save to media library (Pictures folder)
      // Note: MediaLibrary may not preserve exact filename, but it will save the image
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      // Try to add to Downloads album if it exists
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
      
      // Share the file
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
        base64 = await readAsStringAsync(receipt.imageUrl, { encoding: EncodingType.Base64 });
      } else {
        Alert.alert('Unsupported', 'Reprocess is not available for remote images. Use Replace Image to use a local photo.');
        return;
      }
      if (!base64) throw new Error('Could not read image');
    } catch (e) {
      console.error('Read image error:', e);
      Alert.alert('Error', 'Could not read the receipt image. It may have been moved or deleted.');
      return;
    }
    setIsReprocessing(true);
    try {
      const existingMerchants = await ReceiptRepository.getUniqueMerchants();
      const receiptData = await callSupabaseFunction<any>('analyze-receipt', {
        imageBase64: base64,
        existingMerchants: existingMerchants.map((m) => ({ id: m.id, name: m.name, email: m.email, phone: m.phone, suburb: m.suburb, abn: m.abn })),
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
        originalUnitPrice: item.originalUnitPrice != null ? Math.round(parseFloat(String(item.originalUnitPrice)) * 100) : null,
        unitPrice: Math.round(parseFloat(String(item.unitPrice || 0)) * 100),
        discountAmount: item.discountAmount != null ? Math.round(parseFloat(String(item.discountAmount)) * 100) : null,
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
      Alert.alert('Analysis Failed', 'We couldn\'t re-process this receipt. Please try again.');
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

  const gearItems = items.filter(item => item.category === 'gear');
  const serviceItems = items.filter(item => item.category === 'service');
  const educationItems = items.filter(item => item.category === 'education');
  const eventItems = items.filter(item => item.category === 'event');

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={isEditing ? () => setIsEditing(false) : handleBack} className="p-2 -ml-2">
          <Feather name={isEditing ? "x" : "arrow-left"} size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">{isEditing ? 'Edit Record' : 'Record Details'}</Text>
        {!isEditing ? (
          <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
            <Feather name="edit-2" size={24} color="#f5c518" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="p-2">
            <Feather name={isSaving ? "loader" : "check"} size={24} color="#f5c518" />
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
            <Image
              source={{ uri: receipt.imageUrl }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </TouchableOpacity>
        )}

        {isEditing ? (
          // EDIT MODE
          <View className="p-6">
            {/* Document Type */}
            <View className="mb-6">
              <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">Document Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {DOCUMENT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() => setEditDocumentType(type.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        editDocumentType === type.value
                          ? 'bg-gold border-gold'
                          : 'bg-crescender-900/60 border-crescender-700'
                      }`}
                    >
                      <Text className={`text-sm font-bold ${
                        editDocumentType === type.value ? 'text-crescender-950' : 'text-crescender-400'
                      }`}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Merchant */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Merchant</Text>
              <TextInput
                className="text-white text-lg font-semibold border-b border-crescender-700 py-1"
                value={editMerchant}
                onChangeText={setEditMerchant}
                placeholderTextColor="#666"
              />
            </View>

            {/* Summary */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Summary</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={editSummary}
                onChangeText={setEditSummary}
                placeholder="Short description (e.g. Guitar strings, lesson)"
                placeholderTextColor="#666"
              />
            </View>

            {/* ABN & Invoice Number */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">ABN</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editAbn}
                  onChangeText={setEditAbn}
                  placeholder="XX XXX XXX XXX"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">Invoice/Receipt #</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editInvoiceNumber}
                  onChangeText={setEditInvoiceNumber}
                  placeholderTextColor="#666"
                />
              </View>
            </View>

            {/* Date */}
            <View className="mb-6">
              <Text className="text-crescender-400 text-sm mb-1">Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="flex-row items-center justify-between border-b border-crescender-700 py-1"
              >
                <Text className={`text-lg ${editDate ? 'text-white' : 'text-crescender-500'}`}>
                  {editDate 
                    ? new Date(editDate + 'T12:00:00').toLocaleDateString('en-AU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Select date'}
                </Text>
                <Feather name="calendar" size={20} color="#f5c518" />
              </TouchableOpacity>
            </View>

            {/* Financial Details */}
            <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">Financial Details</Text>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">Subtotal</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editSubtotal}
                  onChangeText={setEditSubtotal}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">GST (10%)</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editTax}
                  onChangeText={setEditTax}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Total */}
            <View className="mb-6">
              <Text className="text-crescender-400 text-sm mb-1">Total</Text>
              <TextInput
                className="text-white text-lg font-bold border-b border-crescender-700 py-1"
                value={editTotal}
                onChangeText={setEditTotal}
                placeholder="0.00"
                placeholderTextColor="#666"
                keyboardType="decimal-pad"
              />
            </View>

            {/* Payment Status */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-2">Payment Status</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {PAYMENT_STATUSES.map((status) => (
                    <TouchableOpacity
                      key={status.value}
                      onPress={() => setEditPaymentStatus(status.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        editPaymentStatus === status.value
                          ? `${status.color} border-white`
                          : 'bg-crescender-900/60 border-crescender-700'
                      }`}
                    >
                      <Text className={`text-sm font-bold ${
                        editPaymentStatus === status.value ? 'text-white' : 'text-crescender-400'
                      }`}>
                        {status.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Payment Method */}
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-2">Payment Method</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {PAYMENT_METHODS.map((method) => (
                    <TouchableOpacity
                      key={method.value}
                      onPress={() => setEditPaymentMethod(method.value)}
                      className={`px-3 py-1.5 rounded-full border ${
                        editPaymentMethod === method.value
                          ? 'bg-gold border-gold'
                          : 'bg-crescender-900/60 border-crescender-700'
                      }`}
                    >
                      <Text className={`text-sm font-bold ${
                        editPaymentMethod === method.value ? 'text-crescender-950' : 'text-crescender-400'
                      }`}>
                        {method.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Merchant contact & address */}
            <Text className="text-gold font-bold mb-3 uppercase tracking-widest text-sm">Merchant contact & address</Text>
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Phone</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={editMerchantPhone}
                onChangeText={setEditMerchantPhone}
                placeholderTextColor="#666"
                keyboardType="phone-pad"
              />
            </View>
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Email</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={editMerchantEmail}
                onChangeText={setEditMerchantEmail}
                placeholderTextColor="#666"
                keyboardType="email-address"
              />
            </View>
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Website</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={editMerchantWebsite}
                onChangeText={setEditMerchantWebsite}
                placeholder="example.com"
                placeholderTextColor="#666"
                keyboardType="url"
              />
            </View>
            <View className="mb-4">
              <Text className="text-crescender-400 text-sm mb-1">Address</Text>
              <TextInput
                className="text-white text-base border-b border-crescender-700 py-1"
                value={editMerchantAddress}
                onChangeText={setEditMerchantAddress}
                placeholderTextColor="#666"
              />
            </View>
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">Suburb</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editMerchantSuburb}
                  onChangeText={setEditMerchantSuburb}
                  placeholderTextColor="#666"
                />
              </View>
              <View className="flex-1">
                <Text className="text-crescender-400 text-sm mb-1">State</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editMerchantState}
                  onChangeText={setEditMerchantState}
                  placeholder="e.g. NSW"
                  placeholderTextColor="#666"
                />
              </View>
              <View className="w-24">
                <Text className="text-crescender-400 text-sm mb-1">Postcode</Text>
                <TextInput
                  className="text-white text-base border-b border-crescender-700 py-1"
                  value={editMerchantPostcode}
                  onChangeText={setEditMerchantPostcode}
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Delete Button */}
            <TouchableOpacity onPress={handleDelete} className="bg-red-600/20 border border-red-600 px-6 py-3 rounded-full">
              <Text className="text-red-400 font-bold text-center">Delete Record</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // VIEW MODE
          <View className="p-6 border-b border-crescender-800">
            <View className="flex-row items-center gap-3 mb-4">
              <View className="w-10 h-10 bg-crescender-800 rounded-full justify-center items-center">
                <Feather name="home" size={20} color="#f5c518" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold">{receipt.merchant}</Text>
                <Text className="text-crescender-400 text-base">
                  {new Date(receipt.transactionDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                {receipt.summary && (
                  <Text className="text-gold text-sm mt-1 italic">{receipt.summary}</Text>
                )}
              </View>
            </View>

            {/* Merchant Details */}
            {(receipt.merchantPhone || receipt.merchantEmail || receipt.merchantWebsite || receipt.merchantAddress) && (
              <View className="mb-4 bg-crescender-900/20 p-3 rounded-xl">
                <Text className="text-crescender-400 text-sm font-bold mb-2 uppercase tracking-widest">Merchant Details</Text>
                {receipt.merchantPhone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${receipt.merchantPhone!.replace(/\s/g, '')}`)}
                    className="flex-row items-center gap-2 mb-1"
                  >
                    <Feather name="phone" size={12} color="#f5c518" />
                    <Text className="text-gold text-sm underline">{receipt.merchantPhone}</Text>
                  </TouchableOpacity>
                )}
                {receipt.merchantEmail && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${receipt.merchantEmail}`)}
                    className="flex-row items-center gap-2 mb-1"
                  >
                    <Feather name="mail" size={12} color="#f5c518" />
                    <Text className="text-gold text-sm underline">{receipt.merchantEmail}</Text>
                  </TouchableOpacity>
                )}
                {receipt.merchantWebsite && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://${receipt.merchantWebsite!.replace(/^https?:\/\//, '')}`)}
                    className="flex-row items-center gap-2 mb-1"
                  >
                    <Feather name="globe" size={12} color="#f5c518" />
                    <Text className="text-gold text-sm underline">{receipt.merchantWebsite}</Text>
                  </TouchableOpacity>
                )}
                {receipt.merchantAddress && (
                  <View className="flex-row items-start gap-2">
                    <Feather name="map-pin" size={12} color="#9ca3af" style={{ marginTop: 2 }} />
                    <Text className="text-crescender-300 text-sm flex-1">
                      {receipt.merchantAddress}
                      {receipt.merchantSuburb && `, ${receipt.merchantSuburb}`}
                      {receipt.merchantState && ` ${receipt.merchantState}`}
                      {receipt.merchantPostcode && ` ${receipt.merchantPostcode}`}
                    </Text>
                  </View>
                )}
              </View>
            )}

            <View className="bg-crescender-900/40 p-4 rounded-2xl border border-crescender-800">
              <View className="flex-row justify-between mb-2">
                <Text className="text-crescender-400">Total Amount</Text>
                <Text className="text-white font-bold text-xl">${(receipt.total / 100).toFixed(2)}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-crescender-400">GST (10%)</Text>
                <Text className="text-crescender-300">${receipt.tax ? (receipt.tax / 100).toFixed(2) : '0.00'}</Text>
              </View>
              {receipt.merchantAbn && (
                <View className="flex-row justify-between pt-2 border-t border-crescender-800/50">
                  <Text className="text-crescender-400">ABN</Text>
                  <Text className="text-crescender-200 font-mono text-sm">{formatABN(receipt.merchantAbn)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!isEditing && (
          <>
            {/* Gear Items */}
            {gearItems.length > 0 && (
              <View className="p-6 border-b border-crescender-800">
                <Text className="text-gold font-bold mb-4 uppercase tracking-widest text-sm">Captured Gear</Text>
                <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                  {gearItems.map((item) => (
                    <View key={item.id} style={{ width: '100%', padding: 4 }}>
                      <SimpleGearCard
                        item={lineItemToResultItem(item, receipt)}
                        onPress={() => router.push(`/gear/item/${item.id}`)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Other Items */}
            {(serviceItems.length > 0 || educationItems.length > 0 || eventItems.length > 0) && (
              <View className="p-6">
                <Text className="text-crescender-400 font-bold mb-4 uppercase tracking-widest text-sm">Other Items and Services</Text>
                <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
                  {[...serviceItems, ...educationItems, ...eventItems].map((item) => {
                    const resultItem = lineItemToResultItem(item, receipt);
                    return (
                      <View key={item.id} style={{ width: '100%', padding: 4 }}>
                        {item.category === 'service' ? (
                          <SimpleServiceCard
                            item={resultItem}
                            onPress={() => router.push(`/gear/item/${item.id}`)}
                          />
                        ) : item.category === 'education' ? (
                          <SimpleEducationCard
                            item={resultItem}
                            onPress={() => router.push(`/gear/item/${item.id}`)}
                          />
                        ) : (
                          // Fallback for events or other types
                          <SimpleGearCard
                             item={resultItem}
                             onPress={() => router.push(`/gear/item/${item.id}`)}
                          />
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Footer Actions - Only show in view mode */}
      {!isEditing && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-crescender-950/95 px-4 py-3 border-t border-crescender-800"
          style={{ paddingBottom: insets.bottom + 8 }}
        >
          <View className="flex-row gap-2 justify-center">
            <TouchableOpacity
              className="flex-1 bg-crescender-800/50 py-3 rounded-xl border border-crescender-700/50 items-center"
              onPress={handleReplaceImage}
            >
              <Feather name="image" size={20} color="white" />
              <Text className="text-white text-xs font-semibold mt-1">{receipt.imageUrl ? 'Replace' : 'Add'}</Text>
            </TouchableOpacity>
            {receipt.imageUrl && (
              <TouchableOpacity
                className="flex-1 bg-crescender-800/50 py-3 rounded-xl border border-crescender-700/50 items-center"
                onPress={handleReprocess}
              >
                <Feather name="refresh-cw" size={20} color="white" />
                <Text className="text-white text-xs font-semibold mt-1">Reprocess</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              className="flex-1 bg-red-500/10 py-3 rounded-xl border border-red-500/30 items-center"
              onPress={handleDelete}
            >
              <Feather name="trash-2" size={20} color="#ef4444" />
              <Text className="text-red-500 text-xs font-semibold mt-1">Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Fullscreen Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 bg-black/95" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          {/* Header */}
          <View className="flex-row justify-between items-center px-4 py-3">
            <TouchableOpacity
              onPress={() => setShowImageModal(false)}
              className="bg-crescender-800/50 p-3 rounded-full"
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleSaveImage}
                className="bg-gold/20 px-4 py-3 rounded-full border border-gold/30 flex-row items-center gap-2"
              >
                <Feather name="download" size={20} color="#f5c518" />
                <Text className="text-gold font-semibold text-sm">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareImage}
                className="bg-crescender-800/50 px-4 py-3 rounded-full border border-crescender-700/50 flex-row items-center gap-2"
              >
                <Feather name="share-2" size={20} color="white" />
                <Text className="text-white font-semibold text-sm">Share</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Image */}
          <View className="flex-1 justify-center items-center px-4">
            {receipt?.imageUrl && (
              <Image
                source={{ uri: receipt.imageUrl }}
                className="w-full"
                style={{ flex: 1 }}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
        selectedDate={editDate || null}
        onDateSelect={(date) => {
          setEditDate(date);
          setShowDatePicker(false);
        }}
        showFutureWarning={true}
      />
    </View>
  );
}
