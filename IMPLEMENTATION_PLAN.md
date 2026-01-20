# Crescender Mobile App - Implementation Plan

## Overview

Transform the crescender-mobile app to be functionally identical to geargrabber, with proper Crescender branding (purple theme + gold accents), and refactor from Next.js patterns to React Native.

---

## Phase 1: Fix Critical Issues

### 1.1 Fix Camera Permission (Priority: Critical)

**Current Issue**: Camera permission modal not requesting properly on web

**Solution**:

- Fix web camera permission handling in `app/scan.tsx`
- Use `navigator.mediaDevices.getUserMedia` properly for web
- Ensure permission state updates correctly after granting
- Test on web browser to confirm permission flow works

**Files to Modify**:

- `app/scan.tsx` - Fix `handleRequestPermission` function
- Test permission flow in browser

---

## Phase 2: Redesign Landing Page

### 2.1 New Landing Page Layout

**Current State**: Empty state with geargrabber-style home screen
**Target State**: Dashboard with Crescender branding showing reshaped data tiles

**Components Needed**:

```
┌─────────────────────────────┐
│  [Crescender Logo]          │
│                             │
│  [Camera Button - 80%]      │
│  [Filter] [Menu]            │
│                             │
│  ┌────┐  ┌────┐             │
│  │Gear│  │Gear│             │
│  │Gold│  │Gold│             │
│  └────┘  └────┘             │
│  ┌────┐  ┌────┐             │
│  │Event│ │Event│            │
│  │Cyan │ │Cyan │            │
│  └────┘  └────┘             │
│  ┌────┐  ┌────┐             │
│  │$Money││$Money│           │
│  │Lime │ │Lime │            │
│  └────┘  └────┘             │
│  ... (infinite scroll)      │
└─────────────────────────────┘
```

**Terminology Changes**:

- ❌ "Locker" → ✅ "Results" or "Captured Items"
- ❌ "Collection of images" → ✅ "Gathered gear, events, transactions"
- Use action-oriented language: "Captured", "Gathered", "Extracted"

**Files to Create/Modify**:

- `app/index.tsx` - Complete redesign
- `components/results/CardGrid.tsx` - Two-column grid component
- `components/results/GearCard.tsx` - Gold-bordered card for gear
- `components/results/EventCard.tsx` - Cyan-bordered card for events  
- `components/results/TransactionCard.tsx` - Lime green-bordered card for money
- `components/filters/FilterBar.tsx` - Filter buttons (All, Gear, Events, Transactions)
- `components/header/CameraBar.tsx` - Camera button with filter/menu

---

## Phase 3: Data Model & Reshaping

### 3.1 Data Structure Refactoring

**Current State**: Receipts stored as flat structure
**Target State**: Reshape into categorized items (Gear, Events, Transactions)

**Data Model Changes**:

```typescript
// New unified item structure
interface ResultItem {
  id: string;
  type: 'gear' | 'event' | 'transaction';
  title: string;
  subtitle?: string;
  amount?: number;
  date: string;
  metadata: {
    // Gear-specific
    brand?: string;
    model?: string;
    category?: string;
    // Event-specific
    venue?: string;
    date?: string;
    // Transaction-specific
    merchant?: string;
    paymentMethod?: string;
  };
  receiptId?: string; // Link back to original receipt
  imageUrl?: string;
}
```

**Files to Create/Modify**:

- `lib/results.ts` - Reshape function to convert receipts to unified items
- `lib/repository.ts` - Update to return reshaped data
- `db/schema.ts` - May need adjustments

---

## Phase 4: Port Category Detail Screens from Geargrabber

### 4.1 Gear Detail Screen

**Source**: `crescender-core/tmp/geargrabber/components/geargrabber/receipt-detail.tsx`

**Refactoring Required (Next.js → React Native)**:

