# AdMob & App Store Setup Guide

This guide walks you through completing the AdMob setup wizard and preparing your app for store submission.

## 📋 Current Status

**Completed by AI:**
- ✅ Reviewed AdMob dashboard and identified setup steps
- ✅ Prepared app.json configuration template
- ✅ Created AdMob component structure
- ✅ Set up EAS configuration

**Requires Manual Completion:**
- 🔴 **Payment Details** (Bank account information - see Step 1 below)
- 🔴 **App Registration** (iOS and Android App IDs from AdMob)
- 🔴 **Ad Unit Creation** (Banner, Interstitial IDs)
- 🟡 **Asset Generation** (Icons, splash screens, screenshots)
- 🟡 **Store Account Setup** (Apple Developer, Google Play Console)

---

## 🚀 Step 1: Complete AdMob Payment Setup

**Location:** https://admob.google.com/v2/home

### What You Need:
1. **Bank Account Details:**
   - Bank name
   - Account holder name (must match AdMob account)
   - Account number
   - BSB/SWIFT code (for Australian banks)
   - Bank address

2. **Tax Information:**
   - ABN (Australian Business Number) if applicable
   - Tax ID or personal tax file number
   - Business address (if business account)

3. **Payment Method:**
   - Choose between bank transfer or other available options

### Steps:
1. Click **"Add payment details"** button on the Payments card
2. Select your country (Australia)
3. Choose payment method (typically bank transfer)
4. Enter bank account details
5. Complete tax information
6. Submit for review (can take 24-48 hours)

**⚠️ Important:** Your AdMob account and apps will remain in review until payment details are completed.

---

## 📱 Step 2: Register Apps in AdMob

After payment setup is approved, register your iOS and Android apps.

### 2.1 Register iOS App

1. Click **"Add app"** button on the Apps card
2. Select **"iOS"** platform
3. Enter app details:
   - **App name:** Crescender Mobile (or GearGrabber)
   - **Bundle ID:** `com.crescender.mobile.app` (matches your app.json)
   - **App Store URL:** Leave blank for now (add after App Store submission)
4. Click **"Add app"**
5. **Copy the App ID** - Format: `ca-app-pub-XXXXX~YYYYY`
   - Save this for app.json configuration

### 2.2 Register Android App

1. Click **"Add app"** again
2. Select **"Android"** platform
3. Enter app details:
   - **App name:** Crescender Mobile (or GearGrabber)
   - **Package name:** `com.crescender.mobile.app` (matches your app.json)
   - **Play Store URL:** Leave blank for now (add after Play Store submission)
4. Click **"Add app"**
5. **Copy the App ID** - Format: `ca-app-pub-XXXXX~ZZZZZ`
   - Save this for app.json configuration

---

## 🎯 Step 3: Create Ad Units

After apps are registered, create ad units for each ad format you want to use.

### 3.1 Banner Ad Unit

1. Click **"Add ad unit"** button
2. Select **"Banner"** format
3. Choose your app (iOS or Android - create one for each)
4. Enter details:
   - **Ad unit name:** `Banner - Home Screen`
   - **Ad size:** Adaptive Banner (recommended)
5. Click **"Create ad unit"**
6. **Copy the Ad Unit ID** - Format: `ca-app-pub-XXXXX/YYYYY`
   - Save this for component configuration

### 3.2 Interstitial Ad Unit

1. Click **"Add ad unit"** again
2. Select **"Interstitial"** format
3. Choose your app (iOS or Android - create one for each)
4. Enter details:
   - **Ad unit name:** `Interstitial - Receipt Scan Complete`
   - **Frequency:** After receipt scan completion
5. Click **"Create ad unit"**
6. **Copy the Ad Unit ID** - Format: `ca-app-pub-XXXXX/ZZZZZ`
   - Save this for component configuration

### 3.3 (Optional) Rewarded Ad Unit

1. Click **"Add ad unit"** again
2. Select **"Rewarded"** format
3. Choose your app
4. Enter details:
   - **Ad unit name:** `Rewarded - Premium Features`
5. Click **"Create ad unit"**
6. **Copy the Ad Unit ID**

---

## 📝 Step 4: Update app.json with AdMob IDs

