import AsyncStorage from '@react-native-async-storage/async-storage';

const WEEKLY_SCAN_LIMIT = 10;
const BONUS_SCANS_PER_AD = 10;
const STORAGE_KEY_SCANS = 'usage_scans';
const STORAGE_KEY_WEEK_START = 'usage_week_start';
const STORAGE_KEY_BONUS_SCANS = 'usage_bonus_scans';

interface ScanRecord {
  timestamp: number; // Unix timestamp in milliseconds
}

interface BonusScanRecord {
  timestamp: number; // When the bonus was earned
  amount: number; // Number of scans added
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
    await AsyncStorage.setItem(STORAGE_KEY_BONUS_SCANS, JSON.stringify([]));
    return;
  }

  const storedWeekStart = new Date(parseInt(storedWeekStartStr, 10));
  
  // If stored week is different from current week, reset
  if (storedWeekStart.getTime() !== currentWeekStart.getTime()) {
    await AsyncStorage.setItem(STORAGE_KEY_WEEK_START, currentWeekStart.getTime().toString());
    await AsyncStorage.setItem(STORAGE_KEY_SCANS, JSON.stringify([]));
    await AsyncStorage.setItem(STORAGE_KEY_BONUS_SCANS, JSON.stringify([]));
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
 * Get bonus scans for the current week
 */
async function getBonusScans(): Promise<BonusScanRecord[]> {
  await ensureCurrentWeek();
  const bonusStr = await AsyncStorage.getItem(STORAGE_KEY_BONUS_SCANS);
  if (!bonusStr) return [];
  
  try {
    const bonuses: BonusScanRecord[] = JSON.parse(bonusStr);
    // Filter out any bonuses from previous weeks (safety check)
    const weekStart = getWeekStart();
    return bonuses.filter(bonus => bonus.timestamp >= weekStart.getTime());
  } catch {
    return [];
  }
}

/**
 * Add bonus scans from watching an ad
 */
export async function addBonusScans(amount: number = BONUS_SCANS_PER_AD): Promise<void> {
  await ensureCurrentWeek();
  const bonuses = await getBonusScans();
  bonuses.push({ timestamp: Date.now(), amount });
  await AsyncStorage.setItem(STORAGE_KEY_BONUS_SCANS, JSON.stringify(bonuses));
}

/**
 * Get usage statistics for the current week
 */
export async function getUsageStats(): Promise<{
  scansUsed: number;
  scansLimit: number;
  bonusScans: number;
  scansRemaining: number;
  weekStart: Date;
  weekEnd: Date;
}> {
  await ensureCurrentWeek();
  const scans = await getWeeklyScans();
  const bonuses = await getBonusScans();
  const bonusScans = bonuses.reduce((sum, b) => sum + b.amount, 0);
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7); // End of week (next Monday)

  const totalAvailable = WEEKLY_SCAN_LIMIT + bonusScans;
  const scansRemaining = Math.max(0, totalAvailable - scans.length);

  return {
    scansUsed: scans.length,
    scansLimit: WEEKLY_SCAN_LIMIT,
    bonusScans,
    scansRemaining,
    weekStart,
    weekEnd,
  };
}

/**
 * Check if user has any scans remaining (including bonus scans)
 */
export async function hasScansRemaining(): Promise<boolean> {
  const stats = await getUsageStats();
  return stats.scansRemaining > 0;
}

/**
 * Check if user has used up their base free scans (10 per week)
 * This is used to determine if we should show "Get More Scans" button
 */
export async function hasUsedBaseScans(): Promise<boolean> {
  const stats = await getUsageStats();
  return stats.scansUsed >= stats.scansLimit;
}

/**
 * Get the number of scans remaining this week
 */
export async function getScansRemaining(): Promise<number> {
  const stats = await getUsageStats();
  return stats.scansRemaining;
}
