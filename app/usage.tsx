import { View, Text, ScrollView } from 'react-native';
import React from 'react';
import { PersistentHeader } from '@components/header/PersistentHeader';
import { PlaceholderRewardedAd } from '@components/ads/PlaceholderAd';
import { useUsageScreen } from '@hooks/useUsageScreen';

// Atomic UI Components
import { PageHeader } from '@components/usage/PageHeader';
import { QuotaDashboard } from '@components/usage/QuotaDashboard';
import { ActionCard } from '@components/usage/ActionCard';
import { UsageInfoBox } from '@components/usage/UsageInfoBox';

export default function UsageScreen() {
  const {
    stats,
    loading,
    adLoading,
    isLoaded,
    showPlaceholder,
    handleWatchAd,
    handleBulkUpload,
    handlePlaceholderReward,
    handlePlaceholderClose,
  } = useUsageScreen();

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
          {/* Page Title & Subtitle */}
          <PageHeader 
            title="Weekly Scan Quota" 
            subtitle="Usage & Limits" 
            icon="activity" 
          />

          {/* Core Usage Metrics Dashboard */}
          <QuotaDashboard 
            scansRemaining={stats.scansRemaining}
            scansUsed={stats.scansUsed}
            totalScans={stats.totalScans}
            scansLimit={stats.scansLimit}
            bonusScans={stats.bonusScans}
            percentageUsed={stats.percentageUsed}
            weekEnd={stats.weekEnd}
          />

          {/* Ad Reward Interaction */}
          <ActionCard
            title="Earn More Scans"
            description="Watch a short ad to get 10 additional receipt scans for this week."
            icon="gift"
            buttonText={adLoading ? "Loading Ad..." : isLoaded ? "Watch Ad for +10 Scans" : "Ad Not Ready"}
            buttonIcon="play-circle"
            onPress={handleWatchAd}
            isLoading={adLoading}
            isDisabled={!isLoaded && !adLoading}
          />

          {/* Bulk Upload Management */}
          <ActionCard
            title="Bulk Upload"
            description="Upload multiple receipt images at once. They'll be processed in a queue and you'll be notified when ready."
            icon="upload-cloud"
            buttonText="Select Multiple Images"
            buttonIcon="folder"
            onPress={handleBulkUpload}
            isSecondary
          />

          {/* Footer Information */}
          <UsageInfoBox />
        </View>
      </ScrollView>

      {/* Cross-Platform Ad Fallback System */}
      <PlaceholderRewardedAd
        visible={showPlaceholder || false}
        onClose={handlePlaceholderClose}
        onReward={handlePlaceholderReward}
      />
    </View>
  );
}
