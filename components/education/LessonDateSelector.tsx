/**
 * Lesson Date Selector Component
 * 
 * Provides UI for selecting lesson start date, frequency, and previewing calculated dates
 */

import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useState, useMemo } from 'react';
import { Feather } from '@expo/vector-icons';
import { DatePickerModal } from '../calendar/DatePickerModal';
import { generateEducationEvents } from '@lib/educationEvents';
import { getLessonCountSuspects } from '@lib/educationUtils';
import type { ReceiptItem, EducationDetails } from '@lib/repository';

export type LessonFrequency = 'weekly' | 'fortnightly' | 'monthly' | 'one-off';

interface LessonDateSelectorProps {
  item: ReceiptItem;
  transactionDate: string;
  onUpdate: (updates: Partial<EducationDetails & { quantity?: number }>) => void;
}

const FREQUENCY_OPTIONS: { value: LessonFrequency; label: string; days: number }[] = [
  { value: 'weekly', label: 'Weekly', days: 7 },
  { value: 'fortnightly', label: 'Fortnightly', days: 14 },
  { value: 'monthly', label: 'Monthly', days: 30 },
  { value: 'one-off', label: 'One-off', days: 0 },
];

export function LessonDateSelector({ item, transactionDate, onUpdate }: LessonDateSelectorProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Parse education details
  const eduDetails: EducationDetails = useMemo(() => {
    if (!item.educationDetails) return {};
    if (typeof item.educationDetails === 'string') {
      try {
        return JSON.parse(item.educationDetails);
      } catch {
        return {};
      }
    }
    return item.educationDetails as any;
  }, [item.educationDetails]);

  const startDate = eduDetails.startDate || null;
  const frequency = eduDetails.frequency || 'weekly';
  
  // Determine frequency from string or default
  const currentFrequency: LessonFrequency = useMemo(() => {
    if (!frequency || typeof frequency !== 'string') return 'weekly';
    const f = frequency.toLowerCase();
    if (f.includes('weekly') || f === 'week') return 'weekly';
    if (f.includes('fortnight') || f.includes('biweek')) return 'fortnightly';
    if (f.includes('monthly') || f.includes('month')) return 'monthly';
    return 'one-off';
  }, [frequency]);

  const suspects = useMemo(() => {
    return getLessonCountSuspects(item, eduDetails);
  }, [item, eduDetails]);

  // Generate preview dates
  const previewDates = useMemo(() => {
    if (!startDate || currentFrequency === 'one-off') {
      return startDate ? [startDate] : [];
    }

    // Create a mock receipt for event generation
    const mockReceipt = {
      id: 'preview',
      merchant: '',
      transactionDate,
    } as any;

    // Create a mock item with updated details
    const mockItem = {
      ...item,
      educationDetails: JSON.stringify({
        ...eduDetails,
        startDate,
        frequency: FREQUENCY_OPTIONS.find(f => f.value === currentFrequency)?.label || frequency,
      }),
    } as ReceiptItem;

    const events = generateEducationEvents(mockItem, mockReceipt);
    return events.slice(0, 10).map(e => e.date); // Limit to first 10 for preview
  }, [startDate, currentFrequency, item, transactionDate, eduDetails]);

  const handleFrequencySelect = (freq: LessonFrequency) => {
    const option = FREQUENCY_OPTIONS.find(f => f.value === freq);
    onUpdate({
      frequency: option?.label || freq,
    });
  };

  const handleDateSelect = (date: string) => {
    onUpdate({ startDate: date });
    setShowDatePicker(false);
  };

  const formatDatePreview = (dateStr: string): string => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatDateFull = (dateStr: string | null): string => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <View className="mt-4 pt-4 border-t border-crescender-700">
      <Text className="text-crescender-400 text-sm mb-3 font-semibold">Lesson Schedule</Text>

      {/* Student name – important to capture */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">
          Student name <Text className="text-yellow-500">(required)</Text>
        </Text>
        <TextInput
          className="text-white text-base border-b border-crescender-700 py-1"
          value={eduDetails.studentName || ''}
          onChangeText={(text) => onUpdate({ studentName: text.trim() || undefined })}
          placeholder="e.g. Alex, Jordan"
          placeholderTextColor="#666"
        />
        {!eduDetails.studentName && (
          <Text className="text-yellow-500 text-xs mt-1">Student name helps track lessons</Text>
        )}
      </View>

      {/* Teacher name */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">
          Teacher name <Text className="text-crescender-600">(optional)</Text>
        </Text>
        <TextInput
          className="text-white text-base border-b border-crescender-700 py-1"
          value={eduDetails.teacherName || ''}
          onChangeText={(text) => onUpdate({ teacherName: text.trim() || undefined })}
          placeholder="e.g. Jane Smith"
          placeholderTextColor="#666"
        />
      </View>

      {/* Focus Field */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">
          Focus <Text className="text-crescender-600">(e.g., Violin, Piano, Vocals, Theory)</Text>
        </Text>
        <TextInput
          className="text-white text-base border-b border-crescender-700 py-1"
          value={eduDetails.focus || ''}
          onChangeText={(text) => onUpdate({ focus: text.trim() || undefined })}
          placeholder="Violin, Piano, Vocals, Theory, Etc"
          placeholderTextColor="#666"
        />
        {!eduDetails.focus && (
          <Text className="text-yellow-500 text-xs mt-1">Focus needed for chaining lessons</Text>
        )}
      </View>

      {/* Lesson Start Date */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">Lesson Start Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="bg-crescender-800 p-3 rounded-xl flex-row items-center justify-between border border-crescender-700"
        >
          <Text className={`text-base ${startDate ? 'text-white' : 'text-crescender-500'}`}>
            {formatDateFull(startDate)}
          </Text>
          <Feather name="calendar" size={20} color="#f5c518" />
        </TouchableOpacity>
      </View>

      {/* Frequency Selector Chips */}
      <View className="mb-4">
        <Text className="text-crescender-500 text-xs mb-2">Frequency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2">
            {FREQUENCY_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleFrequencySelect(option.value)}
                className={`px-4 py-2 rounded-full border ${
                  currentFrequency === option.value
                    ? 'bg-gold border-gold'
                    : 'bg-crescender-800 border-crescender-700'
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    currentFrequency === option.value
                      ? 'text-crescender-950'
                      : 'text-crescender-300'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Lesson Count Humility UI */}
      <View className="mb-6">
        <Text className="text-crescender-500 text-xs mb-2">Number of Lessons</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {suspects.map((s, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => onUpdate({ quantity: s.count } as any)} // Note: updateState might need to handle quantity at top level if it's item.quantity
              className={`px-4 py-3 rounded-xl border flex-1 min-w-[100px] ${
                item.quantity === s.count
                  ? 'bg-gold border-gold'
                  : 'bg-crescender-900/60 border-crescender-700'
              }`}
            >
              <Text className={`text-lg font-bold text-center ${item.quantity === s.count ? 'text-crescender-950' : 'text-white'}`}>
                {s.count}
              </Text>
              <Text className={`text-[9px] text-center uppercase tracking-tighter ${item.quantity === s.count ? 'text-crescender-900/70' : 'text-crescender-500'}`}>
                {s.source === 'quantity' ? 'From QTY column' : s.source === 'description' ? 'From Desc' : 'From Dates'}
              </Text>
            </TouchableOpacity>
          ))}
          
          {/* Manual input as a fallback */}
          <View className="flex-1 min-w-[100px] bg-crescender-900/60 border border-crescender-700 rounded-xl px-2">
            <TextInput
              className="text-white text-lg font-bold text-center h-full"
              keyboardType="number-pad"
              placeholder="Other"
              placeholderTextColor="#666"
              defaultValue={item.quantity?.toString() || ''}
              onEndEditing={(e) => {
                const val = parseInt(e.nativeEvent.text, 10);
                if (!isNaN(val)) onUpdate({ quantity: val } as any);
              }}
            />
          </View>
        </View>
        
        {suspects.length > 1 && (
          <View className="bg-yellow-900/20 p-3 rounded-lg border border-yellow-700/50 flex-row gap-2 items-center">
            <Feather name="alert-circle" size={14} color="#fbbf24" />
            <Text className="text-yellow-500/90 text-[10px] flex-1">
              Multiple possible lesson counts detected. Please confirm which is correct.
            </Text>
          </View>
        )}
      </View>

      {/* Preview of Calculated Dates */}
      {startDate && previewDates.length > 0 && (
        <View className="bg-crescender-900/40 p-3 rounded-xl border border-crescender-800">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="calendar" size={14} color="#f5c518" />
            <Text className="text-crescender-300 text-xs font-semibold">
              {FREQUENCY_OPTIONS.find(f => f.value === currentFrequency)?.label}:{' '}
              {previewDates.length} lesson{previewDates.length !== 1 ? 's' : ''} scheduled
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row flex-wrap gap-2">
              {previewDates.map((date, idx) => (
                <View
                  key={idx}
                  className="bg-crescender-800 px-2 py-1 rounded border border-crescender-700"
                >
                  <Text className="text-white text-xs">
                    {formatDatePreview(date)}
                  </Text>
                </View>
              ))}
              {previewDates.length === 10 && (
                <View className="bg-crescender-800 px-2 py-1 rounded border border-crescender-700">
                  <Text className="text-crescender-400 text-xs">+ more</Text>
                </View>
              )}
            </View>
          </ScrollView>
          {previewDates.length === 10 && (
            <Text className="text-crescender-500 text-xs mt-2">
              Showing first 10 lessons. More will be generated based on the schedule.
            </Text>
          )}
        </View>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        onRequestClose={() => setShowDatePicker(false)}
        selectedDate={startDate}
        onDateSelect={handleDateSelect}
        showFutureWarning={false}
      />
    </View>
  );
}
