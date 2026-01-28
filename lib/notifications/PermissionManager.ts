/**
 * Permission Manager
 * 
 * Handles OS-level notification permissions.
 * Single Responsibility: talk to the OS (via expo-notifications) about permissions – and nothing else.
 * Safe to use in Expo Go - will gracefully return 'denied' if module not available.
 */

export type PermissionStatus = 'granted' | 'denied' | 'blocked';

/**
 * Get current notification permission status
 * Returns 'denied' if expo-notifications is not available (e.g., in Expo Go)
 */
export async function getPermissionStatus(): Promise<PermissionStatus> {
  // Lazy import to avoid errors in Expo Go where native module isn't available
  let Notifications: any;
  try {
    Notifications = await import('expo-notifications');
  } catch (error) {
    // Native module not available (e.g., in Expo Go)
    console.warn('expo-notifications not available:', error);
    return 'denied';
  }

  if (!Notifications || !Notifications.getPermissionsAsync) {
    return 'denied';
  }

  try {
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'blocked'; // 'denied' on iOS means permanently blocked
    } else {
      return 'denied'; // 'undetermined' means not yet asked
    }
  } catch (error) {
    console.warn('Error getting notification permissions:', error);
    return 'denied';
  }
}

/**
 * Request notification permission if not already granted
 * Returns the final permission status after the request
 * Returns 'denied' if expo-notifications is not available (e.g., in Expo Go)
 */
export async function ensurePermissionGranted(): Promise<PermissionStatus> {
  const currentStatus = await getPermissionStatus();
  
  if (currentStatus === 'granted') {
    return 'granted';
  }

  // Lazy import to avoid errors in Expo Go where native module isn't available
  let Notifications: any;
  try {
    Notifications = await import('expo-notifications');
  } catch (error) {
    // Native module not available (e.g., in Expo Go)
    console.warn('expo-notifications not available:', error);
    return 'denied';
  }

  if (!Notifications || !Notifications.requestPermissionsAsync) {
    return 'denied';
  }
  
  try {
    // Request permission
    const { status } = await Notifications.requestPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'blocked';
    } else {
      return 'denied';
    }
  } catch (error) {
    console.warn('Error requesting notification permissions:', error);
    return 'denied';
  }
}
