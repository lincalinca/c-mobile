import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey(),
  profileId: text('profile_id'),
  merchant: text('merchant').notNull(),
  date: text('date').notNull(),
  total: integer('total').notNull(), // in cents
  subtotal: integer('subtotal'),
  tax: integer('tax'),
  imageUrl: text('image_url'),
  abn: text('abn'),
  rawOcr: text('raw_ocr_data'),
  syncStatus: text('sync_status').default('pending'), // 'pending' | 'synced'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const receiptItems = sqliteTable('receipt_items', {
  id: text('id').primaryKey(),
  receiptId: text('receipt_id').references(() => receipts.id),
  description: text('description').notNull(),
  quantity: integer('quantity').default(1),
  unitPrice: integer('unit_price').notNull(), // in cents
  totalPrice: integer('total_price').notNull(), // in cents
  category: text('category').notNull(), // 'gear', 'event', 'service', 'other'
  brand: text('brand'),
  model: text('model'),
  instrumentType: text('instrument_type'),
  subcategory: text('subcategory'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

