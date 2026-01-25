# Typography Refinement Plan

**Date:** 25/Jan/2026  
**Objective:** Fix typography issues - focus on smallest text readability while maintaining visual hierarchy and cohesion.

## Issues Identified

1. **Card titles oversized** - Increased from 22px to 33px (+50%) was too aggressive
2. **Settings text-[10px] unchanged** - Using arbitrary values instead of Tailwind classes
3. **Icons not increased** - All icons remain at original sizes
4. **Button text increased unnecessarily** - Primary action buttons didn't need size increase
5. **Lack of visual cohesion** - Some text too large, others too small

## Refined Typography Strategy

### Principle: Focus on Smallest Text Only
- **Primary goal**: Make smallest text (text-xs, text-sm) readable (+50%)
- **Secondary goal**: Slightly increase small-medium text (text-base) for consistency (+25%)
- **Tertiary goal**: Keep larger text (text-lg+) mostly unchanged or minimal increase
- **Button text**: Keep at current sizes (no increase needed)

### Refined Font Size Scale

| Class | Old Size | New Size | Increase | Rationale |
|-------|----------|----------|----------|-----------|
| `text-xs` | 12px | **18px** | +50% | **CRITICAL** - Smallest text, needs biggest boost |
| `text-sm` | 14px | **21px** | +50% | **CRITICAL** - Very small text, needs big boost |
| `text-base` | 16px | **20px** | +25% | **MODERATE** - Base text, slight increase for consistency |
| `text-lg` | 18px | **20px** | +11% | **MINIMAL** - Already readable, minimal increase |
| `text-xl` | 20px | **22px** | +10% | **MINIMAL** - Already readable, minimal increase |
| `text-2xl` | 24px | **26px** | +8% | **MINIMAL** - Headings, keep close to original |
| `text-3xl` | 30px | **32px** | +7% | **MINIMAL** - Large headings, minimal increase |
| `text-4xl` | 36px | **38px** | +6% | **MINIMAL** - Very large headings, minimal increase |

### Card Typography (Special Case)

Card titles were 22px, increased to 33px - **TOO MUCH**

| Element | Old Size | New Size | Increase | Rationale |
|---------|----------|----------|----------|-----------|
| Card Title | 22px | **26px** | +18% | Moderate increase, maintain hierarchy |
| Card Subtitle | 16px | **20px** | +25% | Align with text-base |
| Card Main Value | 36px | **40px** | +11% | Minimal increase, already large |
| Card Relative Date | 14px | **21px** | +50% | Small text, needs boost |
| Card Info Text | 12px | **18px** | +50% | Smallest text, needs boost |

### Icon Size System

Icons should scale proportionally with text. Create centralized icon size constants:

| Context | Old Size | New Size | Increase |
|---------|----------|----------|----------|
| Small icons (chip, badge) | 12px | **18px** | +50% |
| Standard icons (buttons, nav) | 18px | **24px** | +33% |
| Medium icons (cards, headers) | 20px | **26px** | +30% |
| Large icons (featured) | 24px | **32px** | +33% |
| Extra large icons | 40px | **52px** | +30% |

### Button Text

**Keep button text sizes unchanged** - buttons are already readable:
- Primary buttons: Keep at current size (typically text-base or text-lg)
- Secondary buttons: Keep at current size
- Small buttons: May need slight increase if using text-xs

## Implementation Plan

### Phase 1: Fix Tailwind Config
- Update fontSize scale with refined values
- Focus increases on smallest sizes only

### Phase 2: Fix Card Styles
- Reduce card title from 33px to 26px
- Adjust other card text sizes appropriately

### Phase 3: Fix Settings
- Replace `text-[10px]` with proper Tailwind classes
- Use `text-xs` (which will be 18px)

### Phase 4: Create Icon Size System
- Create `lib/iconSizes.ts` with centralized icon size constants
- Update all icon size references to use constants

### Phase 5: Review Button Text
- Identify button text sizes
- Ensure they're not unnecessarily increased

## Files Requiring Updates

### Critical (Smallest Text)
- Settings: `text-[10px]` → `text-xs`
- All `text-xs` usage (will auto-update via Tailwind)
- All `text-sm` usage (will auto-update via Tailwind)

### Card Components
- `components/results/cardStyles.ts` - Reduce title size, adjust others

### Icons
- All Feather icon `size={}` props
- Create centralized icon size constants

### Buttons
- Review primary action buttons
- Keep sizes reasonable
