import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { hasUsedBaseScans } from '../../lib/usageTracking';

interface CameraBarProps {
  /** @deprecated Use startDate/endDate. Kept for backward compat. */
  selectedDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  onShowDatePicker?: () => void;
  onClearDate?: () => void;
}

function formatDayMonth(d: Date) {
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

export const CameraBar = ({
  selectedDate,
  startDate: startProp,
  endDate: endProp,
  onShowDatePicker,
  onClearDate,
}: CameraBarProps) => {
  const router = useRouter();
  const [showGetMoreScans, setShowGetMoreScans] = useState(false);
  
  // Support legacy selectedDate or new start/end range
  const startDate = startProp ?? (selectedDate ?? null);
  const endDate = endProp ?? null;

  // Check if user has used all base scans
  useEffect(() => {
    const checkScans = async () => {
      const usedAll = await hasUsedBaseScans();
      setShowGetMoreScans(usedAll);
    };
    checkScans();
  }, []);

  const hasRange = startDate != null || endDate != null;
  const currentYear = new Date().getFullYear();
  const startYear = startDate?.getFullYear();
  const endYear = endDate?.getFullYear();
  const isSingleDate =
    !!startDate &&
    !!endDate &&
    formatDayMonth(startDate) === formatDayMonth(endDate);
  const shouldShowYears =
    !!startDate &&
    !!endDate &&
    (startYear !== currentYear || endYear !== currentYear);
  const shouldShowYearLine = shouldShowYears && startYear != null && endYear != null;

  const renderRangeLabel = () => {
    if (!startDate && !endDate) return null;
    if (isSingleDate) {
      return (
        <Text
          className="text-crescender-200 text-sm font-bold uppercase tracking-widest"
          numberOfLines={1}
        >
          {formatDayMonth(startDate!)}
        </Text>
      );
    }

    const startLabel = startDate ? formatDayMonth(startDate) : '…';
    const endLabel = endDate ? formatDayMonth(endDate) : '…';

    return (
      <View className="flex-row items-center justify-center gap-1" style={{ minWidth: 120, maxWidth: 200 }}>
        <Text
          className="text-crescender-200 text-sm font-bold uppercase tracking-widest"
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'left' }}
        >
          {startLabel}
        </Text>
        <Text
          className="text-crescender-200 text-sm font-bold uppercase tracking-widest"
          numberOfLines={1}
          style={{ lineHeight: 16 }}
        >
          –
        </Text>
        <Text
          className="text-crescender-200 text-sm font-bold uppercase tracking-widest"
          numberOfLines={1}
          style={{ flex: 1, textAlign: 'right' }}
        >
          {endLabel}
        </Text>
      </View>
    );
  };
  const rangeLabelElement = renderRangeLabel();

  return (
    <View className="px-6 py-2 flex-row items-center gap-3">
      <TouchableOpacity
        onPress={() => {
          if (showGetMoreScans) {
            router.push('/get-more-scans');
          } else {
            router.push('/scan');
          }
        }}
        className={`flex-1 h-14 rounded-2xl flex-row items-center justify-center gap-3 shadow-lg ${
          showGetMoreScans
            ? 'bg-crescender-800 border-2 border-gold/40'
            : 'bg-gold shadow-gold/20'
        }`}
      >
        <Feather 
          name={showGetMoreScans ? 'gift' : 'camera'} 
          size={24} 
          color={showGetMoreScans ? '#f5c518' : '#2e1065'} 
        />
        <Text 
          className={`font-bold text-xl ${
            showGetMoreScans ? 'text-gold' : 'text-crescender-950'
          }`} 
          style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}
        >
          {showGetMoreScans ? 'GET MORE SCANS' : 'SNAP RECEIPT'}
        </Text>
      </TouchableOpacity>

      {/* Date Filter Button */}
      {onShowDatePicker && (
        <TouchableOpacity
          onPress={onShowDatePicker}
          className="h-14 bg-crescender-800/40 px-4 rounded-2xl border border-crescender-700/50 flex-row items-center justify-center gap-2"
        >
          <Feather name="calendar" size={18} color="#f5c518" />
          {rangeLabelElement && (
            <View className="items-center justify-center gap-[2px]">
              {rangeLabelElement}
              {shouldShowYearLine && (
                <View className="flex-row items-center justify-between gap-2" style={{ minWidth: 120, maxWidth: 200 }}>
                  <Text
                    className="text-crescender-300 text-xs font-bold uppercase tracking-widest text-left flex-1"
                    numberOfLines={1}
                  >
                    {startYear}
                  </Text>
                  <Text
                    className="text-crescender-300 text-xs font-bold uppercase tracking-widest text-right flex-1"
                    numberOfLines={1}
                  >
                    {endYear}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Clear Date Button */}
      {hasRange && onClearDate && (
        <TouchableOpacity onPress={onClearDate} className="p-2">
          <Feather name="x" size={20} color="#f5c518" />
        </TouchableOpacity>
      )}
    </View>
  );
};
