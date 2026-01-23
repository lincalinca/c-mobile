# Education → Event Creation & Device Calendar Integration

**Proposal**  
Two features: (1) create lesson/event records from education using frequency, and (2) offer “Add to device calendar” for all events with a canonical app link in the description.

---

## Part A: Education → Event Creation (simpler)

### Current state

- **Education** is a line item with `educationDetails` JSON: `teacherName`, `studentName`, `subtitle`, `frequency`, `duration`, `startDate`, `endDate`, `daysOfWeek?: string[]`, `times?: string[]`.
- **Events** today: (a) line items with `category === 'event'`, or (b) **generated** from services in `reshapeToResults` (e.g. `event_${item.id}`, `event_${item.id}_pickup`, `_dropoff`) as `ResultItem`s; they are not stored as line items.
- Education does **not** currently generate any event `ResultItem`s.

### Goal

From an education record, support:

1. **Single lesson** – one event for a given date/time.
2. **Series** – multiple events from `startDate` to `endDate` using `frequency`, `daysOfWeek`, and `times`.

### Data we have

| Field        | Type     | Example                          | Use |
|-------------|----------|----------------------------------|-----|
| `frequency` | string   | `"Weekly"`, `"Fortnightly"`      | Interval between lessons |
| `startDate` | string   | `"2024-03-01"`                   | Range start |
| `endDate`   | string   | `"2024-12-15"`                   | Range end |
| `daysOfWeek`| string[] | `["Monday","Wednesday"]`         | Which weekdays |
| `times`     | string[] | `["4:00 PM","4:30 PM"]`          | Time(s); if multiple, need a rule (e.g. first, or one per) |
| `duration`  | string   | `"30 min"`                       | For end time if we only have start |

`frequency` is free text. For a first version we can parse:

- **Weekly** → every 7 days on `daysOfWeek`
- **Fortnightly** → every 14 days on `daysOfWeek`
- **Monthly** → e.g. same day-of-month each month (if we can infer)
- **One-off** / empty → single event at `startDate` + first `times` (or receipt date)

### 1. Extend `reshapeToResults` for education (mirroring services)

- In the `education` branch, after pushing the education `ResultItem`, **generate** `ResultItem`s of type `'event'`.
- Reuse the same ID pattern as services: `event_${item.id}` for a single lesson, or `event_${item.id}_${index}` / `event_${item.id}_${dateString}` for a series so each has a stable ID.
- `ResultItem` fields: `id`, `type: 'event'`, `title` (e.g. `"Piano – Lesson"` or `"Piano – Lesson 3 of 12"`), `subtitle`, `date`, `metadata` (e.g. `venue`, `duration`, `frequency`, `startDate`, `endDate`), `receiptId`, `links` to the education item and transaction.

Single-lesson logic:

- If no `startDate`/`endDate`/`frequency`/`daysOfWeek` that we can use for a series: one event.
- Date: `startDate` or `receipt.transactionDate`.
- Time: first of `times` if present; else all-day or a default.

Series logic:

- Parse `startDate`, `endDate`, `frequency`, `daysOfWeek`, `times`.
- Iterate from `startDate` to `endDate`:
  - **Weekly**: advance by 7 days; include only if `weekday` is in `daysOfWeek`.
  - **Fortnightly**: advance by 14 days; same `daysOfWeek` filter.
  - **Monthly**: same day-of-month; `daysOfWeek` can optionally filter.
- For each occurrence: one `ResultItem` with `event_${item.id}_${YYYY-MM-DD}` (or `_${index}` if you prefer).
- Cap: e.g. max 52 occurrences per education item to avoid huge lists.

### 2. UI: “Create events” on Education detail

- **Education detail** (`app/education/[id].tsx`): add an action, e.g. **“Create lesson events”** or **“Add to calendar”** (if we fold in Part B).
- On tap:
  - If we can’t build any occurrence (no dates, etc.): toast “Add start/end and schedule in Education details to create events.”
  - If we can: run the same series logic as in `reshapeToResults`, but this time we **also** drive the “Add to device calendar” flow (Part B) for each generated event.
