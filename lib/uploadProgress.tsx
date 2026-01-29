/**
 * Upload Progress Context
 *
 * Manages the state of bulk uploads across the app.
 * Provides a Google Drive-style collapsible progress UI.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
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

interface UploadProgressStats {
  total: number;
  completed: number;
  readyForReview: number;
  processing: number;
  errors: number;
}

interface UploadProgressContextType {
  items: UploadItem[];
  isExpanded: boolean;
  isVisible: boolean;
  stats: UploadProgressStats;

  // Actions
  addItems: (imageUris: string[]) => void;
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  removeItem: (id: string) => void;
  clearCompleted: () => void;
  setExpanded: (expanded: boolean) => void;
  dismiss: () => void;
  reset: () => void;
}

const UploadProgressContext = createContext<UploadProgressContextType | null>(null);

export function UploadProgressProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const computeStats = useCallback((currentItems: UploadItem[]): UploadProgressStats => {
    return {
      total: currentItems.length,
      completed: currentItems.filter(
        (i) => i.status === 'ready_for_review' || i.status === 'error'
      ).length,
      readyForReview: currentItems.filter((i) => i.status === 'ready_for_review').length,
      processing: currentItems.filter(
        (i) => i.status === 'pending' || i.status === 'uploading' || i.status === 'processing'
      ).length,
      errors: currentItems.filter((i) => i.status === 'error').length,
    };
  }, []);

  const updateItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const processItem = useCallback(async (item: UploadItem) => {
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

      // Get current item state to check for queueItemId
      setItems((prev) => {
        const currentItem = prev.find((i) => i.id === item.id);
        if (currentItem?.queueItemId) {
          ProcessingQueueRepository.markError(currentItem.queueItemId, errorMessage);
        }
        return prev;
      });

      updateItem(item.id, {
        status: 'error',
        progress: 0,
        errorMessage,
      });
    }
  }, [updateItem]);

  const addItems = useCallback((imageUris: string[]) => {
    const newItems: UploadItem[] = imageUris.map((uri, index) => ({
      id: `upload_${Date.now()}_${index}`,
      imageUri: uri,
      status: 'pending' as const,
      progress: 0,
    }));

    setItems((prev) => [...prev, ...newItems]);
    setIsVisible(true);
    setIsExpanded(true);

    // Process items sequentially
    const processSequentially = async () => {
      for (const item of newItems) {
        await processItem(item);
      }
    };
    processSequentially();
  }, [processItem]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const newItems = prev.filter((item) => item.id !== id);
      if (newItems.length === 0) {
        setIsVisible(false);
      }
      return newItems;
    });
  }, []);

  const clearCompleted = useCallback(() => {
    setItems((prev) => {
      const newItems = prev.filter(
        (item) => item.status !== 'ready_for_review' && item.status !== 'error'
      );
      if (newItems.length === 0) {
        setIsVisible(false);
      }
      return newItems;
    });
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
  }, []);

  const reset = useCallback(() => {
    setItems([]);
    setIsExpanded(false);
    setIsVisible(false);
  }, []);

  const value: UploadProgressContextType = {
    items,
    isExpanded,
    isVisible,
    stats: computeStats(items),
    addItems,
    updateItem,
    removeItem,
    clearCompleted,
    setExpanded,
    dismiss,
    reset,
  };

  return (
    <UploadProgressContext.Provider value={value}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const context = useContext(UploadProgressContext);
  if (!context) {
    throw new Error('useUploadProgress must be used within UploadProgressProvider');
  }
  return context;
}
