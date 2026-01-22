# AdMob Quick Start Guide

**Start here!** This is your roadmap to getting AdMob set up and integrated.

---

## 🎯 Current Status

✅ **Code Implementation:** Complete
- All ad components created
- Configuration files updated (with placeholders)
- Documentation ready

🔴 **AdMob Account Setup:** Pending
- Payment details need to be added
- Apps need to be registered
- Ad units need to be created

---

## 📋 Step-by-Step Action Plan

### Step 1: Complete Payment Setup (15-20 minutes)

**Go to:** https://admob.google.com/v2/home

**Action:** Click "Add payment details"

**What you need:**
- Bank account details (BSB, account number, SWIFT)
- Tax information (TFN or ABN)
- Contact information

**Detailed guide:** See `ADMOB_PAYMENT_SETUP.md`

**⏱️ Approval time:** 24-48 hours

---

### Step 2: Register Apps (10 minutes)

**After payment is approved:**

1. **Register iOS App**
   - Click "Add app" → Select "iOS"
   - Name: `Crescender Mobile`
   - Bundle ID: `com.crescender.mobile.app`
   - **Copy iOS App ID:** `ca-app-pub-XXXXX~YYYYY`

2. **Register Android App**
   - Click "Add app" → Select "Android"
   - Name: `Crescender Mobile`
   - Package: `com.crescender.mobile.app`
   - **Copy Android App ID:** `ca-app-pub-XXXXX~ZZZZZ`

---

### Step 3: Create Ad Units (10 minutes)

**After apps are registered:**

1. **Banner Ad Units**
   - Create for iOS → Copy Unit ID
   - Create for Android → Copy Unit ID

2. **Interstitial Ad Units**
   - Create for iOS → Copy Unit ID
   - Create for Android → Copy Unit ID

---

### Step 4: Update Configuration (5 minutes)

**Update `app.json`:**
```json
{
  "plugins": [
    [
      "react-native-google-mobile-ads",
      {
        "iosAppId": "ca-app-pub-XXXXX~YYYYY",  // ← Your iOS App ID
        "androidAppId": "ca-app-pub-XXXXX~ZZZZZ"  // ← Your Android App ID
      }
    ]
  ]
}
```

**Update `components/ads/BannerAd.tsx`:**
- Replace `IOS_BANNER_AD_UNIT_ID` production value
- Replace `ANDROID_BANNER_AD_UNIT_ID` production value

**Update `components/ads/InterstitialAd.tsx`:**
- Replace `IOS_INTERSTITIAL_AD_UNIT_ID` production value
- Replace `ANDROID_INTERSTITIAL_AD_UNIT_ID` production value

---

### Step 5: Integrate Ads (15 minutes)

**Follow:** `ADMOB_INTEGRATION_GUIDE.md`

**Quick summary:**
1. Add `<ATTRequest />` to `app/_layout.tsx`
2. Add `<AdBanner />` to `app/index.tsx`
3. Add `useInterstitialAd()` to `app/review.tsx`

---

### Step 6: Test (10 minutes)

1. Run app: `npm run ios` or `npm run android`
2. Verify banner ad shows on home screen
3. Scan receipt and verify interstitial shows
4. Check console for errors

**Note:** Test ads will show automatically in development mode.

---

## 📚 Documentation Files

1. **`ADMOB_QUICK_START.md`** ← You are here
2. **`ADMOB_SETUP_GUIDE.md`** - Complete detailed guide
3. **`ADMOB_PAYMENT_SETUP.md`** - Payment setup reference
4. **`ADMOB_INTEGRATION_GUIDE.md`** - Code integration guide
5. **`ADMOB_IMPLEMENTATION_SUMMARY.md`** - Technical summary

---

## ✅ Checklist

### Before You Start
- [ ] Have bank account details ready
- [ ] Have tax information ready (TFN or ABN)
- [ ] Have AdMob account created

### Payment Setup
- [ ] Click "Add payment details" in AdMob
- [ ] Enter bank account information
- [ ] Enter tax information
- [ ] Submit for review
- [ ] Wait for approval email

### App Registration
- [ ] Register iOS app → Copy App ID
- [ ] Register Android app → Copy App ID

### Ad Unit Creation
- [ ] Create iOS Banner ad unit → Copy Unit ID
- [ ] Create Android Banner ad unit → Copy Unit ID
- [ ] Create iOS Interstitial ad unit → Copy Unit ID
- [ ] Create Android Interstitial ad unit → Copy Unit ID

### Configuration Updates
- [ ] Update `app.json` with App IDs
- [ ] Update `BannerAd.tsx` with Unit IDs
- [ ] Update `InterstitialAd.tsx` with Unit IDs

### Integration
- [ ] Add ATT request to `_layout.tsx`
- [ ] Add banner ad to `index.tsx`
- [ ] Add interstitial ad to `review.tsx`

### Testing
- [ ] Test banner ad displays
- [ ] Test interstitial ad displays
- [ ] Test ATT prompt (iOS)
- [ ] Check console for errors

---

## 🆘 Need Help?

### Payment Setup Issues
→ See `ADMOB_PAYMENT_SETUP.md` troubleshooting section

### Configuration Issues
→ See `ADMOB_SETUP_GUIDE.md` Step 4

### Integration Issues
→ See `ADMOB_INTEGRATION_GUIDE.md` troubleshooting section

### General Questions
→ See `ADMOB_SETUP_GUIDE.md` for complete reference

---

## 🎉 Next Steps After Setup

1. **Generate Assets** (see `ADMOB_SETUP_GUIDE.md` Step 5)
   - Verify app icons meet requirements
   - Create screenshots
   - Create feature graphic

2. **Set Up Store Accounts**
   - Apple Developer ($99/year)
   - Google Play Console ($25 one-time)

3. **Build & Submit**
   - Configure EAS: `eas build:configure`
   - Build: `eas build --platform ios/android --profile production`
   - Submit: `eas submit --platform ios/android`

---

**Last Updated:** 22/Jan/2025  
**Estimated Total Time:** ~1 hour (plus 24-48h approval wait)
