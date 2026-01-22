# AdMob Integration Guide

This guide shows exactly where to integrate ads into your app **after** you've completed the AdMob setup and updated the configuration files with your App IDs and Ad Unit IDs.

---

## 📍 Integration Points

### 1. Banner Ad - Home Screen (`app/index.tsx`)

**Location:** Bottom of the home screen

**Add to:** `app/index.tsx`

```tsx
import { AdBanner } from '@/components/ads';

// Add inside the main View component, after CardGrid
return (
  <View className="flex-1" style={{ backgroundColor: 'transparent' }}>
    <PersistentHeader />
    
    {/* ... existing code ... */}
    
    <CardGrid 
      ref={gridRef}
      items={filteredResults} 
      onItemPress={handleItemPress}
      onLinkPress={handleLinkPress}
      highlightedId={highlightedId}
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
    
    {/* Add Banner Ad at bottom */}
    <AdBanner position="bottom" />
    
    {/* ... rest of component ... */}
  </View>
);
```

**Note:** The banner ad will automatically position itself at the bottom and won't interfere with your content.

---

### 2. Interstitial Ad - After Receipt Scan (`app/review.tsx`)

**Location:** Show after successful receipt save

**Add to:** `app/review.tsx`

```tsx
import { useInterstitialAd, usePreloadInterstitialAd } from '@/components/ads';

export default function ReviewScreen() {
  // Preload interstitial ad early
  usePreloadInterstitialAd();
  
  // Get interstitial ad hook
  const { show: showInterstitial } = useInterstitialAd();
  
  // ... existing code ...
  
  // Find the handleSave function and add interstitial ad after successful save
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // ... existing save logic ...
      
      // After successful save, show interstitial ad
      if (success) {
        // Small delay to let save complete
        setTimeout(() => {
          showInterstitial();
        }, 500);
        
        // Navigate back to home
        router.back();
      }
    } catch (error) {
      // ... error handling ...
    } finally {
      setSaving(false);
    }
  };
  
  // ... rest of component ...
}
```

**Alternative:** If you want to show the ad before navigating:

```tsx
const handleSave = async () => {
  try {
    setSaving(true);
    
    // ... existing save logic ...
    
    if (success) {
      // Show ad first, then navigate after ad closes
      showInterstitial();
      
      // The ad will handle navigation after it closes
      // Or you can use the ad's onAdClosed callback
      setTimeout(() => {
        router.back();
      }, 2000); // Adjust timing as needed
    }
  } catch (error) {
    // ... error handling ...
  }
};
```

---

### 3. App Tracking Transparency (ATT) - App Entry Point

**Location:** Root layout or app entry point

**Add to:** `app/_layout.tsx`

```tsx
import { ATTRequest } from '@/components/ads';

export default function RootLayout() {
  return (
    <>
      {/* Request ATT permission early in app lifecycle */}
      <ATTRequest 
        onComplete={(status) => {
          console.log('Tracking authorization status:', status);
        }}
      />
      
      {/* ... rest of your layout ... */}
    </>
  );
}
```

**Or use the hook approach:**

```tsx
import { useATT } from '@/components/ads';

export default function RootLayout() {
  const { status, requestPermission, isAuthorized } = useATT();
  
  useEffect(() => {
    if (status === 'not-determined') {
      // Request permission after a short delay
      setTimeout(() => {
        requestPermission();
      }, 1000);
    }
  }, [status]);
  
  // ... rest of your layout ...
}
```

---

## 🎯 Recommended Implementation Order

1. **First:** Add ATT request to `app/_layout.tsx`
2. **Second:** Add banner ad to `app/index.tsx`
3. **Third:** Add interstitial ad to `app/review.tsx`

---

## 🧪 Testing Integration

### Test Banner Ad
1. Run app: `npm run ios` or `npm run android`
2. Navigate to home screen
3. Banner ad should appear at bottom (test ad in development)

### Test Interstitial Ad
1. Run app
2. Scan a receipt (or use mock data)
3. Complete the review/save process
4. Interstitial ad should show (test ad in development)

### Test ATT (iOS Only)
1. Run on iOS simulator or device
2. ATT prompt should appear early in app lifecycle
3. Accept or deny to test both flows

---

## ⚠️ Important Notes

### Development vs Production
- **Development:** Components automatically use test ad IDs (`__DEV__ === true`)
- **Production:** Switch to production IDs only when building for stores
- **Never use production IDs in development** - you could get banned!

### Ad Loading
- Banner ads load automatically when component mounts
- Interstitial ads need to be preloaded - use `usePreloadInterstitialAd()` early
- Interstitial ads may take a few seconds to load

### User Experience
- Don't show ads too frequently (especially interstitials)
- Consider showing interstitial only after every 3-5 scans
- Banner ads are less intrusive and can stay visible

---

## 🔧 Customization Options

### Banner Ad Customization

```tsx
// Change position
<AdBanner position="top" />

// Change size (if needed)
<AdBanner 
  position="bottom"
  size={BannerAdSize.BANNER} // or other sizes
/>
```

### Interstitial Ad Customization

```tsx
// Check if ad is loaded before showing
const { show, isLoaded } = useInterstitialAd();

if (isLoaded) {
  show();
} else {
  console.log('Ad not ready yet');
}
```

### ATT Customization

```tsx
// Custom timing for ATT request
<ATTRequest 
  autoRequest={false} // Don't auto-request
  onComplete={(status) => {
    if (status === 'authorized') {
      // User allowed tracking
    } else {
      // User denied tracking
    }
  }}
/>
```

---

## 📊 Monitoring

After integration:
1. Check AdMob dashboard for ad impressions
2. Monitor ad performance and revenue
3. Check console logs for any ad loading errors
4. Test on real devices before store submission

---

## 🆘 Troubleshooting

### Banner Not Showing
- Check console for errors
- Verify App IDs in `app.json`
- Verify Ad Unit IDs in `BannerAd.tsx`
- Ensure internet connection

### Interstitial Not Showing
- Ensure ad is preloaded (`usePreloadInterstitialAd()`)
- Check `isLoaded` status before calling `show()`
- Verify Ad Unit IDs in `InterstitialAd.tsx`
- Check console for loading errors

### ATT Not Prompting (iOS)
- Verify `NSUserTrackingUsageDescription` in `app.json`
- Check iOS version (14.5+)
- Ensure `expo-tracking-transparency` is installed
- Check console for errors

---

**Last Updated:** 22/Jan/2025
