import { Alert } from 'react-native';
import * as Calendar from 'expo-calendar';
import * as Clipboard from 'expo-clipboard';
import type { ResultItem } from './results';
import type { Receipt } from './repository';
import type { EducationSeriesSummary } from './educationEvents';

const CANONICAL_PREFIX = 'crescender://cal/';
const EVENT_SERIES_PREFIX = 'event_series_';

export function getCanonicalEventUrl(eventId: string): string {
  return `${CANONICAL_PREFIX}${eventId}`;
}

/** Parse "4:00 PM", "16:00" -> { h, m } or null. */
function parseTime(t: string): { h: number; m: number } | null {
  if (!t || typeof t !== 'string') return null;
  const s = t.trim();
  let m = s.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const min = parseInt(m[2], 10);
    if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12;
    if (m[3].toLowerCase() === 'am' && h === 12) h = 0;
    return { h, m: min };
  }
  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return { h: parseInt(m[1], 10), m: parseInt(m[2], 10) };
  return null;
}

/** Parse "30 min", "1 hr" -> minutes. */
function parseDurationMinutes(d: string | undefined): number {
  if (!d || typeof d !== 'string') return 30;
  const s = d.toLowerCase().trim();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*(min|mins?|minutes?|h|hr|hrs?|hours?)$/);
  if (!m) return 30;
  const n = parseFloat(m[1]);
  return m[2].startsWith('h') ? Math.round(n * 60) : Math.round(n);
}

export interface CalendarEventData {
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
}

export function buildCalendarEventFromResultItem(
  item: ResultItem,
  receipt?: Receipt | null
): CalendarEventData {
  const meta = item.metadata || {};
  const dateStr = item.date || '';
  const base = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  if (isNaN(base.getTime())) {
    base.setTime(Date.now());
  }

  const firstTime = (meta.times && meta.times[0]) ? parseTime(meta.times[0]) : null;
  const durationMins = parseDurationMinutes(meta.duration);
  const startDate = new Date(base.getTime());
  const endDate = new Date(base.getTime());

  if (firstTime) {
    startDate.setHours(firstTime.h, firstTime.m, 0, 0);
    endDate.setTime(startDate.getTime() + durationMins * 60 * 1000);
  } else {
    startDate.setHours(9, 0, 0, 0);
    endDate.setTime(startDate.getTime() + durationMins * 60 * 1000);
  }

  const location = meta.venue || receipt?.merchant || undefined;

  const context: string[] = [];
  if (meta.teacherName) context.push(`Lesson with ${meta.teacherName}.`);
  if (meta.studentName && !context.length) context.push(`Student: ${meta.studentName}.`);
  context.push('From Crescender.');
  const url = getCanonicalEventUrl(item.id);
  const notes = context.join(' ') + '\n' + url;

  return {
    title: item.title || 'Event',
    startDate,
    endDate,
    location: location || undefined,
    notes,
  };
}

/** Format YYYY-MM-DD as d MMM yyyy (en-AU). */
function formatDateForNotes(d: string): string {
  const t = new Date(d + 'T12:00:00');
  return isNaN(t.getTime()) ? d : t.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Build one calendar event for an education lesson series: title with occurrence count,
 * first occurrence's start/end, and notes with "N lessons from [first] to [last]" and canonical link.
 */
export function buildCalendarEventFromEducationSeries(
  series: EducationSeriesSummary,
  receipt: Receipt
): CalendarEventData {
  const meta = series.metadata || {};
  const base = series.firstDate ? new Date(series.firstDate + 'T12:00:00') : new Date();
  if (isNaN(base.getTime())) base.setTime(Date.now());

  const firstTime = (meta.times && Array.isArray(meta.times) && meta.times[0]) ? parseTime(String(meta.times[0])) : null;
  const durationMins = parseDurationMinutes(meta.duration as string | undefined);
  const startDate = new Date(base.getTime());
  const endDate = new Date(base.getTime());

  if (firstTime) {
    startDate.setHours(firstTime.h, firstTime.m, 0, 0);
    endDate.setTime(startDate.getTime() + durationMins * 60 * 1000);
  } else {
    startDate.setHours(9, 0, 0, 0);
    endDate.setTime(startDate.getTime() + durationMins * 60 * 1000);
  }

  const location = (meta.venue as string) || receipt.merchant || undefined;
  const firstFmt = formatDateForNotes(series.firstDate);
  const lastFmt = formatDateForNotes(series.lastDate);
  const n = series.count;
  const range = series.firstDate === series.lastDate ? firstFmt : `${firstFmt} to ${lastFmt}`;
  const context: string[] = [];
  context.push(`Series of ${n} lesson${n === 1 ? '' : 's'} from ${range}.`);
  if (meta.frequency) context.push(`Schedule: ${meta.frequency}.`);
  if (meta.teacherName) context.push(`Lesson with ${meta.teacherName}.`);
  if (meta.studentName && !meta.teacherName) context.push(`Student: ${meta.studentName}.`);
  context.push('From Crescender.');
  const seriesId = EVENT_SERIES_PREFIX + series.itemId;
  const notes = context.join(' ') + '\n' + getCanonicalEventUrl(seriesId);

  return {
    title: `${series.title} – Lesson series (${n})`,
    startDate,
    endDate,
    location: location || undefined,
    notes,
  };
}

export async function addEducationSeriesToDeviceCalendar(
  series: EducationSeriesSummary,
  receipt: Receipt
): Promise<void> {
  const eventData = buildCalendarEventFromEducationSeries(series, receipt);
  const seriesId = EVENT_SERIES_PREFIX + series.itemId;
  const url = getCanonicalEventUrl(seriesId);

  try {
    const available = await Calendar.isAvailableAsync();
    if (!available) {
      showCopyFallback(url);
      return;
    }
    await Calendar.createEventInCalendarAsync(eventData);
  } catch (e) {
    console.warn('[calendarExport] createEventInCalendarAsync (series) failed:', e);
    showCopyFallback(url);
  }
}

export async function addEventToDeviceCalendar(
  item: ResultItem,
  receipt?: Receipt | null
): Promise<void> {
  const eventData = buildCalendarEventFromResultItem(item, receipt);
  const url = getCanonicalEventUrl(item.id);

  try {
    const available = await Calendar.isAvailableAsync();
    if (!available) {
      showCopyFallback(url);
      return;
    }
    await Calendar.createEventInCalendarAsync(eventData);
  } catch (e) {
    console.warn('[calendarExport] createEventInCalendarAsync failed:', e);
    showCopyFallback(url);
  }
}

function showCopyFallback(url: string): void {
  const message =
    'Calendar isn’t available here. Copy the link below to add it to your calendar manually:\n\n' + url;
  Alert.alert(
    'Add to calendar',
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Copy link',
        onPress: () => {
          if (Clipboard?.setStringAsync) {
            Clipboard.setStringAsync(url).catch(() => {});
          } else if (Clipboard?.setString) {
            Clipboard.setString(url);
          }
        },
      },
    ]
  );
}
