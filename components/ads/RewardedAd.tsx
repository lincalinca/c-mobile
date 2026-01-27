import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Lazy import to avoid errors in Expo Go where native module isn't available
let RewardedAd: any;
let RewardedAdEventType: any;
let TestIds: any;

try {
  const adsModule = require('react-native-google-mobile-ads');
  RewardedAd = adsModule.RewardedAd;
  RewardedAdEventType = adsModule.RewardedAdEventType;
  TestIds = adsModule.TestIds;
} catch (error) {
  // Native module not available (e.g., in Expo Go)
  console.warn('Google Mobile Ads module not available:', error);
  // Provide fallback TestIds object
  TestIds = {
    REWARDED: 'ca-app-pub-3940256099942544/5224354917', // Google test ad unit ID
  };
}

// Production Ad Unit IDs - Rewarded ads grant +10 scans
const IOS_REWARDED_AD_UNIT_ID = __DEV__
  ? (TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917')
  : 'ca-app-pub-5375818323643018/2580735062';

const ANDROID_REWARDED_AD_UNIT_ID = __DEV__
  ? (TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917')
  : 'ca-app-pub-5375818323643018/7833061743';

const adUnitId = RewardedAd ? Platform.select({
  ios: IOS_REWARDED_AD_UNIT_ID,
  android: ANDROID_REWARDED_AD_UNIT_ID,
  default: TestIds?.REWARDED || 'ca-app-pub-3940256099942544/5224354917',
}) : null;

interface UseRewardedAdOptions {
  onRewarded?: (reward: { type: string; amount: number }) => void;
  onAdClosed?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
}

/**
 * Hook to manage rewarded ads for earning bonus scans
 * 
 * @example
 * ```tsx
 * const { show, isLoaded, isLoading } = useRewardedAd({
 *   onRewarded: (reward) => {
 *     console.log('User earned reward:', reward);
 *     // Add bonus scans
 *   }
 * });
 * 
 * // Show ad when user taps button
 * if (isLoaded) {
 *   show();
 * }
 * ```
 */
export function useRewardedAd(options: UseRewardedAdOptions = {}) {
  const { onRewarded, onAdClosed, onAdFailedToLoad } = options;
  const [rewardedAd, setRewardedAd] = useState<any | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Check if native module is available
  const nativeModuleAvailable = RewardedAd && adUnitId;

  useEffect(() => {
    // If native module not available, enable placeholder mode
    if (!nativeModuleAvailable) {
      setIsLoaded(true); // Mark as "loaded" so UI can show placeholder
      return;
    }

    // Create and load the rewarded ad
    const ad = RewardedAd.createForAdRequest(adUnitId || TestIds?.REWARDED, {
      requestNonPersonalizedAdsOnly: false,
      keywords: ['music', 'gear', 'receipt', 'scan', 'reward'],
    });

    const unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType?.LOADED, () => {
      setIsLoaded(true);
      setIsLoading(false);
      console.log('Rewarded ad loaded');
    });

    const unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType?.EARNED_REWARD, (reward) => {
      console.log('User earned reward:', reward);
      setIsLoaded(false);
      onRewarded?.(reward);
      // Reload the ad after reward is earned
      setIsLoading(true);
      ad.load();
    });

    const unsubscribeClosed = ad.addAdEventListener(RewardedAdEventType?.CLOSED, () => {
      setIsLoaded(false);
      onAdClosed?.();
      // Reload the ad after it's closed
      setIsLoading(true);
      ad.load();
    });

    const unsubscribeError = ad.addAdEventListener(RewardedAdEventType?.ERROR, (error) => {
      console.error('Rewarded ad error:', error);
      setIsLoaded(false);
      setIsLoading(false);
      onAdFailedToLoad?.(error);
    });

    // Load the ad
    setIsLoading(true);
    ad.load();

    setRewardedAd(ad);

    return () => {
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [nativeModuleAvailable, onRewarded, onAdClosed, onAdFailedToLoad]);

  const show = () => {
    if (!nativeModuleAvailable) {
      // Show placeholder ad
      setShowPlaceholder(true);
      return;
    }

    if (rewardedAd && isLoaded) {
      rewardedAd.show();
    } else {
      console.warn('Rewarded ad not loaded yet');
      // Try to load if not loaded
      if (rewardedAd) {
        setIsLoading(true);
        rewardedAd.load();
      }
    }
  };

  const handlePlaceholderReward = () => {
    setShowPlaceholder(false);
    // Simulate reward after 1 second (like watching an ad)
    setTimeout(() => {
      onRewarded?.({ type: 'scans', amount: 10 });
    }, 1000);
  };

  const handlePlaceholderClose = () => {
    setShowPlaceholder(false);
    onAdClosed?.();
  };

  return {
    show,
    isLoaded,
    isLoading,
    showPlaceholder,
    handlePlaceholderReward,
    handlePlaceholderClose,
    load: () => {
      if (rewardedAd) {
        setIsLoading(true);
        rewardedAd.load();
      }
    },
  };
}
