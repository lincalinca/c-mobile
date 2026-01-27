import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Linking, TextInput, useWindowDimensions, FlatList, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatFullDate } from '../../lib/dateUtils';
import { getEducationSeriesSummary } from '../../lib/educationEvents';
import { addEducationSeriesToDeviceCalendar } from '../../lib/calendarExport';
import { findChainForItem, getChainIndex, type EducationChain } from '../../lib/educationChain';
import { detectContinuityGaps, type ContinuityGap } from '../../lib/educationContinuity';
import { ICON_SIZES } from '../../lib/iconSizes';
import { DatePickerModal } from '../../components/calendar/DatePickerModal';
import { generateEducationSeriesTitle } from '../../lib/educationUtils';

const ACCENT_COLOR = '#c084fc'; // Purple for education

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
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
  const [showFirstLessonDatePicker, setShowFirstLessonDatePicker] = useState(false);
  const [showLearningPathInfo, setShowLearningPathInfo] = useState(false);

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
      
      // Generate title if focus and student name are available
      let finalTitle = editTitle.trim();
      if (merged.focus && merged.studentName && merged.startDate) {
        finalTitle = generateEducationSeriesTitle(merged, merged.startDate);
      }
      
      await ReceiptRepository.updateLineItem(item.id, {
        description: finalTitle,
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

  const handleFirstLessonDateSelect = useCallback(async (date: string) => {
    if (!item || !receipt) return;
    
    // Determine day of week from the selected date
    const selectedDate = new Date(date + 'T12:00:00');
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[selectedDate.getDay()];
    
    // Update education details with new start date and day of week
    const edu = item.educationDetailsParsed || {};
    const updatedDaysOfWeek = edu.daysOfWeek && edu.daysOfWeek.length > 0 
      ? edu.daysOfWeek 
      : [dayOfWeek];
    
    // If daysOfWeek doesn't include the selected day, add it
    if (!updatedDaysOfWeek.includes(dayOfWeek)) {
      updatedDaysOfWeek.push(dayOfWeek);
      updatedDaysOfWeek.sort((a, b) => {
        const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return order.indexOf(a) - order.indexOf(b);
      });
    }
    
    const merged = {
      ...edu,
      startDate: date,
      daysOfWeek: updatedDaysOfWeek,
    };
    
    try {
      await ReceiptRepository.updateLineItem(item.id, {
        educationDetails: JSON.stringify(merged),
      });
      await loadData();
      setShowFirstLessonDatePicker(false);
    } catch (e) {
      console.error('Failed to update first lesson date', e);
      Alert.alert('Error', 'Failed to update first lesson date');
    }
  }, [item, receipt, loadData]);


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
          <Feather name="arrow-left" size={ICON_SIZES.standard} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Education Details</Text>
        {isEditing ? (
          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="px-3 py-2 rounded-lg" style={{ backgroundColor: ACCENT_COLOR }}>
            <Text className="text-white text-base font-bold">{isSaving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleEdit} className="p-2">
            <Feather name="edit-2" size={ICON_SIZES.standard} color={ACCENT_COLOR} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: insets.bottom + 100 }} nestedScrollEnabled={true}>
        {/* Title */}
        <View className="p-6 border-b border-crescender-800">
          {isEditing ? (
            <>
              <Text className="text-crescender-400 text-xs mb-1">Title</Text>
              <TextInput value={editTitle} onChangeText={setEditTitle} className="text-white text-xl font-bold bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600 mb-3" placeholderTextColor="#9ca3af" />
              <Text className="text-crescender-400 text-xs mb-1">Subtitle (e.g. provider)</Text>
              <TextInput value={editSubtitle} onChangeText={setEditSubtitle} className="text-crescender-300 text-sm bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholderTextColor="#9ca3af" />
            </>
          ) : (
            <>
              <Text className="text-white text-xl font-bold mb-1">{item.description}</Text>
              <Text className="text-crescender-400 text-sm">{eduDetails?.subtitle ?? receipt.merchant}</Text>
            </>
          )}
        </View>

        {/* Comprehensive Details */}
        <View className="p-6 border-b border-crescender-800">
          {/* Student */}
          {isEditing ? (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">Student</Text>
              <TextInput value={editStudentName} onChangeText={setEditStudentName} className="text-white text-base bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholder="Student name" placeholderTextColor="#9ca3af" />
            </View>
          ) : (
            eduDetails?.studentName && (
              <View className="mb-3">
                <Text className="text-crescender-400 text-sm mb-1">Student</Text>
                <Text className="text-white text-base" numberOfLines={1}>{eduDetails.studentName}</Text>
              </View>
            )
          )}

          {/* Focus */}
          {isEditing ? (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">Focus</Text>
              <TextInput value={editFocus} onChangeText={setEditFocus} className="text-white text-base bg-crescender-800/50 rounded px-2 py-1.5 border border-crescender-600" placeholder="Violin, Piano, Vocals, Theory, Etc" placeholderTextColor="#9ca3af" />
            </View>
          ) : (
            eduDetails?.focus && (
              <View className="mb-3">
                <Text className="text-crescender-400 text-sm mb-1">Focus</Text>
                <Text className="text-white text-base" numberOfLines={1}>{eduDetails.focus}</Text>
              </View>
            )
          )}

          {/* Provider */}
          <View className="mb-3">
            <Text className="text-crescender-400 text-sm mb-1">Provider</Text>
            <Text className="text-white text-base" numberOfLines={1}>{eduDetails?.subtitle ?? receipt.merchant}</Text>
          </View>

          {/* Series Length (Number of Lessons) */}
          {seriesSummary && seriesSummary.count > 0 && (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">Series Length</Text>
              <Text className="text-white text-base" numberOfLines={1}>{seriesSummary.count} lesson{seriesSummary.count !== 1 ? 's' : ''}</Text>
            </View>
          )}

          {/* Lesson Length - Only show if it's not a term length */}
          {eduDetails?.duration && !eduDetails.duration.toLowerCase().includes('week') && !eduDetails.duration.toLowerCase().includes('term') && (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">Lesson Length</Text>
              <Text className="text-white text-base" numberOfLines={1}>{eduDetails.duration}</Text>
            </View>
          )}

          {/* First Lesson Date - Selectable */}
          {seriesSummary && seriesSummary.firstDate && (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">First Lesson Date</Text>
              <TouchableOpacity
                onPress={() => setShowFirstLessonDatePicker(true)}
                className="flex-row items-center justify-between bg-crescender-800/50 p-2 rounded-lg border border-crescender-700"
              >
                <Text className="text-white text-base" numberOfLines={1}>
                  {formatFullDate(seriesSummary.firstDate)}
                </Text>
                <Feather name="calendar" size={ICON_SIZES.small} color={ACCENT_COLOR} />
              </TouchableOpacity>
            </View>
          )}

          {/* Frequency - Capitalized */}
          {eduDetails?.frequency && (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">Frequency</Text>
              <Text className="text-white text-base" numberOfLines={1}>
                {eduDetails.frequency.charAt(0).toUpperCase() + eduDetails.frequency.slice(1)}
              </Text>
            </View>
          )}

          {/* Days of Week */}
          {eduDetails?.daysOfWeek && eduDetails.daysOfWeek.length > 0 && (
            <View className="mb-3">
              <Text className="text-crescender-400 text-sm mb-1">Day{eduDetails.daysOfWeek.length !== 1 ? 's' : ''} of Week</Text>
              <Text className="text-white text-base" numberOfLines={2}>{eduDetails.daysOfWeek.join(', ')}</Text>
            </View>
          )}

          {/* Date Added - Use receipt.createdAt */}
          <View className="mb-3">
            <Text className="text-crescender-400 text-sm mb-1">Date Added</Text>
            <Text className="text-white text-base" numberOfLines={1}>
              {receipt.createdAt ? formatFullDate(receipt.createdAt) : formatFullDate(receipt.transactionDate)}
            </Text>
          </View>

          {/* Teacher (if available) */}
          {eduDetails?.teacherName && !isEditing && (
            <View>
              <Text className="text-crescender-400 text-sm mb-1">Teacher</Text>
              <Text className="text-white text-base" numberOfLines={1}>{eduDetails.teacherName}</Text>
            </View>
          )}
        </View>

        {/* Learning Path - Swipeable Contexts */}
        {chain && chain.items.length > 1 && (
          <View className="p-6 border-b border-crescender-800">
            <View className="flex-row items-center gap-2 mb-3">
              <Text className="font-bold uppercase tracking-widest text-xs flex-1" style={{ color: ACCENT_COLOR }}>Learning Path</Text>
              <TouchableOpacity onPress={() => setShowLearningPathInfo(true)} className="p-1">
                <Feather name="info" size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <View className="mb-2">
              <Text className="text-crescender-400 text-sm mb-1">
                {chain.items.length} term{chain.items.length !== 1 ? 's' : ''} of {chain.focus} lessons
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
                          <View className="flex-1 min-w-0">
                            <Text className="text-white text-base font-medium" numberOfLines={2}>{chainItem.item.description}</Text>
                            <Text className="text-crescender-400 text-sm mt-1">
                              {formatFullDate(chainItem.receipt.transactionDate)}
                            </Text>
                          </View>
                          <Text className="text-crescender-500 text-base ml-2 flex-shrink-0">
                            ${(chainItem.item.totalPrice / 100).toFixed(2)}
                          </Text>
                        </View>
                        {currentSeries && currentSeries.count > 0 && (
                          <Text className="text-crescender-400 text-sm">
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
                  <Feather name="alert-triangle" size={ICON_SIZES.standard} color="#fbbf24" />
                  <View className="flex-1">
                    <Text className="text-yellow-400 text-base font-semibold mb-1">Gap detected</Text>
                    <Text className="text-white text-sm mb-1">
                      Expected: {formatFullDate(gap.expectedDate)}
                    </Text>
                    {gap.actualNextDate && (
                      <Text className="text-white text-sm">
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
                    <Text className="text-white text-sm text-center">Accept Gap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert('Add Missing Receipt', 'You can scan the missing receipt to fill this gap.');
                    }}
                    className="flex-1 bg-gold px-3 py-2 rounded-lg"
                  >
                    <Text className="text-crescender-950 text-sm text-center font-semibold">Add Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Lesson series — one block: N occurrences, first–last date, Add to calendar */}
        {seriesSummary && seriesSummary.count > 0 && (
          <View className="p-6 border-b border-crescender-800">
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: '#06b6d4' }}>Lesson series</Text>
            <View className="p-4 rounded-xl flex-row items-center justify-between border" style={{ backgroundColor: '#06b6d410', borderColor: '#06b6d430' }}>
              <View className="flex-1 min-w-0">
                <Text className="text-white text-base font-medium" numberOfLines={1}>
                  {seriesSummary.count} occurrence{seriesSummary.count === 1 ? '' : 's'}
                </Text>
                <Text className="text-cyan-300 text-sm mt-1" numberOfLines={2}>
                  {seriesSummary.firstDate === seriesSummary.lastDate
                    ? formatFullDate(seriesSummary.firstDate)
                    : `${formatFullDate(seriesSummary.firstDate)} to ${formatFullDate(seriesSummary.lastDate)}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleAddSeriesToCalendar}
                className="p-2 rounded-lg"
                style={{ backgroundColor: '#06b6d420' }}
              >
                <Feather name="calendar" size={ICON_SIZES.standard} color="#06b6d4" />
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
                  <Feather name="phone" size={ICON_SIZES.standard} color={ACCENT_COLOR} />
                  <Text className="text-white text-base underline">{receipt.merchantPhone}</Text>
                </TouchableOpacity>
              )}
              {receipt.merchantEmail && (
                <TouchableOpacity onPress={() => openEmail(receipt.merchantEmail!)} className="flex-row items-center gap-3 mb-3">
                  <Feather name="mail" size={ICON_SIZES.standard} color={ACCENT_COLOR} />
                  <Text className="text-white text-base underline">{receipt.merchantEmail}</Text>
                </TouchableOpacity>
              )}
              {receipt.merchantAddress && (
                <View className="flex-row items-start gap-3">
                  <Feather name="map-pin" size={ICON_SIZES.standard} color={ACCENT_COLOR} style={{ marginTop: 2 }} />
                  <Text className="text-crescender-300 text-base flex-1">
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
            <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: '#10b981' }}>Associated Transaction</Text>
            <TouchableOpacity
              onPress={() => router.push(`/gear/${receipt.id}` as any)}
              className="p-4 rounded-xl border"
              style={{ backgroundColor: '#10b98110', borderColor: '#10b98130' }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 min-w-0">
                  <Text className="text-white text-base font-medium" numberOfLines={1}>{receipt.merchant}</Text>
                  <Text className="text-green-300 text-sm mt-1" numberOfLines={1}>
                    {formatFullDate(receipt.transactionDate)} • ${(receipt.total / 100).toFixed(2)}
                  </Text>
                </View>
                <Feather name="chevron-right" size={ICON_SIZES.standard} color="#10b981" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Raw OCR Data (Debug) */}
        {receipt.rawOcrData && (
          <View className="p-6">
            <TouchableOpacity 
              onPress={() => {
                Alert.alert("Raw OCR Data", receipt.rawOcrData || "No data available");
              }}
              className="bg-crescender-800/40 p-4 rounded-xl border border-crescender-700 items-center"
            >
              <Text className="text-crescender-400 font-bold uppercase tracking-widest text-[10px]">View Raw OCR Data (Debug)</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* First Lesson Date Picker Modal */}
      {seriesSummary && seriesSummary.firstDate && (
        <DatePickerModal
          visible={showFirstLessonDatePicker}
          onRequestClose={() => setShowFirstLessonDatePicker(false)}
          selectedDate={seriesSummary.firstDate}
          onDateSelect={handleFirstLessonDateSelect}
          showFutureWarning={false}
        />
      )}

      {/* Learning Path Info Modal */}
      <Modal
        visible={showLearningPathInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLearningPathInfo(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowLearningPathInfo(false)}
          className="flex-1 bg-black/50 justify-center items-center px-6"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="bg-crescender-900 rounded-2xl p-6 border border-crescender-700 max-w-md w-full"
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">Learning Path</Text>
              <TouchableOpacity onPress={() => setShowLearningPathInfo(false)}>
                <Feather name="x" size={ICON_SIZES.standard} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            <Text className="text-crescender-300 text-base leading-6">
              Swipe left/right to view other lessons in this series
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

