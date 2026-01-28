# Standard build and deploy order ("build all")

When deploying to both stores, use this order:

1. **Build iOS**  
   `eas build --platform ios --profile production --non-interactive`

2. **Submit to Apple App Store Connect** (after iOS build finishes)  
   `eas submit --platform ios --profile production --latest --non-interactive`

3. **Build Android**  
   `eas build --platform android --profile production --non-interactive`

4. **Submit to Google Play Store** (after Android build finishes)  
   `eas submit --platform android --profile production --latest --non-interactive`

Monitor builds at: https://expo.dev/accounts/lnm83/projects/crescender-mobile/builds
