import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  // Support legacy selectedDate or new start/end range
  const startDate = startProp ?? (selectedDate ?? null);
  const endDate = endProp ?? null;

  const hasRange = startDate != null || endDate != null;
  const label = (() => {
    if (!startDate && !endDate) return null;
    if (startDate && endDate) {
      const a = formatDayMonth(startDate);
      const b = formatDayMonth(endDate);
      if (a === b) return a;
      return `${a} – ${b}`;
    }
    if (startDate) return `${formatDayMonth(startDate)} – …`;
    if (endDate) return `… – ${formatDayMonth(endDate)}`;
    return null;
  })();

  return (
    <View className="px-6 py-2 flex-row items-center gap-3">
      <TouchableOpacity
        onPress={() => router.push('/scan')}
        className="flex-1 h-14 bg-gold rounded-2xl flex-row items-center justify-center gap-3 shadow-lg shadow-gold/20"
      >
        <Feather name="camera" size={24} color="#2e1065" />
        <Text className="text-crescender-950 font-bold text-xl" style={{ fontFamily: (Platform.OS as any) === 'web' ? 'Bebas Neue, system-ui' : 'System' }}>
          SNAP RECEIPT
        </Text>
      </TouchableOpacity>

      {/* Date Filter Button */}
      {onShowDatePicker && (
        <TouchableOpacity
          onPress={onShowDatePicker}
          className="h-14 bg-crescender-800/40 px-4 rounded-2xl border border-crescender-700/50 flex-row items-center justify-center gap-2"
        >
          <Feather name="calendar" size={18} color="#f5c518" />
          {label != null && (
            <Text className="text-crescender-200 text-sm font-bold uppercase tracking-widest" numberOfLines={1}>
              {label}
            </Text>
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
