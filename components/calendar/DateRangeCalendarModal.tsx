import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// en-AU: week starts Monday, short month names
LocaleConfig.locales['en-AU'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today',
};
LocaleConfig.defaultLocale = 'en-AU';

// Crescender theme: gold accent, purple/dark background
const CRESCENDER_THEME = {
  calendarBackground: 'transparent',
  textSectionTitleColor: '#ddd6fe',
  textSectionTitleDisabledColor: '#6b21a8',
  selectedDayBackgroundColor: '#f5c518',
  selectedDayTextColor: '#2e1065',
  todayTextColor: '#f5c518',
  todayBackgroundColor: 'rgba(245, 197, 24, 0.2)',
  dayTextColor: '#e9d5ff',
  textDisabledColor: '#5b21b6',
  arrowColor: '#f5c518',
  monthTextColor: '#f5c518',
  textInactiveColor: '#7c3aed',
};

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function parseDateString(s: string): Date {
  const d = new Date(s + 'T12:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface DateRangeCalendarModalProps {
  visible: boolean;
  onRequestClose: () => void;
  startDate: Date | null;
  endDate: Date | null;
  onApply: (start: Date | null, end: Date | null) => void;
}

export function DateRangeCalendarModal({
  visible,
  onRequestClose,
  startDate,
  endDate,
  onApply,
}: DateRangeCalendarModalProps) {
  // Initial temp state from props when modal opens; we'll derive from props for controlled-ish behaviour.
  // When visible changes to true, we need to sync. Use startDate/endDate as initial and manage temp in state.
  // For simplicity: when modal is visible, we treat parent's start/end as the "current" and on each tap we
  // compute the next range and call onApply only on Apply/Clear. So we need internal temp state that we
  // init when modal opens.
  const [tempStart, setTempStart] = useState<string | null>(null);
  const [tempEnd, setTempEnd] = useState<string | null>(null);

  // Sync from props when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTempStart(startDate ? toDateString(startDate) : null);
      setTempEnd(endDate ? toDateString(endDate) : null);
    }
  }, [visible, startDate, endDate]);

  const onDayPress = (day: { dateString: string }) => {
    const s = day.dateString;
    if (!tempStart) {
      setTempStart(s);
      setTempEnd(null);
      return;
    }
    if (!tempEnd) {
      if (s < tempStart) {
        setTempStart(s);
        setTempEnd(tempStart);
      } else {
        setTempEnd(s);
      }
      return;
    }
    // Both set: start new range
    setTempStart(s);
    setTempEnd(null);
  };

  const buildMarkedDates = (): Record<string, { startingDay?: boolean; endingDay?: boolean; color: string; textColor?: string }> => {
    const out: Record<string, { startingDay?: boolean; endingDay?: boolean; color: string; textColor?: string }> = {};
    const color = '#f5c518';
    const textColor = '#2e1065';
    if (!tempStart) return out;
    if (!tempEnd || tempStart === tempEnd) {
      out[tempStart] = { startingDay: true, endingDay: true, color, textColor };
      return out;
    }
    const [a, b] = tempStart < tempEnd ? [tempStart, tempEnd] : [tempEnd, tempStart];
    const cur = new Date(a + 'T12:00:00');
    const end = new Date(b + 'T12:00:00');
    while (cur <= end) {
      const k = toDateString(cur);
      out[k] = {
        startingDay: k === a,
        endingDay: k === b,
        color,
        textColor,
      };
      cur.setDate(cur.getDate() + 1);
    }
    return out;
  };

  const handleApply = () => {
    const start = tempStart ? parseDateString(tempStart) : null;
    const end = tempEnd ? parseDateString(tempEnd) : null;
    onApply(start, end);
    onRequestClose();
  };

  const handleClear = () => {
    setTempStart(null);
    setTempEnd(null);
    onApply(null, null);
    onRequestClose();
  };

  const initialMonth = (startDate && toDateString(startDate)) || (endDate && toDateString(endDate)) || toDateString(new Date());

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View className="flex-1 bg-black/60 justify-center items-center px-4">
        <View className="bg-crescender-900/98 rounded-2xl p-4 w-full max-w-md border border-crescender-700">
          <Text className="text-gold text-lg font-bold mb-2 text-center" style={{ fontFamily: (Platform.OS as string) === 'web' ? 'Bebas Neue, system-ui' : undefined }}>
            Date range
          </Text>
          <Text className="text-crescender-300 text-sm mb-3 text-center">
            Tap a start date, then an end date. Same tap again to choose a new range.
          </Text>
          <Calendar
            key={visible ? 'open' : 'closed'}
            initialDate={initialMonth}
            onDayPress={onDayPress}
            markingType="period"
            markedDates={buildMarkedDates()}
            theme={CRESCENDER_THEME}
            firstDay={1}
            hideExtraDays={false}
            enableSwipeMonths
          />
          <View className="flex-row justify-between gap-3 mt-2">
            <TouchableOpacity
              onPress={handleClear}
              className="px-4 py-2.5 rounded-xl bg-crescender-800 border border-crescender-600"
            >
              <Text className="text-crescender-200 font-semibold">Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onRequestClose}
              className="px-4 py-2.5 rounded-xl bg-crescender-800 border border-crescender-600"
            >
              <Text className="text-crescender-200 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleApply}
              className="px-4 py-2.5 rounded-xl bg-gold"
            >
              <Text className="text-crescender-950 font-bold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
