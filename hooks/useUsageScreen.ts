import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { getUsageStats, addBonusScans } from '../lib/usageTracking';
import { useRewardedAd } from '../components/ads';

export interface UsageStats {
  scansUsed: number;
  scansLimit: number;
  bonusScans: number;
  weekStart: Date | null;
  weekEnd: Date | null;
  totalScans: number;
  scansRemaining: number;
  percentageUsed: number;
}

export function useUsageScreen() {
  const [stats, setStats] = useState<UsageStats>({
    scansUsed: 0,
    scansLimit: 10,
    bonusScans: 0,
    weekStart: null,
    weekEnd: null,
    totalScans: 10,
    scansRemaining: 10,
    percentageUsed: 0,
  });
  const [loading, setLoading] = useState(true);

  const isLoadedRef = useRef(false);

  const loadUsageStats = useCallback(async () => {
    try {
      const liveStats = await getUsageStats();
      const total = liveStats.scansLimit + liveStats.bonusScans;
      const remaining = Math.max(0, total - liveStats.scansUsed);
      const percentage = total > 0 ? (liveStats.scansUsed / total) * 100 : 0;

      setStats({
        scansUsed: liveStats.scansUsed,
        scansLimit: liveStats.scansLimit,
        bonusScans: liveStats.bonusScans,
        weekStart: liveStats.weekStart,
        weekEnd: liveStats.weekEnd,
        totalScans: total,
        scansRemaining: remaining,
        percentageUsed: percentage,
      });
    } catch (error) {
      console.error('Failed to load usage stats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRewarded = useCallback(async () => {
    await addBonusScans(10);
    await loadUsageStats();
    Alert.alert(
      'Scans Added!',
      'You\'ve earned 10 additional scans. You can now scan more receipts this week.',
      [{ text: 'OK' }]
    );
  }, [loadUsageStats]);

  const handleAdClosed = useCallback(() => {
    if (!isLoadedRef.current) {
      Alert.alert(
        'Ad Closed',
        'The ad was closed before completion. Watch the full ad to earn bonus scans.',
        [{ text: 'OK' }]
      );
    }
  }, []);

  const handleAdFailed = useCallback(() => {
    Alert.alert(
      'Ad Unavailable',
      'Unable to load ad at this time. Please try again later.',
      [{ text: 'OK' }]
    );
  }, []);

  const adOptions = useMemo(() => ({
    onRewarded: handleRewarded,
    onAdClosed: handleAdClosed,
    onAdFailedToLoad: handleAdFailed,
  }), [handleRewarded, handleAdClosed, handleAdFailed]);

  const { 
    show, 
    isLoaded, 
    isLoading: adLoading, 
    showPlaceholder, 
    handlePlaceholderReward, 
    handlePlaceholderClose 
  } = useRewardedAd(adOptions);

  useEffect(() => {
    isLoadedRef.current = isLoaded;
  }, [isLoaded]);

  useEffect(() => {
    loadUsageStats();
  }, [loadUsageStats]);

  const handleWatchAd = useCallback(() => {
    if (isLoaded) {
      show();
    } else if (adLoading) {
      Alert.alert('Loading Ad', 'Please wait while we load the ad...');
    } else {
      Alert.alert('Ad Not Ready', 'The ad is not ready yet. Please try again in a moment.');
    }
  }, [isLoaded, adLoading, show]);

  const handleBulkUpload = useCallback(async () => {
    Alert.alert(
      'Bulk Upload',
      'Select multiple receipt images to upload and process in a queue.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Select Images',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                multiple: true,
                copyToCacheDirectory: true,
              });

              if (result.canceled) return;

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
  }, []);

  return {
    stats,
    loading,
    adLoading,
    isLoaded,
    showPlaceholder,
    handleWatchAd,
    handleBulkUpload,
    handlePlaceholderReward,
    handlePlaceholderClose,
    refreshStats: loadUsageStats,
  };
}
