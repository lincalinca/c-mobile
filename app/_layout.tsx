// URL polyfill must be imported FIRST before any other imports
import 'react-native-url-polyfill/auto';
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { initDatabase } from "../db/client";
import { View } from "react-native";
import { MusicFlowBackground } from "../components/common/MusicFlowBackground";
import { ATTRequest } from "../components/ads";
// NOTIFICATIONS ARCHIVED - See /docs/NOTIFICATIONS_ARCHIVE.md for re-implementation
// import { initializeChannels } from "../lib/notifications/Channels";
// import { reconcileNotifications, cleanupStaleNotifications } from "../lib/notifications/Reconciler";
import "../global.css";

export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const isScanScreen = pathname === '/scan';

  useEffect(() => {
    // Initialize DB in background, don't block render
    initDatabase()
      .then(async () => {
        // NOTIFICATIONS ARCHIVED - See /docs/NOTIFICATIONS_ARCHIVE.md for re-implementation
        // To restore notifications, uncomment the imports above and the code below:
        //
        // try {
        //   // Initialize notification channels (safe in Expo Go - will skip if not available)
        //   await initializeChannels();
        // } catch (e) {
        //   console.warn("Failed to initialize notification channels (may not be available in Expo Go):", e);
        // }
        //
        // try {
        //   // Clean up stale notifications
        //   await cleanupStaleNotifications();
        // } catch (e) {
        //   console.warn("Failed to cleanup stale notifications:", e);
        // }
        //
        // try {
        //   // Reconcile notifications based on current domain data
        //   await reconcileNotifications();
        // } catch (e) {
        //   console.warn("Failed to reconcile notifications:", e);
        // }
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
        <StatusBar style="light" />
      </View>
    </SafeAreaProvider>
  );
}
