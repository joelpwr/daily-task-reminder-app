/**
 * Notification Helper
 * 
 * Handles all notification-related operations.
 * In native Android, this would use AlarmManager or WorkManager.
 * Here, we use expo-notifications which provides a cross-platform API.
 * 
 * Features:
 * - Request notification permission (Android 13+)
 * - Schedule local notifications
 * - Cancel scheduled notifications
 * - Handle notification taps
 * 
 * Why expo-notifications:
 * - Works on both iOS and Android
 * - Handles permission requests automatically
 * - Provides reliable scheduling
 * - Persists across app restarts
 */

import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * Initialize notifications.
 * Call this once when the app starts.
 * 
 * Sets up:
 * - Notification handler
 * - Permission requests
 * - Default notification behavior
 * - Android notification channel (for repeating sound)
 */
export async function initializeNotifications(): Promise<void> {
  try {
    // Set notification handler (what happens when notification arrives while app is in foreground)
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: false, // Deprecated but kept for backwards compatibility
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Set up Android notification channel with custom sound behavior
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("task-reminders", {
        name: "Task Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        enableLights: true,
        lightColor: "#0a7ea4",
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false, // Don't bypass Do Not Disturb
        showBadge: true,
      });
    }

    // Request notification permission on Android 13+
    if (Platform.OS === "android") {
      await requestNotificationPermission();
    }

    // On iOS, request permission
    if (Platform.OS === "ios") {
      await requestNotificationPermission();
    }

    console.log("Notifications initialized successfully");
  } catch (error) {
    console.error("Failed to initialize notifications:", error);
  }
}

/**
 * Request notification permission from the user.
 * Required on Android 13+ and iOS.
 * 
 * Returns true if permission granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    const granted = status === "granted";
    console.log(
      `Notification permission: ${granted ? "granted" : "denied"}`
    );
    return granted;
  } catch (error) {
    console.error("Failed to request notification permission:", error);
    return false;
  }
}

/**
 * Check if notification permission is granted.
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === "granted";
  } catch (error) {
    console.error("Failed to check notification permission:", error);
    return false;
  }
}

/**
 * Schedule a local notification for a task reminder.
 * 
 * Parameters:
 * - taskId: Unique identifier for the task
 * - taskTitle: Title of the task
 * - reminderTime: ISO string of when to show the notification
 * 
 * Returns the notification ID (needed to cancel later).
 * 
 * Reminder Schedule:
 * - If task is more than 24 hours away: notification 1 day before
 * - If task is more than 12 hours away: notification 12 hours before
 * - If task is more than 6 hours away: notification 6 hours before
 * - At scheduled time: main notification
 * - After scheduled time: follow-up notifications every 2 minutes for 10 minutes
 */
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  reminderTime: string
): Promise<string | null> {
  try {
    // Check if permission is granted
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) {
      console.warn("Notification permission not granted");
      return null;
    }

    const reminderDate = new Date(reminderTime);
    const now = new Date();

    // Don't schedule if reminder time is in the past
    if (reminderDate <= now) {
      console.warn("Reminder time is in the past");
      return null;
    }

    // Calculate seconds until reminder
    const secondsUntilReminder = Math.floor(
      (reminderDate.getTime() - now.getTime()) / 1000
    );

    const hoursUntilReminder = secondsUntilReminder / 3600;

    // Schedule advance notifications based on how far away the task is
    const advanceNotifications: Array<{ seconds: number; title: string; body: string }> = [];

    // 1 day before (if task is more than 24 hours away)
    if (hoursUntilReminder > 24) {
      const advanceSeconds = secondsUntilReminder - (24 * 3600);
      if (advanceSeconds > 0) { // Only schedule if in the future
        advanceNotifications.push({
          seconds: advanceSeconds,
          title: "📅 Upcoming Task Tomorrow",
          body: `${taskTitle} is scheduled for tomorrow`,
        });
      }
    }

    // 12 hours before (if task is more than 12 hours away)
    if (hoursUntilReminder > 12) {
      const advanceSeconds = secondsUntilReminder - (12 * 3600);
      if (advanceSeconds > 0) { // Only schedule if in the future
        advanceNotifications.push({
          seconds: advanceSeconds,
          title: "⏳ Task in 12 Hours",
          body: `${taskTitle} is coming up in 12 hours`,
        });
      }
    }

    // 6 hours before (if task is more than 6 hours away)
    if (hoursUntilReminder > 6) {
      const advanceSeconds = secondsUntilReminder - (6 * 3600);
      if (advanceSeconds > 0) { // Only schedule if in the future
        advanceNotifications.push({
          seconds: advanceSeconds,
          title: "⏰ Task in 6 Hours",
          body: `${taskTitle} is coming up in 6 hours`,
        });
      }
    }

    // Schedule all advance notifications
    for (const notification of advanceNotifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: {
            taskId,
            taskTitle,
            isAdvanceReminder: true,
          },
          sound: "default",
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.DEFAULT,
          ...(Platform.OS === "android" && {
            vibrate: [0, 250, 250, 250],
            categoryIdentifier: "reminder",
          }),
        },
        trigger: {
          type: "time",
          seconds: notification.seconds,
          channelId: "task-reminders",
        } as any,
      });
    }

    // Schedule the main notification at the exact time
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Task Reminder - NOW",
        body: taskTitle,
        data: {
          taskId,
          taskTitle,
          isMainReminder: true,
        },
        sound: "default",
        badge: 1,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === "android" && {
          vibrate: [0, 250, 250, 250],
          categoryIdentifier: "reminder",
          sticky: false,
        }),
      },
      trigger: {
        type: "time",
        seconds: secondsUntilReminder,
        channelId: "task-reminders",
      } as any,
    });

    // Schedule follow-up notifications every 2 minutes for 10 minutes AFTER the scheduled time
    const followUpIntervals = [120, 240, 360, 480, 600]; // 2, 4, 6, 8, 10 minutes after
    
    for (const interval of followUpIntervals) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Reminder: Still Pending",
          body: taskTitle,
          data: {
            taskId,
            taskTitle,
            isFollowUp: true,
          },
          sound: "default",
          badge: 1,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === "android" && {
            vibrate: [0, 250, 250, 250],
            categoryIdentifier: "reminder",
          }),
        },
        trigger: {
          type: "time",
          seconds: secondsUntilReminder + interval,
          channelId: "task-reminders",
        } as any,
      });
    }

    console.log(
      `Scheduled reminder for task ${taskId}: ${notificationId} ` +
      `(${advanceNotifications.length} advance + 1 main + ${followUpIntervals.length} follow-ups)`
    );
    return notificationId;
  } catch (error) {
    console.error("Failed to schedule reminder:", error);
    return null;
  }
}

