import React, { useEffect } from 'react';
import { Platform } from 'react-native';

// Lazy import to avoid errors in Expo Go where native module isn't available
let InterstitialAd: any;
let AdEventType: any;
let TestIds: any;

try {
  const adsModule = require('react-native-google-mobile-ads');
  InterstitialAd = adsModule.InterstitialAd;
  AdEventType = adsModule.AdEventType;
  TestIds = adsModule.TestIds;
} catch (error) {
  // Native module not available (e.g., in Expo Go)
  console.warn('Google Mobile Ads module not available:', error);
}

// TODO: Replace with your production Ad Unit IDs after creating them in AdMob
// iOS Interstitial: ca-app-pub-XXXXX/YYYYY
// Android Interstitial: ca-app-pub-XXXXX/ZZZZZ
const IOS_INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-XXXXX/YYYYY'; // Replace with your iOS interstitial ad unit ID

const ANDROID_INTERSTITIAL_AD_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : 'ca-app-pub-XXXXX/ZZZZZ'; // Replace with your Android interstitial ad unit ID

const adUnitId = InterstitialAd ? Platform.select({
  ios: IOS_INTERSTITIAL_AD_UNIT_ID,
  android: ANDROID_INTERSTITIAL_AD_UNIT_ID,
  default: TestIds?.INTERSTITIAL,
}) : null;

/**
 * Interstitial Ad Manager
 * 
 * Handles loading and showing interstitial ads.
 * Preloads ads for better user experience.
 * 
 * @example
 * ```tsx
 * const interstitial = useInterstitialAd();
 * 
 * // After receipt scan completes
 * interstitial.show();
 * ```
 */
export function useInterstitialAd() {
  const [interstitial, setInterstitial] = React.useState<any | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  useEffect(() => {
    // If native module not available, return early
    if (!InterstitialAd || !adUnitId) {
      return;
    }

    // Create and load the interstitial ad
    const ad = InterstitialAd.createForAdRequest(adUnitId || TestIds?.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
      keywords: ['music', 'gear', 'receipt', 'scan'],
    });

    const unsubscribeLoaded = ad.addAdEventListener(AdEventType?.LOADED, () => {
      setIsLoaded(true);
      console.log('Interstitial ad loaded');
    });

    const unsubscribeClosed = ad.addAdEventListener(AdEventType?.CLOSED, () => {
      setIsLoaded(false);
      // Reload the ad after it's closed
      ad.load();
    });

    const unsubscribeError = ad.addAdEventListener(AdEventType?.ERROR, (error) => {
      console.error('Interstitial ad error:', error);
      setIsLoaded(false);
    });

    // Load the ad
    ad.load();

    setInterstitial(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, []);

  const show = () => {
    if (interstitial && isLoaded) {
      interstitial.show();
    } else {
      console.warn('Interstitial ad not loaded yet');
      // Try to load if not loaded
      if (interstitial) {
        interstitial.load();
      }
    }
  };

  return {
    show,
    isLoaded,
    load: () => interstitial?.load(),
  };
}

/**
 * Hook to preload interstitial ad
 * Call this early in your app lifecycle
 */
export function usePreloadInterstitialAd() {
  useEffect(() => {
    // If native module not available, return early
    if (!InterstitialAd || !adUnitId) {
      return;
    }

    const ad = InterstitialAd.createForAdRequest(adUnitId || TestIds?.INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });

    ad.load();

    return () => {
      // Cleanup handled by ad lifecycle
    };
  }, []);
}
