# Crescender Mobile – Roadmap Wishlist

A running list of future enhancements and options we’d like to support. Not committed; order and scope may change.

---

## Calendar & events

### Native direct insertion (createEventAsync)

**Status:** Roadmap / future option

**Context:** “Add to device calendar” currently uses **`createEventInCalendarAsync`**, which opens the **system** “Create event” UI with our fields (title, dates, location, notes with `crescender://cal/<id>`) pre-filled. The user edits and saves or cancels. No calendar permission is required on iOS for this path.

**Wishlist item:** Offer **native direct insertion** via **`createEventAsync(calendarId, eventData)`** as an alternative:

- **Behaviour:** One tap adds the event to the device calendar in the background. No system UI. We request calendar permission, resolve a `calendarId` (e.g. default or user‑chosen), and call `createEventAsync` with the same `eventData` we’d use for the system UI (including `notes` with `crescender://cal/<eventId>`).
- **Pros:** Faster for users who trust our pre-filled data; we could show “Added to calendar” and optionally store the device `eventId` for a future “Remove from calendar” or for de-duplication.
- **Cons:** Permission flow, platform differences (e.g. iOS `calendarId` behaviour), and we must handle `isAvailableAsync()` and Android/iOS‑only. We’d need `READ_CALENDAR` / `WRITE_CALENDAR` on Android and `NSCalendarsUsageDescription` on iOS (expo-calendar plugin can manage these).

**Possible UX:** A setting or long-press: “Add to calendar” = system UI (default); “Add without opening” or “Quick add” = direct insert. Or a second button “Quick add to calendar” when we implement it.

**Dependencies:** `expo-calendar` (already in use for `createEventInCalendarAsync`); confirm Android permissions when moving from system-UI‑only to `createEventAsync`.

---

---

## iPad Support

### Split View & Multitasking

**Status:** Roadmap / Future enhancement

**Context:** The app currently supports iPad (Universal binary) but is locked to `portrait` orientation. This prevents the app from supporting iPadOS Split View and Slide Over features properly.

**Wishlist item:** Enable flexible orientation support to unlock iPad multitasking.

- **Goal:** Allow the app to rotate and resize dynamically.
- **Task:** Update `app.json` orientation settings and audit layouts (especially the receipt scanner and detailed views) to ensure they work in landscape and narrow split-screen widths.
- **Benefit:** Provides a premium experience for iPad users who want to use Crescender alongside their calendar or music apps.
