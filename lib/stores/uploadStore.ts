/**
 * Upload Progress Store (Zustand)
 *
 * Manages the state of bulk uploads across the app.
 * Provides a Google Drive-style collapsible progress UI state.
 */

import { create } from 'zustand';
import { ProcessingQueueRepository } from '@lib/processingQueue';
import { callSupabaseFunction } from '@lib/supabase';
import { TransactionRepository, StudentRepository } from '@lib/repository';
import { recordScan, getScansRemaining } from '@lib/usageTracking';

export type UploadItemStatus = 'pending' | 'uploading' | 'processing' | 'ready_for_review' | 'error';

export interface UploadItem {
  id: string;
  imageUri: string;
  status: UploadItemStatus;
  progress: number; // 0-100
  merchantName?: string;
  total?: number; // in cents
  errorMessage?: string;
  queueItemId?: string;
  aiResponseData?: any;
}

interface UploadStats {
  total: number;
  completed: number;
  readyForReview: number;
  processing: number;
  errors: number;
}

interface UploadStore {
  items: UploadItem[];
  isExpanded: boolean;
  isVisible: boolean;
  isProcessing: boolean;

  // Actions
  addItems: (imageUris: string[]) => Promise<{ added: number; rejected: number; reason?: string }>;
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  setExpanded: (expanded: boolean) => void;
  dismiss: () => void;
  reset: () => void;

  // Computed helpers
  getStats: () => UploadStats;
  getReadyItems: () => UploadItem[];
}

export const useUploadStore = create<UploadStore>((set, get) => ({
  items: [],
  isExpanded: false,
  isVisible: false,
  isProcessing: false,

  addItems: async (imageUris: string[]) => {
    // Check remaining scans
    const remaining = await getScansRemaining();

    if (remaining <= 0) {
      return { added: 0, rejected: imageUris.length, reason: 'No scans remaining' };
    }

    // Cap to remaining scans
    const cappedUris = imageUris.slice(0, remaining);
    const rejected = imageUris.length - cappedUris.length;

    if (cappedUris.length === 0) {
      return { added: 0, rejected, reason: 'No scans remaining' };
    }

    const newItems: UploadItem[] = cappedUris.map((uri, index) => ({
      id: `upload_${Date.now()}_${index}`,
      imageUri: uri,
      status: 'pending' as const,
      progress: 0,
    }));

    set((state) => ({
      items: [...state.items, ...newItems],
      isVisible: true,
      isExpanded: true,
      isProcessing: true,
    }));

    // Process items in the background
    processItems(newItems, get, set);

    return {
      added: cappedUris.length,
      rejected,
      reason: rejected > 0 ? `Limited to ${remaining} remaining scans` : undefined,
    };
  },

  updateItem: (id: string, updates: Partial<UploadItem>) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  removeItem: (id: string) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.id !== id);
      return {
        items: newItems,
        isVisible: newItems.length > 0,
      };
    });
  },

  clearCompleted: () => {
    set((state) => {
      const newItems = state.items.filter(
        (item) => item.status !== 'ready_for_review' && item.status !== 'error'
      );
      return {
        items: newItems,
        isVisible: newItems.length > 0,
      };
    });
  },

  setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),

  dismiss: () => set({ isVisible: false }),

  reset: () => set({ items: [], isExpanded: false, isVisible: false, isProcessing: false }),

  getStats: () => {
    const { items } = get();
    return {
      total: items.length,
      completed: items.filter(
        (i) => i.status === 'ready_for_review' || i.status === 'error'
      ).length,
      readyForReview: items.filter((i) => i.status === 'ready_for_review').length,
      processing: items.filter(
        (i) => i.status === 'pending' || i.status === 'uploading' || i.status === 'processing'
      ).length,
      errors: items.filter((i) => i.status === 'error').length,
    };
  },

  getReadyItems: () => {
    return get().items.filter((i) => i.status === 'ready_for_review');
  },
}));

/**
 * Process items sequentially
 */
async function processItems(
  items: UploadItem[],
  get: () => UploadStore,
  set: (partial: Partial<UploadStore> | ((state: UploadStore) => Partial<UploadStore>)) => void
) {
  const { updateItem } = get();

  for (const item of items) {
    try {
      // Mark as uploading
      updateItem(item.id, { status: 'uploading', progress: 10 });

      // Read base64 from URI
      const { readAsStringAsync, EncodingType } = await import('expo-file-system/legacy');
      const base64 = await readAsStringAsync(item.imageUri, {
        encoding: EncodingType.Base64,
      });

      updateItem(item.id, { progress: 30 });

      // Add to processing queue
      const queueItemId = await ProcessingQueueRepository.addItem(item.imageUri);
      updateItem(item.id, { queueItemId, status: 'processing', progress: 40 });

      // Fetch existing merchants and students for matching
      const [existingMerchants, existingPeople] = await Promise.all([
        TransactionRepository.getUniqueMerchants(),
        StudentRepository.getAllForPrompt(),
      ]);

      updateItem(item.id, { progress: 50 });

      // Call AI
      const receiptData = await callSupabaseFunction<any>('analyze-receipt', {
        imageBase64: base64,
        existingMerchants: existingMerchants.map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          phone: m.phone,
          suburb: m.suburb,
          abn: m.abn,
        })),
        existingStudents: existingPeople.map((s) => ({
          name: s.name,
          instrument: s.instrument || null,
        })),
      });

      updateItem(item.id, { progress: 80 });

      if (!receiptData || !receiptData.financial) {
        throw new Error('Incomplete data from AI');
      }

      // Record successful scan
      await recordScan();

      // Extract merchant name and total for display
      const merchantName =
        receiptData.merchant?.name ||
        receiptData.merchantDetails?.name ||
        'Unknown';
      const total = receiptData.financial?.total;

      // Mark queue item as ready (this also sends notification)
      await ProcessingQueueRepository.markReadyForReview(queueItemId, receiptData);

      updateItem(item.id, {
        status: 'ready_for_review',
        progress: 100,
        merchantName,
        total,
        aiResponseData: receiptData,
      });
    } catch (error) {
      console.error('[UploadStore] Processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';

      // Mark queue item as error if we have one
      const currentItems = get().items;
      const currentItem = currentItems.find((i) => i.id === item.id);
      if (currentItem?.queueItemId) {
        await ProcessingQueueRepository.markError(currentItem.queueItemId, errorMessage);
      }

      updateItem(item.id, {
        status: 'error',
        progress: 0,
        errorMessage,
      });
    }
  }

  // Mark processing as complete
  set({ isProcessing: false });
}
