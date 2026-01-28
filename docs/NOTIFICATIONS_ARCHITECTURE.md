## Notifications Architecture & Implementation Plan

**Date:** 28/Jan/2026  
**Status:** Design approved – ready for implementation

This document defines how notifications will be implemented in `crescender-mobile` so that:

- The design survives future upgrades (e.g. SDK 55 and beyond).
- Responsibilities are clearly separated (SOLID).
- Logic is centralised and reusable (DRY).
- Notifications integrate cleanly with existing **backup/restore** and **local‑first** patterns.

---

## 1. High‑Level Goals

- **User‑centric**: clear controls in Settings; no surprise spam.
- **Predictable cadence**: target **3–6 notifications/week** per user on average.
- **Category‑based**: every notification belongs to a named category (lessons, gear, warranties, etc.).
- **Derived from data**: notifications are generated from domain data (gear, education, services), not the other way around.
- **Recoverable**: after a backup/restore, notifications can be safely re‑derived from the database.

---

## 2. Core Infrastructure (Step 1)

### 2.1 Dependencies & Config

- Add `expo-notifications` (SDK‑54 compatible).
- In `app.json` ensure the plugin is registered:

```json
"plugins": [
  "expo-router",
  "expo-tracking-transparency",
  ["expo-calendar", { "calendarPermission": "…" }],
  "expo-font",
  "expo-notifications"
]
```

This keeps us aligned with how notifications are configured in SDK 55+ (via config plugins rather than `notification` in `app.json`).

### 2.2 Modules & Responsibilities

All new modules live under `lib/notifications/`, plus a small helper under `lib/navigation/`.

#### 2.2.1 `lib/notifications/types.ts`

- Define fundamental types:

```ts
export type NotificationCategory =
  | 'lessons'
  | 'gear_enrichment'
  | 'warranty'
  | 'maintenance'
  | 'reengagement'
  | 'service';

export interface NotificationMetadata {
  gearId?: string;
  lessonId?: string;
  serviceId?: string;
  personId?: string;
  [key: string]: string | number | boolean | null | undefined;
}
```

#### 2.2.2 `lib/notifications/PermissionManager.ts`

**Responsibility:** talk to the OS (via `expo-notifications`) about permissions – and nothing else.

Public API:

- `getPermissionStatus(): Promise<'granted' | 'denied' | 'blocked'>`
- `ensurePermissionGranted(): Promise<'granted' | 'denied' | 'blocked'>`

Notes:

- `ensurePermissionGranted` is only called when the user enables global notifications or a category for the first time.
- Components never call `expo-notifications` directly – they go through this module.

#### 2.2.3 `lib/notifications/NotificationRepository.ts`

**Responsibility:** persistence (SQLite / Drizzle) for notification settings and history.

Tables (in `db/schema.ts`):

- `notification_settings`
  - `id` (single row)
  - `globalEnabled: boolean`
  - `perCategoryEnabled: Record<NotificationCategory, boolean>` (serialised JSON)
  - `dailyLimit: number`
  - `weeklyLimit: number`
- `notification_events`  
  Represents **individual notification lifecycle events**, not just “something happened sometime”.
  - `id`
  - `category: NotificationCategory`
  - `key: string` – **stable idempotency key**, e.g. `lessons|lineItemId|2025‑03‑04T18:00:00Z`
  - `scheduledAt: string` (ISO UTC) – when we scheduled it
  - `triggerAt: string` (ISO UTC) – when it is/was meant to fire
  - `status: 'scheduled' | 'delivered' | 'cancelled'`
  - `metadata: NotificationMetadata` (JSON)

Notes:

- `notification_events` is the **authoritative history** for both policy (cooldowns, weekly caps) and reconciliation.
- On backup/restore we retain these rows, so we can tell “was scheduled but never fired” vs “already delivered”.

perCategoryEnabled behaviour:

- When loading settings, always normalise against a **category default map** so that:
  - New categories added in a future release get explicit defaults (e.g. `false`) instead of `undefined`.
  - UI and policy never see `undefined` – they operate on a fully populated `Record<NotificationCategory, boolean>`.

The repository exposes simple CRUD methods used by higher‑level services and policy.

#### 2.2.4 `lib/notifications/Scheduler.ts`

**Responsibility:** abstraction over `expo-notifications` scheduling.

Public API:

