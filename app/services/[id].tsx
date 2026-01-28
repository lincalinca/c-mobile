import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemImageGallery } from '../../components/common/ItemImageGallery';
import { ContactDetailsSection } from '../../components/common/ContactDetailsSection';
import { RelatedItemsGrid } from '../../components/common/RelatedItemsGrid';
import { ItemImage } from '../../lib/repository';
import { reshapeToResults, type ResultItem } from '../../lib/results';
import { formatFullDate } from '../../lib/dateUtils';

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
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Service Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        <ItemImageGallery images={images} onImagesChange={handleImagesChange} category="service" />
        <ServiceItemHeroView item={item} receipt={receipt} />
        <ContactDetailsSection data={contactData} accentColor={ACCENT_COLOR} />

        {item.notes && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>
              Notes
            </Text>
            <Text className="text-crescender-300 text-sm">{item.notes}</Text>
          </View>
        )}

        <RelatedItemsGrid items={relatedItems} accentColor={ACCENT_COLOR} />
      </ScrollView>
    </View>
  );
}
