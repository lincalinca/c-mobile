# User Feedback Plan — Initial Build

Plan to address user feedback from the initial build. Assumed scope: **crescender-mobile** (home/index, scan, review, gear detail, history, filters, date, layout).

---

## 1. Get camera working

**Location:** `app/scan.tsx`, `components/header/CameraBar.tsx` (entry to scan), native `app.json` (NSCameraUsageDescription).

**Current:** `expo-camera` `CameraView`, `DocumentPicker` for gallery, permission modal, `takePictureAsync` with base64.

**Planned actions:**
- [ ] Confirm which failure mode: not opening, black screen, no capture, web-only, or a specific device/OS.
- [ ] Check `expo-camera` and `expo` compatibility; consider `expo-image-picker` as fallback for capture if needed.
- [ ] Ensure `CameraView`/`takePictureAsync` and `readAsStringAsync` for picked docs work on iOS/Android.
- [ ] Verify permission flow on first launch and after denial (re-request, settings deep link).

**Clarifying questions:**
- What exactly fails: camera UI, capture, or analysis after capture?
- Is this on device, simulator, or web?

---

## 2. Increase text size a lot

**Possible locations:** `app/index.tsx`, `app/review.tsx`, `app/gear/[id].tsx`, `app/history.tsx`, `components/header/PersistentHeader.tsx`, `FilterBar`, `CameraBar`, `CardGrid` and card components, `MusicFlowBackground` (N/A).

**Planned actions:**
- [ ] Audit `text-sm`, `text-xs`, `text-base`, `text-lg`, `text-xl` (and `text-[10px]`, `text-2xl`) across the app.
- [ ] Define a scale: e.g. +1 or +2 Tailwind steps (e.g. `text-xs` → `text-sm`, `text-sm` → `text-base`), or a global `fontSize` multiplier in `tailwind.config.js` / `global.css`.
- [ ] Apply increases screen-by-screen, with a focus on: home, scan, review, gear detail, history, and headers/filters.

**Clarifying questions:**
- Which screens are highest priority (e.g. home + review + detail)?
- “A lot” — roughly: +1 step, +2 steps, or match a specific size (e.g. 16pt minimum)?

---

## 3. Increase logo size to fill width

**Location:** `components/header/PersistentHeader.tsx`.

**Current:** Fixed sizes: web `234x38`, native `200x23`.

**Planned actions:**
- [ ] Use `width: '100%'` (or `flex-1` with a max-width) for the logo container, with `resizeMode="contain"` and `aspectRatio` to keep proportions.
- [ ] Reserve horizontal space for the menu button (e.g. `flex-1` for the centre logo area, fixed width for the right button) so the logo can grow within the header.
- [ ] Test on small phones and tablets to avoid overflow or clipping.

**Clarifying questions:**
- Should the logo truly fill the full header width (edge to edge) or only the centre area between the menu and a future left element?

---

## 4. Make more fields editable

**Locations:** `app/review.tsx` (pre-save), `app/gear/[id].tsx` (edit mode).