- `scheduleLocalNotification({ category, title, body, triggerDate, deepLink, metadata })`
- `cancelByKey(key: string)`
- `cancelByCategory(category: NotificationCategory)`

Behaviour:

- Computes a **stable notification key** (`NotificationRepository`’s `key` field) based on:
  - `category`
  - domain identifier(s) from `metadata` (e.g. `gearId` / `lessonId`)
  - `triggerDate`
- Before scheduling:
  - Checks for an existing `notification_events` row with the same `key`.
  - If `status === 'scheduled'` and `triggerAt` is unchanged → **idempotently skip**.
  - If `status === 'scheduled'` but `triggerAt` changed (e.g. lesson time edited) → cancel prior OS notification and update the row.
- When actually scheduling:
  - Stores the OS notification identifier alongside the `key` so we can cancel later.
  - Attaches a deep link and metadata (`data` field).
  - Inserts/updates `notification_events` with `status: 'scheduled'` and correct `triggerAt`.

Cancellation responsibilities:

- `cancelByKey`:
  - Cancels the OS notification for that key (if scheduled).
  - Updates `notification_events.status` to `'cancelled'`.
- `cancelByCategory`:
  - Used when a category is disabled; iterates keys for that category and cancels them.

> **Guardrail:** no UI or policy logic here – only “given an allowed notification, tell the OS to schedule it”.

#### 2.2.5 `lib/notifications/Channels.ts` (Android / iOS categories)

**Responsibility:** define OS‑level channels/categories so users have fine‑grained control in settings.

- On **Android**:
  - Create `NotificationChannel`s per category or logical group (`lessons`, `gear`, `account`, etc.).
  - Map `NotificationCategory` → channel id when scheduling.
- On **iOS**:
  - Define categories/actions where appropriate (e.g. “Call educator” action on service reminders).

> This keeps platform‑specific concerns out of `Scheduler` and `Service`, while still giving OS‑native controls.

#### 2.2.6 `lib/notifications/Policy.ts`

**Responsibility:** all rate‑limiting and category‑specific rules in one place.

Example:

```ts
export const NOTIFICATION_POLICY = {
  global: { dailyMax: 1, weeklyMax: 6 },
  perCategory: {
    lessons:        { cooldownDays: 0 },   // one per lesson occurrence
    gear_enrichment:{ cooldownDays: 3 },
    warranty:       { cooldownDays: 7, maxPerItem: 2 },
    maintenance:    { cooldownDays: 60 },
    reengagement:   { cooldownDays: 21 },
    service:        { cooldownDays: 1 },
  },
} as const;
```

Helper:

- `canSend(category, context): Promise<boolean>`
  - Reads `notification_settings` for global + per‑category toggles.
  - Reads `notification_events` to:
    - Enforce category cooldowns (based on `triggerAt` or `delivered` timestamps).
    - Enforce global daily/weekly caps.
    - Enforce per‑item limits (e.g. `maxPerItem` for warranty).
  - Uses a **well‑defined “local day” boundary**:
    - Convert `triggerAt` / `delivered` timestamps to device local time.
    - Count “today” as `[startOfLocalDay, endOfLocalDay)`; “last 7 days” as the 7 previous local days.

> **DRY guardrail:** every notification type goes through `canSend`. Tuning cadence later means updating this file, not chasing ad‑hoc checks across the app.

#### 2.2.7 `lib/notifications/Service.ts`

**Responsibility:** “use‑case” layer for each notification type.

Examples:

- `sendLessonReminder(context)`
- `sendGearEnrichmentNudge(context)`
- `sendWarrantyReminder(context)`
- `sendMaintenancePrompt(context)`
- `sendReengagementPrompt(context)`
- `sendServicePickupReminder(context)`

Each method:

1. Calls `Policy.canSend(category, context)`.
2. If allowed, builds `title`, `body`, `deepLink`, `triggerDate`, `metadata`.
3. Calls `Scheduler.scheduleLocalNotification(...)`.
4. Ensures the `NotificationRepository` row is updated with the correct `status`, `triggerAt`, and `key`.

Optional: some categories (e.g. critical service pick‑ups) may be allowed to **bypass global caps**:

- Policy can include a `priority: 'normal' | 'critical'` flag.
- `canSend` can treat `'critical'` as allowed even if the daily/weekly cap is reached, while still respecting user‑level “global off”.

