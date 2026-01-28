/**
 * Permission Manager
 * 
 * Handles OS-level notification permissions.
 * Single Responsibility: talk to the OS (via expo-notifications) about permissions – and nothing else.
 */

import * as Notifications from 'expo-notifications';

export type PermissionStatus = 'granted' | 'denied' | 'blocked';

/**
 * Get current notification permission status
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  
  if (status === 'granted') {
    return 'granted';
  } else if (status === 'denied') {
    return 'blocked'; // 'denied' on iOS means permanently blocked
  } else {
    return 'denied'; // 'undetermined' means not yet asked
  }
}

/**
 * Request notification permission if not already granted
 * Returns the final permission status after the request
 */
export async function ensurePermissionGranted(): Promise<PermissionStatus> {
  const currentStatus = await getPermissionStatus();
  
  if (currentStatus === 'granted') {
    return 'granted';
  }
  
  // Request permission
  const { status } = await Notifications.requestPermissionsAsync();
  
  if (status === 'granted') {
    return 'granted';
  } else if (status === 'denied') {
    return 'blocked';
  } else {
    return 'denied';
  }
}
