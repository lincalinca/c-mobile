// URL polyfill must be imported FIRST before any other imports
import 'react-native-url-polyfill/auto';
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { initDatabase } from "@db/client";
import { View } from "react-native";
import { MusicFlowBackground } from "@components/common/MusicFlowBackground";
import { ATTRequest } from "@components/ads";
import { BulkUploadProgress } from "@components/bulk";
import { initializeChannels } from "@lib/notifications/Channels";
import { reconcileNotifications, cleanupStaleNotifications } from "@lib/notifications/Reconciler";
import "@root/global.css";

// Initialize Google Mobile Ads SDK
let mobileAdsInitialized = false;
async function initializeMobileAds() {
  if (mobileAdsInitialized) return;
  try {
    const { default: mobileAds } = await import('react-native-google-mobile-ads');
    await mobileAds().initialize();
    mobileAdsInitialized = true;
    console.log('[Ads] Google Mobile Ads SDK initialized');
  } catch (e) {
    console.warn('[Ads] Failed to initialize Google Mobile Ads SDK:', e);
  }
}

export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const isScanScreen = pathname === '/scan';

  useEffect(() => {
    // Initialize Google Mobile Ads SDK early
    initializeMobileAds();

    // Initialize DB in background, don't block render
    initDatabase()
      .then(async () => {
        try {
          // Initialize notification channels (safe in Expo Go - will skip if not available)
          await initializeChannels();
        } catch (e) {
          console.warn("Failed to initialize notification channels:", e);
        }

        try {
          // Clean up stale notifications
          await cleanupStaleNotifications();
        } catch (e) {
          console.warn("Failed to cleanup stale notifications:", e);
        }

        try {
          // Reconcile notifications based on current domain data
          await reconcileNotifications();
        } catch (e) {
          console.warn("Failed to reconcile notifications:", e);
        }
      })
      .catch((e) => {
        console.error("Failed to initialize database", e);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <ATTRequest 
        onComplete={(status) => {
          console.log('Tracking authorization status:', status);
        }}
      />
      <View 
        className="flex-1" 
        style={{ backgroundColor: isScanScreen ? 'black' : '#2a0b4c' }}
      >
        {!isScanScreen && <MusicFlowBackground />}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            backgroundColor: 'transparent'
          } as any}
        />
        <BulkUploadProgress />
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}
