# Cloud Logging Implementation Guide

This guide explains how to manually add cloud logging to the AdMob components in the Crescender mobile app.

## Prerequisites

✅ **Already Completed:**
- Cloud logger utility created at `lib/cloudLogger.ts`
- Supabase migration created at `supabase/migrations/20260129_create_app_logs.sql`
- AdMob SDK initialization instrumented in `app/_layout.tsx`

## Step 1: Run Supabase Migration

First, apply the migration to create the `app_logs` table:

```bash
cd /Users/linc/Dev-Work/Crescender/crescender-mobile
npx supabase db push
```

Or manually run the SQL in the Supabase dashboard.

## Step 2: Add Logging to RewardedAd Component

**File:** `components/ads/RewardedAd.tsx`

### 2.1 Add Import (Line 3)

After the existing imports, add:

```typescript
import { cloudLog } from '@lib/cloudLogger';
```

### 2.2 Add Logging to `initializeAd` Function

**Location: Line ~133** (after `try {`)

```typescript
try {
  cloudLog.info('ads', 'Creating rewarded ad', { adUnitId, platform: Platform.OS });
  
  // Create and load the rewarded ad with error handling
  ad = RewardedAd.createForAdRequest(adUnitId, {
```

**Location: Line ~145** (in LOADED event listener, replace `console.log`)

```typescript
unsubscribeLoaded = ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
  setIsLoaded(true);
  setIsLoading(false);
  cloudLog.info('ads', 'Rewarded ad loaded successfully');
  // If user requested to show ad, show it now that it's loaded
```

**Location: Line ~160** (in EARNED_REWARD event listener, after `console.log`)

```typescript
unsubscribeEarned = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: any) => {
  console.log('User earned reward:', reward);
  cloudLog.info('ads', 'User earned reward from ad', { reward });
  setIsLoaded(false);
```

**Location: Line ~187** (in ERROR event listener, after `console.error`)

```typescript
unsubscribeError = ad.addAdEventListener(RewardedAdEventType.ERROR, (error: any) => {
  console.error('Rewarded ad error:', error);
  cloudLog.error('ads', 'Rewarded ad failed to load', { 
    error: error?.message || String(error),
    code: error?.code 
  });
  setIsLoaded(false);
```

**Location: Line ~212** (in catch block, after `console.error`)

```typescript
} catch (error) {
  console.error('Error initializing rewarded ad:', error);
  cloudLog.error('ads', 'Error initializing rewarded ad', { 
    error: (error as Error)?.message || String(error),
    stack: (error as Error)?.stack
  });
  setIsLoaded(false);
```

## Step 3: Add Logging to BannerAd Component

**File:** `components/ads/BannerAd.tsx`

### 3.1 Add Import

```typescript
import { cloudLog } from '@lib/cloudLogger';
```

### 3.2 Add Logging to Event Handlers

Find the `onAdLoaded` handler and add:

```typescript
onAdLoaded={() => {
  cloudLog.info('ads', 'Banner ad loaded successfully', { adUnitId });
}}
```

Find the `onAdFailedToLoad` handler and add:

```typescript
onAdFailedToLoad={(error) => {
  cloudLog.error('ads', 'Banner ad failed to load', { 
    error: error?.message || String(error),
    adUnitId 
  });
}}
```

## Step 4: Add Logging to ATTRequest Component

**File:** `components/ads/ATTRequest.tsx`

### 4.1 Add Import

```typescript
import { cloudLog } from '@lib/cloudLogger';
```

### 4.2 Add Logging After Permission Request

Find where `requestTrackingPermissionsAsync()` is called and add logging:

```typescript
const { status } = await requestTrackingPermissionsAsync();
cloudLog.info('ads', 'ATT permission requested', { 
  status,
  platform: Platform.OS 
});
```

## Step 5: View Logs in Supabase

### Option 1: Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → `app_logs`
3. Filter by `category = 'ads'`
4. Sort by `created_at DESC`

### Option 2: SQL Editor

```sql
-- View all ad-related logs (most recent first)
SELECT 
  created_at,
  level,
  message,
  metadata,
  device_info->>'platform' as platform,
  device_info->>'appVersion' as app_version
FROM app_logs 
WHERE category = 'ads' 
ORDER BY created_at DESC 
LIMIT 100;

-- View logs for a specific session
SELECT * FROM app_logs 
WHERE session_id = 'YOUR_SESSION_ID'
ORDER BY created_at ASC;

-- View only errors
SELECT 
  created_at,
  message,
  metadata,
  device_info
FROM app_logs 
WHERE level = 'error' AND category = 'ads'
ORDER BY created_at DESC 
LIMIT 50;

-- View logs from the last hour
SELECT * FROM app_logs 
WHERE created_at > NOW() - INTERVAL '1 hour'
  AND category = 'ads'
ORDER BY created_at DESC;
```

## Step 6: Test the Logging

1. **Run the mobile app** on a physical device or simulator
2. **Navigate to** `/get-more-scans` screen
3. **Tap "Watch Ad"** button
4. **Check Supabase** for log entries

Expected log sequence:
1. `Starting AdMob SDK initialization` (on app launch)
2. `AdMob module imported successfully`
3. `AdMob SDK initialized successfully`
4. `Creating rewarded ad` (when user taps "Watch Ad")
5. `Rewarded ad loaded successfully` OR `Rewarded ad failed to load`
6. `User earned reward from ad` (if user completes the ad)

## Troubleshooting

### No Logs Appearing

1. **Check Supabase connection:** Verify `lib/supabase.ts` is configured correctly
2. **Check RLS policies:** Ensure the user can insert into `app_logs`
3. **Check console:** Look for `[CloudLogger]` warnings
4. **Check network:** Logs are batched every 5 seconds, wait a bit

### Logs Not Batching

The logger batches logs every 5 seconds. To force immediate flush:

```typescript
import { cloudLog } from '@lib/cloudLogger';

// After logging something important
await cloudLog.flush();
```

### Too Many Logs

Adjust the logger configuration in `lib/cloudLogger.ts`:

```typescript
// Only log errors
private minLevel: LogLevel = 'error';

// Only log specific categories
private enabledCategories: Set<LogCategory> = new Set(['ads']);
```

## Next Steps

Once logging is working:

1. **Diagnose ad issues** based on the logs
2. **Check for common problems:**
   - AdMob SDK not initializing
   - Ad unit IDs incorrect
   - ATT permission denied (iOS)
   - Network connectivity issues
   - Ad inventory not available
3. **Implement fixes** based on findings
4. **Monitor logs** during testing

## Log Categories Reference

- `ads` - AdMob SDK, ad loading, ad display
- `scan` - Receipt scanning, image processing
- `upload` - Bulk upload, file processing
- `quota` - Scan quota checks, limits
- `auth` - Authentication, user sessions
- `db` - Database operations
- `general` - Everything else

