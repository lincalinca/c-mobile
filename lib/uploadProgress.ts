/**
 * Upload Progress State Manager
 *
 * Manages the state of bulk uploads across the app.
 * Used by BulkUploadProgress component and scan flow.
 */

import { create } from 'zustand';
import { ProcessingQueueRepository } from './processingQueue';
import { callSupabaseFunction } from './supabase';
import { TransactionRepository, StudentRepository } from './repository';
import { recordScan } from './usageTracking';

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

interface UploadProgressState {
  items: UploadItem[];
  isExpanded: boolean;
  isVisible: boolean;

  // Actions
  addItems: (imageUris: string[]) => void;
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  setExpanded: (expanded: boolean) => void;
  setVisible: (visible: boolean) => void;
  processAllPending: () => Promise<void>;
  reset: () => void;

  // Computed
  getStats: () => {
    total: number;
    completed: number;
    readyForReview: number;
    processing: number;
    errors: number;
  };
}

export const useUploadProgress = create<UploadProgressState>((set, get) => ({
  items: [],
  isExpanded: false,
  isVisible: false,

  addItems: (imageUris: string[]) => {
    const newItems: UploadItem[] = imageUris.map((uri, index) => ({
      id: `upload_${Date.now()}_${index}`,
      imageUri: uri,
      status: 'pending',
      progress: 0,
    }));

    set((state) => ({
      items: [...state.items, ...newItems],
      isVisible: true,
      isExpanded: true, // Auto-expand when adding new items
    }));

    // Start processing
    get().processAllPending();
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
  setVisible: (visible: boolean) => set({ isVisible: visible }),

  processAllPending: async () => {
    const { items, updateItem } = get();
    const pendingItems = items.filter((item) => item.status === 'pending');

    // Process items sequentially to avoid overwhelming the API
    for (const item of pendingItems) {
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
        console.error('[UploadProgress] Processing error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Processing failed';

        // Mark queue item as error if we have one
        const currentItem = get().items.find((i) => i.id === item.id);
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
  },

  reset: () => set({ items: [], isExpanded: false, isVisible: false }),

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
}));
