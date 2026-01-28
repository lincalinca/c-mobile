import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ReceiptRepository, type LineItemWithDetails, type Receipt } from '../../lib/repository';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getEducationSeriesSummary } from '../../lib/educationEvents';
import { addEducationSeriesToDeviceCalendar } from '../../lib/calendarExport';
import { findChainForItem, getChainIndex, type EducationChain } from '../../lib/educationChain';
import { detectContinuityGaps, type ContinuityGap } from '../../lib/educationContinuity';
import { ICON_SIZES } from '../../lib/iconSizes';
import { DatePickerModal } from '../../components/calendar/DatePickerModal';
import { ContactDetailsSection } from '../../components/common/ContactDetailsSection';

import { useEducationItemEdit } from './useEducationItemEdit';
import { EducationItemEditForm } from './EducationItemEditForm';
import { EducationItemDetailsView } from './EducationItemDetailsView';
import { EducationLearningPathView } from './EducationLearningPathView';
import { EducationLessonSeriesView } from './EducationLessonSeriesView';
import { EducationContinuityGapsView } from './EducationContinuityGapsView';
import { EducationTransactionView } from './EducationTransactionView';

const ACCENT_COLOR = '#c084fc'; // Purple for education

// Header View Component
function EducationHeaderView({
  item,
  receipt,
}: {
  item: LineItemWithDetails;
  receipt: Receipt;
}) {
  const eduDetails = item.educationDetailsParsed;

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="text-white text-xl font-bold mb-1">{item.description}</Text>
      <Text className="text-crescender-400 text-sm">{eduDetails?.subtitle ?? receipt.merchant}</Text>
    </View>
  );
}

export default function EducationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState<LineItemWithDetails | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [chain, setChain] = useState<EducationChain | null>(null);
  const [currentChainIndex, setCurrentChainIndex] = useState(0);
  const [continuityGaps, setContinuityGaps] = useState<ContinuityGap[]>([]);
  const [showFirstLessonDatePicker, setShowFirstLessonDatePicker] = useState(false);
  const [showLearningPathInfo, setShowLearningPathInfo] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const receipts = await ReceiptRepository.getAllWithItems();

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

        const educationChain = findChainForItem(id, receipts);
        if (educationChain) {
          setChain(educationChain);
          setCurrentChainIndex(getChainIndex(id, educationChain));
          setContinuityGaps(detectContinuityGaps(educationChain.items));
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
  }, [id]);

  // Recalculate gaps when chain or current item changes
  useEffect(() => {
    if (chain && item) {
      setContinuityGaps(detectContinuityGaps(chain.items));
    }
  }, [chain, item]);

  const {
    isEditing,
    isSaving,
    editState,
    setEditState,
    handleStartEdit,
    handleSave,
    handleCancelEdit,
  } = useEducationItemEdit(item, receipt, loadData);

  const seriesSummary = useMemo(
    () => (item && receipt ? getEducationSeriesSummary(item, receipt) : null),
    [item, receipt]
  );

  const handleBack = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/');
  }, [router]);

  const handleAddSeriesToCalendar = useCallback(() => {
    if (seriesSummary && receipt) {
      addEducationSeriesToDeviceCalendar(seriesSummary, receipt);
    }
  }, [seriesSummary, receipt]);

  const handleChainItemChange = useCallback(
    (newIndex: number, newItemId: string) => {
      if (chain) {
        const newChainItem = chain.items[newIndex];
        setCurrentChainIndex(newIndex);
        setItem(newChainItem.item);
        setReceipt(newChainItem.receipt);
        router.setParams({ id: newItemId } as any);
      }
    },
    [chain, router]
  );

  const handleFirstLessonDateSelect = useCallback(
    async (date: string) => {
      if (!item || !receipt) return;

      const selectedDate = new Date(date + 'T12:00:00');
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = dayNames[selectedDate.getDay()];

      const edu = item.educationDetailsParsed || {};
      const existingDays = edu.daysOfWeek ?? [];
      const updatedDaysOfWeek = existingDays.length > 0 ? [...existingDays] : [dayOfWeek];

      if (!updatedDaysOfWeek.includes(dayOfWeek)) {
        updatedDaysOfWeek.push(dayOfWeek);
        updatedDaysOfWeek.sort((a, b) => {
          const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          return order.indexOf(a) - order.indexOf(b);
        });
      }

      const merged = { ...edu, startDate: date, daysOfWeek: updatedDaysOfWeek };

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
    },
    [item, receipt, loadData]
  );

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
    address: receipt.merchantAddress,
    suburb: receipt.merchantSuburb,
    state: receipt.merchantState,
    postcode: receipt.merchantPostcode,
  };

  return (
    <View className="flex-1 bg-crescender-950" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-6 py-4 flex-row justify-between items-center border-b border-crescender-800">
        <TouchableOpacity onPress={isEditing ? handleCancelEdit : handleBack} className="p-2 -ml-2">
          <Feather name={isEditing ? 'x' : 'arrow-left'} size={ICON_SIZES.standard} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">Education Details</Text>
        {isEditing ? (
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: ACCENT_COLOR }}
          >
            <Text className="text-white text-base font-bold">{isSaving ? 'Saving…' : 'Save'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleStartEdit} className="p-2">
            <Feather name="edit-2" size={ICON_SIZES.standard} color={ACCENT_COLOR} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        nestedScrollEnabled
      >
        {isEditing ? (
          <EducationItemEditForm
            editState={editState}
            onUpdateField={(field, value) => setEditState({ ...editState, [field]: value })}
          />
        ) : (
          <EducationHeaderView item={item} receipt={receipt} />
        )}

        {!isEditing && (
          <>
            <EducationItemDetailsView
              item={item}
              receipt={receipt}
              onFirstLessonDatePress={() => setShowFirstLessonDatePicker(true)}
            />

            {chain && (
              <EducationLearningPathView
                chain={chain}
                currentChainIndex={currentChainIndex}
                onItemChange={handleChainItemChange}
                showInfoModal={showLearningPathInfo}
                onShowInfoModal={setShowLearningPathInfo}
              />
            )}

            <EducationContinuityGapsView gaps={continuityGaps} />

            {seriesSummary && (
              <EducationLessonSeriesView
                seriesSummary={seriesSummary}
                onAddToCalendar={handleAddSeriesToCalendar}
              />
            )}

            <ContactDetailsSection data={contactData} accentColor={ACCENT_COLOR} />
            <EducationTransactionView receipt={receipt} />
          </>
        )}
      </ScrollView>

      {/* First Lesson Date Picker Modal */}
      {seriesSummary?.firstDate && (
        <DatePickerModal
          visible={showFirstLessonDatePicker}
          onRequestClose={() => setShowFirstLessonDatePicker(false)}
          selectedDate={seriesSummary.firstDate}
          onDateSelect={handleFirstLessonDateSelect}
          showFutureWarning={false}
        />
      )}
    </View>
  );
}
