import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

/**
 * Placeholder Ad Component
 * 
 * Shows a realistic-looking placeholder ad when native AdMob module isn't available.
 * This allows testing ad placement and UI in Expo Go.
 * 
 * In production builds with native module, this is replaced by real AdBanner.
 */
export function PlaceholderBannerAd({ position = 'bottom' }: { position?: 'top' | 'bottom' }) {
  return (
    <View style={[styles.container, position === 'top' ? styles.top : styles.bottom]}>
      <View style={styles.adContainer}>
        <View style={styles.adContent}>
          <View style={styles.adIcon}>
            <Feather name="zap" size={16} color="#94a3b8" />
          </View>
          <View style={styles.adText}>
            <Text style={styles.adLabel}>Ad</Text>
            <Text style={styles.adDescription}>Test Ad Banner</Text>
          </View>
        </View>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>AdMob</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Placeholder Interstitial Ad
 * 
 * Shows a placeholder modal-style ad for testing interstitial ad flow.
 */
export function PlaceholderInterstitialAd({ 
  visible, 
  onClose 
}: { 
  visible: boolean; 
  onClose: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.interstitialOverlay}>
      <View style={styles.interstitialContainer}>
        <View style={styles.interstitialHeader}>
          <Text style={styles.interstitialTitle}>Test Interstitial Ad</Text>
          <Feather name="x" size={20} color="#94a3b8" onPress={onClose} />
        </View>
        <View style={styles.interstitialContent}>
          <Feather name="zap" size={48} color="#f5c518" />
          <Text style={styles.interstitialText}>This is a placeholder ad</Text>
          <Text style={styles.interstitialSubtext}>In production, this will show a real AdMob interstitial ad</Text>
        </View>
        <View style={styles.interstitialFooter}>
          <Text style={styles.interstitialFooterText}>AdMob Test Ad</Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Placeholder Rewarded Ad
 * 
 * Shows a placeholder modal for testing rewarded ad flow.
 */
export function PlaceholderRewardedAd({ 
  visible, 
  onClose,
  onReward 
}: { 
  visible: boolean; 
  onClose: () => void;
  onReward: () => void;
}) {
  if (!visible) return null;

  return (
    <View style={styles.interstitialOverlay}>
      <View style={styles.interstitialContainer}>
        <View style={styles.interstitialHeader}>
          <Text style={styles.interstitialTitle}>Watch Ad for +10 Scans</Text>
          <Feather name="x" size={20} color="#94a3b8" onPress={onClose} />
        </View>
        <View style={styles.interstitialContent}>
          <Feather name="play-circle" size={64} color="#f5c518" />
          <Text style={styles.interstitialText}>Test Rewarded Ad</Text>
          <Text style={styles.interstitialSubtext}>Watch this ad to earn 10 bonus scans</Text>
          <View style={styles.rewardButton}>
            <Text style={styles.rewardButtonText} onPress={onReward}>
              Simulate Ad Completion
            </Text>
          </View>
        </View>
        <View style={styles.interstitialFooter}>
          <Text style={styles.interstitialFooterText}>AdMob Test Ad - Tap button above to simulate reward</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  adContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  adContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adIcon: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adText: {
    flexDirection: 'column',
    gap: 2,
  },
  adLabel: {
    fontSize: 15,  // was 10 → now 15 (+50%)
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  adDescription: {
    fontSize: 18,  // was 12 → now 18 (+50%)
    color: '#cbd5e1',
    fontWeight: '500',
  },
  adBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  adBadgeText: {
    fontSize: 15,  // was 10 → now 15 (+50%)
    color: '#94a3b8',
    fontWeight: '600',
  },
  interstitialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 10000,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  interstitialContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  interstitialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  interstitialTitle: {
    fontSize: 24,  // was 16 → now 24 (+50%)
    fontWeight: '600',
    color: '#f1f5f9',
  },
  interstitialContent: {
    padding: 40,
    alignItems: 'center',
    gap: 16,
  },
  interstitialText: {
    fontSize: 27,  // was 18 → now 27 (+50%)
    fontWeight: '600',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  interstitialSubtext: {
    fontSize: 21,  // was 14 → now 21 (+50%)
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 28,  // was 20 → now 28 (+40%)
  },
  interstitialFooter: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    alignItems: 'center',
  },
  interstitialFooterText: {
    fontSize: 17,  // was 11 → now 17 (+55%)
    color: '#64748b',
    textAlign: 'center',
  },
  rewardButton: {
    marginTop: 8,
    backgroundColor: '#f5c518',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  rewardButtonText: {
    color: '#1e293b',
    fontSize: 24,  // was 16 → now 24 (+50%)
    fontWeight: '600',
  },
});
