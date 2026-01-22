import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Transactions table - represents the receipt/invoice document itself
 * This is the "transaction" that contains line items
 */
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  profileId: text('profile_id'),

  // Merchant details
  merchant: text('merchant').notNull(),
  merchantAbn: text('merchant_abn'),
  merchantAddress: text('merchant_address'),
  merchantPhone: text('merchant_phone'),

  // Document details
  documentType: text('document_type').notNull().default('receipt'), // 'receipt' | 'tax_invoice' | 'invoice' | 'quote' | 'layby' | 'credit_note' | 'refund'
  invoiceNumber: text('invoice_number'),
  referenceNumber: text('reference_number'),
  transactionDate: text('transaction_date').notNull(),
  dueDate: text('due_date'),

  // Financial summary (all in cents)
  subtotal: integer('subtotal'),
  discountTotal: integer('discount_total'),
  tax: integer('tax'),
  total: integer('total').notNull(),
  amountPaid: integer('amount_paid'),
  amountDue: integer('amount_due'),
  currency: text('currency').default('AUD'),

  // Status
  paymentStatus: text('payment_status').default('paid'), // 'paid' | 'partial' | 'unpaid' | 'refunded' | 'voided' | 'credited'
  paymentMethod: text('payment_method'), // 'card' | 'cash' | 'eftpos' | 'bank_transfer' | 'afterpay' | etc

  // Media & raw data
  imageUrl: text('image_url'),
  rawOcrData: text('raw_ocr_data'), // JSON string of full OpenAI response

  // Sync
  syncStatus: text('sync_status').default('pending'), // 'pending' | 'synced' | 'error'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

/**
 * Line items table - individual items within a transaction
 * Categories: gear, service, education, event, other
 */
export const lineItems = sqliteTable('line_items', {
  id: text('id').primaryKey(),
  transactionId: text('transaction_id').references(() => transactions.id),

  // Item details
  description: text('description').notNull(),
  category: text('category').notNull(), // 'gear' | 'service' | 'education' | 'event' | 'other'

  // For gear items
  brand: text('brand'),
  model: text('model'),
  instrumentType: text('instrument_type'),
  gearCategory: text('gear_category'), // 'Instruments' | 'General Accessories' | etc
  serialNumber: text('serial_number'),

  // Pricing (all in cents)
  quantity: integer('quantity').default(1),
  originalUnitPrice: integer('original_unit_price'), // before discount
  unitPrice: integer('unit_price').notNull(), // after discount
  discountAmount: integer('discount_amount'), // fixed $ discount in cents
  discountPercentage: real('discount_percentage'), // e.g., 10.0 for 10%
  totalPrice: integer('total_price').notNull(),

  // For education items - store as JSON
  educationDetails: text('education_details'), // JSON: { studentName, frequency, duration, startDate, endDate, daysOfWeek, times }

  // Notes
  notes: text('notes'),
  confidence: real('confidence'), // 0.0 to 1.0

  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Legacy aliases for backward compatibility during migration
export const receipts = transactions;
export const receiptItems = lineItems;

