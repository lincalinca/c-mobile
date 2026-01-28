import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, useWindowDimensions, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ItemImageGallery } from '../../components/common/ItemImageGallery';
import { ItemImage } from '../../lib/repository';
import { formatFullDate, getRelativeDateLabel } from '../../lib/dateUtils';
import { ResultItem, reshapeToResults } from '../../lib/results';
import { ServiceCard } from '../../components/results/ServiceCard';
import { GearCard } from '../../components/results/GearCard';
import { TransactionCard } from '../../components/results/TransactionCard';
import { EventCard } from '../../components/results/EventCard';
import { EducationCard } from '../../components/results/EducationCard';

const ACCENT_COLOR = '#f97316'; // Orange for services
const RELATED_COLUMN_BREAK = 600;

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [relatedItems, setRelatedItems] = useState<ResultItem[]>([]);
  const [images, setImages] = useState<ItemImage[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        // Get all receipts with items to find our service item
        const allReceipts = await ReceiptRepository.getAllWithItems();
        for (const r of allReceipts) {
          const foundItem = r.items.find((i: LineItemWithDetails) => i.id === id);
          if (foundItem) {
            setItem(foundItem);
            setReceipt(r);
            // Get related items using reshapeToResults
            const results = reshapeToResults([r]);
            const related = results.filter(ri => ri.id !== id);
            setRelatedItems(related);
            break;
          }
        }
      } catch (e) {
        console.error('Failed to load service details', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  useEffect(() => {
    if (item?.imagesParsed) {
      setImages(item.imagesParsed);
    } else {
      setImages([]);
    }
  }, [item]);

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

  const handleRelatedItemPress = (relatedItem: ResultItem) => {
    if (relatedItem.type === 'gear') {
      router.push(`/gear/${relatedItem.id}` as any);
    } else if (relatedItem.type === 'transaction') {
      router.push(`/gear/${relatedItem.receiptId}` as any);
    } else if (relatedItem.type === 'service') {
      router.push(`/services/${relatedItem.id}` as any);
    } else if (relatedItem.type === 'education') {
      router.push(`/education/${relatedItem.id}` as any);
    } else if (relatedItem.type === 'event') {
      router.push(`/events/${relatedItem.id}` as any);
    }
  };

  const openPhone = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  };

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleRelatedLinkPress = (targetId: string, targetType: string) => {
    if (targetType === 'transaction') {
      const r = relatedItems.find((x) => x.id === targetId);
      const rid = (r as ResultItem & { receiptId?: string })?.receiptId;
      if (rid) router.push(`/gear/${rid}` as any);
    } else {
      const seg = targetType === 'education' ? 'education' : targetType === 'service' ? 'services' : targetType === 'event' ? 'events' : 'gear';
      router.push(`/${seg}/${targetId}` as any);
    }
  };

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
        <TouchableOpacity onPress={handleBack} className="px-6 py-3 rounded-full" style={{ backgroundColor: ACCENT_COLOR }}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const warrantyDetails = item.warrantyDetailsParsed;

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
        {/* Item Images Gallery */}
        <ItemImageGallery 
          images={images} 
          onImagesChange={handleImagesChange} 
          category="service" 
        />

        {/* Hero Section */}
        <View className="p-6 border-b border-crescender-800">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: `${ACCENT_COLOR}20` }}>
              <Feather name="tool" size={24} color={ACCENT_COLOR} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{item.description}</Text>
              <Text className="text-crescender-400 text-sm">{receipt.merchant}</Text>
            </View>
          </View>

          {/* Price */}
          <View className="p-4 rounded-2xl border mb-4" style={{ backgroundColor: `${ACCENT_COLOR}10`, borderColor: `${ACCENT_COLOR}30` }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-crescender-400">Service Cost</Text>
              <Text className="text-white font-bold text-2xl">${(item.totalPrice / 100).toFixed(2)}</Text>
            </View>
            <Text className="text-crescender-500 text-xs mt-1">{formatFullDate(receipt.transactionDate)}</Text>
          </View>

          {/* Warranty Badge */}
          {warrantyDetails && (
            <View className="p-3 rounded-xl border mb-4" style={{ backgroundColor: '#22c55e10', borderColor: '#22c55e30' }}>
              <View className="flex-row items-center gap-2 mb-2">
                <Feather name="shield" size={16} color="#22c55e" />
                <Text className="text-green-400 font-bold text-sm">Warranty Included</Text>
              </View>
              {warrantyDetails.coveragePeriod && (
                <Text className="text-crescender-300 text-xs">Coverage: {warrantyDetails.coveragePeriod}</Text>
              )}
              {warrantyDetails.coverageType && (
                <Text className="text-crescender-300 text-xs">Type: {warrantyDetails.coverageType}</Text>
              )}
            </View>
          )}
        </View>

        {/* Merchant Contact Details */}
        {(receipt.merchantPhone || receipt.merchantEmail || receipt.merchantWebsite || receipt.merchantAddress) && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Contact Details</Text>
            <View className="bg-crescender-900/40 p-4 rounded-xl">
              {receipt.merchantPhone && (
                <TouchableOpacity onPress={() => openPhone(receipt.merchantPhone!)} className="flex-row items-center gap-3 mb-3">
                  <Feather name="phone" size={16} color={ACCENT_COLOR} />
                  <Text className="text-white text-sm underline">{receipt.merchantPhone}</Text>
                </TouchableOpacity>
              )}
              {receipt.merchantEmail && (
                <TouchableOpacity onPress={() => openEmail(receipt.merchantEmail!)} className="flex-row items-center gap-3 mb-3">
                  <Feather name="mail" size={16} color={ACCENT_COLOR} />
                  <Text className="text-white text-sm underline">{receipt.merchantEmail}</Text>
                </TouchableOpacity>
              )}
              {receipt.merchantWebsite && (
                <TouchableOpacity onPress={() => Linking.openURL(`https://${receipt.merchantWebsite!.replace(/^https?:\/\//, '')}`)} className="flex-row items-center gap-3 mb-3">
                  <Feather name="globe" size={16} color={ACCENT_COLOR} />
                  <Text className="text-white text-sm underline">{receipt.merchantWebsite}</Text>
                </TouchableOpacity>
              )}
              {receipt.merchantAddress && (
                <View className="flex-row items-start gap-3">
                  <Feather name="map-pin" size={16} color={ACCENT_COLOR} style={{ marginTop: 2 }} />
                  <Text className="text-crescender-300 text-sm flex-1">
                    {receipt.merchantAddress}
                    {receipt.merchantSuburb && `, ${receipt.merchantSuburb}`}
                    {receipt.merchantState && ` ${receipt.merchantState}`}
                    {receipt.merchantPostcode && ` ${receipt.merchantPostcode}`}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Notes */}
        {item.notes && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Notes</Text>
            <Text className="text-crescender-300 text-sm">{item.notes}</Text>
          </View>
        )}

        {/* Related Records — single column on mobile */}
        {relatedItems.length > 0 && (
          <View className="p-6">
            <Text className="font-bold mb-4 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Related Records</Text>
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
              {relatedItems.map((relatedItem) => {
                const cardProps = {
                  item: relatedItem,
                  onPress: () => handleRelatedItemPress(relatedItem),
                  onLinkPress: handleRelatedLinkPress,
                };
                const colWidth = width < RELATED_COLUMN_BREAK ? '100%' : '50%';
                return (
                  <View key={relatedItem.id} style={{ width: colWidth, padding: 4 }}>
                    {relatedItem.type === 'gear' && <GearCard {...cardProps} />}
                    {relatedItem.type === 'service' && <ServiceCard {...cardProps} />}
                    {relatedItem.type === 'transaction' && <TransactionCard {...cardProps} />}
                    {relatedItem.type === 'event' && <EventCard {...cardProps} />}
                    {relatedItem.type === 'education' && <EducationCard {...cardProps} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

