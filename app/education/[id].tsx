import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, TextInput, useWindowDimensions, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatFullDate } from '../../lib/dateUtils';
import { ResultItem, reshapeToResults } from '../../lib/results';
import { getEducationSeriesSummary } from '../../lib/educationEvents';
import { addEducationSeriesToDeviceCalendar } from '../../lib/calendarExport';
import { ServiceCard } from '../../components/results/ServiceCard';
import { GearCard } from '../../components/results/GearCard';
import { TransactionCard } from '../../components/results/TransactionCard';
import { EventCard } from '../../components/results/EventCard';
import { EducationCard } from '../../components/results/EducationCard';
import { findChainForItem, getChainIndex, type EducationChain } from '../../lib/educationChain';
import { detectContinuityGaps, type ContinuityGap } from '../../lib/educationContinuity';

const ACCENT_COLOR = '#c084fc'; // Purple for education
const RELATED_COLUMN_BREAK = 600;

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [relatedItems, setRelatedItems] = useState<ResultItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editFocus, setEditFocus] = useState('');
  const [chain, setChain] = useState<EducationChain | null>(null);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [continuityGaps, setContinuityGaps] = useState<ContinuityGap[]>([]);
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);
  const flatListRef = useRef<FlatList>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const receipts = await ReceiptRepository.getAllWithItems();
      setAllReceipts(receipts);
      
      // Find the current item and receipt
      let foundItem: LineItemWithDetails | null = null;
      let foundReceipt: Receipt | null = null;
      
      for (const r of receipts) {
        const found = r.items.find((i: LineItemWithDetails) => i.id === id);
        if (found) {
          foundItem = found;
          foundReceipt = r;
          break;
        }
      }
      
      if (foundItem && foundReceipt) {
        setItem(foundItem);
        setReceipt(foundReceipt);
        const results = reshapeToResults([foundReceipt]);
        setRelatedItems(results.filter(ri => ri.id !== id));
        
        // Build chain and find current index
        const educationChain = findChainForItem(id, receipts);
        if (educationChain) {
          setChain(educationChain);
          const chainIdx = getChainIndex(id, educationChain);
          setCurrentChainIndex(chainIdx);
          
          // Detect continuity gaps
          const gaps = detectContinuityGaps(educationChain.items);
          setContinuityGaps(gaps);
        }
      }
    } catch (e) {
      console.error('Failed to load education details', e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [id]); // Reload when ID changes (e.g., from swipe navigation)

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  }, [router]);

  const handleEdit = useCallback(() => {
    if (!item || !receipt) return;
    const edu = item.educationDetailsParsed;
    setEditTitle(item.description);
    setEditSubtitle(edu?.subtitle ?? receipt.merchant ?? '');
    setEditStudentName(edu?.studentName ?? '');
    setEditFocus(edu?.focus ?? '');
    setIsEditing(true);
  }, [item, receipt]);

  const handleSave = useCallback(async () => {
    if (!item || !receipt) return;
    setIsSaving(true);
    try {
      const edu = item.educationDetailsParsed || {};
      const merged = {
        ...edu,
        studentName: editStudentName.trim() || undefined,
        subtitle: editSubtitle.trim() || undefined,
        focus: editFocus.trim() || undefined,
      };
      await ReceiptRepository.updateLineItem(item.id, {
        description: editTitle.trim(),
        educationDetails: JSON.stringify(merged),
      });
      await loadData();
      setIsEditing(false);
    } catch (e) {
      console.error('Failed to save education details', e);
    } finally {
      setIsSaving(false);
    }
  }, [item, receipt, editTitle, editSubtitle, editStudentName, editFocus, loadData]);

  const handleRelatedLinkPress = useCallback((targetId: string, targetType: string) => {
    if (targetType === 'transaction' && receipt) {
      router.push(`/gear/${receipt.id}` as any);
    } else if (targetType === 'education') {
      router.push(`/education/${targetId}` as any);
    } else if (targetType === 'gear') {
      router.push(`/gear/${targetId}` as any);
    } else if (targetType === 'service') {
      router.push(`/services/${targetId}` as any);
    } else if (targetType === 'event') {
      router.push(`/events/${targetId}` as any);
    }
  }, [receipt, router]);

  const seriesSummary = useMemo(
    () => {
      if (!item || !receipt) return null;
      return getEducationSeriesSummary(item, receipt);
    },
    [item, receipt]
  );
  
  // Recalculate gaps when chain or current item changes
  useEffect(() => {
    if (chain && item) {
      const gaps = detectContinuityGaps(chain.items);
      setContinuityGaps(gaps);
    }
  }, [chain, item]);

  // Scroll to current item when chain loads
  useEffect(() => {
    if (chain && flatListRef.current && currentChainIndex >= 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: currentChainIndex,
          animated: false,
        });
      }, 100);
    }
  }, [chain, currentChainIndex]);

  const handleAddSeriesToCalendar = useCallback(() => {
    if (seriesSummary && receipt) addEducationSeriesToDeviceCalendar(seriesSummary, receipt);
  }, [seriesSummary, receipt]);

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
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-3 py-2 rounded-lg" style={{ backgroundColor: ACCENT_COLOR }}>
            <Text className="text-white font-bold">{isSaving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleEdit} className="p-2">
            <Feather name="edit-2" size={22} color={ACCENT_COLOR} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} nestedScrollEnabled={true}>
        {/* Hero Section */}
        <View className="p-6 border-b border-crescender-800">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: `${ACCENT_COLOR}20` }}>
              <Feather name="book-open" size={24} color={ACCENT_COLOR} />
            </View>
            <View className="flex-1">
              {isEditing ? (
                <>
                  <Text className="text-crescender-400 text-xs mb-1">Title</Text>
                  <TextInput value={editTitle} onChangeText={setEditTitle} className="text-white text-xl font-bold bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholderTextColor="#9ca3af" />
                  <Text className="text-crescender-400 text-xs mt-2 mb-1">Subtitle (e.g. provider)</Text>
                  <TextInput value={editSubtitle} onChangeText={setEditSubtitle} className="text-crescender-300 text-sm bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholderTextColor="#9ca3af" />
                </>
              ) : (
                <>
                  <Text className="text-white text-xl font-bold">{item.description}</Text>
                  <Text className="text-crescender-400 text-sm">{eduDetails?.subtitle ?? receipt.merchant}</Text>
                </>
              )}
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
          {(eduDetails && (eduDetails.teacherName || eduDetails.studentName)) || isEditing ? (
            <View className="p-4 rounded-xl bg-crescender-900/40 mb-4">
              {eduDetails?.teacherName && !isEditing && (
                <View className="flex-row items-center gap-2 mb-2">
                  <Feather name="user" size={14} color={ACCENT_COLOR} />
                  <Text className="text-crescender-400 text-xs">Teacher:</Text>
                  <Text className="text-white text-sm font-medium">{eduDetails.teacherName}</Text>
                </View>
              )}
              {isEditing ? (
                <>
                  <View className="flex-row items-center gap-2 mb-2">
                    <Feather name="user-check" size={14} color={ACCENT_COLOR} />
                    <Text className="text-crescender-400 text-xs">Student:</Text>
                    <TextInput value={editStudentName} onChangeText={setEditStudentName} className="flex-1 text-white text-sm bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholder="Student name" placeholderTextColor="#9ca3af" />
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Feather name="target" size={14} color={ACCENT_COLOR} />
                    <Text className="text-crescender-400 text-xs">Focus:</Text>
                    <TextInput value={editFocus} onChangeText={setEditFocus} className="flex-1 text-white text-sm bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholder="Violin, Piano, Vocals, Theory, Etc" placeholderTextColor="#9ca3af" />
                  </View>
                </>
              ) : (
                <>
                  {eduDetails?.studentName && (
                    <View className="flex-row items-center gap-2 mb-2">
                      <Feather name="user-check" size={14} color={ACCENT_COLOR} />
                      <Text className="text-crescender-400 text-xs">Student:</Text>
                      <Text className="text-white text-sm font-medium">{eduDetails.studentName}</Text>
                    </View>
                  )}
                  {eduDetails?.focus && (
                    <View className="flex-row items-center gap-2">
                      <Feather name="target" size={14} color={ACCENT_COLOR} />
                      <Text className="text-crescender-400 text-xs">Focus:</Text>
                      <Text className="text-white text-sm font-medium">{eduDetails.focus}</Text>
                    </View>
                  )}
                  {!eduDetails?.focus && (
                    <View className="flex-row items-center gap-2 mt-2">
                      <Feather name="alert-circle" size={14} color="#fbbf24" />
                      <Text className="text-yellow-500 text-xs">Focus needed for chaining lessons</Text>
                    </View>
                  )}
                </>
              )}
            </View>
          ) : null}
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

        {/* Learning Path - Swipeable Contexts */}
        {chain && chain.items.length > 1 && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Learning Path</Text>
            <View className="mb-2">
              <Text className="text-crescender-400 text-xs mb-1">
                {chain.items.length} lesson{chain.items.length !== 1 ? 's' : ''} in this path ({chain.focus} with {chain.provider})
              </Text>
              <Text className="text-crescender-500 text-xs">
                Swipe left/right to view other lessons in this series
              </Text>
            </View>
            <View style={{ height: 120 }}>
              <FlatList
                ref={flatListRef}
                data={chain.items}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                nestedScrollEnabled={true}
                keyExtractor={(ci) => ci.item.id}
                initialScrollIndex={currentChainIndex >= 0 ? currentChainIndex : 0}
                getItemLayout={(data, index) => ({
                  length: width - 48, // Account for padding
                  offset: (width - 48) * index,
                  index,
                })}
                onMomentumScrollEnd={(event) => {
                  const itemWidth = width - 48;
                  const newIndex = Math.round(event.nativeEvent.contentOffset.x / itemWidth);
                  if (newIndex !== currentChainIndex && newIndex >= 0 && newIndex < chain.items.length) {
                    const newItem = chain.items[newIndex];
                    // Update state first
                    setCurrentChainIndex(newIndex);
                    setItem(newItem.item);
                    setReceipt(newItem.receipt);
                    // Reload related items for new receipt
                    const results = reshapeToResults([newItem.receipt]);
                    setRelatedItems(results.filter(ri => ri.id !== newItem.item.id));
                    // Update URL to reflect new item
                    router.setParams({ id: newItem.item.id } as any);
                  }
                }}
                onScrollToIndexFailed={(info) => {
                  // Fallback if scroll fails
                  const wait = new Promise(resolve => setTimeout(resolve, 500));
                  wait.then(() => {
                    flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
                  });
                }}
                renderItem={({ item: chainItem }) => {
                  const currentEdu = chainItem.item.educationDetailsParsed;
                  const currentSeries = getEducationSeriesSummary(chainItem.item, chainItem.receipt);
                  return (
                    <View style={{ width: width - 48 }} className="px-2">
                      <View className="bg-crescender-900/40 p-4 rounded-xl">
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-1">
                            <Text className="text-white font-medium text-sm">{chainItem.item.description}</Text>
                            <Text className="text-crescender-400 text-xs mt-1">
                              {formatFullDate(chainItem.receipt.transactionDate)}
                            </Text>
                          </View>
                          <Text className="text-crescender-500 text-xs">
                            ${(chainItem.item.totalPrice / 100).toFixed(2)}
                          </Text>
                        </View>
                        {currentSeries && currentSeries.count > 0 && (
                          <Text className="text-crescender-400 text-xs">
                            {currentSeries.count} lesson{currentSeries.count !== 1 ? 's' : ''} scheduled
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                }}
              />
            </View>
            {/* Page Indicators */}
            <View className="flex-row justify-center gap-2 mt-3">
              {chain.items.map((_, idx) => (
                <View
                  key={idx}
                  className={`h-1.5 rounded-full ${idx === currentChainIndex ? 'bg-gold' : 'bg-crescender-700'}`}
                  style={{ width: idx === currentChainIndex ? 24 : 8 }}
                />
              ))}
            </View>
          </View>
        )}

        {/* Continuity Gap Detection */}
        {continuityGaps.length > 0 && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Continuity Gap Detected</Text>
            {continuityGaps.map((gap, idx) => (
              <View key={idx} className="bg-yellow-900/20 p-4 rounded-xl mb-3 border border-yellow-700">
                <View className="flex-row items-start gap-2 mb-2">
                  <Feather name="alert-triangle" size={16} color="#fbbf24" />
                  <View className="flex-1">
                    <Text className="text-yellow-400 text-sm font-semibold mb-1">Gap detected</Text>
                    <Text className="text-white text-xs mb-1">
                      Expected: {formatFullDate(gap.expectedDate)}
                    </Text>
                    {gap.actualNextDate && (
                      <Text className="text-white text-xs">
                        Actual: {formatFullDate(gap.actualNextDate)} ({gap.gapDays} days gap)
                      </Text>
                    )}
                  </View>
                </View>
                <View className="flex-row gap-2 mt-2">
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Accept Gap', 'This gap will be kept in the learning path.');
                    }}
                    className="flex-1 bg-crescender-800 px-3 py-2 rounded-lg"
                  >
                    <Text className="text-white text-xs text-center">Accept Gap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Add Missing Receipt', 'You can scan the missing receipt to fill this gap.');
                    }}
                    className="flex-1 bg-gold px-3 py-2 rounded-lg"
                  >
                    <Text className="text-crescender-950 text-xs text-center font-semibold">Add Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lesson series — one block: N occurrences, first–last date, Add to calendar */}
        {seriesSummary && seriesSummary.count > 0 && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Lesson series</Text>
            <View className="bg-crescender-900/40 p-4 rounded-xl flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white font-medium">{seriesSummary.count} occurrence{seriesSummary.count === 1 ? '' : 's'}</Text>
                <Text className="text-crescender-400 text-sm">
                  {seriesSummary.firstDate === seriesSummary.lastDate
                    ? formatFullDate(seriesSummary.firstDate)
                    : `${formatFullDate(seriesSummary.firstDate)} to ${formatFullDate(seriesSummary.lastDate)}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleAddSeriesToCalendar}
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${ACCENT_COLOR}20` }}
              >
                <Feather name="calendar" size={18} color={ACCENT_COLOR} />
              </TouchableOpacity>
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

        {/* Associated Transaction(s) Footer */}
        {receipt && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>Associated Transaction</Text>
            <TouchableOpacity
              onPress={() => router.push(`/gear/${receipt.id}` as any)}
              className="bg-crescender-900/40 p-4 rounded-xl"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-white font-medium">{receipt.merchant}</Text>
                  <Text className="text-crescender-400 text-xs mt-1">
                    {formatFullDate(receipt.transactionDate)} • ${(receipt.total / 100).toFixed(2)}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={ACCENT_COLOR} />
              </View>
            </TouchableOpacity>
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

