/**
 * TypeScript interfaces for the Review screen
 */

import type { DocumentType, PaymentStatus, PaymentMethod } from './config';

// ============================================================================
// Review State Interfaces
// ============================================================================

export interface ReviewTransactionState {
  merchant: string;
  merchantAbn: string;
  documentType: DocumentType;
  transactionDate: string;
  invoiceNumber: string;
  summary: string;
}

export interface ReviewMerchantState {
  merchantPhone: string;
  merchantEmail: string;
  merchantWebsite: string;
  merchantAddress: string;
  merchantSuburb: string;
  merchantState: string;
  merchantPostcode: string;
}

export interface ReviewPaymentState {
  subtotal: string;
  tax: string;
  total: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
}

export interface ReviewMerchantMatchState {
  merchantIsNew: boolean;
  matchedMerchantId: string | null;
}

// ============================================================================
// Line Item Interfaces
// ============================================================================

export interface EducationDetails {
  teacherName?: string;
  focus?: string;
  studentName?: string;
  lessonCount?: number;
  lessonDuration?: number;
  frequency?: string;
  startDate?: string;
  dayOfWeek?: string;
  time?: string;
}

export interface GearDetails {
  brand?: string;
  manufacturer?: string;
  modelName?: string;
  modelNumber?: string;
  serialNumber?: string;
  colour?: string;
  size?: string;
  condition?: string;
  tier?: string;
  uniqueDetail?: string;
  notedDamage?: string;
  officialUrl?: string;
  officialManual?: string;
  warrantyContactDetails?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface ServiceDetails {
  workDone?: string;
  complexity?: string;
  partsUsed?: string;
  technicianName?: string;
}

export interface ReviewLineItem {
  description: string;
  category: string;
  brand?: string;
  model?: string;
  instrumentType?: string;
  gearCategory?: string;
  serialNumber?: string;
  quantity: number;
  originalUnitPrice?: number;
  unitPrice: number;
  discountAmount?: number;
  discountPercentage?: number;
  totalPrice: number;
  gearDetails?: GearDetails;
  educationDetails?: EducationDetails;
  serviceDetails?: ServiceDetails;
  notes?: string;
  confidence?: number;
}

// ============================================================================
// Combined Review State
// ============================================================================

export interface ReviewState extends
  ReviewTransactionState,
  ReviewMerchantState,
  ReviewPaymentState,
  ReviewMerchantMatchState {
  items: ReviewLineItem[];
}

// ============================================================================
// Initial Data from OCR/AI
// ============================================================================

export interface ReviewInitialData {
  summary?: string;
  documentType?: DocumentType;
  financial?: {
    merchant?: string;
    merchantId?: string;
    merchantIsNew?: boolean;
    merchantAbn?: string;
    date?: string;
    invoiceNumber?: string;
    subtotal?: number;
    tax?: number;
    total?: number;
    paymentStatus?: PaymentStatus;
    paymentMethod?: PaymentMethod;
    merchantDetails?: {
      name?: string;
      abn?: string;
      phone?: string;
      email?: string;
      website?: string;
      address?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
    };
  };
  items?: ReviewLineItem[];
}

// ============================================================================
// Action Types for useReducer (optional advanced pattern)
// ============================================================================

export type ReviewAction =
  | { type: 'SET_FIELD'; field: keyof ReviewState; value: unknown }
  | { type: 'SET_MERCHANT_IS_NEW'; value: boolean }
  | { type: 'UPDATE_ITEM'; index: number; item: Partial<ReviewLineItem> }
  | { type: 'UPDATE_ITEM_CATEGORY'; index: number; category: string }
  | { type: 'UPDATE_ITEM_EDUCATION'; index: number; details: Partial<EducationDetails> }
  | { type: 'UPDATE_ITEM_GEAR'; index: number; details: Partial<GearDetails> }
  | { type: 'RESET'; data: ReviewInitialData };

// Default export to prevent expo-router from treating this as a route
export default null;
