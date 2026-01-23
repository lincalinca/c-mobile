# Card Styles & Gear Detail Refactor Plan

Plan to: (1) **unify** all cards by having Education and Service **built on BaseCard** (extend BaseCard to accommodate their unique factors); (2) centralise card styling in one place (`cardStyles`); (3) refactor `app/gear/[id].tsx` and align with education/events/services. **Stance: prefer unification over fracturing** — one layout engine and one style source so future changes apply everywhere. Resilience and working behaviour remain the priority.

---

## Part A: Cards — Inheritance and Centralised Styles

### Current state

| Card | Uses BaseCard? | Typography / layout source |
|------|----------------|----------------------------|
| **GearCard** | Yes (thin wrapper) | BaseCard only |
| **EventCard** | Yes | BaseCard only |
| **TransactionCard** | Yes | BaseCard only |
| **EducationCard** | **No** | Own `StyleSheet` — fully custom |
| **ServiceCard** | **No** | Own `StyleSheet` — fully custom |

**BaseCard** defines: `title` 22, `subtitle` 16, `mainValue` 36, `relativeDate` 14, `fullDate` 14, `cardContainer` margin 4, `animatedCard` padding 16 / height 200 / borderRadius 20, `cornerIcon` 40×40, `chip` 28×28.

**EducationCard** and **ServiceCard** duplicate the same structure but with different values: `title` 15, `subtitle` 11, `priceText` 24, `infoText` 10, `fullDate` 10, margin 8, padding 24, `minHeight` 200, `borderRadius` 32, `cornerIcon` 48×48, etc. They also add `educationInfo`/`serviceInfo`, `infoRow`, `infoText`, `priceText`. That’s why font-size and spacing changes in BaseCard don’t affect them.

### A.1 — Create `components/results/cardStyles.ts` (single source of truth)

Define a **theme object** (not a StyleSheet) with all tokens used by any card:

```ts
// cardStyles.ts
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
  infoTextFontSize: 12,
  fullDateFontSize: 14,
  chipIconSize: 12,
  cornerIconIconSize: 20,
  // Colors (optional; some cards override with accent)
  titleColor: '#ffffff',
  subtitleColor: '#9ca3af',
  fullDateColor: '#4b5563',
  // ...
};
```

BaseCard (and any shared card primitives) should **import from `cardStyles`** and build `StyleSheet` from these tokens. No `fontSize`, `padding`, `margin`, or `borderRadius` hard-coded in card components.

### A.2 — BaseCard: consume `cardStyles` and extend for Education/Service

- Replace every magic number in `StyleSheet.create` with `CARD.xxx`.
- **Extend BaseCard** so EducationCard and ServiceCard are implemented **on top of BaseCard**, not as separate implementations. One layout engine for all cards; future typography and layout changes apply everywhere.

### A.3 — EducationCard and ServiceCard: define using BaseCard by extending it

**Stance: unify over fracture.** Education and Service cards are **defined using BaseCard**, by extending it to accommodate their unique factors. One layout engine and one style source; future typography and layout changes apply everywhere. In the short term this may mean a few extra BaseCard props, but it sets up better, consistent evolution.

**Extend BaseCard with optional props:**

| Prop | Type | Purpose |
|------|------|----------|
| `detailContent` | `ReactNode` | Rendered between header and main value (price/duration). When set, `contentArea` uses `justifyContent: 'space-between'` and renders `[detailContent, mainValue]`. |
| `subtitleOverride` | `string` | Used instead of `item.subtitle` (e.g. Education: `studentName`; Service: `serviceType`). |
| `isAnimatedHighlight` | `boolean` | When `true`, use `Animated.View` and the existing Education-style glow when `isHighlighted`. |
| Chip map | — | Extend BaseCard's link-type → chip handling for `education` and `service`. |

**CardDetailRows helper** (in `components/results/` or next to `cardStyles`): accepts `{ icon, text, accent?: boolean }[]` and renders the common icon+text row pattern using `CARD` (`infoRow`, `infoText`, `infoIconSize`). Education and Service pass rows as `detailContent`.

**EducationCard and ServiceCard after refactor:**
- **EducationCard:** Thin wrapper over BaseCard. `detailContent` = `CardDetailRows` from `studentName`, `duration`, `schedule`, `startDate`; `subtitleOverride` = `studentName`; `isAnimatedHighlight={true}`; `mainValue` = price; `accentColor`, `iconName`, `iconBgColor`, chips. Remove its own `StyleSheet` and layout.
- **ServiceCard:** Thin wrapper over BaseCard. `detailContent` = `CardDetailRows` from `serviceType`, `technician`, `warranty`, `notes` (or fallback when empty); `subtitleOverride` = `serviceType`; `mainValue` = price; `accentColor`, `iconName`, `iconBgColor`, chips. Remove its own `StyleSheet` and layout.

