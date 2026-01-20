import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { initDatabase } from "../db/client";
import "../global.css";

export default function Layout() {
  useEffect(() => {
    // Initialize DB in background, don't block render
    initDatabase().catch((e) => {
      console.error("Failed to initialize database", e);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}
