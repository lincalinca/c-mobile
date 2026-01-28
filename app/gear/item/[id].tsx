import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemImageGallery } from '../../../components/common/ItemImageGallery';
import { ItemImage } from '../../../lib/repository';
import { useGearItemEdit } from './useGearItemEdit';
import { GearItemEditForm } from './GearItemEditForm';
import { GearItemHeroView } from './GearItemHeroView';
import { GearItemSpecsView } from './GearItemSpecsView';
import { GearItemResourcesView } from './GearItemResourcesView';

export default function GearItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [images, setImages] = useState<ItemImage[]>([]);

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
          <TouchableOpacity onPress={() => setIsEditing(true)} className="p-2">
            <Feather name="edit-2" size={20} color="#f5c518" />
          </TouchableOpacity>
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
    </View>
  );
}