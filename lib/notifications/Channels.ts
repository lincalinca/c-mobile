/**
 * Notification Channels
 * 
 * Defines OS-level channels/categories for Android and iOS.
 * Keeps platform-specific concerns out of Scheduler and Service.
 */

import * as Notifications from 'expo-notifications';
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
 */
export async function initializeChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    // Android channels
    const channels: Array<{ id: string; name: string; description: string; importance: Notifications.AndroidImportance }> = [
      {
        id: getChannelId('lessons'),
        name: 'Lessons & Calendar Reminders',
        description: 'Notifications for upcoming lessons and calendar events',
        importance: Notifications.AndroidImportance.HIGH,
      },
      {
        id: getChannelId('gear_enrichment'),
        name: 'Gear Photos & Enrichment',
        description: 'Reminders to add photos and details to your gear',
        importance: Notifications.AndroidImportance.DEFAULT,
      },
      {
        id: getChannelId('warranty'),
        name: 'Warranty & Upgrade Reminders',
        description: 'Warranty expiration and upgrade notifications',
        importance: Notifications.AndroidImportance.DEFAULT,
      },
      {
        id: getChannelId('maintenance'),
        name: 'Instrument Maintenance',
        description: 'Reminders for instrument maintenance and care',
        importance: Notifications.AndroidImportance.DEFAULT,
      },
      {
        id: getChannelId('reengagement'),
        name: 'We Miss You',
        description: 'Re-engagement and educator discovery notifications',
        importance: Notifications.AndroidImportance.LOW,
      },
      {
        id: getChannelId('service'),
        name: 'Service & Repairs',
        description: 'Service pick-ups, follow-ups, and repair reminders',
        importance: Notifications.AndroidImportance.HIGH,
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        description: channel.description,
        importance: channel.importance,
        sound: true,
        enableVibrate: true,
        showBadge: true,
      });
    }
  }
  
  // iOS categories can be defined here if needed for actions
  // For now, we'll use default categories
}
