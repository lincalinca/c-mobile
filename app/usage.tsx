import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '../components/header/PersistentHeader';
import * as DocumentPicker from 'expo-document-picker';
import { getUsageStats, type ScanRecord } from '../lib/usageTracking';
import { format } from 'date-fns';

export default function UsageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [scansUsed, setScansUsed] = useState(0);
  const [scansLimit, setScansLimit] = useState(10);
  const [bonusScans] = useState(0);
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [weekEnd, setWeekEnd] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsageStats();
  }, []);

  const loadUsageStats = async () => {
    try {
      const stats = await getUsageStats();
      setScansUsed(stats.scansUsed);
      setScansLimit(stats.scansLimit);
      setWeekStart(stats.weekStart);
      setWeekEnd(stats.weekEnd);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async () => {
    try {
      Alert.alert(
        'Bulk Upload',
        'Select multiple receipt images to upload and process in a queue.',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Select Images',
            onPress: async () => {
              try {
                const result = await DocumentPicker.getDocumentAsync({
                  type: 'image/*',
                  multiple: true,
                  copyToCacheDirectory: true,
                });

                if (result.canceled) {
                  return;
                }

                // TODO: Implement queue processing
                Alert.alert(
                  'Coming Soon',
                  `You selected ${result.assets.length} image(s). Bulk upload and queue processing will be available in a future update.`,
                  [{ text: 'OK' }]
                );
              } catch (error) {
                console.error('Bulk upload error:', error);
                Alert.alert('Error', 'Failed to select images.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const totalScans = scansLimit + bonusScans;
  const scansRemaining = Math.max(0, totalScans - scansUsed);
  const percentageUsed = totalScans > 0 ? (scansUsed / totalScans) * 100 : 0;

  if (loading) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <View className="flex-1 justify-center items-center">
          <Text className="text-white">Loading usage stats...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-6">
          {/* Page Title */}
          <Text className="text-gold font-bold mb-2 uppercase tracking-widest text-sm">
            <Feather name="activity" size={12} color="#f5c518" /> Usage & Limits
          </Text>
          <Text className="text-white text-2xl font-bold mb-6">Weekly Scan Quota</Text>

          {/* Usage Card */}
          <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-crescender-400 text-sm mb-1">Scans Remaining This Week</Text>
                <Text className="text-white text-4xl font-bold">{scansRemaining}</Text>
                {weekStart && weekEnd && (
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

          {/* Earn More Scans - Coming Soon */}
          <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="gift" size={20} color="#f5c518" />
              <Text className="text-white text-lg font-bold ml-2">Earn More Scans</Text>
            </View>
            <Text className="text-crescender-300 text-sm mb-4">
              Watch a short ad to get 5 additional receipt scans for this week.
            </Text>
            <TouchableOpacity
              className="bg-crescender-800/60 py-3 px-4 rounded-xl border border-crescender-700 items-center"
              onPress={() => Alert.alert('Coming Soon', 'Ad rewards will be available in a future update.')}
            >
              <Text className="text-crescender-400 font-semibold">Coming Soon</Text>
            </TouchableOpacity>
          </View>

          {/* Bulk Upload */}
          <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="upload-cloud" size={20} color="#f5c518" />
              <Text className="text-white text-lg font-bold ml-2">Bulk Upload</Text>
            </View>
            <Text className="text-crescender-300 text-sm mb-4">
              Upload multiple receipt images at once. They'll be processed in a queue and you'll be notified when ready.
            </Text>
            <TouchableOpacity
              className="bg-gold/10 py-3 px-4 rounded-xl border border-gold/40 items-center"
              onPress={handleBulkUpload}
            >
              <View className="flex-row items-center gap-2">
                <Feather name="folder" size={16} color="#f5c518" />
                <Text className="text-gold font-bold">Select Multiple Images</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Info Section */}
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
        </View>
      </ScrollView>
    </View>
  );
}
