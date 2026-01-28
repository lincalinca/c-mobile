# Notifications Feature - Archived

**Status:** Temporarily disabled
**Archived:** January 2026
**Reason:** Build/runtime issues with expo-notifications in Expo Go development environment

## Overview

The notification system was fully implemented but has been temporarily disabled to allow the app to build and run in Expo Go during development. All code is preserved and can be re-enabled when ready for native builds.

## What Was Disabled

### 1. Settings Screen (`app/settings/notifications.tsx`)
- Replaced with a "Coming Soon" placeholder
- Original implementation had master toggle + per-category toggles

### 2. App Initialization (`app/_layout.tsx`)
- Commented out imports for `initializeChannels`, `reconcileNotifications`, `cleanupStaleNotifications`
- Commented out notification initialization in the `useEffect` block

## Preserved Files (Not Modified)

All notification logic files are preserved and ready to use:

```
lib/notifications/
├── types.ts              # Type definitions (NotificationCategory, NotificationSettings, etc.)
├── PermissionManager.ts  # OS permission handling
├── Scheduler.ts          # expo-notifications scheduling interface
├── Channels.ts           # Android/iOS channel configuration
├── Policy.ts             # Rate-limiting and send policies
├── NotificationRepository.ts  # SQLite persistence for settings/events
├── Service.ts            # Domain-specific notification functions
└── Reconciler.ts         # Startup reconciliation and cleanup

hooks/
└── useNotificationSettings.ts  # React hook for settings UI

lib/
└── educationNotifications.ts   # Lesson reminder scheduling
```

### Database Tables (Still Active)
The notification tables in `db/schema.ts` remain in place:
- `notificationSettings` - User preferences
- `notificationEvents` - Notification lifecycle tracking

## Re-Implementation Steps

### Prerequisites
- Expo SDK 54+ (current: check `package.json`)
- Native build capability (EAS Build or local `expo prebuild`)
- `expo-notifications` package (already installed: `^0.32.16`)

### Step 1: Restore App Layout Initialization

In `app/_layout.tsx`:

1. Uncomment the imports at the top:
```typescript
import { initializeChannels } from "../lib/notifications/Channels";
import { reconcileNotifications, cleanupStaleNotifications } from "../lib/notifications/Reconciler";
```

2. Uncomment the initialization code in the `useEffect`:
```typescript
try {
  await initializeChannels();
} catch (e) {
  console.warn("Failed to initialize notification channels:", e);
}

try {
  await cleanupStaleNotifications();
} catch (e) {
  console.warn("Failed to cleanup stale notifications:", e);
}

try {
  await reconcileNotifications();
} catch (e) {
  console.warn("Failed to reconcile notifications:", e);
}
```

### Step 2: Restore Settings Screen

Replace the contents of `app/settings/notifications.tsx` with the original implementation.

The original code used:
- `useNotificationSettings` hook for state management
- Master toggle for global enable/disable
- Per-category toggles for 6 notification types:
  - `lessons` - Lesson & calendar reminders
  - `gear_enrichment` - Gear photos & enrichment prompts
  - `warranty` - Warranty & upgrade reminders
  - `maintenance` - Instrument maintenance reminders
  - `reengagement` - Re-engagement / educator discovery
  - `service` - Service & repairs notifications

Reference the git history for the full original implementation:
```bash
git show HEAD~1:app/settings/notifications.tsx
```

### Step 3: Configure Native Build

Ensure `app.json` has notification permissions configured:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#f5c518",
          "sounds": []
        }
      ]
    ],
    "android": {
      "permissions": ["RECEIVE_BOOT_COMPLETED", "VIBRATE"]
    }
  }
}
```

### Step 4: Test in Development Build

```bash
# Create a development build
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## Notification Categories

| Category | Description | Default Cooldown |
|----------|-------------|------------------|
| `lessons` | Lesson reminders (60 min before) | 0 days |
| `gear_enrichment` | Add photos to gear | 3 days |
| `warranty` | Warranty expiry (30 days before) | 7 days |
| `maintenance` | Maintenance prompts | 60 days |
| `reengagement` | "We miss you" nudges | 21 days |
| `service` | Service pickup reminders | 1 day |

## Rate Limiting Policy

From `lib/notifications/Policy.ts`:
- **Global limit:** 1 notification per day, 6 per week
- **Category cooldowns:** As listed above
- **Critical flag:** Can bypass certain limits for urgent notifications

## Architecture Notes

The notification system follows a layered architecture:

1. **Types** → Core type definitions
2. **Permission** → OS-level permission handling (graceful Expo Go degradation)
3. **Scheduler** → Lazy-loaded expo-notifications interface
4. **Policy** → Rate-limiting before scheduling
5. **Service** → Domain-specific notification builders
6. **Repository** → SQLite persistence via Drizzle ORM
7. **Reconciler** → Startup validation and cleanup

All modules were designed to gracefully degrade in Expo Go where native modules aren't available.

## Troubleshooting

### "expo-notifications native module not available"
- This is expected in Expo Go
- Use a development build: `npx expo run:ios` or `npx expo run:android`

### Notifications not appearing
1. Check OS permissions: Settings → App → Notifications
2. Verify `globalEnabled` is true in notification settings
3. Check rate limits haven't been exceeded
4. Ensure channels are initialized (check console for errors)

### Channel configuration issues (Android)
- Channels can only be modified before first use
- If changing importance levels, users may need to uninstall/reinstall
