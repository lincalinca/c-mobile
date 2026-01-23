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

// Gear Details Interface (Phase 1)
export interface GearDetails {
  manufacturer?: string;
  brand?: string;
  makeYear?: string;
  modelName?: string;
  modelNumber?: string;
  serialNumber?: string;
  colour?: string;
  uniqueDetail?: string;
  condition?: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  notedDamage?: string;
  size?: string;
  tier?: 'Entry-level' | 'Student' | 'Professional' | 'Concert';
  officialUrl?: string;
  officialManual?: string;
  warrantyContactDetails?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

// Education Details Interface (Phase 1 - updated with teacherName)
export interface EducationDetails {
  teacherName?: string;
  studentName?: string;
  /** Override for the hero subtitle (e.g. provider name); if unset, receipt.merchant is used. */
  subtitle?: string;
  frequency?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[];
  times?: string[];
}

// Warranty Details Interface (Phase 2)
export interface WarrantyDetails {
  coveragePeriod?: string;
  coverageType?: string;
  startDate?: string;
}

// Enhanced Line Item with parsed JSON fields
export interface LineItemWithDetails extends LineItem {
  gearDetailsParsed?: GearDetails;
  educationDetailsParsed?: EducationDetails;
  warrantyDetailsParsed?: WarrantyDetails;
}

// Helper functions to parse JSON fields
function parseGearDetails(gearDetailsJson: string | null): GearDetails | undefined {
  if (!gearDetailsJson) return undefined;
  try {
    return JSON.parse(gearDetailsJson) as GearDetails;
  } catch (e) {
    console.warn('[Repository] Failed to parse gearDetails:', e);
    return undefined;
  }
}

function parseEducationDetails(educationDetailsJson: string | null): EducationDetails | undefined {
  if (!educationDetailsJson) return undefined;
  try {
    return JSON.parse(educationDetailsJson) as EducationDetails;
  } catch (e) {
    console.warn('[Repository] Failed to parse educationDetails:', e);
    return undefined;
  }
}

function parseWarrantyDetails(warrantyDetailsJson: string | null): WarrantyDetails | undefined {
  if (!warrantyDetailsJson) return undefined;
  try {
    return JSON.parse(warrantyDetailsJson) as WarrantyDetails;
  } catch (e) {
    console.warn('[Repository] Failed to parse warrantyDetails:', e);
    return undefined;
  }
}

function enhanceLineItem(item: LineItem): LineItemWithDetails {
  return {
    ...item,
    gearDetailsParsed: parseGearDetails(item.gearDetails),
    educationDetailsParsed: parseEducationDetails(item.educationDetails),
    warrantyDetailsParsed: parseWarrantyDetails(item.warrantyDetails),
  };
}

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
        const enhancedItems = items.map(enhanceLineItem);
        return { ...txn, items: enhancedItems };
      })
    );
    return transactionsWithItems;
  },

  async getById(id: string) {
    await waitForDb();
    const result = await db.select().from(transactions).where(eq(transactions.id, id));
    return result[0] || null;
  },

  async getLineItems(transactionId: string): Promise<LineItemWithDetails[]> {
    await waitForDb();
    const items = await db.select().from(lineItems).where(eq(lineItems.transactionId, transactionId));
    return items.map(enhanceLineItem);
  },

  async getLineItemById(id: string): Promise<LineItemWithDetails | null> {
    await waitForDb();
    const result = await db.select().from(lineItems).where(eq(lineItems.id, id));
    return result[0] ? enhanceLineItem(result[0]) : null;
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
  },

  /**
   * Update the image URL for a transaction (used for replacing receipt images)
   */
  async updateImageUrl(id: string, imageUrl: string) {
    await waitForDb();
    await db.update(transactions).set({ imageUrl }).where(eq(transactions.id, id));
    console.log('[Repository] Updated imageUrl for transaction:', id);
  },

  /**
   * Update partial transaction fields (e.g. after reprocessing)
   */
  async update(id: string, updates: Partial<Omit<Transaction, 'id'>>) {
    await waitForDb();
    await db.update(transactions).set(updates).where(eq(transactions.id, id));
    console.log('[Repository] Updated transaction:', id);
  },

  /**
   * Update a single line item by id (e.g. description, educationDetails).
   */
  async updateLineItem(id: string, updates: Partial<Pick<LineItem, 'description' | 'educationDetails'>>) {
    await waitForDb();
    await db.update(lineItems).set(updates).where(eq(lineItems.id, id));
    console.log('[Repository] Updated line item:', id);
  },

  /**
   * Replace all line items for a transaction (deletes existing, inserts new)
   */
  async replaceLineItems(transactionId: string, items: NewLineItem[]) {
    await waitForDb();
    await db.delete(lineItems).where(eq(lineItems.transactionId, transactionId));
    if (items.length > 0) {
      await db.insert(lineItems).values(items);
    }
    console.log('[Repository] Replaced line items for transaction:', transactionId, 'count:', items.length);
  },

  /**
   * Get unique merchants from transaction history for merchant matching
   * Returns array of merchants with: id, name, email, phone, suburb
   */
  async getUniqueMerchants(profileId?: string) {
    await waitForDb();

    // Fetch all transactions (optionally filtered by profileId)
    let query = db.select().from(transactions);
    if (profileId) {
      query = query.where(eq(transactions.profileId, profileId)) as any;
    }

    const allTransactions = await query;

    // Create a map to deduplicate merchants by a composite key
    const merchantMap = new Map<string, {
      id: string;
      name: string;
      email?: string;
      phone?: string;
      suburb?: string;
      abn?: string;
    }>();

    for (const txn of allTransactions) {
      // Create a unique key based on merchant identifiers
      // Priority: ABN > name+suburb > name+phone > name
      const normalizedName = txn.merchant.toLowerCase().trim();
      const normalizedAbn = txn.merchantAbn?.replace(/\s/g, '') || '';
      const normalizedPhone = txn.merchantPhone?.replace(/\s/g, '') || '';
      const normalizedSuburb = txn.merchantSuburb?.toLowerCase().trim() || '';

      let key: string;
      if (normalizedAbn) {
        key = `abn:${normalizedAbn}`;
      } else if (normalizedSuburb) {
        key = `name-suburb:${normalizedName}:${normalizedSuburb}`;
      } else if (normalizedPhone) {
        key = `name-phone:${normalizedName}:${normalizedPhone}`;
      } else {
        key = `name:${normalizedName}`;
      }

      // Only add if not already in map (keeps first occurrence)
      if (!merchantMap.has(key)) {
        merchantMap.set(key, {
          id: txn.id, // Using transaction ID as merchant identifier
          name: txn.merchant,
          email: txn.merchantEmail || undefined,
          phone: txn.merchantPhone || undefined,
          suburb: txn.merchantSuburb || undefined,
          abn: txn.merchantAbn || undefined,
        });
      }
    }

    return Array.from(merchantMap.values());
  }
};

// Legacy alias for backward compatibility
export const ReceiptRepository = TransactionRepository;
