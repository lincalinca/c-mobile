#!/usr/bin/env bash
set -euo pipefail

SCRIPT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_ROOT/.." && pwd)"

cd "$REPO_ROOT"

ADB="${ADB:-adb}"
ANDROID_PACKAGE="${ANDROID_PACKAGE:-com.crescender.mobile.app}"

if ! command -v "$ADB" >/dev/null 2>&1; then
  echo "⚠️  adb not found on PATH; install platform-tools or set ADB to the correct binary."
  exit 1
fi

echo "✅ Starting adb server..."
"$ADB" start-server

echo "⏳ Waiting for a device/emulator..."
"$ADB" wait-for-device

echo "🧹 Clearing app data for $ANDROID_PACKAGE"
"$ADB" shell pm clear "$ANDROID_PACKAGE" >/dev/null || true

echo "🗑️  Uninstalling $ANDROID_PACKAGE (if present)"
"$ADB" uninstall "$ANDROID_PACKAGE" >/dev/null || true

echo "🔁 Bootstrapping a clean Android run..."
pnpm android
