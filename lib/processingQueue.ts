/**
 * Processing Queue Repository
 *
 * Manages receipts that are being processed by AI or awaiting user review.
 * Items move through: processing → ready_for_review → (confirmed/rejected)
 * When confirmed, data moves to transactions table; when rejected, item is deleted.
 */

import { db, waitForDb } from '@db/client';
import { processingQueue } from '@db/schema';
import { eq, desc } from 'drizzle-orm';
import { sendReceiptReadyNotification } from './notifications/Service';

type ProcessingQueueRow = typeof processingQueue.$inferSelect;

export type ProcessingStatus = 'processing' | 'ready_for_review' | 'error';

export interface QueueItem {
  id: string;
  imageUri: string;
  status: ProcessingStatus;
  aiResponseData: any | null;
  errorMessage: string | null;
  submittedAt: string;
  completedAt: string | null;
  notificationSent: boolean;
}

/**
 * Processing Queue Repository
 */
export const ProcessingQueueRepository = {
  /**
   * Add a new item to the processing queue
   */
  async addItem(imageUri: string): Promise<string> {
    await waitForDb();

    const id = `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db.insert(processingQueue).values({
      id,
      imageUri,
      status: 'processing',
      submittedAt: new Date().toISOString(),
    });

    console.log('[ProcessingQueue] Added item:', id);
    return id;
  },

  /**
   * Mark item as ready for review (AI completed successfully)
   */
  async markReadyForReview(
    id: string,
    aiResponseData: any,
    sendNotification: boolean = true
  ): Promise<void> {
    await waitForDb();

    const merchantName = aiResponseData?.merchant?.name || aiResponseData?.merchantDetails?.name;

    await db.update(processingQueue).set({
      status: 'ready_for_review',
      aiResponseData: JSON.stringify(aiResponseData),
      completedAt: new Date().toISOString(),
    }).where(eq(processingQueue.id, id));

    console.log('[ProcessingQueue] Item ready for review:', id);

    // Send notification
    if (sendNotification) {
      try {
        const result = await sendReceiptReadyNotification({
          queueItemId: id,
          merchantName,
        });

        if (result.scheduled) {
          await db.update(processingQueue).set({
            notificationSent: true,
          }).where(eq(processingQueue.id, id));
          console.log('[ProcessingQueue] Notification sent for item:', id);
        }
      } catch (e) {
        console.warn('[ProcessingQueue] Failed to send notification:', e);
      }
    }
  },

  /**
   * Mark item as failed
   */
  async markError(id: string, errorMessage: string): Promise<void> {
    await waitForDb();

    await db.update(processingQueue).set({
      status: 'error',
      errorMessage,
      completedAt: new Date().toISOString(),
    }).where(eq(processingQueue.id, id));

    console.log('[ProcessingQueue] Item failed:', id, errorMessage);
  },

  /**
   * Get item by ID
   */
  async getById(id: string): Promise<QueueItem | null> {
    await waitForDb();

    const result = await db.select().from(processingQueue).where(eq(processingQueue.id, id)).limit(1);

    if (result.length === 0) return null;

    const row: ProcessingQueueRow = result[0];
    return {
      id: row.id,
      imageUri: row.imageUri,
      status: row.status as ProcessingStatus,
      aiResponseData: row.aiResponseData ? JSON.parse(row.aiResponseData) : null,
      errorMessage: row.errorMessage,
      submittedAt: row.submittedAt || new Date().toISOString(),
      completedAt: row.completedAt,
      notificationSent: row.notificationSent ?? false,
    };
  },

  /**
   * Get all items in the queue
   */
  async getAll(): Promise<QueueItem[]> {
    await waitForDb();

    const result = await db.select().from(processingQueue).orderBy(desc(processingQueue.submittedAt));

    return result.map((row: ProcessingQueueRow) => ({
      id: row.id,
      imageUri: row.imageUri,
      status: row.status as ProcessingStatus,
      aiResponseData: row.aiResponseData ? JSON.parse(row.aiResponseData) : null,
      errorMessage: row.errorMessage,
      submittedAt: row.submittedAt || new Date().toISOString(),
      completedAt: row.completedAt,
      notificationSent: row.notificationSent ?? false,
    }));
  },

  /**
   * Get items by status
   */
  async getByStatus(status: ProcessingStatus): Promise<QueueItem[]> {
    await waitForDb();

    const result = await db
      .select()
      .from(processingQueue)
      .where(eq(processingQueue.status, status))
      .orderBy(desc(processingQueue.submittedAt));

    return result.map((row: ProcessingQueueRow) => ({
      id: row.id,
      imageUri: row.imageUri,
      status: row.status as ProcessingStatus,
      aiResponseData: row.aiResponseData ? JSON.parse(row.aiResponseData) : null,
      errorMessage: row.errorMessage,
      submittedAt: row.submittedAt || new Date().toISOString(),
      completedAt: row.completedAt,
      notificationSent: row.notificationSent ?? false,
    }));
  },

  /**
   * Get count of items ready for review (for badge display)
   */
  async getReadyForReviewCount(): Promise<number> {
    await waitForDb();

    const result = await db
      .select()
      .from(processingQueue)
      .where(eq(processingQueue.status, 'ready_for_review'));

    return result.length;
  },

  /**
   * Remove item from queue (after confirmation or rejection)
   */
  async removeItem(id: string): Promise<void> {
    await waitForDb();
    await db.delete(processingQueue).where(eq(processingQueue.id, id));
    console.log('[ProcessingQueue] Removed item:', id);
  },

  /**
   * Clear all completed/errored items older than specified days
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    await waitForDb();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
    const cutoffIso = cutoffDate.toISOString();

    // Get items to delete
    const toDelete: ProcessingQueueRow[] = await db.select().from(processingQueue);
    const oldItems = toDelete.filter(
      (item: ProcessingQueueRow) => item.completedAt && item.completedAt < cutoffIso
    );

    for (const item of oldItems) {
      await db.delete(processingQueue).where(eq(processingQueue.id, item.id));
    }

    console.log('[ProcessingQueue] Cleaned up', oldItems.length, 'old items');
    return oldItems.length;
  },
};
