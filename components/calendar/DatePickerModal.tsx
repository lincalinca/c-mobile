import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { MonthPickerModal } from './MonthPickerModal';

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

interface DatePickerModalProps {
  visible: boolean;
  onRequestClose: () => void;
  selectedDate: string | null; // YYYY-MM-DD format
  onDateSelect: (date: string) => void;
  /** Optional max date (default: none) */
  maxDate?: string;
  /** Show warning when future date selected */
  showFutureWarning?: boolean;
}

export function DatePickerModal({
  visible,
  onRequestClose,
  selectedDate,
  onDateSelect,
  maxDate,
  showFutureWarning = true,
}: DatePickerModalProps) {
  const [tempDate, setTempDate] = useState<string | null>(null);
  const [displayMonth, setDisplayMonth] = useState<string>('');
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const initialMonth = selectedDate || toDateString(new Date());

  // Sync from props when modal becomes visible
  useEffect(() => {
    if (visible) {
      setTempDate(selectedDate);
      setDisplayMonth(selectedDate || initialMonth);
      setShowWarning(false);
    }
  }, [visible, selectedDate, initialMonth]);

  const onDayPress = (day: { dateString: string }) => {
    const today = toDateString(new Date());
    setTempDate(day.dateString);

    // Check if future date
    if (showFutureWarning && day.dateString > today) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  };

  const buildMarkedDates = (): Record<string, { selected: boolean; selectedColor: string }> => {
    const out: Record<string, { selected: boolean; selectedColor: string }> = {};
    if (tempDate) {
      out[tempDate] = {
        selected: true,
        selectedColor: '#f5c518',
      };
    }
    return out;
  };

  const handleConfirm = () => {
    if (tempDate) {
      onDateSelect(tempDate);
    }
    onRequestClose();
  };

  const handleToday = () => {
    const today = toDateString(new Date());
    setTempDate(today);
    setDisplayMonth(today);
    setShowWarning(false);
  };

  const pad = (n: number) => String(n).padStart(2, '0');
  const displayForPicker = (() => {
    const s = displayMonth || initialMonth;
    if (!s) return { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
    const [y, m] = s.split('-').map(Number);
    return { year: y, month: m || 1 };
  })();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <View style={[styles.overlay, styles.overlayCenter]}>
        {Platform.OS !== 'web' && (
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        )}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
        <View style={styles.card}>
          <Text className="text-gold text-lg font-bold mb-2 text-center" style={{ fontFamily: (Platform.OS as string) === 'web' ? 'Bebas Neue, system-ui' : undefined }}>
            Select Date
          </Text>
          <Text className="text-crescender-300 text-sm mb-3 text-center">
            Choose a transaction date
          </Text>
          {showWarning && (
            <View className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-3 mb-3">
              <Text className="text-yellow-400 text-sm text-center">
                ⚠️ Future date selected. Are you sure this is correct?
              </Text>
            </View>
          )}
          <Calendar
            key={visible ? 'open' : 'closed'}
            initialDate={displayMonth || initialMonth}
            onDayPress={onDayPress}
            onMonthChange={(d) => setDisplayMonth((d.dateString || '').slice(0, 7) + '-01')}
            markedDates={buildMarkedDates()}
            theme={CRESCENDER_THEME}
            firstDay={1}
            hideExtraDays={false}
            enableSwipeMonths
            maxDate={maxDate}
            renderHeader={(date) => (
              <TouchableOpacity onPress={() => setMonthPickerOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={{ color: CRESCENDER_THEME.monthTextColor, fontSize: 27, fontWeight: '600' }}>
                  {date ? date.toString('MMMM yyyy') : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
          <MonthPickerModal
            visible={monthPickerOpen}
            onRequestClose={() => setMonthPickerOpen(false)}
            year={displayForPicker.year}
            month={displayForPicker.month}
            onSelect={(y, m) => {
              setDisplayMonth(`${y}-${pad(m)}-01`);
              setMonthPickerOpen(false);
            }}
          />
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity onPress={handleToday} className="flex-1 py-2.5 rounded-xl bg-crescender-800 border border-crescender-600">
              <Text className="text-crescender-200 font-semibold text-center text-sm">Today</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row justify-between gap-3 mt-2">
            <TouchableOpacity
              onPress={onRequestClose}
              className="px-4 py-2.5 rounded-xl bg-crescender-800 border border-crescender-600"
            >
              <Text className="text-crescender-200 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gold"
            >
              <Text className="text-crescender-950 font-bold">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  overlayCenter: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'rgba(24,9,48,0.97)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    maxWidth: 448,
    borderWidth: 1,
    borderColor: 'rgba(126,34,206,0.5)',
  },
});