**Current:**  
- **Review:** Many fields editable (merchant, ABN, invoice #, date, financials, payment status/method, merchant details, summary, line items, categories).  
- **Gear [id]:** Edit mode: document type, merchant, ABN, invoice #, date, subtotal, tax, total, payment status, payment method. View mode: read-only. Line items and merchant contact/address blocks are not editable in the current edit form.

**Planned actions:**
- [ ] **Gear [id]:** Add to edit mode: `summary`, `merchantPhone`, `merchantEmail`, `merchantWebsite`, `merchantAddress`, `merchantSuburb`, `merchantState`, `merchantPostcode`.
- [ ] **Gear [id]:** Decide whether to support inline or modal edit of line items (description, category, price, etc.) and implement if in scope.
- [ ] **Review:** Confirm if any additional fields are needed beyond what’s already there.

**Clarifying questions:**
- Which specific fields are missing in gear detail: merchant contact/address, summary, or line-item fields (and which of those)?
- Is the main gap in review, gear detail, or both?

---

## 5. Make background animation slightly more evident

**Location:** `components/common/MusicFlowBackground.tsx`.

**Current:** `opacity={0.6}` on the `G` group, stave `opacity={0.3}` and `1`, `strokeWidth` 6 and 1.5, `amplitude` 6–8.

**Planned actions:**
- [ ] Increase visibility by one or more of: raise `G` opacity (e.g. 0.6 → 0.75–0.85), raise stave opacity (e.g. 0.3 → 0.4–0.5), slightly increase `strokeWidth` and/or `amplitude`.
- [ ] Re-check contrast and readability of cards/headers on top; revert if it’s too busy.

**Clarifying questions:**
- Any preference: stronger lines, more motion, or both?

---

## 6. Single column for phone, double for landscape / tablets

**Location:** `components/results/CardGrid.tsx`.

**Current:** `numColumns={2}` always.

**Planned actions:**
- [ ] Use `useWindowDimensions()` (or a `useBreakpoint`/`useNumColumns` hook) to choose `numColumns`: e.g. `width < 600` → 1, else 2 (or use 768 for tablets).
- [ ] Adjust card min/max width or `flex` if needed so a single column doesn’t look too wide on tablets in portrait.
- [ ] Optionally: 3 columns on very wide tablets; document the breakpoints.

**Clarifying questions:**
- Preferred breakpoint: 600px, 768px, or another?
- Should “landscape” mean “phone in landscape” (still 1 column) or “any width above X” (2 columns)?

---

## 7. Align buttons with filters

**Locations:** `app/index.tsx`, `components/header/CameraBar.tsx`, `components/filters/FilterBar.tsx`.

**Current:**  
- **CameraBar:** `px-6 py-2`, `flex-row`, SNAP RECEIPT (flex-1) + date + clear.  
- **FilterBar:** `paddingHorizontal: 16`, horizontal `ScrollView`, `gap-2`.

**Planned actions:**
- [ ] Unify horizontal padding: e.g. both use `px-6` (or both 16) so the left/right edges of the filter chips and the camera/date row align.
- [ ] If “buttons” includes the date and clear controls, align their vertical rhythm and spacing with the filter row (e.g. same `py` or `mb`).

**Clarifying questions:**
- “Buttons” = only SNAP RECEIPT, or SNAP + date + clear? Any other buttons (e.g. on cards)?
- “Align” = same horizontal padding, same vertical spacing, or both?

---

## 8. Make icon filter buttons the default

**Location:** `app/index.tsx`, `AsyncStorage` key `useIconFilters`.

**Current:** `useIconFilters` defaults to `false`; it is loaded from `AsyncStorage` and passed to `FilterBar` as `useIcons`.

**Planned actions:**
- [ ] Default `useIconFilters` to `true` when there is no saved value: e.g. `JSON.parse(saved) ?? true` (or `saved !== null ? JSON.parse(saved) : true`).
- [ ] Ensure Settings (or wherever the filter-style toggle lives) can still switch to label-only and that the new default is persisted correctly.

**Clarifying questions:**
- Should existing users who have `false` saved keep that, or should we migrate them to `true`?

---

## 9. Centre the icons in the filter buttons

**Location:** `components/filters/FilterBar.tsx`.

**Current:** When `useIcons` is true: `flex-row items-center gap-2`, icon + `{useIcons ? '' : filter.label}`. With empty text, the icon can appear left-aligned in the chip.

**Planned actions:**
- [ ] When `useIcons` and icon is shown: use `justify-center` on the `TouchableOpacity` and avoid an empty `Text` that affects layout (or use a zero-width spacer only if needed).
- [ ] Give the chip a minimum width so the icon is visually centred; ensure centring holds when the chip is selected vs unselected.

**Clarifying questions:**
- Are the chips a fixed width, or should they remain flexible (and we only centre the content)?

---

## 10. Override calendar UI in date selector

**Location:** `app/index.tsx` — `DateTimePicker` from `@react-native-community/datetimepicker`.

**Current:** `display="default"` (native calendar); `mode="date"`; `accentColor="#f5c518"`. Trigger: `CameraBar` date button → `onShowDatePicker` → `setShowDatePicker(true)`.

**Planned actions:**
- [x] Replace or wrap the native `DateTimePicker` with a custom in-app calendar (e.g. custom modal with a calendar grid, or a library like `react-native-calendars` that allows full UI control).
- [x] Apply Crescender colours (e.g. gold, `#2a0b4c`, `crescender-*`) and typography to match the app.
- [x] Preserve `onDateChange` behaviour and `selectedDate` / `showDatePicker` state.

**Clarifying questions:**
- What’s wrong with the current calendar: look-and-feel, size, accessibility, or platform inconsistency?
- Any must-have: week starts on Monday, en-AU locale, year/month navigation, or minimal/compact layout?

---

## 11. Add date range options (not just single-date filter)

**Location:** `app/index.tsx` — `selectedDate`, `showDatePicker`, `onDateChange`, `filteredResults` (date filter), `CameraBar` (date button and clear).

**Current:** Single date: `selectedDate`; filter `item.date.startsWith(dateStr)`.

**Planned actions:**
- [x] Add state: `dateRange: { start: Date | null; end: Date | null }` or `startDate` / `endDate`.
- [x] Update the date UI (same or new calendar): allow selecting a range (e.g. tap start, tap end) or “From” / “To” with two pickers.
- [x] Change filter to: `item.date >= start && item.date <= end` (or equivalent with `dateStr`).
- [x] Update `CameraBar` (or a new `DateRangeBar`): show “DD Mmm – DD Mmm” or “DD Mmm – …” when range is set; clear range action.
- [x] Ensure the calendar (or custom) supports range selection if we use one.

**Clarifying questions:**
- Prefer: one calendar with range selection, or two separate “From” / “To” fields?
- Should a single-date filter remain as a shortcut (e.g. “Same day” = start = end)?

---

## Suggested order of work

| Priority | Item | Notes |
|----------|------|-------|
| 1 | **#8** Icon filters default | Small, clear change |
| 2 | **#9** Centre icons in filter buttons | Small, depends on FilterBar |
| 3 | **#6** Single/double column | Layout, no new deps |
| 4 | **#7** Align buttons with filters | Layout/padding |
| 5 | **#3** Logo fill width | One component |
| 6 | **#5** Background animation | One component, tunable |
| 7 | **#2** Text size | Broader, needs scope |
| 8 | **#4** More fields editable | Gear detail + maybe review |
| 9 | **#10** Override calendar UI | New UI or lib |
| 10 | **#11** Date range | Builds on date/calendar |
| 11 | **#1** Camera | Depends on failure mode and env |

---

## Summary of clarifying questions

1. **Camera (#1):** What exactly fails (UI, capture, analysis) and on which platform (device/simulator/web)?
2. **Text size (#2):** Which screens first, and how large (“+1 step”, “+2 steps”, or a minimum pt)?
3. **Logo (#3):** Full header width or only the centre strip between future nav elements?
4. **Editable fields (#4):** Which concrete fields in gear detail (and review, if any) are missing?
5. **Background (#5):** Prefer stronger lines, more motion, or both?
6. **Columns (#6):** Breakpoint (e.g. 600 vs 768) and whether phone landscape stays 1 column?
7. **Align buttons (#7):** Which buttons (SNAP only vs SNAP+date+clear) and align = padding, vertical rhythm, or both?
8. **Icon default (#8):** Keep existing users’ `false` or migrate to `true`?
9. **Filter icons (#9):** Fixed vs flexible width for the filter chips?
10. **Calendar (#10):** Main issues (look, size, a11y, platform) and must-haves (Monday start, en-AU, compact)?
11. **Date range (#11):** One range calendar vs two From/To fields, and keep a same-day shortcut?

---

*Last updated: plan created from user feedback. Adjust as answers and priorities are clarified.*
