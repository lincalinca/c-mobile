import { formatDistanceToNow, isToday, isTomorrow, isYesterday, format, differenceInDays, addDays, isPast } from 'date-fns';

export function getRelativeDateLabel(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  
  if (isToday(targetDate)) return 'Occurs today';
  if (isTomorrow(targetDate)) return 'Occurs tomorrow';
  if (isYesterday(targetDate)) return 'Occurred yesterday';

  const diffDays = differenceInDays(targetDate, new Date());
  
  if (diffDays > 0) {
    // Future dates
    if (diffDays < 7) return `Occurs in ${diffDays} days`;
    if (diffDays < 14) return 'Occurs in 1 week';
    const weeks = Math.floor(diffDays / 7);
    if (weeks < 4) return `Occurs in ${weeks} weeks`;
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `Occurs in ${months} ${months === 1 ? 'month' : 'months'}`;
    const years = Math.floor(diffDays / 365);
    return `Occurs in ${years} ${years === 1 ? 'year' : 'years'}`;
  } else {
    // Past dates
    const absDiff = Math.abs(diffDays);
    if (absDiff < 7) return `Occurred ${absDiff} days ago`;
    if (absDiff < 14) return 'Occurred 1 week ago';
    const weeks = Math.floor(absDiff / 7);
    if (weeks < 4) return `Occurred ${weeks} weeks ago`;
    const months = Math.floor(absDiff / 30);
    if (months < 12) return `Occurred ${months} ${months === 1 ? 'month' : 'months'} ago`;
    const years = Math.floor(absDiff / 365);
    return `Occurred ${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

export function getFrequencyLabel(frequency: string, nextOccurrence: string | Date): string {
  const targetDate = typeof nextOccurrence === 'string' ? new Date(nextOccurrence) : nextOccurrence;
  const label = getRelativeDateLabel(targetDate);
  // Simplify the label from "Occurs in 3 days" to just "in 3 days" for the combined string
  const relativeText = label.toLowerCase().replace('occurs ', '');
  return `${frequency}. Next ${relativeText}`;
}

export function formatFullDate(date: string | Date): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  return format(targetDate, 'd MMM yyyy');
}
