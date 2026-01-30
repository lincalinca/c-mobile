import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { cloudLog } from '@lib/cloudLogger';
import type { BannerAdSize as BannerAdSizeType } from 'react-native-google-mobile-ads';

// Lazy import to avoid errors in Expo Go where native module isn't available
let BannerAd: any;
let BannerAdSize: any;
let TestIds: any;

try {
  const adsModule = require('react-native-google-mobile-ads');
  BannerAd = adsModule.BannerAd;
  BannerAdSize = adsModule.BannerAdSize;
  TestIds = adsModule.TestIds;
} catch (error) {
  // Native module not available (e.g., in Expo Go)
  console.warn('Google Mobile Ads module not available:', error);
  // Provide fallback TestIds object
  TestIds = {
    BANNER: 'ca-app-pub-3940256099942544/6300978111', // Google test ad unit ID
  };
}

// Production Ad Unit IDs
const IOS_BANNER_AD_UNIT_ID = __DEV__
  ? (TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111')
  : 'ca-app-pub-5375818323643018/6519980079';

const ANDROID_BANNER_AD_UNIT_ID = __DEV__
  ? (TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111')
  : 'ca-app-pub-5375818323643018/6200415873';

// Platform-specific ad unit ID selection
const adUnitId = BannerAd ? Platform.select({
  ios: IOS_BANNER_AD_UNIT_ID,
  android: ANDROID_BANNER_AD_UNIT_ID,
  default: TestIds?.BANNER || 'ca-app-pub-3940256099942544/6300978111',
}) : null;

interface AdBannerProps {
  /**
   * Position of the banner ad
   * @default 'bottom'
   */
  position?: 'top' | 'bottom';
  
  /**
   * Size of the banner ad
   * @default BannerAdSize.ANCHORED_ADAPTIVE_BANNER
   */
  size?: BannerAdSizeType | string;
}

/**
 * Banner Ad Component
 * 
 * Displays a banner ad at the top or bottom of the screen.
 * Automatically uses test IDs in development mode.
 * 
 * @example
 * ```tsx
 * <AdBanner position="bottom" />
 * ```
 */
export function AdBanner({ 
  position = 'bottom',
  size = BannerAdSize?.ANCHORED_ADAPTIVE_BANNER 
}: AdBannerProps) {
  // If native module not available (e.g., Expo Go), show placeholder ad
  if (!BannerAd || !adUnitId) {
    const { PlaceholderBannerAd } = require('./PlaceholderAd');
    return <PlaceholderBannerAd position={position} />;
  }

  return (
    <View style={[styles.container, position === 'top' ? styles.top : styles.bottom]}>
      <BannerAd
        unitId={adUnitId || TestIds?.BANNER}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false, // Set to true if you want non-personalized ads only
        }}
        onAdLoaded={() => {
          cloudLog.info('ads', 'Banner ad loaded successfully', { adUnitId });
        }}
        onAdFailedToLoad={(error: unknown) => {
          cloudLog.error('ads', 'Banner ad failed to load', { 
            error: error instanceof Error ? error.message : String(error),
            adUnitId 
          });
        }}
      />
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
});