- Optional: a small **“Events”** block on the education detail listing the generated event(s) with links to `/events/[id]`, same as services.

### 3. Optional: persist vs generated-on-the-fly

- **Recommended for v1:** keep events **generated on the fly** in `reshapeToResults` and in the education “Create lesson events” flow. No new tables. Same pattern as service events.
- **Later:** if we need editable lesson-specific data or to track “added to device calendar,” we could add an `education_events` or `generated_events` table. Out of scope for this proposal.

### 4. Parsing `frequency` and `times`

- **frequency:** `Weekly` / `weekly` → 7 days; `Fortnightly` / `fortnightly` / `every 2 weeks` → 14; `Monthly` / `monthly` → 1 month; else treat as one-off.
- **times:** if `times = ["4:00 PM","4:30 PM"]`, treat as one slot per occurrence (e.g. first) or define a rule (e.g. “each occurrence gets the first time”). For **duration**, parse `"30 min"` / `"1 hr"` to compute `endDate` of the event when adding to device calendar.
- **daysOfWeek:** map `"Monday"` → 1 (or `Calendar.DayOfTheWeek.Monday` if we use expo-calendar recurrence), etc. Normalise case.

### 5. Files to touch

- `lib/results.ts` – education branch: add event generation (single + series) with the chosen ID scheme and `ResultItem` shape.
- `lib/educationEvents.ts` (new) – `generateEducationEvents(educationLineItem, receipt): ResultItem[]` used by `results.ts` and by the education detail “Create lesson events” flow. Handles parsing of `frequency`, `daysOfWeek`, `times`, `duration`, and capping.
- `app/education/[id].tsx` – “Create lesson events” button, call `generateEducationEvents`, then for each event run the “Add to device calendar” flow (Part B). Optionally an “Events” list linking to `/events/[id]`.

### 6. Edge cases

- No `startDate`: use `receipt.transactionDate` for a single event.
- No `endDate` for series: cap at 6 or 12 months from `startDate`, or 52 occurrences.
- `daysOfWeek` empty: for weekly/fortnightly, assume all weekdays or a single day from `startDate`; document the rule.
- `times` empty: create all-day events or use a default (e.g. 09:00); document.

---

## Part B: Device Calendar Integration & Canonical Link (more involved)

### Goal

Whenever an event is created or shown (from education, services, concerts, deliveries, or ad‑hoc event line items):

1. **Offer** “Add to device calendar” for that event.
2. **Pre-fill** the device calendar event with a **canonical URL** in the description/notes that links back to the app, e.g. `crescender://cal:eventcode` (or `crescender://cal/<eventId>`). The notes should look like typical meeting invites: a short line with the URL.

### Canonical link format

- **Pattern:** `crescender://cal/<eventId>`
  - `eventId` = the same id we use in the app for that event: `events/[id]` (e.g. line item id, or `event_${serviceId}_pickup`, or `event_${educationId}_2024-03-15`).
- **Alternative:** `crescender://cal:event:<eventId>` if we want a `cal` “action” or to reserve `cal` for other uses later. The proposal uses `crescender://cal/<eventId>` for simplicity.
- **Scheme:** `app.json` currently has `"scheme": "crescender-mobile"`. To support `crescender://` we can either:
  - Add a second scheme `crescender` in the Expo config, or
  - Use `crescender-mobile://cal/<eventId>` as the canonical form.  
  Recommendation: add `crescender` so `crescender://cal/<eventId>` works; keep `crescender-mobile` for existing links if needed.

### Deep link handling

- **Path:** `/cal/:eventId` or `cal/<eventId>`.
- **Handler:** resolve `eventId` to the correct screen:
  - `event_*` or plain line-item id that corresponds to an event → `router.replace('/events/' + eventId)`.
- **Expo / React Navigation:** ensure the `crescender` (and optionally `crescender-mobile`) scheme and path are in the linking config so `Linking` and the OS route into the app and to `/events/[id]`.

### Device calendar: two implementation options

#### Option 1: `createEventInCalendarAsync` (recommended for UX and permissions)

