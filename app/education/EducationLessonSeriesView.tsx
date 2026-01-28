import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatFullDate } from '../../lib/dateUtils';
import { ICON_SIZES } from '../../lib/iconSizes';
import type { getEducationSeriesSummary } from '../../lib/educationEvents';

const SERIES_COLOR = '#06b6d4'; // Cyan for lesson series

interface EducationLessonSeriesViewProps {
  seriesSummary: NonNullable<ReturnType<typeof getEducationSeriesSummary>>;
  onAddToCalendar: () => void;
}

export function EducationLessonSeriesView({
  seriesSummary,
  onAddToCalendar,
}: EducationLessonSeriesViewProps) {
  if (seriesSummary.count <= 0) return null;

  const dateRange =
    seriesSummary.firstDate === seriesSummary.lastDate
      ? formatFullDate(seriesSummary.firstDate)
      : `${formatFullDate(seriesSummary.firstDate)} to ${formatFullDate(seriesSummary.lastDate)}`;

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: SERIES_COLOR }}>
        Lesson series
      </Text>
      <View
        className="p-4 rounded-xl flex-row items-center justify-between border"
        style={{ backgroundColor: `${SERIES_COLOR}10`, borderColor: `${SERIES_COLOR}30` }}
      >
        <View className="flex-1 min-w-0">
          <Text className="text-white text-base font-medium" numberOfLines={1}>
            {seriesSummary.count} occurrence{seriesSummary.count === 1 ? '' : 's'}
          </Text>
          <Text className="text-cyan-300 text-sm mt-1" numberOfLines={2}>
            {dateRange}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onAddToCalendar}
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${SERIES_COLOR}20` }}
        >
          <Feather name="calendar" size={ICON_SIZES.standard} color={SERIES_COLOR} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
