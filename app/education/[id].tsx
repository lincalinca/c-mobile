import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatFullDate, getRelativeDateLabel } from '../../lib/dateUtils';
import { ResultItem, reshapeToResults } from '../../lib/results';
import { ServiceCard } from '../../components/results/ServiceCard';
import { GearCard } from '../../components/results/GearCard';
import { TransactionCard } from '../../components/results/TransactionCard';
import { EventCard } from '../../components/results/EventCard';
import { EducationCard } from '../../components/results/EducationCard';

const ACCENT_COLOR = '#c084fc'; // Purple for education

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [relatedItems, setRelatedItems] = useState<ResultItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      try {
        const allReceipts = await ReceiptRepository.getAllWithItems();
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
      } catch (e) {
        console.error('Failed to load education details', e);
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
        <Text className="text-white text-xl font-bold mb-4">Education record not found</Text>
        <TouchableOpacity onPress={handleBack} className="px-6 py-3 rounded-full" style={{ backgroundColor: ACCENT_COLOR }}>
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const eduDetails = item.educationDetailsParsed;

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={handleBack} className="p-2 -ml-2">
          <Feather name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Education Details</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}>
        {/* Hero Section */}
        <View className="p-6 border-b border-crescender-800">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: `${ACCENT_COLOR}20` }}>
              <Feather name="book-open" size={24} color={ACCENT_COLOR} />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold">{item.description}</Text>
              <Text className="text-crescender-400 text-sm">{receipt.merchant}</Text>
            </View>
          </View>

          {/* Price */}
          <View className="p-4 rounded-2xl border mb-4" style={{ backgroundColor: `${ACCENT_COLOR}10`, borderColor: `${ACCENT_COLOR}30` }}>
            <View className="flex-row justify-between items-center">
              <Text className="text-crescender-400">Fee</Text>
              <Text className="text-white font-bold text-2xl">${(item.totalPrice / 100).toFixed(2)}</Text>
            </View>
            <Text className="text-crescender-500 text-xs mt-1">{formatFullDate(receipt.transactionDate)}</Text>
          </View>

          {/* Teacher/Student Info */}
          {eduDetails && (eduDetails.teacherName || eduDetails.studentName) && (
            <View className="p-4 rounded-xl bg-crescender-900/40 mb-4">
              {eduDetails.teacherName && (
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="user" size={14} color={ACCENT_COLOR} />
                  <Text className="text-crescender-400 text-xs">Teacher:</Text>
                  <Text className="text-white text-sm font-medium">{eduDetails.teacherName}</Text>
                </View>
              )}
              {eduDetails.studentName && (
                <View className="flex-row items-center gap-2">
                  <Feather name="user-check" size={14} color={ACCENT_COLOR} />
                  <Text className="text-crescender-400 text-xs">Student:</Text>
                  <Text className="text-white text-sm font-medium">{eduDetails.studentName}</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Schedule Details */}
        {eduDetails && (eduDetails.frequency || eduDetails.duration || eduDetails.daysOfWeek || eduDetails.times) && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Schedule</Text>
            <View className="bg-crescender-900/40 p-4 rounded-xl">
              {eduDetails.frequency && (
                <View className="flex-row mb-2">
                  <Text className="text-crescender-500 text-sm w-24">Frequency:</Text>
                  <Text className="text-white text-sm flex-1">{eduDetails.frequency}</Text>
                </View>
              )}
              {eduDetails.duration && (
                <View className="flex-row mb-2">
                  <Text className="text-crescender-500 text-sm w-24">Duration:</Text>
                  <Text className="text-white text-sm flex-1">{eduDetails.duration}</Text>
                </View>
              )}
              {eduDetails.daysOfWeek && eduDetails.daysOfWeek.length > 0 && (
                <View className="flex-row mb-2">
                  <Text className="text-crescender-500 text-sm w-24">Days:</Text>
                  <Text className="text-white text-sm flex-1">{eduDetails.daysOfWeek.join(', ')}</Text>
                </View>
              )}
              {eduDetails.times && eduDetails.times.length > 0 && (
                <View className="flex-row mb-2">
                  <Text className="text-crescender-500 text-sm w-24">Times:</Text>
                  <Text className="text-white text-sm flex-1">{eduDetails.times.join(', ')}</Text>
                </View>
              )}
              {eduDetails.startDate && (
                <View className="flex-row mb-2">
                  <Text className="text-crescender-500 text-sm w-24">Start:</Text>
                  <Text className="text-white text-sm flex-1">{formatFullDate(eduDetails.startDate)}</Text>
                </View>
              )}
              {eduDetails.endDate && (
                <View className="flex-row">
                  <Text className="text-crescender-500 text-sm w-24">End:</Text>
                  <Text className="text-white text-sm flex-1">{formatFullDate(eduDetails.endDate)}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Merchant Contact Details */}
        {(receipt.merchantPhone || receipt.merchantEmail || receipt.merchantAddress) && (
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

        {/* Related Records */}
        {relatedItems.length > 0 && (
          <View className="p-6">
            <Text className="font-bold mb-4 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Related Records</Text>
            <View className="flex-row flex-wrap" style={{ marginHorizontal: -4 }}>
              {relatedItems.map((relatedItem) => {
                const cardProps = {
                  item: relatedItem,
                  onPress: () => handleRelatedItemPress(relatedItem),
                };
                return (
                  <View key={relatedItem.id} style={{ width: '50%', padding: 4 }}>
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

