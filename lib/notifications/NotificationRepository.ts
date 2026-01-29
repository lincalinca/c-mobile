/**
 * Notification Repository
 * 
 * Handles persistence for notification settings and events.
 * Single Responsibility: persistence (SQLite / Drizzle) only.
 */

import { db, waitForDb } from '@db/client';
import { notificationSettings, notificationEvents } from '@db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import type { NotificationCategory, NotificationMetadata, NotificationStatus, NotificationSettings as NotificationSettingsType, NotificationEvent } from './types';

// Category default map - ensures new categories get explicit defaults
const CATEGORY_DEFAULTS: Record<NotificationCategory, boolean> = {
  lessons: false,
  gear_enrichment: false,
  warranty: false,
  maintenance: false,
  reengagement: false,
  service: false,
};

/**
 * Normalise perCategoryEnabled against category defaults
 */
function normaliseCategorySettings(
  perCategoryEnabledJson: string | null
): Record<NotificationCategory, boolean> {
  let parsed: Partial<Record<NotificationCategory, boolean>> = {};
  
  if (perCategoryEnabledJson) {
    try {
      parsed = JSON.parse(perCategoryEnabledJson);
    } catch (e) {
      console.warn('[NotificationRepository] Failed to parse perCategoryEnabled:', e);
    }
  }
  
  // Merge with defaults to ensure all categories are present
  return { ...CATEGORY_DEFAULTS, ...parsed };
}

/**
 * Notification Settings Repository
 */
export const NotificationSettingsRepository = {
  /**
   * Get notification settings (creates default if none exist)
   */
  async getSettings(): Promise<NotificationSettingsType> {
    await waitForDb();
    
    const result = await db
      .select()
      .from(notificationSettings)
      .where(eq(notificationSettings.id, 'default'))
      .limit(1);
    
    if (result.length === 0) {
      // Create default settings
      const defaults: NotificationSettingsType = {
        id: 'default',
        globalEnabled: false,
        perCategoryEnabled: CATEGORY_DEFAULTS,
        dailyLimit: 1,
        weeklyLimit: 6,
      };
      
      await db.insert(notificationSettings).values({
        id: 'default',
        globalEnabled: false,
        perCategoryEnabled: JSON.stringify(CATEGORY_DEFAULTS),
        dailyLimit: 1,
        weeklyLimit: 6,
      });
      
      return defaults;
    }
    
    const row = result[0];
    return {
      id: row.id,
      globalEnabled: row.globalEnabled ?? false,
      perCategoryEnabled: normaliseCategorySettings(row.perCategoryEnabled),
      dailyLimit: row.dailyLimit ?? 1,
      weeklyLimit: row.weeklyLimit ?? 6,
    };
  },
  
  /**
   * Update notification settings
   */
  async updateSettings(updates: Partial<Omit<NotificationSettingsType, 'id'>>): Promise<void> {
    await waitForDb();
    
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };
    
    if (updates.globalEnabled !== undefined) {
      updateData.globalEnabled = updates.globalEnabled;
    }
    
    if (updates.perCategoryEnabled !== undefined) {
      updateData.perCategoryEnabled = JSON.stringify(updates.perCategoryEnabled);
    }
    
    if (updates.dailyLimit !== undefined) {
      updateData.dailyLimit = updates.dailyLimit;
    }
    
    if (updates.weeklyLimit !== undefined) {
      updateData.weeklyLimit = updates.weeklyLimit;
    }
    
    await db
      .update(notificationSettings)
      .set(updateData)
      .where(eq(notificationSettings.id, 'default'));
  },
};

/**
 * Notification Events Repository
 */