### A.4 — Standardise one set of token values

Today BaseCard uses larger title (22) and mainValue (36); Education/Service use smaller (15, 24). The plan should pick **one** set of values for `CARD` and apply to all. Based on the “increase text size” feedback, the **larger** BaseCard-like values (or a compromise, e.g. title 18–20, mainValue 30–32) should be the default. Align `CARD` with that, then:

- BaseCard: already close; switch to `CARD` and adjust if needed.  
- EducationCard, ServiceCard: refactor onto BaseCard (A.3); they inherit `CARD` via BaseCard. If needed, tweak `CARD` once so all cards feel consistent.

### A.5 — Order of work (cards)

1. Add `components/results/cardStyles.ts` with `CARD` and any helpers (e.g. `makeCardStyles(CARD)` if useful).  
2. Update **BaseCard** to use `CARD` only and add `detailContent`, `subtitleOverride`, `isAnimatedHighlight`, and chip map for `education`/`service`; confirm Gear, Event, Transaction unchanged.  
3. Add **CardDetailRows** helper.  
4. Refactor **EducationCard** to use BaseCard with those props; remove its own `StyleSheet` and layout.  
5. Refactor **ServiceCard** similarly.  
6. Visually compare all five card types; adjust `CARD` if one type needs an exception (prefer extending `CARD` with an optional overrides object rather than new magic numbers in components).

---

## Part B: Gear Detail Refactor and Alignment with Education / Events / Services

### Current state

- **`app/gear/[id].tsx`**: ~941 lines. **Receipt-centric** (route `id` = receipt id). Has: loading, not-found, header (back / Edit|Save), **edit mode** (large form) vs **view mode** (receipt image, merchant/financial block, “Captured Gear”, “Other Items”), footer (Replace Image, Reprocess, Delete). Uses `ReceiptRepository`, `DocumentPicker`, `callSupabaseFunction` (reprocess), and many `useState` for edit fields.  
- **`app/education/[id].tsx`**: ~256 lines. **Line-item-centric** (id = line item id). Read-only. Hero (icon, title, subtitle, price), Teacher/Student, Schedule, Contact, Related.  
- **`app/events/[id].tsx`**: ~250 lines. **Line-item or generated-event-centric**. Read-only. Hero (icon, title, subtitle, date/time), Event Details, Contact, Related.  
- **`app/services/[id].tsx`**: ~233 lines. **Line-item-centric**. Read-only. Hero (icon, title, subtitle, price), Warranty, Contact, Notes, Related.

### Overlap between detail pages

| Piece | gear | education | events | services |
|-------|------|-----------|--------|----------|
| Loading spinner | ✓ | ✓ | ✓ | ✓ |
| Not-found + Go Back | ✓ | ✓ | ✓ | ✓ |
| Screen shell (paddingTop insets, bg) | ✓ | ✓ | ✓ | ✓ |
| Header: back, title, right (edit/save vs spacer) | ✓ (edit/save) | ✓ (spacer) | ✓ (spacer) | ✓ (spacer) |
| ScrollView + contentContainerStyle | ✓ | ✓ | ✓ | ✓ |
| Hero (icon + title + subtitle + primary block) | ✗ (different) | ✓ | ✓ | ✓ |
| Contact/merchant block | ✓ (view: “Merchant Details”) | ✓ | ✓ | ✓ |
| Related Records grid | ✗ | ✓ | ✓ | ✓ |
| Section block (title + content) | ✓ (implied) | ✓ | ✓ | ✓ |