- **API:** `Calendar.createEventInCalendarAsync(eventData, presentationOptions?)`
- **Behavior:** Opens the **system** “Create event” UI with our fields pre-filled. User can edit and save or cancel. **No calendar permission required on iOS** when using this API.
- **eventData** we pass:
  - `title`: event title (e.g. “Piano – Lesson”, “Guitar setup – Pickup”).
  - `startDate`, `endDate`: `Date`; we derive from `date`, `metadata.startDate`/`endDate`, `metadata.duration`, `times`.
  - `location`: `metadata.venue` or `receipt.merchant` when relevant.
  - `notes`:  
    - One or two lines of context (e.g. “Lesson with [teacher]. From Crescender.”).  
    - Then the canonical link on its own line:  
      `https://crescender.app/events/...` or, better for in-app:  
      `crescender://cal/<eventId>`  
    - So notes look like:  
      `Lesson with Jane. From Crescender.\ncrescender://cal/event_abc123_2024-03-15`
- **Android:** needs `READ_CALENDAR` / `WRITE_CALENDAR` if we also use `createEventAsync`; for *only* `createEventInCalendarAsync` the docs suggest the system UI path may not require them—confirm for Android. If we need to fall back to `createEventAsync`, we’ll need permissions.

#### Option 2: `createEventAsync` (direct insert)

- **API:** `Calendar.createEventAsync(calendarId, eventData)`
- **Behavior:** We need to request calendar permission, get a `calendarId` (e.g. default), then create the event in the background. No system UI.
- **Pros:** One tap to add; we can show “Added to calendar” and optionally store the device `eventId` for “Remove from calendar” later.  
- **Cons:** Permission flow, platform differences (e.g. iOS `calendarId` can be ignored in some flows), and we must handle `isAvailableAsync()` and Android/iOS‑only.

### Recommendation for Part B

- **Primary:** Use **`createEventInCalendarAsync`** so the user sees the native sheet with our title, dates, location, and **notes including the canonical link**. Aligns with “like meeting URLs in the body.”
- **Fallback:** On platforms where `createEventInCalendarAsync` is not available or fails, show an Alert with the canonical URL and “Copy link” so the user can paste it into their calendar manually.
- **expo-calendar:** Add `expo-calendar` and, if we ever use `createEventAsync`, the `expo-calendar` plugin with `calendarPermission` in `app.json`. For `createEventInCalendarAsync`-only, iOS may not need the permission; still set `NSCalendarsUsageDescription` for consistency and for any future `createEventAsync`/`getCalendarsAsync` use.

### Notes field and URL encoding

- expo-calendar `Event.notes` is a string. We put the raw `crescender://cal/<eventId>` in it. There is a [known issue](https://github.com/expo/expo/issues/13804) with `url` being over-encoded on iOS; we are using `notes`, not `url`, so we avoid that. If we later add `url` on iOS, we should test that it stays clickable.

### Where to offer “Add to device calendar”

- **Event detail** (`app/events/[id].tsx`): floating button or header action “Add to calendar”. Build `eventData` from the current `ResultItem` (or resolved line item + metadata), include `notes` with the canonical link, then `createEventInCalendarAsync(eventData)`.
- **Education detail** (“Create lesson events”): after generating the list of education events, we can:
  - **A)** Show a list of generated events; each has “Add to calendar” that does `createEventInCalendarAsync` for that one; or
  - **B)** One “Add all to calendar” that opens the system UI once per event (could be disruptive if there are many); or
  - **C)** For series, only offer “Add to calendar” from the **event detail** when viewing one of the generated events.  
  Recommendation: (A) plus (C)—each event (whether from education, service, or event line item) has “Add to calendar” on its **event detail** page; on education we can also offer it from the list of generated events.
- **Service detail** (`app/services/[id].tsx`): for each related event (pickup, dropoff, overall), we can add “Add to calendar” on the service page or rely on the event detail. Prefer event detail for consistency.
- **Other event sources** (concerts, deliveries, etc.): same as event detail; any screen that renders an event gets an “Add to calendar” that uses the same helper.

