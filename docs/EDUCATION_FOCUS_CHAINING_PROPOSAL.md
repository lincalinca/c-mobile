# Education Focus, Chaining, and Continuity Proposal

## Summary
Add a structured Education focus field, prompt for it when missing, and introduce education chaining with swipeable contexts and continuity gap prompts. Show associated transaction records in the footer (typically one) for each education context.

## Goals
- Add a stable Education focus field (for example: Violin, Piano, Vocals, Theory, Etc).
- Prompt the user to fill focus when it is missing on an education record.
- Daisy-chain education items across receipts into a single student-focus context.
- Enable left/right swiping between chained contexts on the education detail screen.
- Detect continuity gaps primarily via dates and secondarily via term/semester/year syntax.
- Show associated transaction record(s) in the footer (usually one).

## Non-goals
- No new backend tables required for v1; continue using JSON fields in line items.
- No changes to the existing receipt-to-transaction navigation flow.

## Data Model Changes
Add a focus field to education details JSON stored on line items.

Example:
```json
{
  "teacherName": "Jane Smith",
  "studentName": "Jason",
  "subtitle": "Acme Music Academy",
  "focus": "Guitar",
  "frequency": "Weekly",
  "duration": "30 min",
  "startDate": "2025-01-15",
  "endDate": "2025-03-20",
  "daysOfWeek": ["Wednesday"],
  "times": ["4:00 PM"]
}
```

Update types in `EducationDetails` and parse/store `focus` alongside existing fields.

## UX and UI Changes
### Education Card
- Display focus as part of the card detail rows or subtitle.
- If focus is missing, show a subtle indicator (for example "Focus needed").

### Education Detail
- If focus is missing, show an inline editable field with placeholder:
  "Violin, Piano, Vocals, Theory, Etc".
- Display focus near the hero or in the Schedule section.
- Add a "Learning Path" section with horizontal swipe between contexts.
- Keep "Related Records" and add a footer area to show associated transaction record(s).

### Swipe Contexts
- Use a horizontal `FlatList` with `pagingEnabled` for swiping.
- Each page represents one education context within the chain.
- The footer should reflect the currently visible context.

### Continuity Gap Prompt
- If a gap is detected, show a prompt with two actions:
  - Accept gap (keeps chain as-is)
  - Add missing receipt/record

## Chaining Logic
### Chain Key
Default chain key:
- `studentName + focus`
- Provider (teacher/merchant) is NOT included to allow chaining across provider changes

Rationale:
- Student + focus disambiguates instrument/subject.
- Excluding provider allows chaining when student switches teachers but continues same learning path (e.g., same instrument/subject).
- Multiple providers are tracked within the chain for display purposes.

### Building Chains
- Load all receipts with items.
- Extract education items and normalize key fields (lowercase, trim).
- Group items into chains by the chain key.
- Sort each chain by `startDate` (or `transactionDate` if missing).

## Continuity Gap Detection
### Primary: Date-Based
- Use `startDate`, `endDate`, `frequency`, `daysOfWeek`, and `times`.
- Derive expected occurrences (can reuse `generateEducationEvents`).
- A gap occurs when a next expected date is missing and the delta exceeds a tolerance.

### Secondary: Term/Semester/Year Parsing
- Parse patterns from title/subtitle, for example:
  - "Term 1 2025"
  - "Semester 2 2024"
  - "2025 Term 3"
- If dates are incomplete, use term ordering as a secondary signal.

## Associated Transactions
- For each education context, list associated transaction record(s) in the footer.
- Default to one Transaction card, but allow multiple if found.

## Suggested Implementation Steps
1. Add `focus` to `EducationDetails` type and parsing.
2. Save `focus` in `educationDetails` JSON on edit.
3. Display focus on Education card and detail screen.
4. Add focus prompt UI when missing with the specified placeholder.
5. Build chaining helper (for example `lib/educationChain.ts`).
6. Add swipeable contexts on education detail.
7. Add continuity gap detection and prompt.
8. Add associated transaction footer section.

## Risks and Edge Cases
- Missing `studentName` or `focus` may cause over-grouping; prompt for focus mitigates.
- Incomplete dates may reduce accuracy of gap detection; term parsing is a fallback.
- Very long chains could affect performance; limit displayed items or lazy load.

## Acceptance Criteria
- Focus is stored and visible on education cards and detail screens.
- If focus is missing, user is prompted to fill it with the provided placeholder.
- Education detail supports left/right swipe across chained contexts.
- Continuity gaps are detected and surfaced with a prompt.
- Associated transaction record(s) appear in the footer for each context.
