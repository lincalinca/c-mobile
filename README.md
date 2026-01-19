# Crescender Mobile

The official Crescender mobile app "GearGrabber".
Built with **Expo** (React Native), **NativeWind**, and **Supabase**.

## Features
- **GearGrabber**: Scan receipts to automatically extract musical gear, events, and expenses.
- **Local First**: Stores data in SQLite securely on your device.
- **Anonymous Scanning**: No registration required to start.

## Stack
- **Framework**: Expo (SDK 52)
- **Styling**: NativeWind (Tailwind CSS)
- **DB**: Supabase (Postgres) + SQLite (Local)
- **AI**: Supabase Edge Functions + OpenAI Vision

## Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run on simulator:
   ```bash
   npm run ios
   # or
   npm run android
   ```
