#!/usr/bin/env node
/**
 * Version bump script for Crescender Mobile
 *
 * Usage:
 *   node scripts/bump-version.js patch   # 1.0.0 -> 1.0.1
 *   node scripts/bump-version.js minor   # 1.0.0 -> 1.1.0
 *   node scripts/bump-version.js major   # 1.0.0 -> 2.0.0
 *
 * Updates:
 *   - package.json version
 *   - app.json expo.version
 *   - app.json ios.buildNumber (same as version string)
 *   - app.json android.versionCode (numeric: major*10000 + minor*100 + patch)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const APP_JSON = path.join(ROOT, 'app.json');

function parseVersion(version) {
  const [major, minor, patch] = version.split('.').map(Number);
  return { major, minor, patch };
}

function formatVersion({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function toVersionCode({ major, minor, patch }) {
  // 1.2.3 -> 10203, 2.0.0 -> 20000
  return major * 10000 + minor * 100 + patch;
}

function bumpVersion(version, type) {
  const v = parseVersion(version);

  switch (type) {
    case 'major':
      return { major: v.major + 1, minor: 0, patch: 0 };
    case 'minor':
      return { major: v.major, minor: v.minor + 1, patch: 0 };
    case 'patch':
      return { major: v.major, minor: v.minor, patch: v.patch + 1 };
    default:
      throw new Error(`Unknown bump type: ${type}. Use 'major', 'minor', or 'patch'.`);
  }
}

function main() {
  const bumpType = process.argv[2];

  if (!bumpType || !['major', 'minor', 'patch'].includes(bumpType)) {
    console.error('Usage: node scripts/bump-version.js <major|minor|patch>');
    process.exit(1);
  }

  // Read current files
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON, 'utf-8'));
  const appJson = JSON.parse(fs.readFileSync(APP_JSON, 'utf-8'));

  const currentVersion = packageJson.version;
  const newVersionObj = bumpVersion(currentVersion, bumpType);
  const newVersion = formatVersion(newVersionObj);
  const newVersionCode = toVersionCode(newVersionObj);

  console.log(`\nBumping version: ${currentVersion} -> ${newVersion}`);
  console.log(`  iOS buildNumber: ${newVersion}`);
  console.log(`  Android versionCode: ${newVersionCode}`);

  // Update package.json
  packageJson.version = newVersion;
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(packageJson, null, 2) + '\n');
  console.log(`\n✓ Updated package.json`);

  // Update app.json
  appJson.expo.version = newVersion;
  appJson.expo.ios.buildNumber = newVersion;
  appJson.expo.android.versionCode = newVersionCode;
  fs.writeFileSync(APP_JSON, JSON.stringify(appJson, null, 2) + '\n');
  console.log(`✓ Updated app.json`);

  console.log(`\nVersion bumped to ${newVersion} successfully!`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review changes: git diff`);
  console.log(`  2. Commit: git add -A && git commit -m "chore: bump version to ${newVersion}"`);
  console.log(`  3. Build: eas build --platform all`);
}

main();
