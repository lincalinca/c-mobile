/**
 * Notification Channels
 * 
 * Defines OS-level channels/categories for Android and iOS.
 * Keeps platform-specific concerns out of Scheduler and Service.
 */

import { Platform } from 'react-native';
import type { NotificationCategory } from './types';

/**
 * Map notification category to channel ID
 */
export function getChannelId(category: NotificationCategory): string {
  return `crescender_${category}`;
}

/**
 * Initialize notification channels (Android) and categories (iOS)
 * Should be called on app startup
 * Safe to call in Expo Go - will gracefully skip if module not available
 */
export async function initializeChannels(): Promise<void> {
  // Lazy import to avoid errors in Expo Go where native module isn't available
  let Notifications: any;
  try {
    Notifications = await import('expo-notifications');
  } catch (error) {
    // Native module not available (e.g., in Expo Go)
    console.warn('expo-notifications not available, skipping channel initialization:', error);
    return;
  }

  if (!Notifications || Platform.OS !== 'android') {
    return;
  }

  try {
    // Android channels
    const channels: Array<{ id: string; name: string; description: string; importance: any }> = [
      {
        id: getChannelId('lessons'),
        name: 'Lessons & Calendar Reminders',
        description: 'Notifications for upcoming lessons and calendar events',
        importance: Notifications.AndroidImportance?.HIGH || 4,
      },
      {
        id: getChannelId('gear_enrichment'),
        name: 'Gear Photos & Enrichment',
        description: 'Reminders to add photos and details to your gear',
        importance: Notifications.AndroidImportance?.DEFAULT || 3,
      },
      {
        id: getChannelId('warranty'),
        name: 'Warranty & Upgrade Reminders',
        description: 'Warranty expiration and upgrade notifications',
        importance: Notifications.AndroidImportance?.DEFAULT || 3,
      },
      {
        id: getChannelId('maintenance'),
        name: 'Instrument Maintenance',
        description: 'Reminders for instrument maintenance and care',
        importance: Notifications.AndroidImportance?.DEFAULT || 3,
      },
      {
        id: getChannelId('reengagement'),
        name: 'We Miss You',
        description: 'Re-engagement and educator discovery notifications',
        importance: Notifications.AndroidImportance?.LOW || 2,
      },
      {
        id: getChannelId('service'),
        name: 'Service & Repairs',
        description: 'Service pick-ups, follow-ups, and repair reminders',
        importance: Notifications.AndroidImportance?.HIGH || 4,
      },
    ];

    for (const channel of channels) {
      try {
        await Notifications.setNotificationChannelAsync(channel.id, {
          name: channel.name,
          description: channel.description,
          importance: channel.importance,
          sound: true,
          enableVibrate: true,
          showBadge: true,
        });
      } catch (error) {
        console.warn(`Failed to create notification channel ${channel.id}:`, error);
      }
    }
  } catch (error) {
    console.warn('Error initializing notification channels:', error);
  }
  
  // iOS categories can be defined here if needed for actions
  // For now, we'll use default categories
}
