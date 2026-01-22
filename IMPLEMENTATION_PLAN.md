# Master Implementation Plan: Data Model Enhancement

## Executive Summary

Comprehensive four-phase plan to enhance receipt parsing with richer data extraction, better data organisation, and intelligent merchant deduplication. **NOT an architectural change** - same data flow, same database structure, just greedier AI extraction and richer display.

**Total Effort**: ~8 hours | **Cost Increase**: ~$7.56/year (1,200 receipts) | **Status**: Ready to implement

---

## Key Clarifications

✅ **NOT an architectural change:**

- API already returns JSON (no format change)
- Same database structure (just adding new columns)
- Same data flow through system
- Just greedier AI extraction + richer display
- Only Phase 2 involves categorical refinement (warranty)

---

## Phase 1: Comprehensive Gear Details + Transaction Summary (4-4.5 hours)

### What's Being Added

**Gear Details** (14+ fields per item):

- manufacturer, brand, makeYear, modelName, modelNumber
- serialNumber, colour, uniqueDetail
- condition (enum: Excellent/Good/Fair/Poor)
- notedDamage, size
- tier (enum: Entry-level/Student/Professional/Concert)
- officialUrl (major brands only), officialManual
- warrantyContactDetails (phone, email, website)

**Transaction Summary**:

- 3-10 word blurb describing entire purchase
- Applies to ALL transaction types (gear, services, education, events, other)
- Examples: "Upright piano with delivery and tuning", "Guitar with strings, case, and 3x lessons"

**Education Details Enhancement**:

- Added `teacherName` field (if visible on receipt)

**Merchant Details Expansion**:

- Capturing: name, ABN, phone, email, address, website, suburb, state, postcode

### Phase 1 Implementation

1. **AI Prompt**: Add Rules 8-10 to CRITICAL RULES section
2. **Schemas**: Add gearDetails to receiptItemSchema, summary to receiptDataSchema, teacherName to lessonDetailsSchema
3. **Repository**: Parse gearDetails JSON when fetching items
4. **UI**: Display gear details in organised sections on detail page and review page
5. **Testing**: Test with 5-10 real receipts

### Phase 1 Token Impact

- +800-900 tokens per receipt
- +$0.0038 per receipt
- +$4.56/year (1,200 receipts)

---

## Phase 2: Warranty Handling (2.5 hours)

### What's Changing

**Warranty as Service Items**:

- Parse warranty as separate `service` category line items
- No longer concatenated with product descriptions
- Warranty contact details default to merchant if not independently specified

### Phase 2 Implementation

1. **AI Prompt**: Add Rule 11 (WARRANTY ITEMS)
2. **Schemas**: Add warrantyDetails to receiptItemSchema
3. **Repository**: Handle warranty item creation
4. **UI**: Display warranty items as regular line items with "warranty" category
5. **Testing**: Test with receipts containing warranty info

### Phase 2 Token Impact

- +200-300 tokens per receipt
- +$0.0015 per receipt
- +$1.80/year (1,200 receipts)

---

## Phase 3: Merchant Matching (1.25 hours)

### What's Happening

**Invisible Merchant Deduplication**:

- When processing receipt, check if merchant exists in user's transaction history
- **Applies to ALL merchant types**: retailers, service providers, education providers, event venues, etc.
- If match found (by name, ABN, or other details), **reuse existing merchant ID** (not duplicate data)
- If no match, create new merchant with new ID
- AI returns the **merchant ID** to link to existing record, ensuring single source of truth
- Completely invisible to user but provides data quality benefits
- Prevents duplicate merchant entries from minor variations

### Phase 3 Implementation

1. **AI Prompt**: Add Rule 12 (MERCHANT MATCHING)
2. **Repository**:
   - Fetch existing merchants (all types: retailers, education providers, venues, etc.)
   - Pass merchant list with IDs to AI
   - AI returns merchant ID if match found, or null if new merchant needed
   - Use merchant ID to link transaction (not duplicate merchant data)
   - Create new merchant record only if no match found
3. **Matching Logic**: Exact name match, ABN match, similar name + suburb/postcode, similar name + phone
4. **Testing**: Monitor merchant deduplication accuracy and verify single merchant records

### Phase 3 Token Impact

- +50-200 tokens per receipt (merchant list size)
- +$0.0010 per receipt
- +$1.20/year (1,200 receipts)

---

## Phase 4: Future Enhancements

- Warranty expiry alerts
- Serial number validation/lookup
- Merchant profile pages
- Spending analytics by merchant
- Loyalty program integration

---

## Collective Impact

### Token Consumption

- **Baseline**: ~3,050 tokens/receipt
- **New (All Phases)**: ~4,555 tokens/receipt
- **Increase**: +1,505 tokens (+49%)

### Cost Increase

These estimates anticipate Claude Sonnet 3.5 as baseline:

- **Per receipt**: +$0.0063
- **Monthly (100 receipts)**: +$0.63
- **Annual (1,200 receipts)**: +$7.56

---

## Implementation Order

1. Start with Phase 1 (highest impact)
2. Test thoroughly with real receipts
3. Move to Phase 2 (warranty handling)
4. Move to Phase 3 (merchant matching)
5. Gather feedback for Phase 4

---

## Files to Modify

**crescender-core repo**:

- `supabase/functions/analyze-receipt/index.ts` - AI prompt + schemas
- `db/schema.ts` - Add columns
- `db/client.ts` - Schema creation
- `lib/repository.ts` - Data access layer

**crescender-mobile repo**:

- `app/gear/[id].tsx` - Display gear details
- `app/review.tsx` - Edit gear details

---

## Success Criteria

✅ Phase 1: Gear details and summaries display correctly
✅ Phase 2: Warranty items appear as separate line items
✅ Phase 3: Duplicate merchants are prevented
✅ All tests pass
✅ Real receipts parse correctly
✅ Token costs within estimates

---

## Next Steps

1. Review this master plan
2. Begin Phase 1 implementation
3. Update AI prompt in Supabase function
4. Update database schema
5. Update repository layer
6. Update UI
7. Test with real receipts
8. Proceed to Phase 2 & 3
