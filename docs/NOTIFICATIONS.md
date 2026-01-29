# Notifications Feature

**Status:** Active
**Re-enabled:** January 2026

## Overview

The notification system provides local notifications for lesson reminders, gear enrichment prompts, warranty expiration alerts, and more. The system uses lazy loading to gracefully degrade in environments where the native module isn't available.

## Configuration

### app.json Plugin

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "color": "#f5c518"
        }
      ]
    ],
    "android": {
      "permissions": [
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE"
      ]
    }
  }
}
```

### App Initialization

In `app/_layout.tsx`, notifications are initialized after database setup:

```typescript
import { initializeChannels } from "@lib/notifications/Channels";
import { reconcileNotifications, cleanupStaleNotifications } from "@lib/notifications/Reconciler";

// In useEffect after initDatabase():
await initializeChannels();
await cleanupStaleNotifications();
await reconcileNotifications();
```

## File Structure

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

### Database Tables

The notification tables in `db/schema.ts`:
- `notificationSettings` - User preferences
- `notificationEvents` - Notification lifecycle tracking

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

All modules use lazy loading via dynamic `import('expo-notifications')` to gracefully handle environments where the native module isn't available.

## Development

### Testing in Expo Go
Notifications will gracefully degrade - the module will log warnings but won't crash. To test actual notifications, use a development build.

### Testing with Development Build

```bash
# Create a development build
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

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
