/**
 * Notification Scheduler
 * 
 * Abstraction over expo-notifications scheduling.
 * Single Responsibility: scheduling only.
 */

import * as Notifications from 'expo-notifications';
import { NotificationEventsRepository } from './NotificationRepository';
import { getChannelId } from './Channels';
import type { NotificationCategory, NotificationMetadata, NotificationStatus } from './types';
import { formatISO, parseISO } from 'date-fns';

/**
 * Configure notification handler
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
 */
export async function scheduleLocalNotification(
  params: ScheduleNotificationParams
): Promise<void> {
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
      if (existingEvent.osNotificationId) {
        await Notifications.cancelScheduledNotificationAsync(existingEvent.osNotificationId);
      }
    }
  }
  
  // Convert local time to UTC for storage
  const triggerDateUTC = new Date(triggerDate.toISOString());
  
  // Schedule with OS
  const trigger = {
    date: triggerDate,
  };
  
  const notificationId = await Notifications.scheduleNotificationAsync({
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
  
  // Store in database
  const scheduledAt = new Date().toISOString();
  const triggerAt = formatISO(triggerDateUTC);
  
  if (existingEvent) {
    // Update existing event with new notification ID
    await NotificationEventsRepository.updateEventStatus(key, 'scheduled', notificationId);
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
    await NotificationEventsRepository.updateEventStatus(key, 'scheduled', notificationId);
  }
  
  console.log(`[Scheduler] Scheduled notification: ${key} (OS ID: ${notificationId})`);
}

/**
 * Cancel notification by key
 */
export async function cancelByKey(key: string): Promise<void> {
  const event = await NotificationEventsRepository.getEventByKey(key);
  
  if (event && event.osNotificationId) {
    await Notifications.cancelScheduledNotificationAsync(event.osNotificationId);
  }
  
  await NotificationEventsRepository.updateEventStatus(key, 'cancelled');
  console.log(`[Scheduler] Cancelled notification: ${key}`);
}

/**
 * Cancel all notifications for a category
 */
export async function cancelByCategory(category: NotificationCategory): Promise<void> {
  const events = await NotificationEventsRepository.getEventsByCategory(category);
  
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  
  for (const event of scheduledEvents) {
    await cancelByKey(event.key);
  }
  
  console.log(`[Scheduler] Cancelled ${scheduledEvents.length} notifications for category: ${category}`);
}
