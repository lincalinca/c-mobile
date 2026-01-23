# Claude Repatriation Works - Complete Audit & Implementation Plan

**Created:** 23/Jan/2026  
**Purpose:** Comprehensive audit of all user requests and Claude implementations from conversation history to ensure complete functionality repatriation.

---

## Table of Contents

1. [AI Prompt Improvements](#ai-prompt-improvements)
2. [Merchant Matching & Updates](#merchant-matching--updates)
3. [Date Pickers](#date-pickers)
4. [Education Cards & Events](#education-cards--events)
5. [Service Events](#service-events)
6. [Card Components & Detail Pages](#card-components--detail-pages)
7. [Event Chip Collapsing](#event-chip-collapsing)
8. [Filter Toggles](#filter-toggles)
9. [Share Functionality](#share-functionality)
10. [Usage Tracking](#usage-tracking)
11. [Bulk Upload](#bulk-upload)
12. [Ad Integration](#ad-integration)
13. [UI/UX Improvements](#uiux-improvements)
14. [Navigation & Menu](#navigation--menu)
15. [Pending & Verification](#pending--verification)

---

## AI Prompt Improvements

### Request 1: Address Extraction (Lines 8-9, 352-360)
**User Request:** "it assumed the address on the receipt was the merchant, but it was near my name. it should clearly infer that it is not their address."

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-core/supabase/functions/analyze-receipt/index.ts`

**Code Added:**
```typescript
8. ADDRESS EXTRACTION (CRITICAL):
   - Merchant Address: Usually at TOP of receipt with merchant name/logo in header/footer
   - Customer Address: Usually in "Sold To:", "Ship To:", "Bill To:" sections, or NEAR customer name
   - Context Clues:
     * If address appears with customer name → customer address (IGNORE IT)
     * If address in header/footer with merchant contact info → merchant address
     * If address in "delivery" or "billing" section → customer address (IGNORE IT)
     * If NO merchant address found → leave merchantAddress null (don't guess)
   - Validation: If uncertain whether address belongs to merchant or customer, set merchantAddress to null
```

**Verification:** Check that AI prompt includes Rule 8 with address extraction logic.

---

### Request 2: Merchant URL Extraction (Line 9, 361-365)
**User Request:** "it didn't grab the merchant url, despite being on the receipt"

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-core/supabase/functions/analyze-receipt/index.ts`

**Code Added:**
```typescript
9. MERCHANT CONTACT DETAILS:
   - Website/URL: Look for "www.", "http://", ".com", ".au", ".com.au" patterns
   - Locations: Headers, footers, contact sections, social media areas, email signatures
   - Formats: May include "Visit us:", "Website:", "Web:", or just the URL alone
   - Extract full URL including protocol if visible (e.g., "https://www.merchant.com.au")
```

**Verification:** Check that AI prompt includes Rule 9 with URL extraction patterns.

---

### Request 3: Color Extraction (Line 10, 366-375)
**User Request:** "it didn't grab the colour or size from the item name (22" is the size, Clear Black Dot is the colour)"

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-core/supabase/functions/analyze-receipt/index.ts`

**Code Added:**
```typescript
10. COLOUR EXTRACTION FROM ITEM NAMES:
    - Common Patterns:
      * "Red Fender Stratocaster" → colour: "Red"
      * "Yamaha P-125 White Digital Piano" → colour: "White"
      * "Remo Clear Black Dot 22\" Bass Drum" → colour: "Clear Black Dot"
      * "Natural Finish Acoustic Guitar" → colour: "Natural"
    - Multi-word Colours: Extract FULL colour phrase (e.g., "Clear Black Dot", "Vintage Sunburst", "Pearl White", "Metallic Blue", "Tobacco Burst")
    - Music-Specific Colours: "Sunburst", "Starburst", "Clear Black Dot", "Natural", "Vintage White", "Aged Cherry"
    - Location: Extract from anywhere in item description/name
    - Storage: Place in gearDetails.colour field
```

**Verification:** Check that AI prompt includes Rule 10 with color extraction patterns, including music-specific colors.

---

### Request 4: Size Extraction (Line 10, 376-386)
**User Request:** "22" is the size"

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-core/supabase/functions/analyze-receipt/index.ts`

**Code Added:**
```typescript
11. SIZE EXTRACTION FROM ITEM NAMES:
    - Numeric Sizes with Units:
      * Drum heads: 10", 12", 14", 22" (diameter in inches)
      * Cymbals: 14", 16", 18", 20", 22" (diameter in inches)
      * Guitar scale: 24.75", 25.5" (scale length)
      * String gauge: .009, .010, .011, .012
    - Fractional Sizes: 1/2, 3/4, 4/4, 7/8 (violin/cello sizes)
    - Named Sizes: Small, Medium, Large, XL, XXL
    - Pattern: Extract size WITH unit (e.g., "22\"", not just "22")
    - Context Example: "Remo 22\" Control Sound..." → size: "22\""
    - Storage: Place in gearDetails.size field
```

**Verification:** Check that AI prompt includes Rule 11 with size extraction patterns, ensuring units are included.

---

### Request 5: SKU vs Serial Number (Line 11, 387-408)
**User Request:** "it inferred the model number (which is clearly displayed as the SKU in the receipt) as the Serial no."

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-core/supabase/functions/analyze-receipt/index.ts`

**Code Added:**
```typescript
12. SKU vs MODEL NUMBER vs SERIAL NUMBER (CRITICAL DISTINCTION):
    - SKU (Stock Keeping Unit):
      * Retailer's internal product code (not unique to individual unit)
      * Usually alphanumeric code on receipt line items
      * Examples: "SKU12345", "ITEM-ABC-001", "787724024751"
      * Labels: May appear as "SKU:", "Item#:", "Product Code:", "DLUO:", or unlabeled number
      * ACTION: Extract to `sku` field (NOT serialNumber, NOT modelNumber)
    - Model Number:
      * Manufacturer's product identifier (same for all units of that product)
      * Examples: "Stratocaster HSS", "P-125", "PSR-E373", "Control Sound Clear Black Dot"
      * ACTION: Extract to `modelNumber` or `model` field
    - Serial Number:
      * UNIQUE identifier for ONE specific unit (different for each individual item)
      * Only appears if explicitly labeled: "Serial:", "SN:", "Serial No:", "S/N:"
      * Examples: "SN: Z1234567", "Serial: US19087432"
      * ACTION: ONLY extract if explicitly labeled → `serialNumber` field
      * If NO serial visible or labeled → serialNumber: null
      * NEVER use SKU as serial number - they are completely different
    - Priority: If you see a code on the receipt, determine:
      1. Is it labeled "Serial" or "SN"? → serialNumber
      2. Is it a product/SKU/item code? → sku
      3. Is it part of the product name? → modelNumber
```

**Database Schema Change:** Added `sku` field to `lineItems` table.

**Verification:** 
- Check that AI prompt includes Rule 12 with SKU/serial distinction
- Verify `sku` field exists in database schema
- Verify `sku` field is saved when creating line items

---

### Request 6: Education Details Enhancement (Lines 443-444, 453-454)
**User Request:** Extract teacher name, frequency, duration, dates, days of week, times for education items.

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-core/supabase/functions/analyze-receipt/index.ts`

**Code Added:**
```typescript
15. EDUCATION DETAILS - TEACHER NAME: For education items, ALWAYS extract teacherName into educationDetails if visible on receipt.
    This is in addition to studentName, frequency, duration, dates, etc.
```

**Verification:** Check that AI prompt includes Rule 15 for teacher name extraction, and that education details schema includes all required fields.

---

## Merchant Matching & Updates

### Request 7: Merchant Update Workflow (Lines 15-16, 107-159)
**User Request:** "If the merchant is a match, but there are new details (contact phone, email, address) we should offer to the user to update the merchant record."

**Implementation Status:** ✅ COMPLETE  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/MerchantUpdatePrompt.tsx` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/lib/repository.ts` (updateMerchantDetails method)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/review.tsx` (detection logic)

**Key Implementation:**
```typescript
// Detection logic in review.tsx
useEffect(() => {
  if (!merchantIsNew && matchedMerchantId && initialData.financial?.merchantDetails) {
    TransactionRepository.getById(matchedMerchantId).then((existing) => {
      // Compare fields and detect updates
      // Show MerchantUpdatePrompt if updates found
    });
  }
}, [merchantIsNew, matchedMerchantId, initialData]);

// Repository method
async updateMerchantDetails(merchantId: string, updates: {...}) {
  // Find all transactions with matching merchant
  // Update merchant fields across all matching transactions
  // Returns count of updated transactions
}
```

**Verification:**
- Check that `MerchantUpdatePrompt.tsx` exists and displays old → new values
- Check that `updateMerchantDetails` method exists in repository
- Check that review screen detects merchant updates and shows prompt
- Check that "Matched to [Merchant]. Press to Create New instead" banner appears when merchant is matched

---

## Date Pickers

### Request 8: Replace Text Input with Date Picker (Line 17, 167-203)
**User Request:** "when reviewing captured data, it has a date field. If the user presses her, it's just a text field used to input date. I want to swap that out to use the date picker from the home page."

**Implementation Status:** ✅ COMPLETE  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/calendar/DatePickerModal.tsx` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/review.tsx` (replaced TextInput)

**Key Implementation:**
```typescript
// DatePickerModal.tsx - Single date picker with future date warning
export function DatePickerModal({
  visible,
  onRequestClose,
  selectedDate,
  onDateSelect,
  maxDate,
  showFutureWarning = true,
}: DatePickerModalProps) {
  // Calendar UI with Crescender theme
  // Future date warning
  // Month picker integration
}

// review.tsx - Replaced TextInput
<TouchableOpacity onPress={() => setShowDatePicker(true)}>
  <Text>{transactionDate ? formattedDate : 'Select date'}</Text>
  <Feather name="calendar" size={20} color="#f5c518" />
</TouchableOpacity>
```

**Verification:**
- Check that `DatePickerModal.tsx` exists
- Check that review screen uses date picker instead of TextInput
- Check that "edit record" page (`app/gear/[id].tsx`) also uses date picker
- Check that future date warning appears when selecting future dates

---

## Education Cards & Events

### Request 9: Education Card Title Formatting
**User Request:** "the titles the AI is serving back are 'Term 1 fees vivian'. The fees side of things should just be what the money transaction is about, this card should instead have the title 'Music lessons for Vivian' and if the focus has been defined either on the receipt or independently by the user, '[Instrument/focus] lessons for Vivian'"

**Implementation Status:** ⚠️ NEEDS VERIFICATION  
**Files:** Check `lib/results.ts` and education card components

**Expected Implementation:**
- Title should be formatted as "Music lessons for Vivian" or "[Instrument/focus] lessons for Vivian"
- Use `focus` field from educationDetails if available
- Use `studentName` from educationDetails

**Verification:** Check that education cards display formatted titles, not raw receipt descriptions.

---

### Request 10: Education Card Details Condensation
**User Request:** "we have a list of - term duration - lesson frequency - start date. This takes up more vertical space than needed. These could be converted into a string sentence, like '9x Weekly lessons from 30th January until 30th March'"

**Implementation Status:** ⚠️ NEEDS VERIFICATION  
**Files:** Check `SimpleEducationCard.tsx` and education card rendering

**Expected Implementation:**
- Condense term duration, lesson frequency, start date into single sentence
- Format: "9x Weekly lessons from 30th January until 30th March"
- Or: "12x twice weekly lessons on Tuesday and Friday from 5th June to 18th July"

**Verification:** Check that education cards show condensed schedule details.

---

### Request 11: Education Lesson Date Selection
**User Request:** "It also only captures the date of the invoice and assumes that's when the lessons are, which is very unlikely to correspond with the days of the week that the lessons take place. This should be one of the more directly sought questions, unless it's somehow included in the invoice (not likely, though)."

**Implementation Status:** ⚠️ NEEDS VERIFICATION  
**Files:** Check `app/review.tsx` education section

**Expected Implementation:**
- User-selectable lesson start date (separate from invoice date)
- Date picker for lesson start date
- Preview of calculated lesson occurrence dates as chips
- Format: "Weekly: March 2, 9, 16, 23, 30, April 5, 12, 19, 26, May 3"

**Verification:** Check that review screen has lesson start date picker and lesson date preview.

---

### Request 12: Education Event Series Generation
**User Request:** "I just added a tuition invoice and it failed to recognise that there was more than one lesson involved."

**Implementation Status:** ✅ COMPLETE (per summary)  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/lib/results.ts` (generateEducationEvents)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/lib/educationEvents.ts` (if exists)

**Verification:** Check that education items generate individual lesson events.

---

### Request 13: Save + Calendar Options
**User Request:** "At the bottom of the save screen, there should be two save options when there are events involved: 'Save + View' or 'Save + Add to Calendar'"

**Implementation Status:** ⚠️ NEEDS VERIFICATION  
**Files:** Check `app/review.tsx` save buttons

**Expected Implementation:**
- Conditional rendering: Show dual buttons when education/event items present
- "SAVE + VIEW" button
- "+ CALENDAR" button (or "SAVE + ADD TO CALENDAR")
- Default to single "SAVE TRANSACTION" button otherwise

**Verification:** Check that review screen shows dual save buttons for education/event items.

---

## Service Events

### Request 14: Service Date Fields & Events
**User Request:** "services SHOULD have date. It should have a start and enddate, and a toggle to say whether or not it's a single day or not. Any service over a day should have three events associated: start date/dropoff, overall service period, end date/pickup."

**Implementation Status:** ✅ COMPLETE (per summary)  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/lib/serviceEvents.ts` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/lib/results.ts` (integrated)

**Verification:**
- Check that `serviceEvents.ts` exists and generates pickup, overall, dropoff events
- Check that services have start/end dates and isMultiDay toggle
- Check that service events are grouped like education series

---

## Card Components & Detail Pages

### Request 15: Simple Cards for Detail Pages
**User Request:** "the bottom section of the record details page has things like captured gear, with these custom cards, but they should actually use the same cards as from the homepage, and they should be clickable to link to the relevant gear item. They should be the same except that they should not show the data chips in the footer or the date."

**Implementation Status:** ✅ COMPLETE  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/results/SimpleCard.tsx` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/results/SimpleGearCard.tsx` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/results/SimpleServiceCard.tsx` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/results/SimpleEducationCard.tsx` (NEW)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/gear/[id].tsx` (updated to use SimpleCards)

**Verification:**
- Check that all SimpleCard components exist
- Check that record details page uses SimpleCards for gear/service/education items
- Check that cards are clickable and navigate to item detail pages
- Check that cards do NOT show footer chips or date

---

### Request 16: Gear Detail Page
**User Request:** "there still appears not to be a gear page, I thought I requested that to be built earlier. please make up the gear page with all granular detail about the gear item. the ai prompt is meant to find a url for the item, repair and maintenance manuals etc. all of those urls and pages should be linked and accessible from the gear page"

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/gear/item/[id].tsx`

**Verification:**
- Check that gear detail page exists
- Check that it displays all granular details (manufacturer, model, serial, color, size, condition, etc.)
- Check that external links (officialUrl, officialManual, warrantyContactDetails) are clickable
- Check that links open in browser

---

## Event Chip Collapsing

### Request 17: Collapse Multiple Chips
**User Request:** "The icon in the money card and in the education card that shows the events is also busier than it should be. It should be all collapsed into one signifying it's got a set/series, e.g. [event +6], and on click, like usual, it would navigate on that page, to the actual result tile/card"

**Implementation Status:** ✅ COMPLETE (per summary)  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/results/BaseCard.tsx`

**Expected Implementation:**
- Group link chips by type
- Display collapsed `[icon +N]` badge for 3+ items of same type
- Examples: `[event +6]`, `[gear +5]`, `[service +2]`

**Verification:**
- Check that BaseCard groups chips by type
- Check that collapsed badges appear for 3+ items
- Check that clicking collapsed chip navigates appropriately

---

### Request 18: Multi-Reference Chip Navigation
**User Request:** "If a multi-reference chip is clicked, we should navigate to the page of the card, and scroll to the section with the relevant items, e.g. if the gear chip is clicked on a money card, we go to the receipt record page, and scroll to the gear, and indicate the list of available gear."

**Implementation Status:** ⚠️ NEEDS VERIFICATION  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/index.tsx` (handleLinkPress)

**Expected Implementation:**
- For collapsed chips: Navigate to parent/transaction page, scroll to relevant section
- For single chips: Navigate directly to item's detail page

**Verification:** Check that `handleLinkPress` implements smart navigation based on chip type and collapse state.

---

## Filter Toggles

### Request 19: Event Series Toggle
**User Request:** "well I want all events, including education ones, to appear. Maybe we need a filter instead that display toggles between series and individual events, with series being the default."

**Implementation Status:** ✅ COMPLETE (per summary)  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/index.tsx` (showEventSeries state)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/filters/FilterBar.tsx` (toggle button)

**Expected Implementation:**
- Toggle between "series" and "individual events" views
- Default to "series" (hide individual generated events)
- Toggle appears in FilterBar row, not separate row

**Verification:**
- Check that FilterBar has event series toggle
- Check that toggle is in the filter row (not separate)
- Check that default hides individual events (event IDs starting with `event_`)

---

## Share Functionality

### Request 20: Share from Other Apps
**User Request:** "most apps have a 'share' button, and it presents all of the apps a user might share an image with. I want Crescender to be included in that list, so a user can share an image, and it confirm 'do you want Crescender to read this receipt image using AI?'"

**Implementation Status:** ✅ COMPLETE (Android), ⚠️ iOS PENDING  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app.json` (intentFilters, permissions)
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/share.tsx` (NEW)

**Verification:**
- Check that `app.json` has Android intentFilters for image sharing
- Check that `app.json` has iOS photo library permission description
- Check that `share.tsx` exists and handles shared images
- Check that share screen shows confirmation dialog
- Note: iOS share functionality noted for future implementation

---

## Usage Tracking

### Request 21: Usage Screen & Tracking
**User Request:** "I want to give all users (based on mac address and IP) 2x free scans per day, but watching an rewarded ad video grants the user 5x more scans per ad watched. we need to add a usage page that tracks the day and month's usage"

**Implementation Status:** ⚠️ UI COMPLETE, LOGIC PENDING  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/usage.tsx`

**Current State:**
- UI exists with placeholder state
- Shows daily scan quota, progress bar, breakdown
- "Earn More Scans" section (coming soon)
- Bulk upload button (placeholder)

**Pending:**
- Database tables for usage tracking
- Device ID generation (MAC address/IP)
- Actual daily/monthly limit enforcement
- Scan counting logic

**Verification:**
- Check that usage screen exists and displays correctly
- Check that menu includes "USAGE" item
- Note: Core tracking logic needs implementation

---

## Bulk Upload

### Request 22: Bulk Add Functionality
**User Request:** "The homepage needs to add a 'Bulk add' functionality, where the user can add multiple receipt images or take multiple snaps that get batched and processed in batches, and the user will need to enable notifications so that once each has been processed, they can be notified of it being ready to evaluate."

**Implementation Status:** ⚠️ UI PLACEHOLDER, LOGIC PENDING  
**Files:**
- `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/usage.tsx` (bulk upload button)
- Homepage (needs bulk add button)

**Current State:**
- Usage screen has bulk upload button (placeholder)
- Document picker integration exists
- Shows "Coming Soon" alert

**Pending:**
- Queue processing system
- Background task handling
- Notification system
- Status tracking for queued receipts
- Temporary state storage between processing and saving

**Verification:**
- Check that bulk upload button exists
- Check that homepage has link to bulk upload
- Note: Core queue processing needs implementation

---

## Ad Integration

### Request 23: Ad Implementation
**User Request:** "Throughout the app, I want footer advertisements, and the additional aforementioned rewarded ads for boosts"

**Implementation Status:** ❌ NOT STARTED  
**Files:** None yet

**Pending:**
- Google AdMob integration
- Footer banner ads
- Rewarded video ads for scan boosts
- Ad placement throughout app

**Verification:** Check if any ad integration exists (likely none).

---

## UI/UX Improvements

### Request 24: Record Details Footer Layout
**User Request:** "the replace vs reprocess buttons have taken up more height in the receord details page, which is now covering up over the bottom of the page. We need to be able to scroll down to see the bottom of the bottom item. Either we need to reduce those footer options to a single row, or enable scrolling just a little bit further down the contents of the record details page."

**Implementation Status:** ✅ COMPLETE (per summary)  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/app/gear/[id].tsx`

**Expected Implementation:**
- Footer buttons in single compact row (icons with text)
- ScrollView paddingBottom increased to 180

**Verification:**
- Check that footer buttons are in single row
- Check that ScrollView has sufficient paddingBottom

---

### Request 25: Month Selector Performance
**User Request:** "The month selector sub0menu from the date picker takes about a whole second to load. Is there a performance issue, or are ther some hardcoded delays built into the component? It should load immediately."

**Implementation Status:** ✅ COMPLETE (per summary)  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/calendar/MonthPickerModal.tsx`

**Expected Implementation:**
- Replaced `setTimeout` with `requestAnimationFrame`
- Set `animated: false` for scrolling

**Verification:** Check that MonthPickerModal uses requestAnimationFrame and has no delays.

---

### Request 26: Logo Navigation
**User Request:** "Pressing the Cresecnder logo at the top of the screen from anywhere in the app should navigate back to the home page"

**Implementation Status:** ❌ NOT IMPLEMENTED  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/header/PersistentHeader.tsx`

**Expected Implementation:**
- Wrap Crescender logo Image in TouchableOpacity
- Navigate to `/` on press

**Verification:** Check that logo is wrapped in TouchableOpacity and navigates home.

---

## Navigation & Menu

### Request 27: Remove UI Mockup from Menu
**User Request:** "I'm ready to remove the ui mockup screen from appearing now."

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/header/PersistentHeader.tsx`

**Verification:**
- Check that menuItems does NOT include "UI MOCKUP"
- Check that `/app/mock.tsx` is deleted (or redirects)

---

### Request 28: Add Usage to Menu
**User Request:** "did you implement the usage screen? you need to update the menu with it"

**Implementation Status:** ✅ COMPLETE  
**File:** `/Users/linc/Dev-Work/Crescender/crescender-mobile/components/header/PersistentHeader.tsx`

**Verification:** Check that menuItems includes "USAGE" with path `/usage`.

---

## Pending & Verification

### Critical Items Needing Verification

1. **Logo Navigation** (Request 26) - ❌ NOT IMPLEMENTED
   - Action: Wrap logo in TouchableOpacity, navigate to `/`

2. **Education Card Titles** (Request 9) - ⚠️ NEEDS VERIFICATION
   - Action: Check title formatting in education cards

3. **Education Card Details** (Request 10) - ⚠️ NEEDS VERIFICATION
   - Action: Check condensed schedule display

4. **Lesson Date Selection** (Request 11) - ⚠️ NEEDS VERIFICATION
   - Action: Check review screen for lesson date picker and preview

5. **Save + Calendar Buttons** (Request 13) - ⚠️ NEEDS VERIFICATION
   - Action: Check review screen for dual save buttons

6. **Multi-Reference Chip Navigation** (Request 18) - ⚠️ NEEDS VERIFICATION
   - Action: Check handleLinkPress implementation

### Major Features Pending Implementation

1. **Usage Tracking Logic** (Request 21)
   - Database schema for usage
   - Device ID generation
   - Daily/monthly limit enforcement
   - Scan counting

2. **Bulk Upload Queue** (Request 22)
   - Queue processing system
   - Background tasks
   - Notifications
   - Status tracking

3. **Ad Integration** (Request 23)
   - Google AdMob setup
   - Footer banner ads
   - Rewarded video ads

---

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. ✅ Fix logo navigation (Request 26)
2. ⚠️ Verify education card titles (Request 9)
3. ⚠️ Verify education card details condensation (Request 10)
4. ⚠️ Verify lesson date selection (Request 11)
5. ⚠️ Verify save + calendar buttons (Request 13)
6. ⚠️ Verify multi-reference chip navigation (Request 18)

### Phase 2: Core Features (Next Sprint)
1. Usage tracking logic (Request 21)
2. Bulk upload queue system (Request 22)

### Phase 3: Monetization (Future)
1. Ad integration (Request 23)

---

## Notes

- **Date Format:** All dates should use Australian format (dd/mmm/yyyy)
- **Language:** Australian English throughout
- **Backup:** Always create safe rollback points before major changes
- **Testing:** Test each feature thoroughly before marking complete

---

**Last Updated:** 23/Jan/2026  
**Status:** In Progress - Verification Phase
