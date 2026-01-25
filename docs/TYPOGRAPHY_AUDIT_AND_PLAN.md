# Typography Audit and Standardisation Plan

**Date:** 25/Jan/2026  
**Objective:** Increase smallest text sizes by at least 50% and establish centralized typography standards for consistent, accessible text sizing throughout the app.

## Current State Analysis

### Tailwind Default Font Sizes (Current)
| Class | Size (rem) | Pixels | Usage Count |
|-------|-----------|--------|-------------|
| `text-xs` | 0.75rem | **12px** | 24 files |
| `text-sm` | 0.875rem | **14px** | 33 files |
| `text-base` | 1rem | **16px** | Common |
| `text-lg` | 1.125rem | **18px** | Common |
| `text-xl` | 1.25rem | **20px** | Common |
| `text-2xl` | 1.5rem | **24px** | Common |
| `text-3xl` | 1.875rem | **30px** | Common |
| `text-4xl` | 2.25rem | **36px** | Common |

### Problem Areas
- **text-xs (12px)**: Too small for mobile readability - used in 24 files
- **text-sm (14px)**: Borderline too small - used in 33 files
- **No centralized typography system**: Changes require individual file updates
- **Inconsistent sizing**: Mix of Tailwind classes and inline styles

## Proposed Typography Scale

### New Font Size Standards (50%+ increase for smallest sizes)

| Class | Old Size | New Size (rem) | New Size (px) | Increase |
|-------|----------|----------------|---------------|----------|
| `text-xs` | 12px | 1.125rem | **18px** | +50% |
| `text-sm` | 14px | 1.3125rem | **21px** | +50% |
| `text-base` | 16px | 1.5rem | **24px** | +50% |
| `text-lg` | 18px | 1.75rem | **28px** | +55% |
| `text-xl` | 20px | 2rem | **32px** | +60% |
| `text-2xl` | 24px | 2.5rem | **40px** | +67% |
| `text-3xl` | 30px | 3.25rem | **52px** | +73% |
| `text-4xl` | 36px | 4rem | **64px** | +78% |

### Rationale
- **Minimum readable size**: 18px (text-xs) ensures accessibility
- **Proportional scaling**: Larger sizes increased proportionally to maintain hierarchy
- **Mobile-first**: Optimized for mobile device readability
- **WCAG compliance**: Meets accessibility guidelines for text size

## Implementation Strategy

### Phase 1: Centralized Typography System
1. **Extend Tailwind Config** (`tailwind.config.js`)
   - Override default font sizes in `theme.extend.fontSize`
   - Maintain Tailwind class names for easy migration
   - Add custom line-height values for better readability

2. **Create Typography Constants** (Optional)
   - Create `lib/typography.ts` for programmatic access
   - Export size constants for use in StyleSheet objects
   - Document usage patterns

### Phase 2: File-by-File Updates
1. **Priority Files** (most text-xs/text-sm usage):
   - `app/usage.tsx` - Usage screen
   - `app/gear/[id].tsx` - Receipt detail view
   - `app/review/simplified/SimplifiedReview.tsx` - Review screen
   - `components/results/BaseCard.tsx` - Card components
   - `app/settings.tsx` - Settings screen
   - `app/history.tsx` - History screen
   - `components/filters/FilterBar.tsx` - Filter components
   - All workflow pages in `app/review/workflow/`

2. **Update Pattern**:
   - Replace `text-xs` → `text-xs` (will use new 18px via config)
   - Replace `text-sm` → `text-sm` (will use new 21px via config)
   - Verify larger text remains proportionally larger
   - Check for any hardcoded fontSize values in StyleSheet objects

### Phase 3: Verification
1. **Visual Testing**: Review all screens for readability
2. **Hierarchy Check**: Ensure text size relationships are maintained
3. **Edge Cases**: Check for any overflow or layout issues

## Files Requiring Updates

### High Priority (text-xs usage - 24 files)
- `app/usage.tsx`
- `app/scan.tsx`
- `app/gear/[id].tsx`
- `app/review/simplified/SimplifiedReview.tsx`
- `app/gear/item/[id].tsx`
- `components/education/LessonDateSelector.tsx`
- `app/education/[id].tsx`
- `app/settings.tsx`
- `app/history.tsx`
- `components/filters/FilterBar.tsx`
- `app/get-more-scans.tsx`
- `app/events/[id].tsx`
- `app/services/[id].tsx`
- `components/calendar/*.tsx` (multiple files)
- `components/results/*.tsx` (multiple files)

### Medium Priority (text-sm usage - 33 files)
- All files listed above plus:
- `app/review/workflow/*.tsx` (all workflow pages)
- `components/header/*.tsx`
- `app/index.tsx`

### Low Priority (text-base and larger)
- These will automatically scale with the new system
- Verify proportions are maintained

## Custom Line Heights

To improve readability with larger text, we'll also adjust line heights:

| Class | Font Size | Line Height | Ratio |
|-------|-----------|-------------|-------|
| `text-xs` | 18px | 24px | 1.33 |
| `text-sm` | 21px | 28px | 1.33 |
| `text-base` | 24px | 32px | 1.33 |
| `text-lg` | 28px | 38px | 1.36 |
| `text-xl` | 32px | 44px | 1.38 |
| `text-2xl` | 40px | 56px | 1.4 |
| `text-3xl` | 52px | 72px | 1.38 |
| `text-4xl` | 64px | 88px | 1.38 |

## Edge Cases to Consider

1. **StyleSheet fontSize**: Any hardcoded fontSize values need manual updates
2. **Card components**: May need layout adjustments for larger text
3. **Modal dialogs**: Ensure text fits within containers
4. **Form inputs**: Label and helper text sizes
5. **Button text**: Ensure buttons accommodate larger text
6. **Navigation**: Header and tab text sizes

## Migration Checklist

- [ ] Update `tailwind.config.js` with new font sizes
- [ ] Test new sizes in development
- [ ] Update all `text-xs` instances (24 files)
- [ ] Update all `text-sm` instances (33 files)
- [ ] Check for hardcoded fontSize in StyleSheet objects
- [ ] Verify text hierarchy is maintained
- [ ] Test on actual devices for readability
- [ ] Check for layout overflow issues
- [ ] Update any custom fontSize values in components

## Notes

- All changes will be backward compatible (same class names)
- No breaking changes to component APIs
- Can be rolled back easily if issues arise
- Future typography changes can be made centrally in Tailwind config
