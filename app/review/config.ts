/**
 * Data-driven configuration for the Review screen
 * All form options, fields, and sections are defined here for consistency and maintainability
 */

// ============================================================================
// Document Type Options
// ============================================================================

export const DOCUMENT_TYPES = [
  { value: 'receipt', label: 'Receipt' },
  { value: 'tax_invoice', label: 'Tax Invoice' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'quote', label: 'Quote' },
  { value: 'layby', label: 'Layby' },
] as const;

export type DocumentType = typeof DOCUMENT_TYPES[number]['value'];

// ============================================================================
// Payment Status Options
// ============================================================================

export const PAYMENT_STATUSES = [
  { value: 'paid', label: 'Paid', color: 'bg-green-600' },
  { value: 'partial', label: 'Partial', color: 'bg-yellow-600' },
  { value: 'unpaid', label: 'Unpaid', color: 'bg-red-600' },
  { value: 'refunded', label: 'Refunded', color: 'bg-purple-600' },
] as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[number]['value'];

// ============================================================================
// Payment Method Options
// ============================================================================

export const PAYMENT_METHODS = [
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'eftpos', label: 'EFTPOS' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'afterpay', label: 'Afterpay' },
  { value: 'other', label: 'Other' },
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number]['value'];

// ============================================================================
// Form Field Configurations
// ============================================================================

type InputType = 'text' | 'numeric' | 'phone' | 'email' | 'url' | 'decimal';

interface BaseFieldConfig {
  label: string;
  key: string;
  placeholder?: string;
}

interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  inputType?: InputType;
}

interface PillSelectFieldConfig extends BaseFieldConfig {
  type: 'pillSelect';
  options: readonly { value: string; label: string; color?: string }[];
}

export type FieldConfig = TextFieldConfig | PillSelectFieldConfig;

export interface SectionConfig {
  id: string;
  title: string;
  icon: string;
  fields: FieldConfig[];
}

// Transaction Details Section Fields
export const TRANSACTION_FIELDS: FieldConfig[] = [
  {
    label: 'Document Type',
    key: 'documentType',
    type: 'pillSelect',
    options: DOCUMENT_TYPES
  },
  { label: 'Merchant', key: 'merchant', type: 'text' },
  { label: 'ABN', key: 'merchantAbn', type: 'text', inputType: 'numeric', placeholder: 'XX XXX XXX XXX' },
  { label: 'Invoice/Receipt #', key: 'invoiceNumber', type: 'text' },
  { label: 'Date', key: 'transactionDate', type: 'text', placeholder: 'YYYY-MM-DD' },
  { label: 'Transaction Summary (3-10 words)', key: 'summary', type: 'text', placeholder: 'e.g., Piano purchase with warranty' },
];

// Merchant Details Section Fields
export const MERCHANT_DETAIL_FIELDS: FieldConfig[] = [
  { label: 'Phone', key: 'merchantPhone', type: 'text', inputType: 'phone', placeholder: '(02) 1234 5678' },
  { label: 'Email', key: 'merchantEmail', type: 'text', inputType: 'email', placeholder: 'info@merchant.com' },
  { label: 'Website', key: 'merchantWebsite', type: 'text', inputType: 'url', placeholder: 'https://www.merchant.com.au' },
  { label: 'Street Address', key: 'merchantAddress', type: 'text', placeholder: '123 Main Street' },
  { label: 'Suburb', key: 'merchantSuburb', type: 'text', placeholder: 'Sydney' },
  { label: 'State', key: 'merchantState', type: 'text', placeholder: 'NSW' },
  { label: 'Postcode', key: 'merchantPostcode', type: 'text', inputType: 'numeric', placeholder: '2000' },
];

// Payment Details Section Fields
export const PAYMENT_FIELDS: FieldConfig[] = [
  {
    label: 'Payment Status',
    key: 'paymentStatus',
    type: 'pillSelect',
    options: PAYMENT_STATUSES
  },
  {
    label: 'Payment Method',
    key: 'paymentMethod',
    type: 'pillSelect',
    options: PAYMENT_METHODS
  },
  { label: 'Subtotal', key: 'subtotal', type: 'text', inputType: 'decimal', placeholder: '0.00' },
  { label: 'GST', key: 'tax', type: 'text', inputType: 'decimal', placeholder: '0.00' },
  { label: 'Total', key: 'total', type: 'text', inputType: 'decimal' },
];

// ============================================================================
// Line Item Field Configurations
// ============================================================================

export const EDUCATION_DETAIL_FIELDS: FieldConfig[] = [
  { label: 'Teacher Name', key: 'teacherName', type: 'text', placeholder: "Teacher's name" },
  { label: 'Focus', key: 'focus', type: 'text', placeholder: 'Violin, Piano, Vocals, Theory, Etc' },
];

export const GEAR_DETAIL_FIELDS: FieldConfig[] = [
  { label: 'Brand', key: 'brand', type: 'text', placeholder: 'e.g., Yamaha' },
  { label: 'Manufacturer', key: 'manufacturer', type: 'text', placeholder: 'If different from brand' },
  { label: 'Model Name', key: 'modelName', type: 'text', placeholder: 'e.g., PSR-E373' },
  { label: 'Model Number', key: 'modelNumber', type: 'text', placeholder: 'SKU or model #' },
  { label: 'Serial Number', key: 'serialNumber', type: 'text', placeholder: 'Serial number' },
  { label: 'Colour', key: 'colour', type: 'text', placeholder: 'e.g., Sunburst' },
  { label: 'Size', key: 'size', type: 'text', placeholder: 'e.g., 3/4, Full Size' },
];

// Default export to prevent expo-router from treating this as a route
export default null;
