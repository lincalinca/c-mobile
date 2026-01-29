import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '@lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatFullDate, getRelativeDateLabel } from '@lib/dateUtils';
import { ContactDetailsSection } from '@components/common/ContactDetailsSection';
import { RelatedItemsGrid } from '@components/common/RelatedItemsGrid';
import { reshapeToResults, type ResultItem } from '@lib/results';
import { addEventToDeviceCalendar } from '@lib/calendarExport';

const ACCENT_COLOR = '#22d3ee'; // Cyan for events

// Hero View Component
function EventItemHeroView({
  title,
  subtitle,
  eventDate,
  metadata
}: {
  title: string;
  subtitle: string;
  eventDate: string;
  metadata: Record<string, any>;
}) {
  return (
    <View className="p-6 border-b border-crescender-800">
      <View className="flex-row items-center gap-3 mb-4">
        <View
          className="w-12 h-12 rounded-full justify-center items-center"
          style={{ backgroundColor: `${ACCENT_COLOR}20` }}
        >
          <Feather name="calendar" size={24} color={ACCENT_COLOR} />
        </View>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold">{title}</Text>
          <Text className="text-crescender-400 text-sm">{subtitle}</Text>
        </View>
      </View>

      {/* Date & Time */}
      <View
        className="p-4 rounded-2xl border mb-4"
        style={{ backgroundColor: `${ACCENT_COLOR}10`, borderColor: `${ACCENT_COLOR}30` }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <Feather name="clock" size={16} color={ACCENT_COLOR} />
          <Text className="font-bold" style={{ color: ACCENT_COLOR }}>
            {getRelativeDateLabel(eventDate)}
          </Text>
        </View>
        <Text className="text-white text-lg">{formatFullDate(eventDate)}</Text>
        {metadata.startDate && metadata.endDate && metadata.startDate !== metadata.endDate && (
          <Text className="text-crescender-400 text-sm mt-1">
            Until {formatFullDate(metadata.endDate)}
          </Text>
        )}
      </View>
    </View>
  );
}

// Event Details Section
function EventDetailsSection({ metadata }: { metadata: Record<string, any> }) {
  if (!metadata.venue && !metadata.duration && !metadata.frequency) return null;

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>
        Event Details
      </Text>
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
  );
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        // Events can be line items or generated from services/education
        if (id.startsWith('event_')) {
          // Generated event: find in reshaped results
          for (const r of allReceipts) {
            const results = reshapeToResults([r]);
            const foundEvent = results.find((ri) => ri.id === id);
            if (foundEvent) {
              setEventData(foundEvent);
              setReceipt(r);
              setRelatedItems(results.filter((ri) => ri.id !== id));
              break;
            }
          }
        } else {
          // Line item event
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
        }
      } catch (e) {
        console.error('Failed to load event details', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // Build event result from either source
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

  if (!receipt && !eventData) {
    return (
      <View className="flex-1 bg-crescender-950 justify-center items-center p-6">
        <Text className="text-white text-xl font-bold mb-4">Event not found</Text>
        <TouchableOpacity
          onPress={handleBack}
          className="px-6 py-3 rounded-full"
          style={{ backgroundColor: ACCENT_COLOR }}
        >
          <Text className="text-crescender-950 font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = eventResult?.title || item?.description || 'Event';
  const subtitle = eventResult?.subtitle || 'Scheduled Event';
  const eventDate = eventResult?.date || receipt?.transactionDate || '';
  const metadata = eventResult?.metadata || {};

  const contactData = receipt
    ? {
        phone: receipt.merchantPhone,
        email: receipt.merchantEmail,
        address: receipt.merchantAddress,
        suburb: receipt.merchantSuburb,
        state: receipt.merchantState,
        postcode: receipt.merchantPostcode,
      }
    : {};

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
        <EventItemHeroView title={title} subtitle={subtitle} eventDate={eventDate} metadata={metadata} />
        <EventDetailsSection metadata={metadata} />
        <ContactDetailsSection data={contactData} accentColor={ACCENT_COLOR} />
        <RelatedItemsGrid items={relatedItems} accentColor={ACCENT_COLOR} />
      </ScrollView>
    </View>
  );
}
