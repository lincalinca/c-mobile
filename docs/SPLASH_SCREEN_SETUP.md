# Splash Screen Setup

## Current Configuration

The app is configured to use the following splash screens:

- **Default/Web**: `./assets/900_1600.png`
- **iOS**: `./assets/iPhone 14 - 1170_2536.png`
- **Android**: `./assets/Pixel 6 - 1080_2400.png`

## Important Notes

### Expo Go Limitations
Splash screens configured in `app.json` **do not work in Expo Go**. They only work in:
- Development builds (`expo run:ios` / `expo run:android`)
- Production builds (EAS Build)

### To See Splash Screens

1. **Development Build:**
   ```bash
   npx expo prebuild
   npx expo run:ios
   # or
   npx expo run:android
   ```

2. **Production Build:**
   ```bash
   eas build --platform ios
   # or
   eas build --platform android
   ```

### Why Splash Screens Don't Show in Expo Go

Expo Go uses a generic splash screen and cannot use custom splash screens from your `app.json`. The splash screens are compiled into the native app binary during the build process.

### Verifying Configuration

The splash screen configuration in `app.json` is correct:
- ✅ Paths are properly formatted
- ✅ Background color matches design (`#2a0b4c`)
- ✅ Resize mode is set to `contain`

### Troubleshooting

If splash screens still don't appear after building:

1. **Clear build cache:**
   ```bash
   npx expo prebuild --clean
   ```

2. **Verify files exist:**
   - Check that all splash screen files are in `assets/` folder
   - Ensure filenames match exactly (including spaces)

3. **Check file sizes:**
   - Splash screens should be optimized but high quality
   - Very large files might cause issues

4. **Rebuild the app:**
   After changing splash screens, you must rebuild the native app - hot reload won't work.

## Available Splash Screen Sizes

You have these additional splash screen images available:
- `900_1600.png` (default)
- `900_1950.png`
- `900_2000.png`
- `1000_2000.png`
- `iPhone 14 - 1170_2536.png` (iOS)
- `Pixel 6 - 1080_2400.png` (Android)

These can be used for different device sizes if needed, but Expo will automatically scale the configured splash screens to fit different devices.
