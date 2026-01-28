/**
 * Notification Reconciler
 * 
 * Re-derives notifications from domain data after backup/restore or app start.
 * Domain data + policy are the source of truth; OS-level schedules are disposable.
 */

import { NotificationEventsRepository, NotificationSettingsRepository } from './NotificationRepository';
import { scheduleLessonNotificationsForChain } from '../educationNotifications';
import { buildEducationChains } from '../educationChain';
import { TransactionRepository } from '../repository';
import { cancelByKey } from './Scheduler';
import type { NotificationCategory } from './types';

/**
 * Reconcile all notifications based on current domain data and settings
 * Should be called on app start and after restore
 */
export async function reconcileNotifications(): Promise<void> {
  console.log('[NotificationReconciler] Starting reconciliation...');
  
  try {
    // Load settings
    const settings = await NotificationSettingsRepository.getSettings();
    
    if (!settings.globalEnabled) {
      console.log('[NotificationReconciler] Notifications disabled globally, skipping reconciliation');
      return;
    }
    
    // Reconcile lesson notifications
    if (settings.perCategoryEnabled.lessons) {
      await reconcileLessonNotifications();
    }
    
    // TODO: Reconcile other notification types as they're implemented
    // - Gear enrichment nudges
    // - Warranty reminders
    // - Maintenance prompts
    // - Service pick-up reminders
    
    console.log('[NotificationReconciler] Reconciliation complete');
  } catch (error) {
    console.error('[NotificationReconciler] Reconciliation error:', error);
  }
}

/**
 * Reconcile lesson notifications
 */
async function reconcileLessonNotifications(): Promise<void> {
  try {
    // Get all transactions with items
    const transactions = await TransactionRepository.getAllWithItems();
    
    // Build education chains
    const chains = buildEducationChains(transactions);
    
    // Schedule notifications for each chain
    for (const chain of chains) {
      await scheduleLessonNotificationsForChain(chain);
    }
    
    // Clean up notifications for lessons that no longer exist
    // Get all scheduled lesson notifications
    const scheduledLessons = await NotificationEventsRepository.getEventsByCategory('lessons');
    const scheduledLessonsFiltered = scheduledLessons.filter(e => e.status === 'scheduled');
    
    // Check each scheduled notification against current domain data
    for (const event of scheduledLessonsFiltered) {
      const lineItemId = event.metadata.lineItemId || event.metadata.lessonId;
      
      if (lineItemId) {
        // Check if this line item still exists
        const lineItem = await TransactionRepository.getLineItemById(lineItemId);
        
        if (!lineItem || lineItem.category !== 'education') {
          // Item no longer exists or is not an education item, cancel notification
          await cancelByKey(event.key);
          console.log(`[NotificationReconciler] Cancelled notification for removed item: ${lineItemId}`);
        } else {
          // Verify the lesson date still makes sense
          // This is a simplified check - in a full implementation, we'd regenerate events
          // and compare to ensure the notification is still valid
        }
      }
    }
  } catch (error) {
    console.error('[NotificationReconciler] Error reconciling lesson notifications:', error);
  }
}

/**
 * Clean up stale notifications (scheduled but trigger date passed)
 */
export async function cleanupStaleNotifications(): Promise<void> {
  try {
    const now = new Date().toISOString();
    
    // Get all scheduled notifications
    const allEvents = await NotificationEventsRepository.getEventsInDateRange(
      '1970-01-01T00:00:00Z', // Start of epoch
      now
    );
    
    const staleEvents = allEvents.filter(
      e => e.status === 'scheduled' && e.triggerAt < now
    );
    
    for (const event of staleEvents) {
      await NotificationEventsRepository.updateEventStatus(event.key, 'cancelled');
      console.log(`[NotificationReconciler] Marked stale notification as cancelled: ${event.key}`);
    }
  } catch (error) {
    console.error('[NotificationReconciler] Error cleaning up stale notifications:', error);
  }
}
