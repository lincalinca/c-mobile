import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '@lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemImageGallery } from '@components/common/ItemImageGallery';
import { ContactDetailsSection } from '@components/common/ContactDetailsSection';
import { RelatedItemsGrid } from '@components/common/RelatedItemsGrid';
import { ItemImage } from '@lib/repository';
import { reshapeToResults, type ResultItem } from '@lib/results';
import { formatFullDate } from '@lib/dateUtils';
import { useServiceItemEdit } from './useServiceItemEdit';
import { ServiceItemEditForm } from './ServiceItemEditForm';
import { DatePickerModal } from '@components/calendar/DatePickerModal';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

const ACCENT_COLOR = '#f97316'; // Orange for services

// Hero View Component
function ServiceItemHeroView({ item, receipt }: { item: LineItemWithDetails; receipt: Receipt }) {
  const warrantyDetails = item.warrantyDetailsParsed;

  return (
    <View className="p-6 border-b border-crescender-800">
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className="w-12 h-12 rounded-full justify-center items-center"
          style={{ backgroundColor: `${ACCENT_COLOR}20` }}
        >
          <Feather name="tool" size={24} color={ACCENT_COLOR} />
        </View>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">{item.description}</Text>
          <Text className="text-crescender-400 text-sm">{receipt.merchant}</Text>
        </View>
      </View>

      {/* Price */}
      <View
        className="p-4 rounded-2xl border mb-4"
        style={{ backgroundColor: `${ACCENT_COLOR}10`, borderColor: `${ACCENT_COLOR}30` }}
      >
        <View className="flex-row justify-between items-center">
          <Text className="text-crescender-400">Service Cost</Text>
          <Text className="text-white font-bold text-2xl">
            ${(item.totalPrice / 100).toFixed(2)}
          </Text>
        </View>
        <Text className="text-crescender-500 text-xs mt-1">
          {formatFullDate(receipt.transactionDate)}
        </Text>
      </View>

      {/* Warranty Badge */}
      {warrantyDetails && (
        <View
          className="p-3 rounded-xl border"
          style={{ backgroundColor: '#22c55e10', borderColor: '#22c55e30' }}
        >
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="shield" size={16} color="#22c55e" />
            <Text className="text-green-400 font-bold text-sm">Warranty Included</Text>
          </View>
          {warrantyDetails.coveragePeriod && (
            <Text className="text-crescender-300 text-xs">
              Coverage: {warrantyDetails.coveragePeriod}
            </Text>
          )}
          {warrantyDetails.coverageType && (
            <Text className="text-crescender-300 text-xs">
              Type: {warrantyDetails.coverageType}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [relatedItems, setRelatedItems] = useState<ResultItem[]>([]);
  const [images, setImages] = useState<ItemImage[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerKey, setDatePickerKey] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTextContent, setShareTextContent] = useState('');

  const { isEditing, setIsEditing, isSaving, editState, setEditState, handleSave } = useServiceItemEdit(id, item);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const allReceipts = await ReceiptRepository.getAllWithItems();
      for (const r of allReceipts) {
        const foundItem = r.items.find((i: LineItemWithDetails) => i.id === id);
        if (foundItem) {
          setItem(foundItem);
          setReceipt(r);
          const results = reshapeToResults([r]);
          setRelatedItems(results.filter((ri) => ri.id !== id));
          break;
        }
      }
    } catch (e) {
      console.error('Failed to load service details', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setImages(item?.imagesParsed || []);
  }, [item]);

  const handleImagesChange = async (newImages: ItemImage[]) => {
    setImages(newImages);
    if (id) {
      try {
        await ReceiptRepository.updateLineItem(id, { images: JSON.stringify(newImages) });
      } catch (e) {
        console.error('Failed to save images', e);
        Alert.alert('Error', 'Failed to save images. Please try again.');
      }
    }
  };

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  const formatItemForSharing = useCallback((item: LineItemWithDetails, receipt: Receipt): string => {
    const sd = item.serviceDetailsParsed;
    const lines: string[] = [];
    
    lines.push(`🔧 ${item.description || 'Service'}`);
    lines.push('');
    lines.push(`Merchant: ${receipt.merchant || 'N/A'}`);
    lines.push(`Cost: $${(item.totalPrice / 100).toFixed(2)}`);
    lines.push(`Date: ${formatFullDate(receipt.transactionDate)}`);
    
    if (sd?.serviceType) lines.push(`Service Type: ${sd.serviceType}`);
    if (sd?.technicianName) lines.push(`Technician: ${sd.technicianName}`);
    if (sd?.providerName) lines.push(`Provider: ${sd.providerName}`);
    if (sd?.startDate) lines.push(`Start Date: ${sd.startDate}`);
    if (sd?.endDate) lines.push(`End Date: ${sd.endDate}`);
    if (sd?.pickupDate) lines.push(`Pickup Date: ${sd.pickupDate}`);
    if (sd?.dropoffDate) lines.push(`Dropoff Date: ${sd.dropoffDate}`);
    
    if (item.notes) {
      lines.push('');
      lines.push(`Notes: ${item.notes}`);
    }
    
    if (receipt.merchantPhone || receipt.merchantEmail || receipt.merchantAddress) {
      lines.push('');
      lines.push('Contact Details:');
      if (receipt.merchantPhone) lines.push(`Phone: ${receipt.merchantPhone}`);
      if (receipt.merchantEmail) lines.push(`Email: ${receipt.merchantEmail}`);
      if (receipt.merchantAddress) {
        const addressParts = [
          receipt.merchantAddress,
          receipt.merchantSuburb,
          receipt.merchantState,
          receipt.merchantPostcode,
        ].filter(Boolean);
        if (addressParts.length > 0) {
          lines.push(`Address: ${addressParts.join(', ')}`);
        }
      }
    }
    
    return lines.join('\n');
  }, []);

  const handleShareImage = useCallback(async (imageUri: string) => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Image',
          UTI: 'public.jpeg',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
      }
    } catch (error) {
      console.error('Share image error:', error);
      Alert.alert('Share Failed', `Could not share image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  const handleShareItem = useCallback(async () => {
    if (!item || !receipt) return;
    
    try {
      const textContent = formatItemForSharing(item, receipt);
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Sharing is not available on this device.');
        return;
      }
      
      // Share images if available
      if (images.length > 0) {
        // Show modal with text content first
        setShareTextContent(textContent);
        setShowShareModal(true);
      } else {
        // No images, share text only
        const textFileUri = FileSystem.cacheDirectory + `service_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(textFileUri, textContent);
        await Sharing.shareAsync(textFileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Service Details',
        });
      }
    } catch (error) {
      console.error('Share item error:', error);
      Alert.alert('Share Failed', `Could not share service: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [item, receipt, images, formatItemForSharing]);

  const handleShareWithImage = useCallback(async () => {
    if (!images.length) return;
    
    try {
      // Copy text to clipboard
      await Clipboard.setStringAsync(shareTextContent);
      
      // Close modal
      setShowShareModal(false);
      
      // Small delay to ensure clipboard is set
      setTimeout(async () => {
        // Share the first image
        // The text is now in clipboard - user can paste it into the share dialog
        await Sharing.shareAsync(images[0].uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Share Service',
          UTI: 'public.jpeg',
        });
      }, 100);
    } catch (error) {
      console.error('Share with image error:', error);
      Alert.alert('Share Failed', `Could not share: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [images, shareTextContent]);

  if (loading) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center">
        <ActivityIndicator size="large" color={ACCENT_COLOR} />
      </View>
    );
  }

  if (!item || !receipt) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-xl font-bold mb-4">Service not found</Text>
        <TouchableOpacity
          onPress={handleBack}
          className="px-6 py-3 rounded-full"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const contactData = {
    phone: receipt.merchantPhone,
    email: receipt.merchantEmail,
    website: receipt.merchantWebsite,
    address: receipt.merchantAddress,
    suburb: receipt.merchantSuburb,
    state: receipt.merchantState,
    postcode: receipt.merchantPostcode,
  };

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={isEditing ? () => setIsEditing(false) : handleBack} className="p-2 -ml-2">
          <Feather name={isEditing ? "x" : "arrow-left"} size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{isEditing ? 'Edit Service' : 'Service Details'}</Text>
        {!isEditing ? (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleShareItem} className="p-2">
              <Feather name="share-2" size={20} color={ACCENT_COLOR} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
              <Feather name="edit-2" size={20} color={ACCENT_COLOR} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleSave(loadData)} disabled={isSaving} className="p-2">
            <Feather name={isSaving ? "loader" : "check"} size={20} color={ACCENT_COLOR} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <ItemImageGallery 
          images={images} 
          onImagesChange={handleImagesChange} 
          category="service"
          onShareImage={handleShareImage}
          onShareItem={handleShareItem}
        />
        {isEditing ? (
          <ServiceItemEditForm
            editState={editState}
            onUpdateField={(field, value) => setEditState({ ...editState, [field]: value })}
            onDatePress={(key) => {
              setDatePickerKey(key);
              setShowDatePicker(true);
            }}
          />
        ) : (
          <ServiceItemHeroView item={item} receipt={receipt} />
        )}
        <ContactDetailsSection data={contactData} accentColor={ACCENT_COLOR} />

        {item.notes && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>
              Notes
            </Text>
            <Text className="text-crescender-300 text-sm">{item.notes}</Text>
          </View>
        )}

        {!isEditing && <RelatedItemsGrid items={relatedItems} accentColor={ACCENT_COLOR} />}
      </ScrollView>

      <DatePickerModal
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          if (datePickerKey) {
            setEditState({ ...editState, [datePickerKey]: date });
          }
          setShowDatePicker(false);
        }}
        selectedDate={datePickerKey ? editState[datePickerKey as keyof typeof editState] || '' : ''}
      />

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-crescender-900 w-full rounded-2xl p-6 border border-crescender-700 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Share Service</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-crescender-300 text-sm mb-4">
              The text below will be copied to your clipboard. After sharing the image, paste it as the caption/description.
            </Text>
            
            <ScrollView className="bg-crescender-950 rounded-xl p-4 mb-4 max-h-64">
              <Text className="text-white text-sm font-mono" selectable>
                {shareTextContent}
              </Text>
            </ScrollView>
            
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  Clipboard.setStringAsync(shareTextContent);
                  Alert.alert('Copied!', 'Text copied to clipboard');
                }}
                className="flex-1 bg-crescender-800 p-4 rounded-xl items-center border border-crescender-700"
              >
                <Feather name="copy" size={20} color="white" />
                <Text className="text-white font-bold mt-2">Copy Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={handleShareWithImage}
                className="flex-1 bg-gold p-4 rounded-xl items-center"
              >
                <Feather name="share-2" size={20} color="#2e1065" />
                <Text className="text-crescender-950 font-bold mt-2">Share Image</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
