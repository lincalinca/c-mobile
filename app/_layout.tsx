import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../global.css";
import { useEffect } from "react";
import { initDatabase } from "../db/client";

export default function Layout() {
  useEffect(() => {
    try {
      initDatabase();
      console.log("Database initialized");
    } catch (e) {
      console.error("Failed to initialize database", e);
    }
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}
