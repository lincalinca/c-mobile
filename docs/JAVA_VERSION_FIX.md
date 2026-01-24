# Java Version Compatibility Fix

## Problem
Gradle build fails with error:
```
Unsupported class file major version 69
```

This occurs because Java 25 (class file version 69) is not yet fully supported by Gradle 8.14.3.

## Solution

You have two options:

### Option 1: Install Java 21 (Recommended)

Install Java 21 using Homebrew:

```bash
brew install openjdk@21
```

Then set JAVA_HOME for this session:
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

Or add to your shell profile (`~/.zshrc` or `~/.bash_profile`):
```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
```

### Option 2: Use Gradle Toolchain (Automatic Download)

Gradle can automatically download Java 21 if configured. The configuration has been added to `android/build.gradle` and `android/gradle.properties`.

However, you may still need to set JAVA_HOME temporarily:

```bash
# For this build session only
export JAVA_HOME=$(/usr/libexec/java_home -v 21) 2>/dev/null || echo "Java 21 not found. Please install it first."
npx expo run:android
```

## Verify Java Version

Check your current Java version:
```bash
java -version
```

You should see Java 21 or Java 17. Java 25 will cause the build to fail.

## Quick Fix for Current Build

If you just want to build now without installing Java 21:

1. Install Java 21:
   ```bash
   brew install openjdk@21
   ```

2. Set JAVA_HOME:
   ```bash
   export JAVA_HOME=$(/usr/libexec/java_home -v 21)
   ```

3. Verify:
   ```bash
   java -version
   # Should show: openjdk version "21.x.x"
   ```

4. Build:
   ```bash
   npx expo run:android
   ```

## Why This Happens

- **Java 25** (class file version 69) was released recently
- **Gradle 8.14.3** supports up to Java 21
- Gradle needs to be updated to support Java 25, or you need to use Java 21

## Long-term Solution

Either:
1. Keep Java 21 installed and use it for Android builds
2. Wait for Gradle to support Java 25 (future Gradle versions)
3. Use a Java version manager (like `jenv`) to switch between versions