- Replace Next.js `Image` → React Native `Image`
- Replace `motion.div` (framer-motion) → React Native `Animated.View`
- Replace `Button` (shadcn) → React Native `TouchableOpacity` with NativeWind
- Replace HTML elements (`<div>`, `<button>`) → React Native components (`<View>`, `<TouchableOpacity>`)
- Replace CSS classes → NativeWind classes
- Replace `useRouter().push()` → `expo-router` `useRouter().push()`
- Handle navigation differently (React Native Stack navigation)

**Components to Port**:

- Receipt detail header
- Financial details section (collapsible)
- Gear items section (with edit/delete)
- Service items section
- Event items section
- Save/Cancel buttons

**Files to Create**:

- `app/gear/[id].tsx` - Gear detail screen (dynamic route)
- `components/gear/GearDetailView.tsx` - Main detail component
- `components/gear/Sections/FinancialSection.tsx` - Financial details
- `components/gear/Sections/GearItemsSection.tsx` - Gear items list
- `components/gear/Sections/ServicesSection.tsx` - Services list
- `components/gear/Sections/EventsSection.tsx` - Events list

---

### 4.2 Review Screen (Processing Flow)

**Source**: `crescender-core/tmp/geargrabber/components/geargrabber/screens/review-screen.tsx`

**Key Features to Port**:

- Collapsible sections (Financial, Gear, Services, Events)
- Edit functionality for each field
- Save to backend
- Cancel/back navigation

**Refactoring Required**:

- Replace `AnimatePresence` → React Native `Animated` API
- Replace `Input` (shadcn) → React Native `TextInput` with NativeWind
- Replace `Label` → React Native `Text` with proper styling
- Replace `Alert` (shadcn) → React Native `Alert.alert()`
- Replace `Loader2` → React Native `ActivityIndicator`

**Files to Create**:

- `app/review.tsx` - Review screen route
- `components/review/ReviewScreen.tsx` - Main review component
- `components/review/CollapsibleSection.tsx` - Reusable collapsible section

---

### 4.3 Processing Screen

**Source**: `crescender-core/tmp/geargrabber/components/geargrabber/screens/processing-screen.tsx`

**Key Features**:

- Show processing state after receipt capture
- Display progress/status
- Auto-navigate to review when complete

**Files to Create**:

- `app/processing.tsx` - Processing screen route
- `components/processing/ProcessingView.tsx` - Processing UI

---

### 4.4 History/Records Screen

**Source**: `crescender-core/tmp/geargrabber/components/geargrabber/screens/history-screen.tsx`

**Features to Port**:

- List of all captured receipts
- Filter/search functionality
- Navigate to detail screens

**Files to Create**:

- `app/history.tsx` - History screen (accessed via menu)
- `components/history/HistoryList.tsx` - List of receipts

---

## Phase 5: Navigation & Routing

### 5.1 Update Navigation Structure

**Current**: Basic stack navigation
**Target**: Tab/Menu navigation matching geargrabber structure

**Routes Needed**:

```
/ (index) - Landing page with results grid
/scan - Camera capture screen
/review - Review extracted data
/processing - Processing state
/gear/[id] - Gear item detail
/events/[id] - Event detail
/transactions/[id] - Transaction detail
/history - All receipts (from menu)
```

**Files to Modify**:

- `app/_layout.tsx` - Add tab navigation if needed, or use stack with menu button
- Update navigation in all screens

---

## Phase 6: Styling & Branding

### 6.1 Ensure Gold Accents Visible

**Check**:

