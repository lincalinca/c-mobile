# Store Readiness Checklist

**Last Updated:** 24/Jan/2026  
**Status:** In Progress

## ✅ Completed

### Usage & Limits
- ✅ Changed free scans from **2 per day** to **10 per week**
- ✅ Implemented proper usage tracking system with AsyncStorage
- ✅ Weekly quota resets every Monday at midnight
- ✅ Scan limit enforcement before processing receipts
- ✅ Usage screen displays weekly stats with reset date

### Privacy & Legal
- ✅ Privacy policy link in Settings screen
- ✅ Links to: `https://www.crescender.com.au/privacy`
- ✅ iOS ATT (App Tracking Transparency) implemented

### Loading Screens
- ✅ ProcessingView component for receipt analysis
- ✅ Splash screen configured in app.json (`./assets/splash.png`)

### App Icons
- ✅ Icon configured: `./assets/icon.png`
- ✅ Adaptive icon (Android): `./assets/adaptive-icon.png`
- ✅ Splash screen: `./assets/splash.png`

---

## 🔴 Critical - Must Complete Before Store Submission

### 1. AdMob Configuration ⚠️
**Status:** Placeholder IDs currently in use

**Required Actions:**
- [ ] Complete AdMob payment setup (see `ADMOB_PAYMENT_SETUP.md`)
- [ ] Register iOS app in AdMob → Get App ID
- [ ] Register Android app in AdMob → Get App ID
- [ ] Create Banner ad units (iOS + Android) → Get Unit IDs
- [ ] Create Interstitial ad units (iOS + Android) → Get Unit IDs
- [ ] Update `app.json` with production App IDs:
  ```json
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "iosAppId": "ca-app-pub-XXXXX~YYYYY",  // ← Replace
        "androidAppId": "ca-app-pub-XXXXX~ZZZZZ"  // ← Replace
      }
    ]
  ]
  ```
- [ ] Update `components/ads/BannerAd.tsx` with production Unit IDs
- [ ] Update `components/ads/InterstitialAd.tsx` with production Unit IDs

**Files to Update:**
- `app.json` (lines 45-49)
- `components/ads/BannerAd.tsx` (lines 8-14)
- `components/ads/InterstitialAd.tsx` (lines 8-14)

---

### 2. Usage Monitoring & Analytics 📊
**Status:** Basic tracking implemented, but needs enhancement

**Current Implementation:**
- ✅ Local usage tracking (scans per week)
- ✅ Quota enforcement
- ✅ Usage screen displays stats

**Still Needed:**
- [ ] Integrate analytics service (Firebase Analytics, Amplitude, or Mixpanel)
- [ ] Track key events:
  - App launches
  - Receipt scans (success/failure)
  - Ad views/interactions
  - Feature usage (calendar export, etc.)
  - Error tracking
- [ ] User identification for premium users
- [ ] Crash reporting (Sentry, Bugsnag, or Firebase Crashlytics)

**Recommended:**
- Firebase Analytics (free, easy integration with Expo)
- Sentry for error tracking

---

### 3. App Icons & Assets 🎨
**Status:** Files exist, need verification

**Required Checks:**
- [ ] Verify `assets/icon.png` is 1024×1024px (iOS requirement)
- [ ] Verify `assets/adaptive-icon.png` is 1024×1024px (Android)
- [ ] Verify `assets/splash.png` meets platform requirements
- [ ] Test icons display correctly on devices
- [ ] Ensure icons are high-quality and not pixelated
- [ ] Create app store screenshots (various device sizes)
- [ ] Create feature graphic (1024×500px for Google Play)

**iOS Requirements:**
- Icon: 1024×1024px PNG (no transparency)
- Splash: Various sizes (handled by Expo)

**Android Requirements:**
- Adaptive icon: 1024×1024px
- Foreground: 1024×1024px (centered in 1024×1024 canvas)
- Background: Solid colour or gradient

---

### 4. App Manifest (app.json) Review 📱
**Status:** Basic config present, needs review

**Current Configuration:**
```json
{
  "name": "crescender-mobile",
  "slug": "crescender-mobile",
  "version": "1.0.0",
  "bundleIdentifier": "com.crescender.mobile.app",
  "package": "com.crescender.mobile.app"
}
```

