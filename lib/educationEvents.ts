import type { Receipt, ReceiptItem } from './repository';
import type { ResultItem, ResultType } from './results';

const MAX_SERIES = 52;
const DEFAULT_ALL_DAY_HOUR = 9;

type EduDetails = {
  teacherName?: string;
  studentName?: string;
  subtitle?: string;
  frequency?: string;
  duration?: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: string[];
  times?: string[];
};

function parseEduDetails(item: ReceiptItem): EduDetails {
  try {
    return (item.educationDetails ? JSON.parse(item.educationDetails) : {}) as EduDetails;
  } catch {
    return {};
  }
}

/** 0=Sun..6=Sat. daysOfWeek strings like "Monday" -> 1. */
function weekdayFromDayName(name: string): number {
  const n = name.toLowerCase();
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  };
  return map[n] ?? -1;
}

/** Parse "Weekly", "Fortnightly", "Monthly", "every 2 weeks", etc. Returns days between occurrences or 0 for one-off. */
function parseFrequencyDays(freq: string | undefined): number {
  if (!freq || typeof freq !== 'string') return 0;
  const s = freq.toLowerCase();
  if (s.includes('weekly') || s === 'week') return 7;
  if (s.includes('fortnight') || s.includes('every 2 week') || s.includes('biweek')) return 14;
  if (s.includes('monthly') || s.includes('month')) return 30; // approximate for iteration
  return 0;
}

/** Parse "30 min", "1 hr", "1.5 hours" -> minutes. */
function parseDurationMinutes(d: string | undefined): number {
  if (!d || typeof d !== 'string') return 30;
  const s = d.toLowerCase().trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(min|mins?|minutes?|h|hr|hrs?|hours?)$/);
  if (!m) return 30;
  const num = parseFloat(m[1]);
  const unit = m[2];
  if (unit.startsWith('h')) return Math.round(num * 60);
  return Math.round(num);
}

/** Parse "4:00 PM", "16:00" -> { h, m } or null. */
function parseTime(t: string): { h: number; m: number } | null {
  if (!t || typeof t !== 'string') return null;
  const s = t.trim();
  // 4:00 PM / 4:00pm
  let match = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (match[3].toLowerCase() === 'pm' && h !== 12) h += 12;
    if (match[3].toLowerCase() === 'am' && h === 12) h = 0;
    return { h, m };
  }
  // 16:00
  match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return { h: parseInt(match[1], 10), m: parseInt(match[2], 10) };
  }
  return null;
}

/** YYYY-MM-DD to Date at start of day (local). */
function toDate(s: string): Date {
  const d = new Date(s + 'T12:00:00');
  return isNaN(d.getTime()) ? new Date() : d;
}

/** Format YYYY-MM-DD. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Summary of an education lesson series for UI and calendar (one event for the series). */
export interface EducationSeriesSummary {
  count: number;
  firstDate: string;
  lastDate: string;
  title: string;
  itemId: string;
  receiptId: string;
  metadata: Record<string, unknown>;
}

/**
 * Get a single series summary from an education item (count, first–last date).
 * Use for the education detail "Lesson series" block and for one calendar event.
 */
export function getEducationSeriesSummary(
  item: ReceiptItem,
  receipt: Receipt
): EducationSeriesSummary | null {
  const events = generateEducationEvents(item, receipt);
  if (events.length === 0) return null;
  const first = events[0];
  const last = events[events.length - 1];
  return {
    count: events.length,
    firstDate: first.date ?? '',
    lastDate: last.date ?? '',
    title: item.description,
    itemId: item.id,
    receiptId: receipt.id,
    metadata: (first.metadata as Record<string, unknown>) || {},
  };
}

/**
 * Generate event ResultItems from an education line item: single lesson or a series
 * based on frequency, startDate, endDate, daysOfWeek, and times.
 * Used by reshapeToResults and by the education detail "Lesson events" UI.
 */
export function generateEducationEvents(
  item: ReceiptItem,
  receipt: Receipt
): ResultItem[] {
  const events: ResultItem[] = [];
  const edu = parseEduDetails(item);
  const transactionId = `trans_${receipt.id}`;
  const baseTitle = item.description;
  const venue = receipt.merchant || undefined;
  const duration = edu.duration;
  const durationMins = parseDurationMinutes(duration);
  const firstTime = (edu.times && edu.times[0]) ? parseTime(edu.times[0]) : null;
  const freqDays = parseFrequencyDays(edu.frequency);
  const daysOfWeek = (edu.daysOfWeek || [])
    .map((d) => weekdayFromDayName(d))
    .filter((w) => w >= 0);

  const start = edu.startDate ? toDate(edu.startDate) : new Date(receipt.transactionDate + 'T12:00:00');
  let end: Date;
  if (edu.endDate) {
    end = toDate(edu.endDate);
  } else if (freqDays > 0) {
    const cap = new Date(start);
    cap.setMonth(cap.getMonth() + 12);
    end = cap;
  } else {
    end = new Date(start.getTime());
  }

  const linkToEducation = { id: item.id, type: 'education' as ResultType };
  const linkToTrans = { id: transactionId, type: 'transaction' as ResultType };

  // --- Single lesson ---
  if (freqDays === 0 || !edu.startDate) {
    const dateStr = toDateString(start);
    events.push({
      id: `event_${item.id}`,
      type: 'event',
      title: `${baseTitle} – Lesson`,
      subtitle: edu.studentName || 'Lesson',
      date: dateStr,
      metadata: {
        venue,
        duration: duration || undefined,
        frequency: edu.frequency || 'One-off',
        teacherName: edu.teacherName,
        times: edu.times,
      },
      receiptId: receipt.id,
      links: [linkToEducation, linkToTrans],
    });
    return events;
  }

  // --- Series: iterate from start to end ---
  const isMonthly = freqDays >= 28;
  let cur = new Date(start.getTime());
  let count = 0;

  while (cur <= end && count < MAX_SERIES) {
    const weekday = cur.getDay();
    const include =
      daysOfWeek.length === 0 ? true : daysOfWeek.includes(weekday);

    if (include) {
      const dateStr = toDateString(cur);
      const seriesNum = count + 1;
      events.push({
        id: `event_${item.id}_${dateStr}`,
        type: 'event',
        title: `${baseTitle} – Lesson ${seriesNum}`,
        subtitle: edu.studentName || 'Lesson',
        date: dateStr,
        metadata: {
          venue,
          duration: duration || undefined,
          frequency: edu.frequency || undefined,
          startDate: edu.startDate,
          endDate: edu.endDate,
          teacherName: edu.teacherName,
          times: edu.times,
        },
        receiptId: receipt.id,
        links: [linkToEducation, linkToTrans],
      });
      count++;
    }

    if (isMonthly) {
      cur.setMonth(cur.getMonth() + 1);
    } else {
      cur.setDate(cur.getDate() + freqDays);
    }
  }

  return events;
}

