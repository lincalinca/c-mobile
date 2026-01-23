import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatFullDate, getRelativeDateLabel } from '../../lib/dateUtils';
import { ResultItem, reshapeToResults } from '../../lib/results';
import { addEventToDeviceCalendar } from '../../lib/calendarExport';
import { ServiceCard } from '../../components/results/ServiceCard';
import { GearCard } from '../../components/results/GearCard';
import { TransactionCard } from '../../components/results/TransactionCard';
import { EventCard } from '../../components/results/EventCard';
import { EducationCard } from '../../components/results/EducationCard';

const ACCENT_COLOR = '#22d3ee'; // Cyan for events
const RELATED_COLUMN_BREAK = 600;

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [relatedItems, setRelatedItems] = useState<ResultItem[]>([]);
  const [eventData, setEventData] = useState<ResultItem | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const allReceipts = await ReceiptRepository.getAllWithItems();
        // Events can be line items or generated from services or education
        if (id.startsWith('event_')) {
          // Generated event (service or education): find in reshaped results
          for (const r of allReceipts) {
            const results = reshapeToResults([r]);
            const foundEvent = results.find(ri => ri.id === id);
            if (foundEvent) {
              setEventData(foundEvent);
              setReceipt(r);
              const related = results.filter(ri => ri.id !== id);
              setRelatedItems(related);
              break;
            }
          }
        } else {
          // This is a line item event
          for (const r of allReceipts) {
            const foundItem = r.items.find((i: LineItemWithDetails) => i.id === id);
            if (foundItem) {
              setItem(foundItem);
              setReceipt(r);
              const results = reshapeToResults([r]);
              const related = results.filter(ri => ri.id !== id);
              setRelatedItems(related);
              break;
            }
          }
        }
      } catch (e) {
        console.error('Failed to load event details', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

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

  const openPhone = (phone: string) => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`);
  const openEmail = (email: string) => Linking.openURL(`mailto:${email}`);

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

  // Use either the line item or the generated event data
  const title = eventData?.title || item?.description || 'Event';
  const subtitle = eventData?.subtitle || 'Scheduled Event';
  const eventDate = eventData?.date || receipt?.transactionDate || '';
  const metadata = eventData?.metadata || {};

  const eventResult: ResultItem | null = useMemo(() => {
    if (eventData) return eventData;
    if (item && receipt) {
      return {
        id: item.id,
        type: 'event',
        title: item.description,
        subtitle: 'Scheduled Event',
        date: receipt.transactionDate,
        metadata: { venue: item.description },
        receiptId: receipt.id,
        links: [{ id: `trans_${receipt.id}`, type: 'transaction' }],
      };
    }
    return null;
  }, [eventData, item, receipt]);

  const handleAddToCalendar = useCallback(async () => {
    if (!eventResult) return;
    await addEventToDeviceCalendar(eventResult, receipt ?? null);
  }, [eventResult, receipt]);

  if (!receipt && !eventData) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-xl font-bold mb-4">Event not found</Text>
        <TouchableOpacity onPress={handleBack} className="px-6 py-3 rounded-full" style={{ backgroundColor: ACCENT_COLOR }}>
          <Text className="text-crescender-950 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Event Details</Text>
        {eventResult ? (
          <TouchableOpacity onPress={handleAddToCalendar} className="p-2">
            <Feather name="calendar" size={22} color={ACCENT_COLOR} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Hero Section */}
        <View className="p-6 border-b border-crescender-800">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: `${ACCENT_COLOR}20` }}>
              <Feather name="calendar" size={24} color={ACCENT_COLOR} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{title}</Text>
              <Text className="text-crescender-400 text-sm">{subtitle}</Text>
            </View>
          </View>

          {/* Date & Time */}
          <View className="p-4 rounded-2xl border mb-4" style={{ backgroundColor: `${ACCENT_COLOR}10`, borderColor: `${ACCENT_COLOR}30` }}>
            <View className="flex-row items-center gap-2 mb-2">
              <Feather name="clock" size={16} color={ACCENT_COLOR} />
              <Text className="font-bold" style={{ color: ACCENT_COLOR }}>{getRelativeDateLabel(eventDate)}</Text>
            </View>
            <Text className="text-white text-lg">{formatFullDate(eventDate)}</Text>
            {metadata.startDate && metadata.endDate && metadata.startDate !== metadata.endDate && (
              <Text className="text-crescender-400 text-sm mt-1">
                Until {formatFullDate(metadata.endDate)}
              </Text>
            )}
          </View>
        </View>

        {/* Event Details */}
        {(metadata.venue || metadata.duration || metadata.frequency) && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Event Details</Text>
            <View className="bg-crescender-900/40 p-4 rounded-xl">
              {metadata.venue && (
                <View className="flex-row items-center gap-3 mb-3">
                  <Feather name="map-pin" size={16} color={ACCENT_COLOR} />
                  <Text className="text-white text-sm">{metadata.venue}</Text>
                </View>
              )}
              {metadata.duration && (
                <View className="flex-row items-center gap-3 mb-3">
                  <Feather name="clock" size={16} color={ACCENT_COLOR} />
                  <Text className="text-crescender-300 text-sm">Duration: {metadata.duration}</Text>
                </View>
              )}
              {metadata.frequency && (
                <View className="flex-row items-center gap-3">
                  <Feather name="repeat" size={16} color={ACCENT_COLOR} />
                  <Text className="text-crescender-300 text-sm">{metadata.frequency}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Merchant Contact Details */}
        {receipt && (receipt.merchantPhone || receipt.merchantEmail || receipt.merchantAddress) && (
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