export const NotificationEventsRepository = {
  /**
   * Create a notification event
   */
  async createEvent(event: Omit<NotificationEvent, 'id'>): Promise<string> {
    await waitForDb();
    
    const id = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await db.insert(notificationEvents).values({
      id,
      category: event.category,
      key: event.key,
      scheduledAt: event.scheduledAt,
      triggerAt: event.triggerAt,
      status: event.status,
      metadata: JSON.stringify(event.metadata),
    });
    
    return id;
  },
  
  /**
   * Get event by key
   */
  async getEventByKey(key: string): Promise<NotificationEvent | null> {
    await waitForDb();
    
    const result = await db
      .select()
      .from(notificationEvents)
      .where(eq(notificationEvents.key, key))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const row = result[0];
    return {
      id: row.id,
      category: row.category as NotificationCategory,
      key: row.key,
      scheduledAt: row.scheduledAt,
      triggerAt: row.triggerAt,
      status: row.status as NotificationStatus,
      metadata: JSON.parse(row.metadata || '{}') as NotificationMetadata,
      osNotificationId: row.osNotificationId || undefined,
    };
  },
  
  /**
   * Update event status
   */
  async updateEventStatus(key: string, status: NotificationStatus, osNotificationId?: string): Promise<void> {
    await waitForDb();
    
    const updateData: any = { status };
    if (osNotificationId !== undefined) {
      updateData.osNotificationId = osNotificationId;
    }
    
    await db
      .update(notificationEvents)
      .set(updateData)
      .where(eq(notificationEvents.key, key));
  },
  
  /**
   * Get events by category
   */
  async getEventsByCategory(category: NotificationCategory): Promise<NotificationEvent[]> {
    await waitForDb();
    
    const result = await db
      .select()
      .from(notificationEvents)
      .where(eq(notificationEvents.category, category))
      .orderBy(desc(notificationEvents.triggerAt));
    
    return result.map(row => ({
      id: row.id,
      category: row.category as NotificationCategory,
      key: row.key,
      scheduledAt: row.scheduledAt,
      triggerAt: row.triggerAt,
      status: row.status as NotificationStatus,
      metadata: JSON.parse(row.metadata || '{}') as NotificationMetadata,
      osNotificationId: row.osNotificationId || undefined,
    }));
  },
  
  /**
   * Get events within a date range (for rate limiting checks)
   */
  async getEventsInDateRange(
    startDate: string, // ISO UTC
    endDate: string, // ISO UTC
    category?: NotificationCategory
  ): Promise<NotificationEvent[]> {
    await waitForDb();
    
    let query = db
      .select()
      .from(notificationEvents)
      .where(
        and(
          gte(notificationEvents.triggerAt, startDate),
          lte(notificationEvents.triggerAt, endDate)
        )
      );
    
    if (category) {
      query = query.where(
        and(
          eq(notificationEvents.category, category),
          gte(notificationEvents.triggerAt, startDate),
          lte(notificationEvents.triggerAt, endDate)
        )
      ) as any;
    }
    
    const result = await query;
    
    return result.map(row => ({
      id: row.id,
      category: row.category as NotificationCategory,
      key: row.key,
      scheduledAt: row.scheduledAt,
      triggerAt: row.triggerAt,
      status: row.status as NotificationStatus,
      metadata: JSON.parse(row.metadata || '{}') as NotificationMetadata,
      osNotificationId: row.osNotificationId || undefined,
    }));
  },
  
  /**
   * Get latest event for a category/item (for cooldown checks)
   */
  async getLatestEvent(
    category: NotificationCategory,
    metadataFilter?: Partial<NotificationMetadata>
  ): Promise<NotificationEvent | null> {
    await waitForDb();
    
    let query = db
      .select()
      .from(notificationEvents)
      .where(eq(notificationEvents.category, category))
      .orderBy(desc(notificationEvents.triggerAt))
      .limit(100); // Get recent events to filter in memory
    
    const result = await query;
    
    // Filter by metadata if provided
    let events = result.map(row => ({
      id: row.id,
      category: row.category as NotificationCategory,
      key: row.key,
      scheduledAt: row.scheduledAt,
      triggerAt: row.triggerAt,
      status: row.status as NotificationStatus,
      metadata: JSON.parse(row.metadata || '{}') as NotificationMetadata,
      osNotificationId: row.osNotificationId || undefined,
    }));
    
    if (metadataFilter) {
      events = events.filter(event => {
        for (const [key, value] of Object.entries(metadataFilter)) {
          if (event.metadata[key] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    return events.length > 0 ? events[0] : null;
  },
  
  /**
   * Delete event by key
   */
  async deleteEventByKey(key: string): Promise<void> {
    await waitForDb();
    await db.delete(notificationEvents).where(eq(notificationEvents.key, key));
  },
};