**Required Updates:**
- [ ] Add `description` field (for app stores)
- [ ] Add `keywords` array (for discoverability)
- [ ] Verify `version` matches intended release version
- [ ] Add `privacy` field pointing to privacy policy URL
- [ ] Review iOS `infoPlist` permissions descriptions
- [ ] Verify Android `adaptiveIcon` configuration
- [ ] Add `screenshots` array (if using Expo's asset system)
- [ ] Consider adding `extra` field for environment configs

**Example additions:**
```json
{
  "description": "Track your music gear, lessons, and expenses by scanning receipts. Crescender automatically extracts gear items, lesson details, and transaction data.",
  "keywords": ["music", "receipt", "scanner", "gear", "lessons", "expenses"],
  "privacy": "public",
  "extra": {
    "privacyPolicyUrl": "https://www.crescender.com.au/privacy"
  }
}
```

---

### 5. Privacy Policy & Terms 📄
**Status:** Link exists in Settings

**Required Checks:**
- [ ] Verify privacy policy URL is accessible: `https://www.crescender.com.au/privacy`
- [ ] Ensure privacy policy covers:
  - Data collection (receipt images, extracted data)
  - Data storage (local + Supabase)
  - AdMob data usage
  - User rights (GDPR compliance if applicable)
  - Contact information
- [ ] Add Terms of Service link (if required)
- [ ] Add link in app.json `extra.privacyPolicyUrl` (for store submission)

**Current Implementation:**
- ✅ Privacy policy link in Settings screen (`app/settings.tsx` line 70)
- ✅ Opens external browser via `Linking.openURL()`

---

### 6. Loading Screens ⏳
**Status:** ProcessingView exists, need to verify app launch

**Current:**
- ✅ `ProcessingView` component for receipt analysis
- ✅ Splash screen configured in app.json

**To Verify:**
- [ ] Test app launch splash screen displays correctly
- [ ] Verify splash screen timing (should show during app initialization)
- [ ] Ensure smooth transition from splash to app
- [ ] Test on both iOS and Android devices
- [ ] Consider adding app version/build number to splash (optional)

**Note:** Expo handles splash screens automatically based on `app.json` configuration.

---

### 7. Error Handling & Edge Cases 🛡️
**Status:** Basic error handling present

**To Review:**
- [ ] Test scan limit enforcement (should block at 10 scans/week)
- [ ] Test quota reset (should reset on Monday)
- [ ] Handle network errors gracefully
- [ ] Handle camera permission denial
- [ ] Handle storage permission issues (Android)
- [ ] Test offline functionality (if applicable)
- [ ] Add error boundaries for React errors
- [ ] Test with poor network conditions

---

### 8. Store Submission Requirements 🏪

### Apple App Store
- [ ] Apple Developer account ($99/year)
- [ ] App Store Connect app created
- [ ] App screenshots (various iPhone sizes)
- [ ] App preview video (optional but recommended)
- [ ] App description (up to 4000 characters)
- [ ] Keywords (up to 100 characters)
- [ ] Support URL
- [ ] Marketing URL (optional)
- [ ] Privacy policy URL
- [ ] Age rating questionnaire
- [ ] App review information
- [ ] Test account credentials (if app requires login)

### Google Play Store
- [ ] Google Play Console account ($25 one-time)
- [ ] App screenshots (phone, 7-inch tablet, 10-inch tablet)
- [ ] Feature graphic (1024×500px)
- [ ] App description (up to 4000 characters)
- [ ] Short description (up to 80 characters)
- [ ] Privacy policy URL
- [ ] Content rating questionnaire
- [ ] Target audience
- [ ] Data safety section (required)
- [ ] App signing key configured

---

## 📋 Pre-Submission Testing Checklist

### Functional Testing
- [ ] Scan receipt → Verify processing works
- [ ] View usage stats → Verify weekly quota displays
- [ ] Test scan limit → Verify blocking at 10 scans
- [ ] Test quota reset → Verify reset on Monday
- [ ] Test ad display → Verify banner ads show (with test IDs)
- [ ] Test privacy policy link → Verify opens correctly
- [ ] Test all navigation flows
- [ ] Test on both iOS and Android devices

### Performance Testing
- [ ] App launch time (< 3 seconds)
- [ ] Receipt processing time
- [ ] Memory usage (check for leaks)
- [ ] Battery usage (especially camera)
- [ ] Network usage (data consumption)

### Compatibility Testing
- [ ] iOS 13+ devices
- [ ] Android 8+ devices
- [ ] Various screen sizes
- [ ] Dark mode (if applicable)
- [ ] Landscape orientation (if supported)

---

## 🚀 Build & Submit Process

### Using EAS Build

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Login:**
   ```bash
   eas login
   ```

3. **Configure:**
   ```bash
   eas build:configure
   ```

4. **Build iOS:**
   ```bash
   eas build --platform ios --profile production
   ```

5. **Build Android:**
   ```bash
   eas build --platform android --profile production
   ```

6. **Submit iOS:**
   ```bash
   eas submit --platform ios
   ```

7. **Submit Android:**
   ```bash
   eas submit --platform android
   ```

---

## 📝 Notes

### Current Limitations
- AdMob uses placeholder IDs (will use test ads in dev)
- No analytics service integrated yet
- Basic error handling (may need enhancement)
- No crash reporting yet

### Future Enhancements (Post-Launch)
- Premium subscription integration
- Rewarded ads for bonus scans
- Enhanced analytics dashboard
- Push notifications
- Social sharing features
- Export functionality enhancements

---

## ✅ Quick Status Summary

| Item | Status | Priority |
|------|--------|----------|
| Scan Limit (10/week) | ✅ Complete | High |
| Usage Tracking | ✅ Complete | High |
| AdMob Setup | 🔴 Placeholder IDs | **Critical** |
| Analytics Integration | 🔴 Not Started | High |
| App Icons | 🟡 Need Verification | High |
| Privacy Policy Link | ✅ Complete | High |
| App Manifest | 🟡 Needs Review | Medium |
| Loading Screens | ✅ Complete | Medium |
| Store Submission | 🔴 Not Started | **Critical** |

---

**Next Steps:**
1. Complete AdMob payment setup and get production IDs
2. Integrate analytics service (Firebase recommended)
3. Verify and update app icons/assets
4. Review and enhance app.json manifest
5. Test thoroughly on real devices
6. Prepare store assets (screenshots, descriptions)
7. Submit to stores
