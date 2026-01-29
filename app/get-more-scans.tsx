import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PersistentHeader } from '@components/header/PersistentHeader';
import { useRewardedAd } from '@components/ads';
import { PlaceholderRewardedAd } from '@components/ads/PlaceholderAd';
import { getUsageStats, addBonusScans } from '@lib/usageTracking';
import { format } from 'date-fns';

export default function GetMoreScansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    scansUsed: number;
    scansLimit: number;
    bonusScans: number;
    scansRemaining: number;
    weekStart: Date;
    weekEnd: Date;
  } | null>(null);

  const { show, isLoaded, isLoading, showPlaceholder, handlePlaceholderReward, handlePlaceholderClose } = useRewardedAd({
    onRewarded: async (reward) => {
      // Add 10 bonus scans
      await addBonusScans(10);
      // Reload stats
      await loadStats();
      Alert.alert(
        'Scans Added!',
        'You\'ve earned 10 additional scans. You can now scan more receipts this week.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onAdClosed: () => {
      // Ad was closed without earning reward
      if (!isLoaded) {
        Alert.alert(
          'Ad Closed',
          'The ad was closed before completion. Watch the full ad to earn bonus scans.',
          [{ text: 'OK' }]
        );
      }
    },
    onAdFailedToLoad: (error) => {
      Alert.alert(
        'Ad Unavailable',
        'Unable to load ad at this time. Please try again later.',
        [{ text: 'OK' }]
      );
    },
  });

  const loadStats = async () => {
    try {
      const usageStats = await getUsageStats();
      setStats(usageStats);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleWatchAd = () => {
    if (isLoaded) {
      show();
    } else if (isLoading) {
      Alert.alert('Loading Ad', 'Please wait while we load the ad...');
    } else {
      Alert.alert('Ad Not Ready', 'The ad is not ready yet. Please try again in a moment.');
    }
  };

  if (loading || !stats) {
    return (
      <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
        <PersistentHeader />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#f5c518" />
        </View>
      </View>
    );
  }

  const hasUsedAllScans = stats.scansUsed >= stats.scansLimit;

  return (
    <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
      <PersistentHeader />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-6 py-6">
          {/* Page Title */}
          <Text className="text-gold font-bold mb-2 uppercase tracking-widest text-sm">
            <Feather name="gift" size={12} color="#f5c518" /> Get More Scans
          </Text>
          <Text className="text-white text-2xl font-bold mb-6">
            {hasUsedAllScans ? 'You\'ve Used All Your Scans' : 'Earn Bonus Scans'}
          </Text>

          {/* Status Card */}
          <View className="bg-crescender-900/40 p-6 rounded-2xl border border-crescender-800 mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View>
                <Text className="text-crescender-400 text-sm mb-1">Scans This Week</Text>
                <Text className="text-white text-4xl font-bold">{stats.scansUsed}</Text>
                <Text className="text-crescender-500 text-xs mt-1">
                  {stats.scansRemaining} remaining
                </Text>
              </View>
              <View className="w-24 h-24 rounded-full bg-crescender-800/40 items-center justify-center">
                <Feather name="camera" size={40} color="#f5c518" />
              </View>
            </View>

            {/* Breakdown */}
            <View className="border-t border-crescender-800 pt-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-crescender-300 text-sm">Weekly free scans</Text>
                <Text className="text-white text-sm font-semibold">{stats.scansLimit}</Text>
              </View>
              {stats.bonusScans > 0 && (
                <View className="flex-row justify-between mb-2">
                  <Text className="text-crescender-300 text-sm">Bonus scans (from ads)</Text>
                  <Text className="text-gold text-sm font-semibold">+{stats.bonusScans}</Text>
                </View>
              )}
              {stats.weekStart && stats.weekEnd && (
                <View className="flex-row justify-between mt-2 pt-2 border-t border-crescender-800">
                  <Text className="text-crescender-500 text-xs">Resets</Text>
                  <Text className="text-crescender-500 text-xs">
                    {format(stats.weekEnd, 'dd MMM yyyy')}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Watch Ad Card */}
          <View className="bg-crescender-900/40 p-6 rounded-2xl border border-gold/40 mb-6">
            <View className="flex-row items-center mb-3">
              <Feather name="play-circle" size={24} color="#f5c518" />
              <Text className="text-white text-lg font-bold ml-2">Watch Ad to Get +10 Scans</Text>
            </View>
            <Text className="text-crescender-300 text-sm mb-4 leading-relaxed">
              {hasUsedAllScans
                ? 'You\'ve used up all your weekly free scans. Watch this short video to get a topup of 10 additional scans.'
                : 'Watch a short video ad to earn 10 bonus scans. These scans are added to your weekly quota and can be used immediately.'}
            </Text>
            <TouchableOpacity
              className={`py-4 px-6 rounded-xl border-2 items-center ${
                isLoaded
                  ? 'bg-gold border-gold'
                  : isLoading
                  ? 'bg-crescender-800/60 border-crescender-700'
                  : 'bg-crescender-800/60 border-crescender-700'
              }`}
              onPress={handleWatchAd}
              disabled={!isLoaded && !isLoading}
            >
              {isLoading ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#f5c518" />
                  <Text className="text-crescender-400 font-semibold">Loading Ad...</Text>
                </View>
              ) : isLoaded ? (
                <View className="flex-row items-center gap-2">
                  <Feather name="play" size={20} color="#2e1065" />
                  <Text className="text-crescender-950 font-bold text-lg">Watch Ad</Text>
                </View>
              ) : (
                <Text className="text-crescender-400 font-semibold">Ad Not Ready</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Section */}
          <View className="bg-crescender-900/20 p-4 rounded-xl border border-crescender-800/50">
            <View className="flex-row items-start gap-3">
              <Feather name="info" size={16} color="#94a3b8" />
              <View className="flex-1">
                <Text className="text-crescender-400 text-xs leading-relaxed">
                  Bonus scans from ads are added to your weekly quota and reset every Monday. You can watch multiple ads to earn more scans if needed.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Placeholder Rewarded Ad Modal */}
      <PlaceholderRewardedAd
        visible={showPlaceholder || false}
        onClose={handlePlaceholderClose}
        onReward={handlePlaceholderReward}
      />
    </View>
  );
}
