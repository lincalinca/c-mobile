/**
 * Notification Scheduler
 * 
 * Abstraction over expo-notifications scheduling.
 * Single Responsibility: scheduling only.
 * Safe to use in Expo Go - will gracefully skip if module not available.
 */

import { NotificationEventsRepository } from './NotificationRepository';
import { getChannelId } from './Channels';
import type { NotificationCategory, NotificationMetadata, NotificationStatus } from './types';
import { formatISO, parseISO } from 'date-fns';

// Lazy import - will be loaded when needed
let Notifications: any = null;
let notificationsModuleLoaded = false;

/**
 * Get the notifications module (lazy loaded)
 */
async function getNotificationsModule(): Promise<any> {
  if (notificationsModuleLoaded && Notifications) {
    return Notifications;
  }

  try {
    Notifications = await import('expo-notifications');
    notificationsModuleLoaded = true;

    // Configure notification handler (only if module is available)
    if (Notifications && Notifications.setNotificationHandler) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    }

    return Notifications;
  } catch (error) {
    // Native module not available (e.g., in Expo Go)
    console.warn('expo-notifications not available:', error);
    notificationsModuleLoaded = true; // Mark as attempted so we don't keep trying
    return null;
  }
}

export interface ScheduleNotificationParams {
  category: NotificationCategory;
  title: string;
  body: string;
  triggerDate: Date; // Local time
  deepLink: string;
  metadata: NotificationMetadata;
}

/**
 * Generate a stable notification key for idempotency
 */
export function generateNotificationKey(
  category: NotificationCategory,
  metadata: NotificationMetadata,
  triggerDate: Date
): string {
  const dateStr = formatISO(triggerDate, { representation: 'date' });
  const itemId = metadata.lineItemId || metadata.lessonId || metadata.gearId || metadata.serviceId || 'unknown';
  return `${category}|${itemId}|${dateStr}`;
}

/**
 * Schedule a local notification
 * Safe to call in Expo Go - will gracefully skip if module not available
 */
export async function scheduleLocalNotification(
  params: ScheduleNotificationParams
): Promise<void> {
  const NotificationsModule = await getNotificationsModule();
  
  if (!NotificationsModule) {
    console.warn('[Scheduler] expo-notifications not available, skipping notification scheduling');
    return;
  }

  const { category, title, body, triggerDate, deepLink, metadata } = params;
  
  // Generate stable key
  const key = generateNotificationKey(category, metadata, triggerDate);
  
  // Check for existing event
  const existingEvent = await NotificationEventsRepository.getEventByKey(key);
  
  if (existingEvent) {
    if (existingEvent.status === 'scheduled') {
      const existingTriggerDate = parseISO(existingEvent.triggerAt);
      
      // If trigger date hasn't changed, skip (idempotent)
      if (existingTriggerDate.getTime() === triggerDate.getTime()) {
        console.log(`[Scheduler] Notification already scheduled with key: ${key}`);
        return;
      }
      
      // If trigger date changed, cancel the old one
      if (existingEvent.osNotificationId && NotificationsModule.cancelScheduledNotificationAsync) {
        try {
          await NotificationsModule.cancelScheduledNotificationAsync(existingEvent.osNotificationId);
        } catch (error) {
          console.warn(`[Scheduler] Error cancelling old notification:`, error);
        }
      }
    }
  }
  
  // Convert local time to UTC for storage
  const triggerDateUTC = new Date(triggerDate.toISOString());
  
  // Schedule with OS
  const trigger = {
    date: triggerDate,
  };
  
  let notificationId: string | null = null;
  try {
    notificationId = await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          deepLink,
          category,
          ...metadata,
        },
        sound: true,
      },
      trigger,
    });
  } catch (error) {
    console.error('[Scheduler] Error scheduling notification:', error);
    return;
  }
  
  // Store in database
  const scheduledAt = new Date().toISOString();
  const triggerAt = formatISO(triggerDateUTC);
  
  if (existingEvent) {
    // Update existing event with new notification ID
    await NotificationEventsRepository.updateEventStatus(key, 'scheduled', notificationId || undefined);
  } else {
    // Create new event
    const eventId = await NotificationEventsRepository.createEvent({
      category,
      key,
      scheduledAt,
      triggerAt,
      status: 'scheduled',
      metadata,
    });
    
    // Update with OS notification ID
    await NotificationEventsRepository.updateEventStatus(key, 'scheduled', notificationId || undefined);
  }
  
  console.log(`[Scheduler] Scheduled notification: ${key} (OS ID: ${notificationId})`);
}

/**
 * Cancel notification by key
 * Safe to call in Expo Go - will gracefully skip if module not available
 */
export async function cancelByKey(key: string): Promise<void> {
  const NotificationsModule = await getNotificationsModule();
  const event = await NotificationEventsRepository.getEventByKey(key);
  
  if (event && event.osNotificationId && NotificationsModule?.cancelScheduledNotificationAsync) {
    try {
      await NotificationsModule.cancelScheduledNotificationAsync(event.osNotificationId);
    } catch (error) {
      console.warn(`[Scheduler] Error cancelling notification ${key}:`, error);
    }
  }
  
  await NotificationEventsRepository.updateEventStatus(key, 'cancelled');
  console.log(`[Scheduler] Cancelled notification: ${key}`);
}

/**
 * Cancel all notifications for a category
 * Safe to call in Expo Go - will gracefully skip if module not available
 */
export async function cancelByCategory(category: NotificationCategory): Promise<void> {
  const events = await NotificationEventsRepository.getEventsByCategory(category);
  
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  
  for (const event of scheduledEvents) {
    await cancelByKey(event.key);
  }
  
  console.log(`[Scheduler] Cancelled ${scheduledEvents.length} notifications for category: ${category}`);
}
