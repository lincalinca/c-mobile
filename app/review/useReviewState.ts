/**
 * Custom hook for managing Review screen state
 * Encapsulates all state logic and provides a clean API for components
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  ReviewState,
  ReviewInitialData,
  ReviewLineItem,
  EducationDetails,
  GearDetails,
} from './types';
import type { DocumentType, PaymentStatus, PaymentMethod } from './config';

function parseInitialData(data: ReviewInitialData): ReviewState {
  const merchantIsNew = data.financial?.merchantIsNew !== false;

  return {
    // Transaction
    merchant: merchantIsNew
      ? (data.financial?.merchantDetails?.name || data.financial?.merchant || 'Unknown Merchant')
      : (data.financial?.merchant || 'Unknown Merchant'),
    merchantAbn: merchantIsNew ? (data.financial?.merchantDetails?.abn || '') : '',
    documentType: (data.documentType || 'receipt') as DocumentType,
    transactionDate: data.financial?.date || new Date().toISOString().split('T')[0],
    invoiceNumber: data.financial?.invoiceNumber || '',
    summary: data.summary || '',

    // Merchant Details
    merchantPhone: merchantIsNew ? (data.financial?.merchantDetails?.phone || '') : '',
    merchantEmail: merchantIsNew ? (data.financial?.merchantDetails?.email || '') : '',
    merchantWebsite: merchantIsNew ? (data.financial?.merchantDetails?.website || '') : '',
    merchantAddress: merchantIsNew ? (data.financial?.merchantDetails?.address || '') : '',
    merchantSuburb: merchantIsNew ? (data.financial?.merchantDetails?.suburb || '') : '',
    merchantState: merchantIsNew ? (data.financial?.merchantDetails?.state || '') : '',
    merchantPostcode: merchantIsNew ? (data.financial?.merchantDetails?.postcode || '') : '',

    // Payment
    subtotal: data.financial?.subtotal?.toString() || '',
    tax: data.financial?.tax?.toString() || '',
    total: data.financial?.total?.toString() || '0',
    paymentStatus: (data.financial?.paymentStatus || 'paid') as PaymentStatus,
    paymentMethod: (data.financial?.paymentMethod || 'card') as PaymentMethod,

    // Merchant Match
    merchantIsNew,
    matchedMerchantId: data.financial?.merchantId || null,

    // Items
    items: data.items || [],
  };
}

export interface UseReviewStateReturn {
  state: ReviewState;

  // Field setters
  setField: <K extends keyof ReviewState>(field: K, value: ReviewState[K]) => void;
  setMerchantIsNew: (value: boolean) => void;

  // Item operations
  updateItem: (index: number, updates: Partial<ReviewLineItem>) => void;
  updateItemCategory: (index: number, category: string) => void;
  updateItemEducation: (index: number, details: Partial<EducationDetails>) => void;
  updateItemGear: (index: number, details: Partial<GearDetails>) => void;

  // Computed values
  hasEducationOrEvents: boolean;
}

export function useReviewState(initialData: ReviewInitialData): UseReviewStateReturn {
  const [state, setState] = useState<ReviewState>(() => parseInitialData(initialData));

  // Generic field setter
  const setField = useCallback(<K extends keyof ReviewState>(field: K, value: ReviewState[K]) => {
    setState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Merchant match override
  const setMerchantIsNew = useCallback((value: boolean) => {
    setState(prev => ({ ...prev, merchantIsNew: value }));
  }, []);

  // Item operations
  const updateItem = useCallback((index: number, updates: Partial<ReviewLineItem>) => {
    setState(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], ...updates };
      return { ...prev, items: newItems };
    });
  }, []);

  const updateItemCategory = useCallback((index: number, category: string) => {
    setState(prev => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], category };
      return { ...prev, items: newItems };
    });
  }, []);

  const updateItemEducation = useCallback((index: number, details: Partial<EducationDetails>) => {
    setState(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        educationDetails: {
          ...newItems[index].educationDetails,
          ...details,
        },
      };
      return { ...prev, items: newItems };
    });
  }, []);

  const updateItemGear = useCallback((index: number, details: Partial<GearDetails>) => {
    setState(prev => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        gearDetails: {
          ...newItems[index].gearDetails,
          ...details,
        },
      };
      return { ...prev, items: newItems };
    });
  }, []);

  // Computed values
  const hasEducationOrEvents = useMemo(() => {
    return state.items.some(item =>
      item.category === 'education' ||
      item.category === 'event' ||
      (item.educationDetails && Object.keys(item.educationDetails).length > 0)
    );
  }, [state.items]);

  return {
    state,
    setField,
    setMerchantIsNew,
    updateItem,
    updateItemCategory,
    updateItemEducation,
    updateItemGear,
    hasEducationOrEvents,
  };
}

// Default export to prevent expo-router from treating this as a route
export default null;
