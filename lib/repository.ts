import { db, waitForDb } from '../db/client';
import { transactions, lineItems } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

// Types
export type Transaction = typeof transactions.$inferSelect;
export type LineItem = typeof lineItems.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type NewLineItem = typeof lineItems.$inferInsert;

// Legacy aliases
export type Receipt = Transaction;
export type ReceiptItem = LineItem;
export type NewReceipt = NewTransaction;
export type NewReceiptItem = NewLineItem;

/**
 * Transaction Repository - handles receipt/invoice documents and their line items
 */
export const TransactionRepository = {
  async getAll() {
    await waitForDb();
    return await db.select().from(transactions).orderBy(desc(transactions.createdAt));
  },

  async getAllWithItems() {
    await waitForDb();
    const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.createdAt));
    const transactionsWithItems = await Promise.all(
      allTransactions.map(async (txn: Transaction) => {
        const items = await db.select().from(lineItems).where(eq(lineItems.transactionId, txn.id));
        return { ...txn, items: items as LineItem[] };
      })
    );
    return transactionsWithItems;
  },

  async getById(id: string) {
    await waitForDb();
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0] || null;
  },

  async getLineItems(transactionId: string) {
    await waitForDb();
    return await db.select().from(lineItems).where(eq(lineItems.transactionId, transactionId));
  },

  async create(transaction: NewTransaction, items: NewLineItem[]) {
    await waitForDb();
    try {
      await db.insert(transactions).values(transaction);
      if (items.length > 0) {
        await db.insert(lineItems).values(items);
      }
      console.log('[Repository] Created transaction:', transaction.id, 'with', items.length, 'items');
      return transaction;
    } catch (e) {
      console.error('[Repository] Error creating transaction:', e);
      throw e;
    }
  },

  async delete(id: string) {
    await waitForDb();
    await db.delete(lineItems).where(eq(lineItems.transactionId, id));
    await db.delete(transactions).where(eq(transactions.id, id));
  }
};

// Legacy alias for backward compatibility
export const ReceiptRepository = TransactionRepository;
