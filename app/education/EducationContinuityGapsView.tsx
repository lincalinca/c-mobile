import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatFullDate } from '../../lib/dateUtils';
import { ICON_SIZES } from '../../lib/iconSizes';
import type { ContinuityGap } from '../../lib/educationContinuity';

const ACCENT_COLOR = '#c084fc'; // Purple for education

interface EducationContinuityGapsViewProps {
  gaps: ContinuityGap[];
}

export function EducationContinuityGapsView({ gaps }: EducationContinuityGapsViewProps) {
  if (gaps.length === 0) return null;

  const handleAcceptGap = () => {
    Alert.alert('Accept Gap', 'This gap will be kept in the learning path.');
  };

  const handleAddReceipt = () => {
    Alert.alert('Add Missing Receipt', 'You can scan the missing receipt to fill this gap.');
  };

  return (
    <View className="p-6 border-b border-crescender-800">
      <Text className="font-bold mb-3 uppercase tracking-widest text-xs" style={{ color: ACCENT_COLOR }}>
        Continuity Gap Detected
      </Text>
      {gaps.map((gap, idx) => (
        <View
          key={idx}
          className="bg-yellow-900/20 p-4 rounded-xl mb-3 border border-yellow-700"
        >
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
              onPress={handleAcceptGap}
              className="flex-1 bg-crescender-800 px-3 py-2 rounded-lg"
            >
              <Text className="text-white text-sm text-center">Accept Gap</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAddReceipt}
              className="flex-1 bg-gold px-3 py-2 rounded-lg"
            >
              <Text className="text-crescender-950 text-sm text-center font-semibold">Add Receipt</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

// Default export to prevent expo-router from treating this as a route
export default null;
