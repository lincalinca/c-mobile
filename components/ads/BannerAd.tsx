import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

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
}

// TODO: Replace with your production Ad Unit IDs after creating them in AdMob
// iOS Banner: ca-app-pub-XXXXX/YYYYY
// Android Banner: ca-app-pub-XXXXX/ZZZZZ
const IOS_BANNER_AD_UNIT_ID = __DEV__ 
  ? TestIds.BANNER 
  : 'ca-app-pub-XXXXX/YYYYY'; // Replace with your iOS banner ad unit ID

const ANDROID_BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : 'ca-app-pub-XXXXX/ZZZZZ'; // Replace with your Android banner ad unit ID

// Platform-specific ad unit ID selection
const adUnitId = BannerAd ? Platform.select({
  ios: IOS_BANNER_AD_UNIT_ID,
  android: ANDROID_BANNER_AD_UNIT_ID,
  default: TestIds?.BANNER,
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
  size?: BannerAdSize;
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
  // If native module not available (e.g., Expo Go), return null
  if (!BannerAd || !adUnitId) {
    return null;
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
          console.log('Banner ad loaded');
        }}
        onAdFailedToLoad={(error) => {
          console.error('Banner ad failed to load:', error);
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
