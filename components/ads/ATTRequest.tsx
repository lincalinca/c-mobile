import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import { cloudLog } from '@lib/cloudLogger';

// Lazy import to avoid errors in Expo Go where native module might not be available
let TrackingTransparency: any;
try {
  TrackingTransparency = require('expo-tracking-transparency');
} catch (error) {
  // Native module not available (e.g., in Expo Go on some platforms)
  console.warn('Tracking Transparency module not available:', error);
  // Provide fallback enum values
  TrackingTransparency = {
    AdvertisingTrackingStatus: {
      NOT_DETERMINED: 0,
      RESTRICTED: 1,
      DENIED: 2,
      AUTHORIZED: 3,
    },
    getTrackingPermissionsAsync: async () => ({ status: 2 }), // DENIED
    requestTrackingPermissionsAsync: async () => ({ status: 2 }), // DENIED
  };
}

/**
 * App Tracking Transparency (ATT) Request Component
 * 
 * Required for iOS 14.5+ to request permission to track users for personalised ads.
 * This component should be shown early in the app lifecycle, typically after the splash screen.
 * 
 * @example
 * ```tsx
 * <ATTRequest 
 *   onComplete={(status) => console.log('Tracking status:', status)}
 * />
 * ```
 */
interface ATTRequestProps {
  /**
   * Callback when ATT request completes
   * @param status - The tracking authorization status (0=NOT_DETERMINED, 1=RESTRICTED, 2=DENIED, 3=AUTHORIZED)
   */
  onComplete?: (status: number) => void;
  
  /**
   * Whether to show the request automatically on mount
   * @default true
   */
  autoRequest?: boolean;
}

export function ATTRequest({ onComplete, autoRequest = true }: ATTRequestProps) {
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    // Only request on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    // If TrackingTransparency module not available, skip
    if (!TrackingTransparency || !TrackingTransparency.AdvertisingTrackingStatus) {
      console.warn('Tracking Transparency module not available');
      const deniedStatus = TrackingTransparency?.AdvertisingTrackingStatus?.DENIED ?? 2;
      setStatus(deniedStatus);
      onComplete?.(deniedStatus as any);
      return;
    }

    const requestTracking = async () => {
      try {
        const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
        
        // If not determined and autoRequest is true, request permission
        if (currentStatus === TrackingTransparency.AdvertisingTrackingStatus.NOT_DETERMINED && autoRequest) {
          const { status: newStatus } = await TrackingTransparency.requestTrackingPermissionsAsync();
          cloudLog.info('ads', 'ATT permission requested', { 
            status: newStatus,
            platform: Platform.OS 
          });
          setStatus(newStatus);
          onComplete?.(newStatus as any);
        } else {
          setStatus(currentStatus);
          onComplete?.(currentStatus as any);
        }
      } catch (error) {
        console.error('Error requesting tracking permission:', error);
        // Default to denied on error
        const deniedStatus = TrackingTransparency?.AdvertisingTrackingStatus?.DENIED ?? 2;
        setStatus(deniedStatus);
        onComplete?.(deniedStatus as any);
      }
    };

    requestTracking();
  }, [onComplete, autoRequest]);

  // Return null - this component doesn't render anything
  return null;
}

/**
 * Hook to check and request ATT permission
 * 
 * @example
 * ```tsx
 * const { status, requestPermission } = useATT();
 * 
 * if (status === 'not-determined') {
 *   requestPermission();
 * }
 * ```
 */
export function useATT() {
  const [status, setStatus] = useState<number | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    // If TrackingTransparency module not available, set denied
    if (!TrackingTransparency || !TrackingTransparency.AdvertisingTrackingStatus) {
      setStatus(2); // DENIED
      return;
    }

    const checkStatus = async () => {
      try {
        const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
        setStatus(currentStatus);
      } catch (error) {
        console.error('Error checking tracking permission:', error);
        setStatus(TrackingTransparency?.AdvertisingTrackingStatus?.DENIED ?? 2);
      }
    };

    checkStatus();
  }, []);

  const requestPermission = async () => {
    if (Platform.OS !== 'ios') {
      return (TrackingTransparency?.AdvertisingTrackingStatus?.DENIED ?? 2) as any;
    }

    if (!TrackingTransparency || !TrackingTransparency.AdvertisingTrackingStatus) {
      const deniedStatus = 2; // DENIED
      setStatus(deniedStatus);
      return deniedStatus as any;
    }

    try {
      const { status: newStatus } = await TrackingTransparency.requestTrackingPermissionsAsync();
      cloudLog.info('ads', 'ATT permission requested', { 
        status: newStatus,
        platform: Platform.OS 
      });
      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      const deniedStatus = TrackingTransparency?.AdvertisingTrackingStatus?.DENIED ?? 2;
      setStatus(deniedStatus);
      return deniedStatus as any;
    }
  };

  const AdvertisingTrackingStatus = TrackingTransparency?.AdvertisingTrackingStatus ?? {
    NOT_DETERMINED: 0,
    RESTRICTED: 1,
    DENIED: 2,
    AUTHORIZED: 3,
  };

  return {
    status,
    requestPermission,
    isAuthorized: status === AdvertisingTrackingStatus.AUTHORIZED,
    isDenied: status === AdvertisingTrackingStatus.DENIED,
    isNotDetermined: status === AdvertisingTrackingStatus.NOT_DETERMINED,
    isRestricted: status === AdvertisingTrackingStatus.RESTRICTED,
  };
}
