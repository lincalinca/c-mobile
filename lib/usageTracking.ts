import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEKLY_SCAN_LIMIT = 10;
const STORAGE_KEY_SCANS = 'usage_scans';
const STORAGE_KEY_WEEK_START = 'usage_week_start';

interface ScanRecord {
  timestamp: number; // Unix timestamp in milliseconds
}

/**
 * Get the start of the current week (Monday at 00:00:00)
 */
function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check if we need to reset the week (if current week start is different from stored)
 */
async function ensureCurrentWeek(): Promise<void> {
  const currentWeekStart = getWeekStart();
  const storedWeekStartStr = await AsyncStorage.getItem(STORAGE_KEY_WEEK_START);
  
  if (!storedWeekStartStr) {
    // First time - set current week
    await AsyncStorage.setItem(STORAGE_KEY_WEEK_START, currentWeekStart.getTime().toString());
    await AsyncStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify([]));
    return;
  }

  const storedWeekStart = new Date(parseInt(storedWeekStartStr, 10));
  
  // If stored week is different from current week, reset
  if (storedWeekStart.getTime() !== currentWeekStart.getTime()) {
    await AsyncStorage.setItem(STORAGE_KEY_WEEK_START, currentWeekStart.getTime().toString());
    await AsyncStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify([]));
  }
}

/**
 * Get all scans for the current week
 */
export async function getWeeklyScans(): Promise<ScanRecord[]> {
  await ensureCurrentWeek();
  const scansStr = await AsyncStorage.getItem(STORAGE_KEY_SCANS);
  if (!scansStr) return [];
  
  try {
    const scans: ScanRecord[] = JSON.parse(scansStr);
    // Filter out any scans from previous weeks (safety check)
    const weekStart = getWeekStart();
    return scans.filter(scan => scan.timestamp >= weekStart.getTime());
  } catch {
    return [];
  }
}

/**
 * Record a new scan
 */
export async function recordScan(): Promise<void> {
  await ensureCurrentWeek();
  const scans = await getWeeklyScans();
  scans.push({ timestamp: Date.now() });
  await AsyncStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify(scans));
}

/**
 * Get usage statistics for the current week
 */
export async function getUsageStats(): Promise<{
  scansUsed: number;
  scansLimit: number;
  scansRemaining: number;
  weekStart: Date;
  weekEnd: Date;
}> {
  await ensureCurrentWeek();
  const scans = await getWeeklyScans();
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // End of week (next Monday)

  return {
    scansUsed: scans.length,
    scansLimit: WEEKLY_SCAN_LIMIT,
    scansRemaining: Math.max(0, WEEKLY_SCAN_LIMIT - scans.length),
    weekStart,
    weekEnd,
  };
}

/**
 * Check if user can perform a scan (has remaining quota)
 */
export async function canScan(): Promise<boolean> {
  const stats = await getUsageStats();
  return stats.scansRemaining > 0;
}

/**
 * Get the number of scans remaining this week
 */
export async function getScansRemaining(): Promise<number> {
  const stats = await getUsageStats();
  return stats.scansRemaining;
}
