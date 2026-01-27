import React from 'react';
import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';

interface QuotaDashboardProps {
  scansRemaining: number;
  scansUsed: number;
  totalScans: number;
  scansLimit: number;
  bonusScans: number;
  percentageUsed: number;
  weekEnd: Date | null;
}

export const QuotaDashboard: React.FC<QuotaDashboardProps> = ({
  scansRemaining,
  scansUsed,
  totalScans,
  scansLimit,
  bonusScans,
  percentageUsed,
  weekEnd,
}) => {
  return (
    <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-crescender-400 text-sm mb-1">Scans Remaining This Week</Text>
          <Text className="text-white text-4xl font-bold">{scansRemaining}</Text>
          {weekEnd && (
            <Text className="text-crescender-500 text-xs mt-1">
              Resets {format(weekEnd, 'dd MMM yyyy')}
            </Text>
          )}
        </View>
        <View className="w-24 h-24 rounded-full bg-crescender-800/40 items-center justify-center">
          <Feather name="camera" size={40} color="#f5c518" />
        </View>
      </View>

      {/* Progress Bar */}
      <View className="mb-4">
        <View className="h-2 bg-crescender-800 rounded-full overflow-hidden">
          <View
            className="h-full bg-gold rounded-full"
            style={{ width: `${percentageUsed}%` }}
          />
        </View>
        <View className="flex-row justify-between mt-2">
          <Text className="text-crescender-500 text-xs">{scansUsed} used</Text>
          <Text className="text-crescender-500 text-xs">{totalScans} total</Text>
        </View>
      </View>

      {/* Breakdown */}
      <View className="border-t border-crescender-800 pt-4">
        <View className="flex-row justify-between mb-2">
          <Text className="text-crescender-300 text-sm">Weekly free scans</Text>
          <Text className="text-white text-sm font-semibold">{scansLimit}</Text>
        </View>
        {bonusScans > 0 && (
          <View className="flex-row justify-between mb-2">
            <Text className="text-crescender-300 text-sm">Bonus scans (from ads)</Text>
            <Text className="text-gold text-sm font-semibold">+{bonusScans}</Text>
          </View>
        )}
      </View>
    </View>
  );
};
