import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { cloudLog } from '@lib/cloudLogger';

// Lazy import to avoid errors in Expo Go where native module isn't available
let RewardedAd: any;
let RewardedAdEventType: any;
let TestIds: any;
let adsModuleLoaded = false;

// Safely load the ads module with comprehensive error handling
try {
  const adsModule = require('react-native-google-mobile-ads');
  if (adsModule && typeof adsModule === 'object') {
    RewardedAd = adsModule.RewardedAd;
    RewardedAdEventType = adsModule.RewardedAdEventType;
    TestIds = adsModule.TestIds;
    adsModuleLoaded = true;
  }
} catch (error) {
  // Native module not available (e.g., in Expo Go) or failed to load
  console.warn('Google Mobile Ads module not available:', error);
  adsModuleLoaded = false;
}

// Provide fallback TestIds object if module not loaded
if (!TestIds) {
  TestIds = {
    REWARDED: 'ca-app-pub-3940256099942544/5224354917', // Google test ad unit ID
  };
}

// Demo Ad Unit IDs (Google Test IDs)
const IOS_REWARDED_AD_UNIT_ID = 'ca-app-pub-3940256099942544/1712485313';
const ANDROID_REWARDED_AD_UNIT_ID = 'ca-app-pub-3940256099942544/5224354917';

// Hardcoded for testing to verify rewards work
const adUnitId = (RewardedAd && adsModuleLoaded) ? Platform.select({
  ios: IOS_REWARDED_AD_UNIT_ID,
  android: ANDROID_REWARDED_AD_UNIT_ID,
  default: 'ca-app-pub-3940256099942544/5224354917',
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
  const [isMounted, setIsMounted] = useState(false);

  // Store cleanup function from initializeAd
  const cleanupRef = React.useRef<(() => void) | null>(null);

  // Check if native module is available - add comprehensive checks
  const nativeModuleAvailable = adsModuleLoaded && RewardedAd && RewardedAdEventType && adUnitId;

  // Mark component as mounted after initial render to prevent crashes during module initialization
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lazy initialization: Only initialize when user actually wants to watch an ad
  // This prevents crashes during app startup when native modules might not be ready
  useEffect(() => {
    // If native module not available, enable placeholder mode immediately
    if (!nativeModuleAvailable) {
      setIsLoaded(true); // Mark as "loaded" so UI can show placeholder
      return;
    }

    // Don't auto-initialize - wait for user interaction
    // This prevents crashes on app startup
    setIsLoaded(false);

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [nativeModuleAvailable]);

  const initializeAd = React.useCallback(() => {
    // Defensive check before creating ad
    if (!RewardedAd || !RewardedAdEventType || !adUnitId) {
      console.warn('RewardedAd components not fully initialized, using placeholder mode');
      setIsLoaded(true);
      return;
    }

    // If ad already exists, don't recreate
    if (rewardedAd) {
      return;
    }

    let ad: any = null;
    let unsubscribeLoaded: (() => void) | null = null;
    let unsubscribeEarned: (() => void) | null = null;
    let unsubscribeClosed: (() => void) | null = null;
    let unsubscribeError: (() => void) | null = null;

    try {
      cloudLog.info('ads', 'Creating rewarded ad', { adUnitId, platform: Platform.OS });
      
      // Create and load the rewarded ad with error handling
      ad = RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['music', 'gear', 'receipt', 'scan', 'reward'],
      });

      if (!ad) {
        throw new Error('Failed to create rewarded ad instance');
      }

      unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setIsLoaded(true);
        setIsLoading(false);
        cloudLog.info('ads', 'Rewarded ad loaded successfully');
        // If user requested to show ad, show it now that it's loaded
        if (showRequestedRef.current) {
          showRequestedRef.current = false;
          try {
            ad.show();
          } catch (e) {
            console.error('Error showing ad after load:', e);
          }
        }
      });

      unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
        console.log('User earned reward:', reward);
        cloudLog.info('ads', 'User earned reward from ad', { reward });
        setIsLoaded(false);
        onRewarded?.(reward);
        // Reload the ad after reward is earned
        setIsLoading(true);
        try {
          ad.load();
        } catch (e) {
          console.error('Error reloading ad after reward:', e);
          setIsLoading(false);
        }
      });

      unsubscribeClosed = ad.addAdEventListener(RewardedAdEventType.CLOSED, () => {
        setIsLoaded(false);
        onAdClosed?.();
        // Reload the ad after it's closed
        setIsLoading(true);
        try {
          ad.load();
        } catch (e) {
          console.error('Error reloading ad after close:', e);
          setIsLoading(false);
        }
      });

      unsubscribeError = ad.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
        console.error('Rewarded ad error:', error);
        cloudLog.error('ads', 'Rewarded ad failed to load', { 
          error: error?.message || String(error),
          code: error?.code 
        });
        setIsLoaded(false);
        setIsLoading(false);
        onAdFailedToLoad?.(error);
      });

      // Load the ad with error handling
      setIsLoading(true);
      ad.load();

      setRewardedAd(ad);

      // Store cleanup function
      cleanupRef.current = () => {
        // Safely unsubscribe all listeners
        try {
          if (unsubscribeLoaded) unsubscribeLoaded();
          if (unsubscribeEarned) unsubscribeEarned();
          if (unsubscribeClosed) unsubscribeClosed();
          if (unsubscribeError) unsubscribeError();
        } catch (e) {
          console.warn('Error cleaning up ad listeners:', e);
        }
      };
    } catch (error) {
      console.error('Error initializing rewarded ad:', error);
      cloudLog.error('ads', 'Error initializing rewarded ad', { 
        error: (error as Error)?.message || String(error),
        stack: (error as Error)?.stack
      });
      setIsLoaded(false);
      setIsLoading(false);
      onAdFailedToLoad?.(error as Error);
      // Fall back to placeholder mode
      setIsLoaded(true);
    }
  }, [rewardedAd, onRewarded, onAdClosed, onAdFailedToLoad]);

  // Track if user wants to show ad (for lazy initialization)
  const showRequestedRef = React.useRef(false);

  const show = () => {
    if (!nativeModuleAvailable) {
      // Show placeholder ad
      setShowPlaceholder(true);
      return;
    }

    // Lazy initialization: Create ad if it doesn't exist yet
    if (!rewardedAd && isMounted) {
      try {
        showRequestedRef.current = true; // Mark that user wants to show ad
        setIsLoading(true);
        initializeAd();
        // Ad will be shown automatically when loaded via the LOADED event listener
        return;
      } catch (error) {
        console.error('Error initializing rewarded ad on demand:', error);
        showRequestedRef.current = false;
        setIsLoading(false);
        setShowPlaceholder(true);
        return;
      }
    }

    try {
      if (isLoaded && rewardedAd) {
        showRequestedRef.current = false;
        rewardedAd.show();
      } else {
        console.warn('Rewarded ad not loaded yet');
        // Try to load if not loaded
        showRequestedRef.current = true;
        setIsLoading(true);
        if (rewardedAd) {
          rewardedAd.load();
        } else {
          // Initialize if not created yet
          initializeAd();
        }
      }
    } catch (error) {
      console.error('Error showing rewarded ad:', error);
      showRequestedRef.current = false;
      // Fall back to placeholder
      setShowPlaceholder(true);
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
        try {
          setIsLoading(true);
          rewardedAd.load();
        } catch (error) {
          console.error('Error loading rewarded ad:', error);
          setIsLoading(false);
        }
      }
    },
  };
}
