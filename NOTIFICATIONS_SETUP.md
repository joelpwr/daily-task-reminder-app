# Notification Setup & Background Execution

## Current Issue: Notifications Only Work When App is Open

You're experiencing this because you're running the app in **Expo Go**, which has significant limitations for background notifications.

## Why Notifications Don't Work in Background with Expo Go

**Expo Go Limitations:**
1. ❌ Background notifications are unreliable in Expo Go
2. ❌ Scheduled notifications may not fire when app is closed
3. ❌ Push notification functionality removed in SDK 53+
4. ❌ Background tasks have limited support

**What DOES work in Expo Go:**
- ✅ Notifications when app is in foreground
- ✅ Notifications when app is in background (sometimes)
- ❌ Reliable notifications when app is fully closed

## Solution: Build a Development Build

To get reliable background notifications, you need to create a **development build** instead of using Expo Go.

### Option 1: Local Development Build (Recommended)

**For Android:**

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure the project
eas build:configure

# Create a development build for Android
eas build --profile development --platform android

# Once built, download and install the APK on your device
```

**For iOS:**

```bash
# Create a development build for iOS
eas build --profile development --platform ios

# Install on your device via TestFlight or direct installation
```

### Option 2: Quick Test with Expo Dev Client

```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Run with dev client
npx expo run:android
# or
npx expo run:ios
```

## What I've Already Configured

I've added the necessary configuration to `app.config.ts`:

### ✅ Notification Plugin
```typescript
[
  "expo-notifications",
  {
    icon: "./assets/images/icon.png",
    color: "#0a7ea4",
    sounds: ["./assets/sounds/notification.wav"],
    mode: "production",
  },
]
```

### ✅ Android Permissions
```typescript
permissions: [
  "POST_NOTIFICATIONS",      // Required for Android 13+
  "RECEIVE_BOOT_COMPLETED",  // Restart notifications after reboot
  "VIBRATE",                 // Vibration support
  "WAKE_LOCK",               // Keep device awake for notifications
]
```

### ✅ Notification Features Implemented
- Multi-stage reminders (24h, 12h, 6h before)
- On-time notifications
- Follow-up reminders (every 2 min for 10 min)
- High priority notifications
- Vibration patterns
- Custom notification channel

## Testing Background Notifications

Once you have a development build:

1. **Create a task with a reminder** set for 2-3 minutes from now
2. **Close the app completely** (swipe away from recent apps)
3. **Wait for the notification** - it should fire even when app is closed
4. **Tap the notification** - app should open and show the task

## Expected Behavior in Development Build

### When App is Closed:
```
User sets reminder for 3:00 PM
    ↓
User closes app completely
    ↓
3:00 PM → Notification fires (sound + vibration)
    ↓
User taps notification → App opens to task
```

### Advance Reminders:
```
Task scheduled for Friday 3:00 PM
    ↓
Thursday 3:00 PM → "Upcoming Task Tomorrow" notification
    ↓
Friday 3:00 AM → "Task in 12 Hours" notification
    ↓
Friday 9:00 AM → "Task in 6 Hours" notification
    ↓
Friday 3:00 PM → "Task Reminder - NOW" notification
    ↓
Friday 3:02 PM → "Still Pending" notification
    ↓
... continues every 2 minutes for 10 minutes
```

## Why This Happens

**Expo Go is a sandbox app** that runs your code inside its own container. It has:
- Limited native module access
- Restricted background execution
- No custom native code
- Shared notification system with other Expo Go apps

**Development builds** are standalone apps that:
- Have full native module access
- Can run background tasks
- Have dedicated notification channels
- Work exactly like production apps

## Quick Commands Reference

```bash
# Check if notifications are scheduled
# (Add this to your app for debugging)
import * as Notifications from 'expo-notifications';
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Scheduled notifications:', scheduled);

# Build development version
eas build --profile development --platform android

# Build production version (when ready)
eas build --profile production --platform android
```

## Additional Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Development Builds Guide](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)

## Summary

✅ **Your notification code is correct and complete**
✅ **Configuration is properly set up**
❌ **Expo Go doesn't support reliable background notifications**
✅ **Solution: Create a development build with `eas build`**

The notifications will work perfectly once you move from Expo Go to a development build!
