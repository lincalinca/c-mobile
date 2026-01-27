/**
 * Single source of truth for card layout and typography.
 * BaseCard and shared card primitives import from here; no magic numbers in components.
 */

export const CARD = {
  // Layout
  cardMargin: 4,
  cardPadding: 16,
  cardBorderRadius: 22,
  cardMinHeight: 200,
  cornerIconSize: 40,
  headerPaddingRight: 28,
  headerMarginBottom: 6,
  contentGap: 6,
  footerMarginTop: 'auto' as const,
  footerPaddingTop: 0,
  chipSize: 28,
  chipGap: 8,
  // Typography (refined: focus on smallest text, moderate increases for larger)
  titleFontSize: 26,        // was 22 → now 26 (+18%) MODERATE - maintain hierarchy
  titleLineHeight: 30,      // was 22 → now 30 (Better spacing for 26px font)
  subtitleFontSize: 18,     // was 20 → slightly reduced to fit better
  subtitleLineHeight: 22,   // Added line height for subtitle
  subtitleMarginTop: 4,
  mainValueFontSize: 40,    // was 36 → now 40 (+11%) MINIMAL - already large
  relativeDateFontSize: 21, // was 14 → now 21 (+50%) CRITICAL - small text
  relativeDateMarginTop: 6,
  infoTextFontSize: 18,     // was 12 → now 18 (+50%) CRITICAL - smallest text
  infoIconSize: 18,         // was 12 → now 18 (+50%) Match text size
  infoRowGap: 6,
  fullDateFontSize: 21,     // was 14 → now 21 (+50%) CRITICAL - small text
  chipIconSize: 18,         // was 12 → now 18 (+50%) Match text size
  cornerIconIconSize: 26,   // was 20 → now 26 (+30%) Proportional increase
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
