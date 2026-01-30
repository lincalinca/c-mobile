/**
 * Education Chaining Logic
 * 
 * Groups education items across receipts into chains based on:
 * studentName + focus
 * 
 * Provider (teacher/merchant) is NOT included in chain key to allow
 * chaining across provider changes (e.g., student switches teachers
 * but continues same instrument/subject learning path).
 */

import type { Receipt, ReceiptItem, LineItemWithDetails } from './repository';

type ReceiptWithItems = Receipt & { items: LineItemWithDetails[] };

export interface EducationChain {
  chainKey: string;
  items: ChainItem[];
  studentName: string;
  focus: string;
  providers: string[]; // Multiple providers allowed in same chain
}

export interface ChainItem {
  item: LineItemWithDetails;
  receipt: Receipt;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Generate chain key from education details
 * Format: studentName|focus
 * 
 * Note: Provider (teacher/merchant) is NOT included in chain key to allow
 * chaining across provider changes (e.g., student switches teachers but
 * continues same instrument/subject learning path).
 */
export function generateChainKey(
  studentName: string | null | undefined,
  focus: string | null | undefined,
  provider?: string // Kept for compatibility but not used in key
): string {
  const normalizedStudent = (studentName || '').toLowerCase().trim();
  const normalizedFocus = (focus || '').toLowerCase().trim();
  
  return `${normalizedStudent}|${normalizedFocus}`;
}

/**
 * Extract provider from education item and receipt
 * Uses teacherName if present, otherwise merchant name
 */
export function extractProvider(
  item: ReceiptItem | LineItemWithDetails,
  receipt: Receipt
): string {
  const eduDetails = typeof item.educationDetails === 'string'
    ? JSON.parse(item.educationDetails || '{}')
    : (item.educationDetails || {});
  
  return eduDetails.teacherName || receipt.merchant || 'Unknown Provider';
}

/**
 * Parse education details from item
 */
function parseEduDetails(item: ReceiptItem | LineItemWithDetails): any {
  if (!item.educationDetails) return {};
  if (typeof item.educationDetails === 'string') {
    try {
      return JSON.parse(item.educationDetails);
    } catch {
      return {};
    }
  }
  return item.educationDetails;
}

/**
 * Get start date from education item (startDate or transactionDate)
 */
function getStartDate(item: ReceiptItem | LineItemWithDetails, receipt: Receipt): string | null {
  const eduDetails = parseEduDetails(item);
  return eduDetails.startDate || receipt.transactionDate || null;
}

/**
 * Get end date from education item
 */
function getEndDate(item: ReceiptItem | LineItemWithDetails): string | null {
  const eduDetails = parseEduDetails(item);
  return eduDetails.endDate || null;
}

/**
 * Build education chains from all receipts
 */
export function buildEducationChains(receipts: ReceiptWithItems[]): EducationChain[] {
  const chainMap = new Map<string, EducationChain>();
  
  // Extract all education items
  for (const receipt of receipts) {
    for (const item of receipt.items) {
      if (item.category !== 'education') continue;
      
      const eduDetails = parseEduDetails(item);
      const studentName = eduDetails.studentName || null;
      const focus = eduDetails.focus || null;
      const provider = extractProvider(item, receipt);
      
      // Skip if missing critical fields (can't chain without student and focus)
      if (!studentName || !focus) continue;
      
      const chainKey = generateChainKey(studentName, focus);
      
      if (!chainMap.has(chainKey)) {
        chainMap.set(chainKey, {
          chainKey,
          items: [],
          studentName,
          focus,
          providers: [],
        });
      }
      
      const chain = chainMap.get(chainKey)!;
      
      // Track unique providers in this chain
      if (!chain.providers.includes(provider)) {
        chain.providers.push(provider);
      }
      
      chain.items.push({
        item: item as LineItemWithDetails,
        receipt,
        startDate: getStartDate(item, receipt),
        endDate: getEndDate(item),
      });
    }
  }
  
  // Sort each chain by start date (or transaction date)
  for (const chain of chainMap.values()) {
    chain.items.sort((a, b) => {
      const dateA = a.startDate || a.receipt.transactionDate || '';
      const dateB = b.startDate || b.receipt.transactionDate || '';
      return dateA.localeCompare(dateB);
    });
  }
  
  return Array.from(chainMap.values());
}

/**
 * Find chain containing a specific education item
 */
export function findChainForItem(
  itemId: string,
  receipts: ReceiptWithItems[]
): EducationChain | null {
  const chains = buildEducationChains(receipts);
  
  for (const chain of chains) {
    if (chain.items.some(ci => ci.item.id === itemId)) {
      return chain;
    }
  }
  
  return null;
}

/**
 * Get chain index for a specific item
 */
export function getChainIndex(itemId: string, chain: EducationChain): number {
  return chain.items.findIndex(ci => ci.item.id === itemId);
}
