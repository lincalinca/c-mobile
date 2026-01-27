import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export const UsageInfoBox = () => {
  return (
    <View className="bg-crescender-900/20 p-4 rounded-xl border border-crescender-800/50">
      <View className="flex-row items-start gap-3">
        <Feather name="info" size={16} color="#94a3b8" />
        <View className="flex-1">
          <Text className="text-crescender-400 text-xs leading-relaxed">
            Your weekly scan quota resets every Monday at midnight. Bonus scans from ads expire at the end of each week. Bulk uploads count toward your weekly limit.
          </Text>
        </View>
      </View>
    </View>
  );
};
