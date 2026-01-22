import React, { useEffect, useState } from 'react';
import { Platform, Alert } from 'react-native';
import * as TrackingTransparency from 'expo-tracking-transparency';

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
   * @param status - The tracking authorization status
   */
  onComplete?: (status: TrackingTransparency.AdvertisingTrackingStatus) => void;
  
  /**
   * Whether to show the request automatically on mount
   * @default true
   */
  autoRequest?: boolean;
}

export function ATTRequest({ onComplete, autoRequest = true }: ATTRequestProps) {
  const [status, setStatus] = useState<TrackingTransparency.AdvertisingTrackingStatus | null>(null);

  useEffect(() => {
    // Only request on iOS
    if (Platform.OS !== 'ios') {
      return;
    }

    const requestTracking = async () => {
      try {
        const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
        
        // If not determined and autoRequest is true, request permission
        if (currentStatus === TrackingTransparency.AdvertisingTrackingStatus.NOT_DETERMINED && autoRequest) {
          const { status: newStatus } = await TrackingTransparency.requestTrackingPermissionsAsync();
          setStatus(newStatus);
          onComplete?.(newStatus);
        } else {
          setStatus(currentStatus);
          onComplete?.(currentStatus);
        }
      } catch (error) {
        console.error('Error requesting tracking permission:', error);
        // Default to denied on error
        const deniedStatus = TrackingTransparency.AdvertisingTrackingStatus.DENIED;
        setStatus(deniedStatus);
        onComplete?.(deniedStatus);
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
  const [status, setStatus] = useState<TrackingTransparency.AdvertisingTrackingStatus | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const checkStatus = async () => {
      try {
        const { status: currentStatus } = await TrackingTransparency.getTrackingPermissionsAsync();
        setStatus(currentStatus);
      } catch (error) {
        console.error('Error checking tracking permission:', error);
        setStatus(TrackingTransparency.AdvertisingTrackingStatus.DENIED);
      }
    };

    checkStatus();
  }, []);

  const requestPermission = async () => {
    if (Platform.OS !== 'ios') {
      return TrackingTransparency.AdvertisingTrackingStatus.DENIED;
    }

    try {
      const { status: newStatus } = await TrackingTransparency.requestTrackingPermissionsAsync();
      setStatus(newStatus);
      return newStatus;
    } catch (error) {
      console.error('Error requesting tracking permission:', error);
      const deniedStatus = TrackingTransparency.AdvertisingTrackingStatus.DENIED;
      setStatus(deniedStatus);
      return deniedStatus;
    }
  };

  return {
    status,
    requestPermission,
    isAuthorized: status === TrackingTransparency.AdvertisingTrackingStatus.AUTHORIZED,
    isDenied: status === TrackingTransparency.AdvertisingTrackingStatus.DENIED,
    isNotDetermined: status === TrackingTransparency.AdvertisingTrackingStatus.NOT_DETERMINED,
    isRestricted: status === TrackingTransparency.AdvertisingTrackingStatus.RESTRICTED,
  };
}
