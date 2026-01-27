# iOS Readiness

**Last updated:** 27/Jan/2026

---

## Do you need Xcode?

**No, for building and submitting to the App Store.**

- **EAS Build** (`eas build --platform ios`) runs in the cloud. You don't need Xcode installed to produce an IPA.
- **EAS Submit** (`eas submit`) uploads to App Store Connect. Again, no Xcode required.
- **Apple Developer account** is required (paid membership).

**Yes, only if you want to:**

- Run the app in the **iOS Simulator** (Simulator is part of Xcode).
- Develop or debug **native iOS code** (e.g. custom native modules, Xcode project changes).

---

## What’s already in place for iOS

- **`app.json`:** `ios.bundleIdentifier`, `ios.infoPlist` (camera, tracking), AdMob app ID, splash.
- **`eas.json`:** `build.production.ios`, `submit.production.ios` (Apple ID, ASC App ID, Team ID placeholders).
- **Expo config:** `expo-calendar`, `expo-camera`, `expo-tracking-transparency`, `react-native-google-mobile-ads` with iOS IDs.

---

## Before shipping to the App Store

1. **Replace placeholders in `eas.json` `submit.production.ios`:**
   - `appleId`: your Apple ID email
   - `ascAppId`: App Store Connect app ID (from the app’s App Information page)
   - `appleTeamId`: Team ID from [Apple Developer](https://developer.apple.com/account) → Membership

2. **Create the app in App Store Connect** (if not done yet): bundle ID `com.crescender.mobile.app`, name, etc.

3. **Build:**  
   `eas build --platform ios --profile production`

4. **Submit:**  
   `eas submit --platform ios --profile production`  
   (or upload the IPA manually via Transporter / App Store Connect).

5. **App Store listing:** screenshots, description, privacy policy URL, age rating, etc.

---

## Summary

You **can** create and ship the iPhone app **without Xcode** by using EAS Build and EAS Submit. Install Xcode only if you need the simulator or native iOS development.
