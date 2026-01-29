/**
 * Centralized icon size constants
 * Icons should scale proportionally with text for visual cohesion
 * 
 * Usage:
 *   import { ICON_SIZES } from '@lib/iconSizes';
 *   <Feather name="camera" size={ICON_SIZES.standard} />
 */

export const ICON_SIZES = {
  // Small icons (chips, badges, inline indicators)
  small: 18,      // was 12 → now 18 (+50%) - matches text-xs
  
  // Standard icons (buttons, navigation, list items)
  standard: 24,   // was 18 → now 24 (+33%) - matches text-base/lg
  
  // Medium icons (card headers, section headers)
  medium: 26,     // was 20 → now 26 (+30%) - matches card title
  
  // Large icons (featured, prominent actions)
  large: 32,      // was 24 → now 32 (+33%) - matches text-xl
  
  // Extra large icons (hero, splash screens)
  xlarge: 52,      // was 40 → now 52 (+30%) - matches text-3xl
  
  // Specific contexts (can be overridden for special cases)
  chip: 18,       // Chip icons - match small
  button: 24,     // Button icons - match standard
  card: 26,       // Card icons - match medium
  header: 24,     // Header icons - match standard
} as const;
