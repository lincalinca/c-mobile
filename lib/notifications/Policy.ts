/**
 * Notification Policy
 * 
 * All rate-limiting and category-specific rules in one place.
 * Single Responsibility: all rate-limit logic.
 */

import { NotificationEventsRepository, NotificationSettingsRepository } from './NotificationRepository';
import type { NotificationCategory, NotificationMetadata } from './types';
import { startOfDay, endOfDay, subDays, parseISO, formatISO } from 'date-fns';

/**
 * Notification policy configuration
 */
export const NOTIFICATION_POLICY = {
  global: { dailyMax: 1, weeklyMax: 6 },
  perCategory: {
    lessons: { cooldownDays: 0 }, // One per lesson occurrence
    gear_enrichment: { cooldownDays: 3 },
    warranty: { cooldownDays: 7, maxPerItem: 2 },
    maintenance: { cooldownDays: 60 },
    reengagement: { cooldownDays: 21 },
    service: { cooldownDays: 1 },
  },
} as const;

/**
 * Check if a notification can be sent based on policy and settings
 */
export async function canSend(
  category: NotificationCategory,
  context: {
    metadata?: NotificationMetadata;
    triggerDate: Date; // Local time
    priority?: 'normal' | 'critical';
  }
): Promise<{ allowed: boolean; reason?: string }> {
  // Load settings
  const settings = await NotificationSettingsRepository.getSettings();
  
  // Check global enabled
  if (!settings.globalEnabled) {
    return { allowed: false, reason: 'Global notifications disabled' };
  }
  
  // Check category enabled
  if (!settings.perCategoryEnabled[category]) {
    return { allowed: false, reason: `Category ${category} disabled` };
  }
  
  // Critical notifications bypass daily/weekly caps but still respect global/category toggles
  const isCritical = context.priority === 'critical';
  
  if (!isCritical) {
    // Check daily limit
    const now = new Date();
    const startOfToday = startOfDay(now);
    const endOfToday = endOfDay(now);
    
    const todayEvents = await NotificationEventsRepository.getEventsInDateRange(
      formatISO(startOfToday),
      formatISO(endOfToday)
    );
    
    const todayCount = todayEvents.filter(
      e => e.status === 'scheduled' || e.status === 'delivered'
    ).length;
    
    if (todayCount >= settings.dailyLimit) {
      return { allowed: false, reason: 'Daily limit reached' };
    }
    
    // Check weekly limit
    const startOfWeek = startOfDay(subDays(now, 7));
    const weekEvents = await NotificationEventsRepository.getEventsInDateRange(
      formatISO(startOfWeek),
      formatISO(endOfToday)
    );
    
    const weekCount = weekEvents.filter(
      e => e.status === 'scheduled' || e.status === 'delivered'
    ).length;
    
    if (weekCount >= settings.weeklyLimit) {
      return { allowed: false, reason: 'Weekly limit reached' };
    }
  }
  
  // Check category cooldown
  const categoryPolicy = NOTIFICATION_POLICY.perCategory[category];
  if (categoryPolicy.cooldownDays > 0) {
    const latestEvent = await NotificationEventsRepository.getLatestEvent(
      category,
      context.metadata
    );
    
    if (latestEvent) {
      const latestTriggerDate = parseISO(latestEvent.triggerAt);
      const daysSince = Math.floor(
        (context.triggerDate.getTime() - latestTriggerDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      if (daysSince < categoryPolicy.cooldownDays) {
        return {
          allowed: false,
          reason: `Cooldown not elapsed (${daysSince} days since last notification)`,
        };
      }
    }
  }
  
  // Check per-item limit (e.g., warranty maxPerItem)
  if (categoryPolicy.maxPerItem && context.metadata) {
    const itemEvents = await NotificationEventsRepository.getEventsByCategory(category);
    const itemKey = context.metadata.gearId || context.metadata.serviceId || context.metadata.lessonId;
    
    if (itemKey) {
      const itemCount = itemEvents.filter(
        e => {
          const meta = e.metadata;
          const eventKey = meta.gearId || meta.serviceId || meta.lessonId;
          return eventKey === itemKey && (e.status === 'scheduled' || e.status === 'delivered');
        }
      ).length;
      
      if (itemCount >= categoryPolicy.maxPerItem) {
        return { allowed: false, reason: `Per-item limit reached (${itemCount}/${categoryPolicy.maxPerItem})` };
      }
    }
  }
  
  return { allowed: true };
}