/**
 * Cancel a scheduled notification.
 * 
 * Parameters:
 * - notificationId: ID returned from scheduleTaskReminder
 */
export async function cancelReminder(notificationId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Cancelled reminder: ${notificationId}`);
  } catch (error) {
    console.error("Failed to cancel reminder:", error);
  }
}

/**
 * Get all scheduled notifications.
 * Useful for debugging or syncing state.
 */
export async function getScheduledNotifications(): Promise<
  Notifications.NotificationRequest[]
> {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Failed to get scheduled notifications:", error);
    return [];
  }
}

/**
 * Cancel all scheduled notifications.
 * Use with caution (e.g., when user clears all tasks).
 */
export async function cancelAllReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log("Cancelled all reminders");
  } catch (error) {
    console.error("Failed to cancel all reminders:", error);
  }
}

/**
 * Handle notification tap.
 * Call this in your app to respond when user taps a notification.
 * 
 * Example usage:
 * ```
 * useEffect(() => {
 *   const subscription = Notifications.addNotificationResponseReceivedListener(
 *     (response) => {
 *       const taskId = response.notification.request.content.data.taskId;
 *       // Navigate to task or highlight it
 *     }
 *   );
 *   return () => subscription.remove();
 * }, []);
 * ```
 */
export function setupNotificationTapHandler(
  onNotificationTap: (taskId: string) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const taskId = response.notification.request.content.data?.taskId as string | undefined;
      if (taskId && typeof taskId === "string") {
        onNotificationTap(taskId);
      }
    }
  );

  return () => subscription.remove();
}

/**
 * Format a reminder time for display in notifications.
 * Input: ISO string (e.g., "2024-01-15T14:30:00Z")
 * Output: "Today at 2:30 PM" or "Jan 15 at 2:30 PM"
 */
export function formatReminderTimeForNotification(
  isoString: string
): string {
  try {
    const date = new Date(isoString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    });

    const time = timeFormatter.format(date);
    const dateStr = dateFormatter.format(date);

    return isToday ? `Today at ${time}` : `${dateStr} at ${time}`;
  } catch {
    return "Reminder set";
  }
}