- Tailwind gold color properly applied
- Buttons use gold (#f5c518) as accent
- Borders use gold for gear items
- All interactive elements have gold highlights

**Files to Verify**:

- `tailwind.config.js` - Gold colors defined
- All component files - Using `gold` or `text-gold`, `border-gold`, `bg-gold`

### 6.2 Crescender Logo Integration

**Requirements**:

- Logo at top of landing page
- Proper sizing and positioning
- Works on web (SVG) and native (may need PNG fallback)

**Files to Modify**:

- `app/index.tsx` - Add Crescender logo at top
- Ensure logo files in `public/` are accessible

### 6.3 Color Scheme Implementation

**Border Colors**:

- Gear items: `border-gold` (#f5c518)
- Event items: `border-cyan-400` or `border-cyan-500`
- Transaction items: `border-lime-400` or `border-lime-500`

**Files to Modify**:

- `components/results/GearCard.tsx` - Gold border
- `components/results/EventCard.tsx` - Cyan border
- `components/results/TransactionCard.tsx` - Lime green border

---

## Phase 7: API Integration

### 7.1 Receipt Analysis Edge Function

**Current**: Calls `analyze-receipt` edge function
**Needed**: Ensure proper integration with Supabase Edge Functions

**Files to Check**:

- `app/scan.tsx` - `processImage` function
- Verify Supabase client configuration

---

## Implementation Order

### Week 1: Foundation

1. ✅ Fix camera permission (Critical blocker)
2. ✅ Redesign landing page layout
3. ✅ Implement card grid with two columns
4. ✅ Add gold/cyan/lime borders to cards
5. ✅ Create filter bar (All, Gear, Events, Transactions)

### Week 2: Data & Navigation

6. ✅ Reshape data model (receipts → unified items)
2. ✅ Implement infinite scroll (10 items, load more)
3. ✅ Add menu button → category detail screens
4. ✅ Port gear detail screen from geargrabber

### Week 3: Complete Ports

10. ✅ Port review screen
2. ✅ Port processing screen
3. ✅ Port history screen
4. ✅ Polish styling and branding

---

## Technical Considerations

### Next.js → React Native Conversions

| Next.js | React Native | Notes |
|---------|--------------|-------|
| `Image` (next/image) | `Image` (react-native) | Different API, use `source={{ uri }}` |
| `motion.div` | `Animated.View` | Use React Native Animated API |
| `Button` (shadcn) | `TouchableOpacity` | Wrap with NativeWind styling |
| `Input` (shadcn) | `TextInput` | Style with NativeWind |
| `useRouter().push()` | `useRouter().push()` | Same API in expo-router |
| CSS classes | NativeWind classes | Same syntax, different rendering |
| `<div>`, `<span>` | `<View>`, `<Text>` | Use semantic RN components |
| `onClick` | `onPress` | Event handler difference |

### Key Libraries Needed

- ✅ `expo-router` - Navigation (already installed)
- ✅ `expo-camera` - Camera (already installed)
- ✅ `nativewind` - Styling (already installed)
- ✅ `react-native-safe-area-context` - Safe areas (already installed)
- ⚠️ May need `@react-native-async-storage/async-storage` for filter state persistence
- ⚠️ May need `react-native-animatable` for animations (or use RN Animated)

---

## Testing Checklist

- [ ] Camera permission works on web
- [ ] Camera permission works on Android
- [ ] Camera permission works on iOS
- [ ] Landing page shows Crescender logo
- [ ] Camera button is almost full width
- [ ] Filter and menu buttons visible
- [ ] Two-column grid displays correctly
- [ ] Gold borders on gear items
- [ ] Cyan borders on event items
- [ ] Lime green borders on transaction items
- [ ] Filters work (All, Gear, Events, Transactions)
- [ ] Infinite scroll loads 10 items at a time
- [ ] Menu button navigates to category screens
- [ ] All geargrabber screens ported and functional
- [ ] Gold accents visible throughout app
- [ ] Crescender branding consistent

---

## Notes

- Terminology: Focus on "results", "captured items", "gathered data" - not "collection" or "locker"
- Branding: Purple background (#2e1065) + Gold accents (#f5c518) must be prominent
- Data Model: Receipts are the source, but UI shows reshaped unified items
- Performance: Lazy load images, optimize card rendering for smooth scrolling
