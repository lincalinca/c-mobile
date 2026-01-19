import { db } from '../db/client';
import { receipts, receiptItems } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

export type Receipt = typeof receipts.$inferSelect;
export type ReceiptItem = typeof receiptItems.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;
export type NewReceiptItem = typeof receiptItems.$inferInsert;

export const ReceiptRepository = {
  async getAll() {
    return await db.select().from(receipts).orderBy(desc(receipts.createdAt));
  },

  async getById(id: string) {
    const result = await db.select().from(receipts).where(eq(receipts.id, id));
    return result[0] || null;
  },

  async getItems(receiptId: string) {
    return await db.select().from(receiptItems).where(eq(receiptItems.receiptId, receiptId));
  },

  async create(receipt: NewReceipt, items: NewReceiptItem[]) {
    try {
      await db.insert(receipts).values(receipt);
      if (items.length > 0) {
        await db.insert(receiptItems).values(items);
      }
      return receipt;
    } catch (e) {
      console.error('Error creating receipt:', e);
      throw e;
    }
  },

  async delete(id: string) {
    await db.delete(receiptItems).where(eq(receiptItems.receiptId, id));
    await db.delete(receipts).where(eq(receipts.id, id));
  }
};
