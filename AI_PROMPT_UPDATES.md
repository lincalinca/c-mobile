# AI Prompt Updates for Receipt Parsing

## File Location

`supabase/functions/analyze-receipt/index.ts`

---

## Important Context

**The API already returns JSON.** We're not changing the architecture - just updating the schema to extract more fields and be more specific in extraction. This is purely about making the AI greedier and more detailed.

---

## Phase 1: Comprehensive Gear Details + Transaction Summary + Enhanced Education

### Update 1: System Prompt (buildSystemPrompt function)

**Current CRITICAL RULES section (lines 249-256):**

```javascript
CRITICAL RULES:
1. DISCOUNTS: If an item shows original price and discounted price, capture both. Note if discount is $ amount or %.
2. BRANDS: Separate brand from model (e.g., "Fender Stratocaster" -> brand="Fender", model="Stratocaster").
3. FINANCIAL: total (final amount), amountPaid (what was paid), amountDue (what's still owed) are DISTINCT.
4. ABN: Extract 11 digit ABN, usually near business name or at bottom.
5. EDUCATION: For lessons/courses, extract scheduling (days, times, duration, term dates) into educationDetails.
6. PAYMENT STATUS: Determine if paid, partial, unpaid based on amount paid vs total.
7. CONFIDENCE: Score items based on text clarity.
```

**Add these rules:**

```javascript
8. GEAR DETAILS: For gear items, extract ALL available details:
   - manufacturer: Company that made the item (e.g., "Steinway & Sons")
   - brand: Brand name (e.g., "Steinway", "Fender", "Yamaha")
   - makeYear: Year of manufacture if visible
   - modelName: Full model name (e.g., "Model D", "Stratocaster")
   - modelNumber: Model number/code if visible
   - serialNumber: Serial number (SN:, Serial:, S/N:, etc.)
   - colour: Color/finish (e.g., "Ebony Black", "Sunburst")
   - uniqueDetail: Any notable history (e.g., "Used by Van Halen", "Played by Louis Armstrong")
   - condition: Item condition (e.g., "Excellent", "Good", "Fair", "Poor")
   - notedDamage: Any damage noted on receipt
   - size: Dimensions if applicable (e.g., "108cm", "4/4 size")
   - tier: Professional/Student/Entry-level if specified
   - officialUrl: Official product page (ONLY for major brands: Fender, Yamaha, Pearl, Gibson, etc.)
   - officialManual: Link to official manual if available
   - warrantyContactDetails: Phone, email, website for warranty support

   Store ALL extracted details in gearDetails JSON field.
   Only include fields that are actually present on the receipt.

9. TRANSACTION SUMMARY: Generate a 3-10 word summary of the entire purchase.
   Applies to ALL transaction types (gear, services, education, events, other).
   Be concise and descriptive. Examples:
   - "Upright piano with delivery and tuning"
   - "Guitar with strings, case, and 3x lessons"
   - "Drum kit with hardware and cymbal stands"
   - "Keyboard with sustain pedal and music stand"
   - "Violin with bow, rosin, and 10x lessons"
   - "Piano tuning and maintenance service"
   - "Concert tickets and merchandise"
   Store in summary field at transaction level (not per item).

10. EDUCATION DETAILS: For lessons/courses, extract:
    - studentName: Name of student or participant (if visible)
    - teacherName: Name of teacher or instructor (if visible)
    - frequency: Lesson frequency (weekly, fortnightly, monthly, once, etc)
    - duration: Lesson duration (30 mins, 1 hour, etc)
    - startDate: Start date in YYYY-MM-DD format
    - endDate: End date in YYYY-MM-DD format
    - daysOfWeek: Days of the week for recurring lessons
    - times: Times of day for lessons

    Only include fields that are actually present on the receipt.
```

### Update 2: Receipt Item Schema

**Add to receiptItemSchema properties:**

```javascript
gearDetails: {
  type: "object",
  description: "Comprehensive gear metadata for instruments and equipment",
  properties: {
    manufacturer: { type: "string", description: "Company that manufactured the item" },
    brand: { type: "string", description: "Brand name" },
    makeYear: { type: "integer", description: "Year of manufacture" },
    modelName: { type: "string", description: "Full model name" },
    modelNumber: { type: "string", description: "Model number or code" },
    serialNumber: { type: "string", description: "Serial number" },
    colour: { type: "string", description: "Color or finish" },
    uniqueDetail: { type: "string", description: "Notable history or unique details" },
    condition: { type: "string", enum: ["Excellent", "Good", "Fair", "Poor"], description: "Item condition" },
    notedDamage: { type: "string", description: "Any damage noted" },
    size: { type: "string", description: "Size or dimensions" },
    tier: { type: "string", enum: ["Entry-level", "Student", "Professional", "Concert"], description: "Equipment tier" },
    officialUrl: { type: "string", description: "Official product page URL (major brands only)" },
    officialManual: { type: "string", description: "Link to official manual" },
    warrantyContactDetails: {
      type: "object",
      properties: {
        phone: { type: "string" },
        email: { type: "string" },
        website: { type: "string" }
      }
    }
  }
}
```

