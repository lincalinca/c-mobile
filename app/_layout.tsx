// URL polyfill must be imported FIRST before any other imports
import 'react-native-url-polyfill/auto';
import { Stack, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { initDatabase } from "../db/client";
import { View } from "react-native";
import { MusicFlowBackground } from "../components/common/MusicFlowBackground";
import "../global.css";

export default function Layout() {
  const pathname = usePathname();
  const router = useRouter();
  const isScanScreen = pathname === '/scan';

  useEffect(() => {
    // Initialize DB in background, don't block render
    initDatabase().catch((e) => {
      console.error("Failed to initialize database", e);
    });
  }, []);

  return (
    <SafeAreaProvider>
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
