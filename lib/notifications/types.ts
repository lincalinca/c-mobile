/**
 * Notification Types
 * 
 * Core type definitions for the notifications system.
 */

export type NotificationCategory =
  | 'receipt_ready'
  | 'lessons'
  | 'gear_enrichment'
  | 'warranty'
  | 'maintenance'
  | 'reengagement'
  | 'service';

export interface NotificationMetadata {
  gearId?: string;
  lessonId?: string;
  serviceId?: string;
  personId?: string;
  lineItemId?: string;
  studentName?: string;
  instrument?: string;
  queueItemId?: string; // For receipt_ready notifications
  merchantName?: string; // For receipt_ready notifications
  itemCount?: number; // For receipt_ready notifications (batch)
  [key: string]: string | number | boolean | null | undefined;
}

export type NotificationStatus = 'scheduled' | 'delivered' | 'cancelled';

export interface NotificationEvent {
  id: string;
  category: NotificationCategory;
  key: string; // Stable idempotency key
  scheduledAt: string; // ISO UTC
  triggerAt: string; // ISO UTC
  status: NotificationStatus;
  metadata: NotificationMetadata;
  osNotificationId?: string; // OS notification identifier for cancellation
}

export interface NotificationSettings {
  id: string; // Single row ID (e.g., 'default')
  globalEnabled: boolean;
  perCategoryEnabled: Record<NotificationCategory, boolean>;
  dailyLimit: number;
  weeklyLimit: number;
}