### Update 3: Update Lesson Details Schema (Add teacherName)

**Update lessonDetailsSchema properties:**

```javascript
// Add to existing lessonDetailsSchema:
teacherName: { type: "string", description: "Name of teacher or instructor" },

// Full schema now includes:
{
  studentName: { type: "string", description: "Name of student or participant" },
  teacherName: { type: "string", description: "Name of teacher or instructor" },  // NEW
  frequency: { type: "string", description: "Lesson frequency" },
  duration: { type: "string", description: "Lesson duration" },
  startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
  endDate: { type: "string", description: "End date in YYYY-MM-DD format" },
  daysOfWeek: { type: "array", items: { type: "string" } },
  times: { type: "array", items: { type: "string" } }
}
```

### Update 4: Receipt Data Schema (Add summary)

**Add to receiptDataSchema properties (around line 190):**

```javascript
summary: {
  type: "string",
  description: "3-10 word summary of the entire purchase (applies to all transaction types)",
  minLength: 3,
  maxLength: 100,
}
```

---

## Phase 2: Warranty Handling

### Update 1: Add Warranty to Item Schema

**Add to receiptItemSchema properties:**

```javascript
warrantyDetails: {
  type: "object",
  description: "Warranty information if item includes warranty coverage",
  properties: {
    coveragePeriod: {
      type: "string",
      description: "Duration of warranty (e.g., '5 years', '24 months', '3 years')"
    },
    coverageType: {
      type: "string",
      description: "Type of coverage (e.g., 'full', 'accidental damage', 'parts only', 'comprehensive')"
    },
    startDate: {
      type: "string",
      description: "Warranty start date in YYYY-MM-DD format"
    }
  }
}
```

### Update 2: System Prompt - Warranty Rule

**Add to CRITICAL RULES:**

```javascript
10. WARRANTY ITEMS: If receipt includes warranty or protection plan:
    - Create SEPARATE line item with category='warranty'
    - Extract coverage period (e.g., "5 years", "24 months")
    - Extract coverage type (e.g., "full", "accidental damage", "parts only")
    - Store details in warrantyDetails JSON object
    - Set category to 'warranty' for warranty items
    
    Example: "Piano $5000, 5-year warranty $500"
    Should create TWO items:
    1. { description: "Upright Piano", category: "gear", price: 5000 }
    2. { description: "5-year comprehensive warranty", category: "warranty", 
        price: 500, warrantyDetails: { coveragePeriod: "5 years", 
        coverageType: "comprehensive" } }
```

---

## Phase 3: Merchant Matching

### Update: System Prompt (Add Rule 11)

**Add to CRITICAL RULES:**

```javascript
11. MERCHANT MATCHING: When processing a receipt, check if the merchant matches
    an existing merchant in the user's transaction history.

    IMPORTANT: This applies to ALL merchant types - retailers, service providers,
    education providers (music teachers, schools), event venues, etc.

    Existing merchants list (with IDs) will be provided in the prompt.

    If merchant matches an existing one (by name, ABN, or other identifying details):
    - Return the MERCHANT ID to link to existing record: { existingMerchantId: "merchant_123" }
    - DO NOT duplicate merchant data - use the ID to reference the single source of truth

    If merchant is new:
    - Return: { merchantDetails: { name, abn, phone, email, address, website, suburb, state, postcode } }
    - A new merchant ID will be created in the database

    Matching logic:
    - Exact name match (case-insensitive)
    - ABN match (if both have ABN)
    - Similar name + same suburb/postcode
    - Similar name + same phone number

    Be conservative: if unsure, create new merchant rather than incorrectly matching.
```

### Implementation in Repository

When calling AI:

1. Fetch existing merchants for user from database
2. Format as list: `[{ id: "merchant_123", name: "Muso's Music", abn: "12345678901", suburb: "Sydney" }, ...]`
3. Include in system prompt before sending receipt
4. AI returns either `existingMerchantId` or `merchantDetails`
5. Repository handles merchant creation/lookup accordingly

---

## Testing the Prompt

### Test Case 1: Serial Numbers

**Input:** Receipt with "Piano SN: ABC123456"
**Expected Output:** serialNumber: "ABC123456"

### Test Case 2: Summary

**Input:** Receipt with piano, delivery, tuning
**Expected Output:** summary: "Upright piano with delivery and tuning"

### Test Case 3: Warranty

**Input:** Receipt with "Guitar $800, 3-year warranty $150"
**Expected Output:** Two line items (guitar + warranty)

---

## Rollout Steps

1. Update system prompt with rules 8-10 (Phase 1 & 2)
2. Add summary to receiptDataSchema
3. Add gearDetails to receiptItemSchema
4. Deploy and test Phase 1
5. Add warrantyDetails to schema
6. Deploy and test Phase 2
7. Add rule 11 to system prompt (Phase 3)
8. Update repository to fetch and pass existing merchants
9. Deploy and test Phase 3

---

## Notes

- Keep temperature at 0.1 (low) for consistent extraction
- Increase max_tokens if needed for complex receipts
- Test with 5-10 real receipts before full rollout
- Monitor confidence scores for accuracy