### Shared helper for “Add to calendar”

- **`lib/calendarExport.ts`** (or `lib/deviceCalendar.ts`):
  - `buildCalendarEventFromResultItem(item: ResultItem, receipt?: Receipt | null): { title, startDate, endDate, location?, notes }`
    - `notes` = `[optional context]\ncrescender://cal/<item.id>`
  - `getCanonicalEventUrl(eventId: string): string`  
    - returns `crescender://cal/<eventId>`
  - `addEventToDeviceCalendar(item: ResultItem, receipt?: Receipt | null): Promise<void>`
    - calls `buildCalendarEventFromResultItem`, then `Calendar.createEventInCalendarAsync(eventData)`
    - if `!Calendar.isAvailableAsync()` or API throws: show alert with `getCanonicalEventUrl(item.id)` and “Copy link”
- **`app.json`:** add `expo-calendar` plugin and, if needed, `crescender` scheme.  
- **Linking:** handle `crescender://cal/<eventId>` (and `crescender-mobile://cal/<eventId>` if we keep it) and route to `/events/[eventId]`.

### App config changes

- **Scheme:** add `crescender` (or switch to `crescender`) so `crescender://cal/<id>` works. If we support both: `"scheme": ["crescender-mobile", "crescender"]` if Expo allows an array; otherwise pick one and document.
- **expo-calendar plugin:**
  ```json
  ["expo-calendar", { "calendarPermission": "Crescender would like to add events to your calendar so you can view lessons and appointments next to your schedule." }]
  ```
- **Android:** if we use `createEventAsync` or any read path, add `READ_CALENDAR` and `WRITE_CALENDAR` to `android.permissions` or the manifest as per Expo/Android docs.

### Files to touch (Part B)

- `lib/calendarExport.ts` – `buildCalendarEventFromResultItem`, `getCanonicalEventUrl`, `addEventToDeviceCalendar`.
- `app/events/[id].tsx` – “Add to calendar” button, call `addEventToDeviceCalendar`.
- `app/education/[id].tsx` – when showing generated education events, “Add to calendar” per event reusing the same helper; the `ResultItem` passed in is the generated education event.
- `app/services/[id].tsx` – optional “Add to calendar” for each related event, or link through to event detail.
- `app/_layout.tsx` or `app/+config.ts` (or wherever Expo Router linking is configured) – handle `crescender://cal/<eventId>` → `/events/[eventId]`.
- `app.json` – `expo-calendar` plugin, `NSCalendarsUsageDescription` (or plugin), and `crescender` scheme.
- `package.json` – `expo-calendar`.

---

## Summary

| Part | Scope | Complexity | Main work |
|------|-------|------------|-----------|
| **A. Education → events** | Generate lesson/event `ResultItem`s from education using frequency, start/end, days, times; “Create lesson events” in education detail | Lower | `lib/educationEvents.ts`, `lib/results.ts`, `app/education/[id].tsx` |
| **B. Device calendar + link** | “Add to calendar” for any event; `notes` includes `crescender://cal/<eventId>`; deep link `crescender://cal/<id>` → `/events/[id]` | Higher | `expo-calendar`, `lib/calendarExport.ts`, `app/events/[id].tsx`, linking + `app.json` |

Part A can be done first and will work without Part B (events show in the app and in education detail; “Add to calendar” can be added later). Part B is what makes the device calendar and canonical link work for education-generated events, service events, and all other event types in one go.

---

## Open questions

1. **Scheme:** Prefer `crescender://` or keep `crescender-mobile://` as the canonical form?
2. **`frequency` and `times`:** Any extra values we must parse (e.g. “Every 3 weeks”, “Biweekly”) or a fixed “first time in the list” rule for `times`?
3. **Cap for series:** 52 occurrences, 12 months, or configurable?
4. **`createEventInCalendarAsync` vs `createEventAsync`:** Proceed with system UI first and add silent `createEventAsync` as a later option, or support both from the start (e.g. “Add to calendar” = system UI, “Add without opening” = `createEventAsync` behind a long-press or setting)?