**Gear-specific:** Receipt image, view block (merchant/date/summary, merchant details, financial box), **edit form** (document type, merchant, summary, ABN, invoice#, date, financial, payment, merchant contact/address, Delete), Replace Image / Reprocess / Delete footer, **Captured Gear** (gear line items with `gearDetails`), **Other Items** (service+event line items with `educationDetails`).

### B.1 — Shared components to extract (resilience-first order)

1. **DetailScreenShell**  
   - `View` with `flex-1`, `bg-crescender-950`, `paddingTop: insets.top`.  
   - Optional: wrap `ScrollView` with `contentContainerStyle` and `paddingBottom`.  
   - Used by all four. Very low risk.

2. **DetailHeader**  
   - Props: `onBack`, `title`, `rightNode?: ReactNode` (edit/save buttons or `<View style={{ width: 40 }} />`).  
   - gear: `rightNode` = edit or save; others: spacer.  
   - Low risk.

3. **ContactDetailsSection**  
   - Props: `{ phone?, email?, website?, address?, suburb?, state?, postcode?, accentColor }`.  
   - Renders: section title “Contact Details” / “Merchant Details” (configurable?), then phone (tel:), email (mailto:), website (optional), address block.  
   - Same structure in education, events, services, and gear (view).  
   - High reuse, low risk.

4. **RelatedRecordsSection**  
   - Props: `{ items: ResultItem[], onItemPress, accentColor }`.  
   - Renders section title “Related Records” and the same 2-up grid and card switching (GearCard, ServiceCard, EventCard, EducationCard, TransactionCard) as in the existing pages.  
   - `handleRelatedItemPress` logic (gear → `/gear/:id`, transaction → `/gear/:receiptId`, etc.) can live inside or be passed in.  
   - education, events, services only. Low risk.

5. **DetailSection**  
   - Props: `{ title: string, accentColor: string, children }`.  
   - Wrapper: section title (accent, uppercase, tracking) + children.  
   - Reusable for “Schedule”, “Event Details”, “Contact Details”, “Notes”, “Captured Gear”, “Other Items”.  
   - Low risk.

6. **DetailHero** (for education, events, services)  
   - Props: `{ icon, accentColor, title, subtitle, primaryBlock: ReactNode }`.  
   - Layout: icon circle, title, subtitle, then `primaryBlock` (price box or date/time box).  
   - gear does **not** use this; it keeps receipt image + view/edit blocks.  
   - Medium value, low risk.

7. **LoadingAndNotFound** (optional)  
   - `{ loading, notFound, onBack, notFoundMessage, notFoundButtonText }` plus slot for custom “Go Back” style.  
   - Can remain inline in each screen if we prefer fewer abstractions; otherwise a small helper.  
   - Low risk.

### B.2 — Gear-specific extractions (in `app/gear/` or `components/gear/`)

1. **GearFooter**  
   - Replace Image, Reprocess (if `imageUrl`), Delete.  
   - Props: `{ hasImage, onReplaceImage, onReprocess, onDelete }`.  
   - ~35 lines. Low risk.

2. **GearViewBlock**  
   - View-mode block: merchant/date/summary row, merchant details (if any), financial box (Total, GST, ABN).  
   - Props: `receipt`, `formatABN`.  
   - ~80 lines. Low risk.

3. **GearEditForm**  
   - The whole edit form: document type, merchant, summary, ABN, invoice#, date, financial (subtotal, tax, total), payment status, payment method, merchant contact & address, Delete.  
   - Props: `{ editState, setEditField, onSave, onDelete, isSaving, DOCUMENT_TYPES, PAYMENT_STATUSES, PAYMENT_METHODS }`.  
   - `editState` can be an object; `setEditField('merchant', v)` or similar.  
   - ~250 lines. **Higher risk**; split into sub-steps below.

4. **GearItemBlock** (or **GearLineItemCard**)  
   - One gear line item: description, tags (brand, model, condition, tier), optional “Gear Details” block (manufacturer, model, serial, etc., links, warranty), qty/price.  
   - Props: `item: LineItemWithDetails`, `onLinkPress?`.  
   - ~120 lines. Gear-only. Medium risk.

5. **OtherItemsBlock**  
   - “Other Items” (service + event line items) with optional `educationDetails` block.  
   - Props: `items: LineItemWithDetails[]`.  
   - ~70 lines. Gear-only. Low risk.

### B.3 — Refactor order for `app/gear/[id].tsx` (resilience-first)

**Phase 1 — Shared, no behaviour change**  
1. Extract `DetailHeader`; use in gear, education, events, services.  
2. Extract `ContactDetailsSection`; use in all four. For gear, pass merchant fields; for others, receipt.merchant*.  
3. Extract `DetailSection`; use where a section title + content appears.  
4. Extract `RelatedRecordsSection`; use in education, events, services.  
5. Optionally `DetailScreenShell` if it simplifies the four screens.

**Phase 2 — Gear view mode and footer**  
6. Extract `GearViewBlock`; replace the view-mode block in gear.  
7. Extract `GearFooter`; replace the footer in gear.  
8. Run app: view mode and footer must behave as before.

**Phase 3 — Gear edit form (in small steps)**  
9. Extract only **Document type + Merchant + Summary** into a `GearEditFormBasic` (or first slice of `GearEditForm`).  
10. Wire `editState` and `setEditField`; test save.  
11. Extract **ABN, Invoice#, Date**.  
12. Extract **Financial (subtotal, tax, total)**.  
13. Extract **Payment status and method**.  
14. Extract **Merchant contact & address** and **Delete**.  
15. Merge into one `GearEditForm` or keep as sub-components; ensure `handleSave` and `loadData` still work.

**Phase 4 — Gear line items**  
16. Extract `GearItemBlock`; replace the `gearItems.map` block.  
17. Extract `OtherItemsBlock`; replace the “Other Items” block.  
18. Test: gear details, links, and navigation unchanged.

**Phase 5 — Hero and education/events/services**  
19. Extract `DetailHero`; refactor education, events, services to use it.  
20. Optionally `LoadingAndNotFound` if it reduces duplication without adding fragility.

### B.4 — Blending of concerns in `app/gear/[id].tsx`

- **Today:** Data loading, 20+ edit `useState`, `handleSave` / `handleReplaceImage` / `handleReprocess` / `handleDelete`, and all UI (view/edit, sections, form, list) live in one file.  
- **Options:**  
  - **A) Custom hook `useGearDetail(id)`**  
    - Returns: `{ receipt, items, loading, isEditing, setIsEditing, editState, setEditField, handleSave, handleReplaceImage, handleReprocess, handleDelete, loadData }`.  
    - Page becomes mostly layout and composition.  
    - **Risk:** Hook must stay in sync with all handlers and state; easy to break if we move things in stages.  
  - **B) Keep state and handlers in the page; extract only presentational components**  
    - `GearEditForm` receives `editState`, `setEditField`, `onSave`, `onDelete`, etc.  
    - All `useState` and `useCallback` stay in `[id].tsx`.  
    - **Risk:** Lower; we can extract UI in small steps and test after each.  