> **SOLID:** this layer knows the **domain** (lessons, gear, services), but nothing about React components or OS specifics.

#### 2.2.8 `lib/navigation/deeplinks.ts`

**Responsibility:** central place to construct deep links:

- `linkToEducationItem(lineItemId: string): string`
- `linkToGearItem(gearId: string): string`
- `linkToService(serviceId: string): string`
- etc.

> **Guardrail:** prevents multiple hard‑coded deep link formats from appearing in different services.

### 2.3 Permissions Pattern

- Only request OS permission when:
  - The **global** toggle is turned on, or
  - The first category is enabled while global is off.
- If permission is denied/blocked:
  - Revert the toggle back to off.
  - Show a friendly explanation in the UI.

> **SRP:** components do not talk to `expo-notifications` directly; they only talk to hooks/services that in turn use `PermissionManager`.

### 2.4 Backup & Restore

- Notification tables live in the same SQLite DB as the rest of the app, so:
  - They are already covered by existing backup & restore (database + images).
- Local OS notifications are treated as **derived state**:
  - After restore, a `NotificationReconciler` runs on app start to:
    - Inspect domain data (lessons, services, warranties).
    - Re‑schedule future notifications based on the current `Policy`.

> **Guardrail:** do not attempt to fully restore OS notification IDs; only re‑derive what should exist in the future based on domain truth.

---

## 3. Settings → Notifications Page (Step 2)

### 3.1 Route & Layout

- New route: `app/settings/notifications.tsx`.
- Content:
  - Header: “Notifications”.
  - Toggles:
    - Global: **“Allow notifications”**.
    - Per category:
      - “Lessons & calendar reminders”
      - “Gear photos & enrichment”
      - “Warranty & upgrade reminders”
      - “Instrument maintenance reminders”
      - “We miss you / educator discovery”
      - “Service & repairs (pick‑ups, follow‑ups)”

### 3.2 Hook: `useNotificationSettings`

File: `hooks/useNotificationSettings.ts`.

Responsibilities:

- Load and write `notification_settings` via `NotificationRepository`.
- Expose:
  - `settings`
  - `updateGlobal(enabled: boolean)`
  - `updateCategory(category: NotificationCategory, enabled: boolean)`

Behaviour:

- When enabling:
  1. Call `PermissionManager.ensurePermissionGranted()`.
  2. If not granted, revert toggle and show an explanation.
- When disabling:
  - Update DB.
  - Call `Scheduler.cancelByCategory(category)` so existing OS‑scheduled notifications are not delivered after the user opts out.

> **DRY guardrail:** this is the only place UI toggles interact with both the DB and OS notification permissions.

### 3.3 First‑Run UX

- If no settings row exists:
  - Initialise with sensible defaults (e.g. global disabled, categories defaulted but inactive until permission is granted).
  - Show a short explainer at top of the screen:
    - “Control how often Crescender notifies you. You can change this any time.”

---

## 4. Lesson Reminder Notifications (Step 3)

Lesson reminders are our **v1 walking skeleton** for the whole notification system.

### 4.1 Domain Integration

- New file: `lib/educationNotifications.ts`:

```ts
export async function scheduleLessonNotificationsForChain(chain: EducationChain) {
  for (const chainItem of chain.items) {
    await NotificationService.sendLessonReminder({
      chain,
      chainItem,
    });
  }
}
```

Callers:

- On create/update of an education item/series (`useEducationItemEdit`).
- From `NotificationReconciler` at startup:
  - For each active chain, schedule reminders for upcoming lessons in the next X days **using the same stable key logic**.

Idempotency:

- Both paths (edit‑time scheduling and startup reconciliation) must generate the **same `key`** for a given lesson occurrence so that:
  - We never double‑schedule the same reminder.
  - Editing a lesson time correctly cancels/reschedules instead of duplicating.

### 4.2 Content & Deep Links

- Example lesson reminder:

```ts
NotificationService.sendLessonReminder({
  category: 'lessons',
  title: `Lesson today – ${instrument}`,
  body: `${studentName} has ${instrument} lessons today at ${time}.`,
  triggerDate: computedStartMinusOffset,
  deepLink: linkToEducationItem(lineItemId),
  metadata: { lineItemId, studentName, instrument },
});
```

- Deep links use `navigation/deeplinks.ts` so notification taps always open the correct Education detail screen.