After you have your App IDs and Ad Unit IDs, update `app.json`:

```json
{
  "expo": {
    "plugins": [
      // ... existing plugins ...
      [
        "react-native-google-mobile-ads",
        {
          "iosAppId": "ca-app-pub-XXXXX~YYYYY",
          "androidAppId": "ca-app-pub-XXXXX~ZZZZZ"
        }
      ]
    ]
  }
}
```

**Action Required:** Replace `XXXXX~YYYYY` and `XXXXX~ZZZZZ` with your actual AdMob App IDs from Step 2.

---

## 🎨 Step 5: Generate Required Assets

### 5.1 App Icon (1024×1024px)

**Requirements:**
- Size: 1024×1024px
- Format: PNG (no alpha channel for iOS)
- No transparency
- Square design with safe zone (no important content in corners)

**Current Status:** Check if `assets/icon.png` meets these requirements

### 5.2 Adaptive Icon (Android - 1024×1024px)

**Requirements:**
- Size: 1024×1024px
- Format: PNG
- Safe zone: Keep important content within 66% center area
- Background color: White (#ffffff) - already set in app.json

**Current Status:** Check if `assets/adaptive-icon.png` meets these requirements

### 5.3 Splash Screen (1284×2778px or larger)

**Requirements:**
- Size: Minimum 1284×2778px (iPhone 14 Pro Max)
- Format: PNG
- Background color: Black (#000000) - already set in app.json

**Current Status:** Check if `assets/splash.png` meets these requirements

### 5.4 Feature Graphic (Google Play - 1024×500px)

**Requirements:**
- Size: 1024×500px
- Format: PNG or JPG
- Purpose: Play Store listing banner

**Action Required:** Create this asset

### 5.5 Screenshots

**iOS Requirements:**
- Minimum 3 screenshots per device size:
  - 6.7" (iPhone 14 Pro Max): 1290×2796px
  - 6.5" (iPhone 11 Pro Max): 1242×2688px
  - 5.5" (iPhone 8 Plus): 1242×2208px
- Format: PNG or JPG

**Android Requirements:**
- Minimum 2 screenshots (phone)
- Recommended: 1080×1920px or higher
- Format: PNG or JPG
- Optional: Tablet screenshots

**Action Required:** Capture screenshots from your app running on simulators/devices

---

## 🏪 Step 6: App Store Account Setup

### 6.1 Apple Developer Account

**Cost:** $99 USD/year

**Steps:**
1. Go to https://developer.apple.com/programs/
2. Sign in with Apple ID
3. Enrol in Apple Developer Program
4. Complete payment ($99/year)
5. Wait for approval (usually 24-48 hours)

**Required Information:**
- Apple ID
- Credit card for payment
- Business/Personal details
- D-U-N-S number (if business)

### 6.2 Google Play Console Account

**Cost:** $25 USD one-time fee

**Steps:**
1. Go to https://play.google.com/console/
2. Sign in with Google account
3. Pay one-time $25 registration fee
4. Complete developer profile

**Required Information:**
- Google account
- Credit card for payment
- Developer name (appears in Play Store)

---

## 🔧 Step 7: EAS Build Configuration

EAS (Expo Application Services) is recommended for building and submitting your app.

### 7.1 Install EAS CLI

```bash
npm install -g eas-cli
```

### 7.2 Login to Expo

```bash
eas login
```

### 7.3 Configure Project

```bash
cd /Users/linc/Dev-Work/Crescender/crescender-mobile
eas build:configure
```

This creates `eas.json` with build profiles.

### 7.4 Build for Stores

**iOS Build:**
```bash
eas build --platform ios --profile production
```

**Android Build:**
```bash
eas build --platform android --profile production
```

**Note:** First build may take 20-30 minutes. Subsequent builds are faster.

### 7.5 Submit to Stores

**iOS Submission:**
```bash
eas submit --platform ios
```

**Android Submission:**
```bash
eas submit --platform android
```

---

## 📱 Step 8: iOS App Tracking Transparency (ATT)

Required for iOS 14.5+ to show personalised ads.

### 8.1 Install Package

```bash
npx expo install expo-tracking-transparency
```

### 8.2 Update app.json

Add to `ios.infoPlist`:

```json
{
  "ios": {
    "infoPlist": {
      "NSUserTrackingUsageDescription": "This allows us to show you relevant ads and improve your experience."
    }
  }
}
```

### 8.3 Implement in Code

See `components/ads/ATTRequest.tsx` for implementation.

---

## ✅ Implementation Checklist

### AdMob Setup
- [ ] Complete payment details in AdMob
- [ ] Register iOS app in AdMob → Get App ID
- [ ] Register Android app in AdMob → Get App ID
- [ ] Create Banner ad unit (iOS) → Get Unit ID
- [ ] Create Banner ad unit (Android) → Get Unit ID
- [ ] Create Interstitial ad unit (iOS) → Get Unit ID
- [ ] Create Interstitial ad unit (Android) → Get Unit ID
- [ ] Update app.json with App IDs
- [ ] Update ad components with Unit IDs

### Assets
- [ ] Verify app icon is 1024×1024px (no alpha)
- [ ] Verify adaptive icon is 1024×1024px with safe zone
- [ ] Verify splash screen is 1284×2778px or larger
- [ ] Create feature graphic 1024×500px
- [ ] Capture iOS screenshots (3+ per device size)
- [ ] Capture Android screenshots (2+ phone, optional tablet)

### Configuration
- [ ] Install `react-native-google-mobile-ads`
- [ ] Install `expo-tracking-transparency`
- [ ] Update app.json with AdMob plugin
- [ ] Update app.json with ATT permission
- [ ] Create EAS account and configure project
- [ ] Test ads with test IDs in development

### Store Accounts
- [ ] Create Apple Developer account ($99/year)
- [ ] Create Google Play Console account ($25 one-time)
- [ ] Prepare store listing copy
- [ ] Prepare privacy policy URL
- [ ] Build iOS app with EAS
- [ ] Build Android app with EAS
- [ ] Submit iOS app to App Store
- [ ] Submit Android app to Play Store

---

## 🧪 Testing AdMob Integration

### Test IDs (Development Only)

Always use test IDs during development to avoid getting banned:

- **iOS Banner:** `ca-app-pub-3940256099942544/2934735716`
- **Android Banner:** `ca-app-pub-3940256099942544/6300978111`
- **iOS Interstitial:** `ca-app-pub-3940256099942544/4411468910`
- **Android Interstitial:** `ca-app-pub-3940256099942544/1033173712`

The components automatically switch between test and production IDs based on `__DEV__`.

### Testing Checklist

- [ ] Banner ad displays on home screen
- [ ] Interstitial ad shows after receipt scan
- [ ] Ads load correctly on iOS simulator
- [ ] Ads load correctly on Android emulator
- [ ] ATT prompt appears on iOS (if enabled)
- [ ] No console errors related to ads
- [ ] Test IDs work in development
- [ ] Production IDs ready for store builds

---

## 📚 Additional Resources

- [AdMob Documentation](https://developers.google.com/admob)
- [Expo AdMob Plugin](https://docs.expo.dev/versions/latest/sdk/google-mobile-ads/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Guide](https://support.google.com/googleplay/android-developer)

---

## 🆘 Troubleshooting

### Payment Setup Issues
- Ensure bank account name matches AdMob account name exactly
- Double-check BSB/SWIFT codes for Australian banks
- Contact AdMob support if review takes longer than 48 hours

### Ad Not Showing
- Verify App IDs are correct in app.json
- Check Ad Unit IDs match between AdMob and code
- Ensure you're using test IDs in development
- Check console for error messages
- Verify app is connected to internet

### Build Issues
- Ensure EAS CLI is up to date: `npm install -g eas-cli@latest`
- Check `eas.json` configuration is correct
- Verify Apple Developer account is active
- Check Google Play Console account is set up

---

## 📝 Notes

- **Development:** Always use test ad IDs (`TestIds.BANNER`, etc.) in development
- **Production:** Switch to production IDs only when building for stores
- **Privacy:** Ensure privacy policy URL is ready before store submission
- **Compliance:** Review AdMob policies to ensure app compliance
- **Performance:** Monitor ad performance in AdMob dashboard after launch

---

**Last Updated:** 22/Jan/2025
**Status:** Payment setup pending - awaiting bank details