**Recommendation:** Use **B** for Phases 1–4. Revisit a `useGearDetail`-style hook only if, after extractions, the page is still hard to follow.

### B.5 — Where to put shared detail components

- **Shared by 2+ detail screens:**  
  - `components/detail/DetailHeader.tsx`  
  - `components/detail/ContactDetailsSection.tsx`  
  - `components/detail/RelatedRecordsSection.tsx`  
  - `components/detail/DetailSection.tsx`  
  - `components/detail/DetailHero.tsx`  
  - `components/detail/DetailScreenShell.tsx` (if used)

- **Gear-only:**  
  - `components/gear/GearFooter.tsx`  
  - `components/gear/GearViewBlock.tsx`  
  - `components/gear/GearEditForm.tsx` (and any sub-pieces while we slice)  
  - `components/gear/GearItemBlock.tsx`  
  - `components/gear/OtherItemsBlock.tsx`

- **Constants** (`DOCUMENT_TYPES`, `PAYMENT_STATUSES`, `PAYMENT_METHODS`):  
  - Can stay in `gear/[id].tsx` or move to `constants/` when we extract `GearEditForm`.  
  - Low priority.

### B.6 — Testing and rollback

- After each extraction: run the app, open gear/education/events/services details, and spot-check:  
  - View mode, edit mode (gear), navigation, save, replace image, reprocess, delete, related cards.  
- Prefer **one logical extraction per commit** so we can revert a single file if something breaks.  
- If we need to keep old behaviour during a transition, we can temporarily keep both old and new and switch behind a flag; in most cases, a direct replace with a quick check is enough.

---

## Summary

- **Cards:** Introduce `cardStyles.ts` as the single source of truth. **Define Education and Service cards using BaseCard** by extending it (`detailContent`, `subtitleOverride`, `isAnimatedHighlight`, chip map, `CardDetailRows`); one layout engine and one style source. Align on one set of font/size values in `CARD` so all cards respond to the same changes. Unify over fracture.  
- **Gear detail:** Extract shared building blocks (DetailHeader, ContactDetailsSection, DetailSection, RelatedRecordsSection, then DetailHero) and use them in education, events, services; extract gear-only pieces (GearFooter, GearViewBlock, GearEditForm in slices, GearItemBlock, OtherItemsBlock) in the order above. Keep state and handlers in the page until the extractions are stable.  
- **Resilience:** One or two extractions at a time; run the app after each; prioritise view and edit behaviour over “perfect” structure. Clean code is secondary to working behaviour.

---

*Last updated: plan created from codebase review and user requirements. Adjust as implementation progresses.*
