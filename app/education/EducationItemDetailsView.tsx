import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { LineItemWithDetails, Receipt } from '../../lib/repository';
import { formatFullDate } from '../../lib/dateUtils';
import { getEducationSeriesSummary } from '../../lib/educationEvents';
import { ICON_SIZES } from '../../lib/iconSizes';

const ACCENT_COLOR = '#c084fc'; // Purple for education

interface DetailFieldConfig {
  label: string;
  getValue: (data: DetailsData) => string | null | undefined;
  condition?: (data: DetailsData) => boolean;
}

interface DetailsData {
  item: LineItemWithDetails;
  receipt: Receipt;
  eduDetails: any;
  seriesSummary: ReturnType<typeof getEducationSeriesSummary> | null;
}

const DETAIL_FIELDS: DetailFieldConfig[] = [
  {
    label: 'Focus',
    getValue: (d) => d.eduDetails?.focus,
  },
  {
    label: 'Provider',
    getValue: (d) => d.eduDetails?.subtitle ?? d.receipt.merchant,
  },
  {
    label: 'Series Length',
    getValue: (d) =>
      d.seriesSummary && d.seriesSummary.count > 0
        ? `${d.seriesSummary.count} lesson${d.seriesSummary.count !== 1 ? 's' : ''}`
        : null,
  },
  {
    label: 'Lesson Length',
    getValue: (d) => d.eduDetails?.duration,
    condition: (d) =>
      d.eduDetails?.duration &&
      !d.eduDetails.duration.toLowerCase().includes('week') &&
      !d.eduDetails.duration.toLowerCase().includes('term'),
  },
  {
    label: 'Frequency',
    getValue: (d) =>
      d.eduDetails?.frequency
        ? d.eduDetails.frequency.charAt(0).toUpperCase() + d.eduDetails.frequency.slice(1)
        : null,
  },
  {
    label: 'Day of Week',
    getValue: (d) =>
      d.eduDetails?.daysOfWeek?.length > 0 ? d.eduDetails.daysOfWeek.join(', ') : null,
  },
  {
    label: 'Date Added',
    getValue: (d) => formatFullDate(d.receipt.createdAt || d.receipt.transactionDate),
  },
  {
    label: 'Teacher',
    getValue: (d) => d.eduDetails?.teacherName,
  },
];

interface EducationItemDetailsViewProps {
  item: LineItemWithDetails;
  receipt: Receipt;
  onFirstLessonDatePress?: () => void;
}

export function EducationItemDetailsView({
  item,
  receipt,
  onFirstLessonDatePress,
}: EducationItemDetailsViewProps) {
  const eduDetails = item.educationDetailsParsed;
  const seriesSummary = getEducationSeriesSummary(item, receipt);

  const data: DetailsData = { item, receipt, eduDetails, seriesSummary };

  const visibleFields = DETAIL_FIELDS.filter((field) => {
    if (field.condition && !field.condition(data)) return false;
    const value = field.getValue(data);
    return value !== null && value !== undefined && value !== '';
  });

  return (
    <View className="p-6 border-b border-crescender-800">
      {visibleFields.map((field) => (
        <View key={field.label} className="mb-3">
          <Text className="text-crescender-400 text-sm mb-1">{field.label}</Text>
          <Text className="text-white text-base" numberOfLines={2}>
            {field.getValue(data)}
          </Text>
        </View>
      ))}

      {/* First Lesson Date - Special interactive field */}
      {seriesSummary && seriesSummary.firstDate && (
        <View className="mb-3">
          <Text className="text-crescender-400 text-sm mb-1">First Lesson Date</Text>
          <TouchableOpacity
            onPress={onFirstLessonDatePress}
            className="flex-row items-center justify-between bg-crescender-800/50 p-2 rounded-lg border border-crescender-700"
          >
            <Text className="text-white text-base" numberOfLines={1}>
              {formatFullDate(seriesSummary.firstDate)}
            </Text>
            <Feather name="calendar" size={ICON_SIZES.small} color={ACCENT_COLOR} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
