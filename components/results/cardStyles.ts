/**
 * Single source of truth for card layout and typography.
 * BaseCard and shared card primitives import from here; no magic numbers in components.
 */

export const CARD = {
  // Layout
  cardMargin: 4,
  cardPadding: 16,
  cardBorderRadius: 20,
  cardMinHeight: 200,
  cornerIconSize: 40,
  headerPaddingRight: 28,
  headerMarginBottom: 6,
  contentGap: 6,
  footerMarginTop: 'auto' as const,
  footerPaddingTop: 0,
  chipSize: 28,
  chipGap: 8,
  // Typography
  titleFontSize: 22,
  titleLineHeight: 18,
  subtitleFontSize: 16,
  subtitleMarginTop: 4,
  mainValueFontSize: 36,
  relativeDateFontSize: 14,
  relativeDateMarginTop: 6,
  infoTextFontSize: 12,
  infoIconSize: 12,
  infoRowGap: 6,
  fullDateFontSize: 14,
  chipIconSize: 12,
  cornerIconIconSize: 20,
  // Colors (some cards override with accent)
  titleColor: '#ffffff',
  subtitleColor: '#9ca3af',
  fullDateColor: '#4b5563',
  relativeDateColor: '#d1d5db',
} as const;

/** Chip icon and color per link type. Used by BaseCard for the footer chips. */
export const CHIP_ICONS: Record<string, { name: string; color: string }> = {
  gear: { name: 'package', color: '#f5c518' },
  event: { name: 'calendar', color: '#22d3ee' },
  education: { name: 'book-open', color: '#c084fc' },
  service: { name: 'tool', color: '#f97316' },
  transaction: { name: 'dollar-sign', color: '#a3e635' },
};

export function getChipIcon(type: string): { name: string; color: string } {
  return CHIP_ICONS[type] ?? CHIP_ICONS.transaction;
}