### 4.3 Time & Timezone Handling

- Store canonical timestamps in DB as **UTC**.
- Convert to device local time at scheduling.
- If `triggerDate` is already in the past when we compute it, skip scheduling.

> **Guardrail:** avoids weird behaviour when users travel or their device time changes.

---

## 5. Rate Limiting & Telemetry (Step 4)

### 5.1 Cadence Controls

Targets:

- **Global:** ~3–6 notifications/week per user.
- **Hard limits:** at most 1 notification per calendar day, unless explicitly overridden for critical operational events.

Implementation:

- `Policy.canSend` checks:
  - `notification_settings.globalEnabled`.
  - `perCategoryEnabled[category]`.
  - `notification_events`:
    - Count notifications whose `triggerAt`/`delivered` timestamps fall within **local**:
      - “today” → `[startOfLocalDay, endOfLocalDay)` (daily cap).
      - “last 7 days” → 7 preceding local days (weekly cap).
    - Time since last **delivered (or still‑scheduled)** notification for this category/context (cooldown).

All `NotificationService.sendXxx` functions must call `canSend` before scheduling.

### 5.2 Telemetry & Debugging

- In development builds:
  - Log when `canSend` returns false and why:
    - Permissions not granted.
    - Global disabled.
    - Category disabled.
    - Cooldown not elapsed.
    - Daily/weekly cap reached.
- Optional: dev‑only debug screen listing:
  - Latest `notification_events`.
  - Current `notification_settings`.
  - Derived “notifications this week” count.

This makes it easy to tune policy toward the target cadence.

### 5.3 Backup/Restore Reconciliation

- On app start (and after a restore):
  - Run a `NotificationReconciler` that:
    - Reads future‑relevant domain data (lessons, services, warranties).
    - Reads `notification_events` for existing `key`/`status`/`triggerAt` values.
    - Applies `Policy` and `NotificationSettings` to decide what to:
      - Schedule (for new or changed events).
      - Leave alone (already scheduled and unchanged).
      - Cancel (no longer valid due to domain changes or disabled categories).

> **Key principle:** domain data + policy are the source of truth; OS‑level schedules are disposable.

---

## 6. SOLID & DRY Guardrails

To keep the implementation maintainable:

- **Single Responsibility (S)**  
  - `PermissionManager`: OS permissions only.  
  - `NotificationRepository`: persistence only.  
  - `Scheduler`: scheduling only.  
  - `Policy`: all rate‑limit logic.  
  - `Service`: domain‑specific “send X” operations.  
  - UI components/hooks: presentation and user interaction only.

- **Open/Closed (O)**  
  - Adding a new category should require:
    - Extending `NotificationCategory`.
    - Adding one entry in `NOTIFICATION_POLICY.perCategory`.
    - Implementing one `sendXxx` method in `Service.ts`.
    - Wiring one toggle label in Settings.  
  - Existing functionality should not need modification.

- **Liskov Substitution (L)**  
  - If some categories later move to **server‑side push**, we can keep the `NotificationService` interface and swap the internal scheduler implementation without breaking callers.

- **Interface Segregation (I)**  
  - High‑level code depends on small, focused interfaces (`INotificationScheduler`, `INotificationRepository`, etc.), not on monolithic “god” services.

- **Dependency Inversion (D)**  
  - High‑level orchestration code depends on abstractions in `lib/notifications`, not on `expo-notifications` or raw SQLite.

- **DRY**  
  - One permission flow.  
  - One policy file.  
  - One scheduling abstraction.  
  - One place for deep link construction.

---

## 7. Implementation Order

1. **Scaffold modules & DB schema**  
   - Create files in `lib/notifications/` and `lib/navigation/deeplinks.ts`.  
   - Add `notification_*` tables in `db/schema.ts` + migrations.

2. **Implement Settings → Notifications page**  
   - Hook it up to `useNotificationSettings` and `PermissionManager`.

3. **Implement v1: Lesson reminders**  
   - Wire `educationNotifications.ts` into `useEducationItemEdit` and the startup reconciler.

4. **Add reconciling on app start / after restore**  
   - Ensure notifications can be safely re‑derived from domain data.

5. **Iterate on additional categories**  
   - Gear enrichment, warranty reminders, maintenance, re‑engagement, service pick‑ups – each implemented as a new `NotificationService.sendXxx` method plus a toggle and minimal UI.

