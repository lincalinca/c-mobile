import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '@lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemImageGallery } from '@components/common/ItemImageGallery';
import { ItemImage } from '@lib/repository';
import { useGearItemEdit } from './useGearItemEdit';
import { GearItemEditForm } from './GearItemEditForm';
import { GearItemHeroView } from './GearItemHeroView';
import { GearItemSpecsView } from './GearItemSpecsView';
import { GearItemResourcesView } from './GearItemResourcesView';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { formatFullDate } from '@lib/dateUtils';

export default function GearItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [images, setImages] = useState<ItemImage[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTextContent, setShareTextContent] = useState('');

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const lineItem = await ReceiptRepository.getLineItemById(id);
      if (lineItem) {
        setItem(lineItem);
        if (lineItem.transactionId) {
          const r = await ReceiptRepository.getById(lineItem.transactionId);
          setReceipt(r);
        }
      }
    } catch (e) {
      console.error('Failed to load gear item', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (item?.imagesParsed) {
      setImages(item.imagesParsed);
    } else {
      setImages([]);
    }
  }, [item]);

  const { isEditing, setIsEditing, isSaving, editState, setEditState, handleSave } = useGearItemEdit(id, item);

  const handleImagesChange = async (newImages: ItemImage[]) => {
    setImages(newImages);
    if (id) {
      try {
        await ReceiptRepository.updateLineItem(id, {
          images: JSON.stringify(newImages),
        });
      } catch (e) {
        console.error('Failed to save images', e);
        Alert.alert('Error', 'Failed to save images. Please try again.');
      }
    }
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleReceiptPress = () => {
    if (receipt) {
      router.push(`/gear/${receipt.id}` as any);
    }
  };

  const formatItemForSharing = useCallback((item: LineItemWithDetails, receipt: Receipt | null): string => {
    const gd = item.gearDetailsParsed;
    const lines: string[] = [];
    
    lines.push(`🎸 ${item.description || 'Gear Item'}`);
    lines.push('');
    if (item.brand) lines.push(`Brand: ${item.brand}`);
    if (item.model) lines.push(`Model: ${item.model}`);
    if (item.serialNumber) lines.push(`Serial Number: ${item.serialNumber}`);
    
    if (receipt) {
      lines.push(`Merchant: ${receipt.merchant || 'N/A'}`);
      lines.push(`Cost: $${(item.totalPrice / 100).toFixed(2)}`);
      lines.push(`Date: ${formatFullDate(receipt.transactionDate)}`);
    }
    
    if (gd) {
      if (gd.manufacturer) lines.push(`Manufacturer: ${gd.manufacturer}`);
      if (gd.modelName) lines.push(`Model Name: ${gd.modelName}`);
      if (gd.modelNumber) lines.push(`Model Number: ${gd.modelNumber}`);
      if (gd.colour) lines.push(`Colour: ${gd.colour}`);
      if (gd.size) lines.push(`Size: ${gd.size}`);
      if (gd.condition) lines.push(`Condition: ${gd.condition}`);
      if (gd.tier) lines.push(`Tier: ${gd.tier}`);
      if (gd.uniqueDetail) lines.push(`Details: ${gd.uniqueDetail}`);
      if (gd.notedDamage) lines.push(`Damage: ${gd.notedDamage}`);
    }
    
    if (item.notes) {
      lines.push('');
      lines.push(`Notes: ${item.notes}`);
    }
    
    if (receipt && (receipt.merchantPhone || receipt.merchantEmail || receipt.merchantAddress)) {
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
        const textFileUri = FileSystem.cacheDirectory + `gear_${Date.now()}.txt`;
        await FileSystem.writeAsStringAsync(textFileUri, textContent);
        await Sharing.shareAsync(textFileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Share Gear Details',
        });
      }
    } catch (error) {
      console.error('Share item error:', error);
      Alert.alert('Share Failed', `Could not share gear item: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          dialogTitle: 'Share Gear Item',
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
        <ActivityIndicator size="large" color="#f5c518" />
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-xl font-bold mb-4">Item not found</Text>
        <TouchableOpacity onPress={handleBack} className="bg-gold px-6 py-3 rounded-full">
          <Text className="text-crescender-950 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gearDetails = item.gearDetailsParsed;

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={isEditing ? () => setIsEditing(false) : handleBack} className="p-2 -ml-2">
          <Feather name={isEditing ? "x" : "arrow-left"} size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">{isEditing ? 'Edit Item' : 'Item Details'}</Text>
        {!isEditing ? (
          <View className="flex-row gap-2">
            <TouchableOpacity onPress={handleShareItem} className="p-2">
              <Feather name="share-2" size={20} color="#f5c518" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
              <Feather name="edit-2" size={20} color="#f5c518" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleSave(loadData)} disabled={isSaving} className="p-2">
            <Feather name={isSaving ? "loader" : "check"} size={20} color="#f5c518" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Item Images Gallery */}
        <ItemImageGallery 
          images={images} 
          onImagesChange={handleImagesChange} 
          category="gear"
          onShareImage={handleShareImage}
          onShareItem={handleShareItem}
        />

        {/* Hero Section */}
        <View className="p-6 border-b border-crescender-800">
          {isEditing ? (
            <GearItemEditForm 
              editState={editState}
              onUpdateField={(field, value) => setEditState({ ...editState, [field]: value })}
            />
          ) : (
            <GearItemHeroView 
              item={item}
              receipt={receipt}
              onReceiptPress={handleReceiptPress}
            />
          )}
        </View>


        {/* Gear Details Section - Only show in view mode */}
        {!isEditing && gearDetails && (
          <GearItemSpecsView gearDetails={gearDetails} serialNumber={item.serialNumber} />
        )}

        {/* Resources Section - Only show in view mode */}
        {!isEditing && gearDetails && (
          <GearItemResourcesView gearDetails={gearDetails} />
        )}
      </ScrollView>

      {/* Share Modal */}
      <Modal visible={showShareModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-crescender-900 w-full rounded-2xl p-6 border border-crescender-700 max-h-[80%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-lg font-bold">Share Gear Item</Text>
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