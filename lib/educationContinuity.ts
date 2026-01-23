/**
 * Education Continuity Gap Detection
 * 
 * Detects gaps in education lesson series based on dates and frequency
 */

import type { ReceiptItem, Receipt } from './repository';
import { generateEducationEvents } from './educationEvents';

export interface ContinuityGap {
  expectedDate: string;
  actualNextDate: string | null;
  gapDays: number;
  chainItemIndex: number;
}

/**
 * Parse frequency to days between occurrences
 */
function parseFrequencyDays(frequency: string | undefined): number {
  if (!frequency || typeof frequency !== 'string') return 0;
  const f = frequency.toLowerCase();
  if (f.includes('weekly') || f === 'week') return 7;
  if (f.includes('fortnight') || f.includes('every 2 week') || f.includes('biweek')) return 14;
  if (f.includes('monthly') || f.includes('month')) return 30;
  return 0;
}

/**
 * Parse date string to Date object
 */
function toDate(s: string): Date {
  const d = new Date(s + 'T12:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Format date to YYYY-MM-DD
 */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Detect continuity gaps in a chain of education items
 * 
 * @param chainItems Array of chain items sorted by date
 * @param toleranceDays Number of days tolerance for gaps (default: 7)
 * @returns Array of detected gaps
 */
export function detectContinuityGaps(
  chainItems: Array<{ item: ReceiptItem; receipt: Receipt; startDate: string | null; endDate: string | null }>,
  toleranceDays: number = 7
): ContinuityGap[] {
  const gaps: ContinuityGap[] = [];
  
  for (let i = 0; i < chainItems.length - 1; i++) {
    const current = chainItems[i];
    const next = chainItems[i + 1];
    
    if (!current.startDate || !next.startDate) continue;
    
    const eduDetails = typeof current.item.educationDetails === 'string'
      ? JSON.parse(current.item.educationDetails || '{}')
      : (current.item.educationDetails || {});
    
    const frequency = parseFrequencyDays(eduDetails.frequency);
    if (frequency === 0) continue; // Can't detect gaps without frequency
    
    const currentDate = toDate(current.startDate);
    const nextDate = toDate(next.startDate);
    
    // Calculate expected next date based on frequency
    const expectedDate = new Date(currentDate);
    if (frequency >= 28) {
      // Monthly
      expectedDate.setMonth(expectedDate.getMonth() + 1);
    } else {
      expectedDate.setDate(expectedDate.getDate() + frequency);
    }
    
    // Check if there's a significant gap
    const daysDiff = Math.abs((nextDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > toleranceDays) {
      gaps.push({
        expectedDate: toDateString(expectedDate),
        actualNextDate: next.startDate,
        gapDays: Math.round(daysDiff),
        chainItemIndex: i + 1,
      });
    }
  }
  
  return gaps;
}

/**
 * Parse term/semester/year patterns from title/subtitle
 * Returns term number and year if found
 */
export function parseTermPattern(text: string): { term?: number; semester?: number; year?: number } | null {
  const lower = text.toLowerCase();
  
  // Patterns: "Term 1 2025", "Semester 2 2024", "2025 Term 3"
  const termMatch = lower.match(/(?:term|semester)\s*(\d+)[\s,]*(\d{4})/);
  if (termMatch) {
    const num = parseInt(termMatch[1], 10);
    const year = parseInt(termMatch[2], 10);
    if (lower.includes('term')) {
      return { term: num, year };
    } else {
      return { semester: num, year };
    }
  }
  
  // Pattern: "2025 Term 3"
  const reverseMatch = lower.match(/(\d{4})[\s,]*term\s*(\d+)/);
  if (reverseMatch) {
    return {
      term: parseInt(reverseMatch[2], 10),
      year: parseInt(reverseMatch[1], 10),
    };
  }
  
  return null;
}
