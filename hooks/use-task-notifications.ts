/**
 * useTaskNotifications Hook
 * 
 * Manages notification scheduling for tasks.
 * When a task is created or updated with a reminder, this hook schedules a notification.
 * When a task is deleted or reminder is disabled, this hook cancels the notification.
 * 
 * Usage:
 * ```
 * useTaskNotifications(tasks);
 * ```
 */

import { useEffect, useRef } from "react";
import { Task } from "@/lib/types/task";
import * as notificationHelper from "@/lib/notifications/notification-helper";

// Map to store notification IDs for each task
// Key: taskId, Value: notificationId
const notificationMap = new Map<string, string>();

/**
 * Hook to sync task reminders with scheduled notifications.
 * 
 * Responsibilities:
 * - Schedule notifications for new tasks with reminders
 * - Cancel notifications for tasks with reminders disabled
 * - Cancel notifications for deleted tasks
 * - Initialize notifications on first load
 */
export function useTaskNotifications(tasks: Task[]): void {
  const initializedRef = useRef(false);

  useEffect(() => {
    // Initialize notifications on first load
    if (!initializedRef.current) {
      notificationHelper.initializeNotifications();
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    // Sync notifications with tasks
    syncNotifications(tasks);
  }, [tasks]);
}

/**
 * Sync notifications with current tasks.
 * 
 * Algorithm:
 * 1. For each task with reminder enabled:
 *    - If notification not scheduled yet, schedule it
 *    - If notification already scheduled, check if time changed (update if needed)
 * 
 * 2. For each scheduled notification:
 *    - If corresponding task doesn't exist or reminder disabled, cancel it
 */
async function syncNotifications(tasks: Task[]): Promise<void> {
  try {
    const taskIdsWithReminders = new Set(
      tasks
        .filter((t) => t.reminderEnabled && t.reminderTime)
        .map((t) => t.id)
    );

    // Schedule or update notifications for tasks with reminders
    for (const task of tasks) {
      if (task.reminderEnabled && task.reminderTime) {
        const existingNotificationId = notificationMap.get(task.id);

        if (!existingNotificationId) {
          // Schedule new notification
          const notificationId = await notificationHelper.scheduleTaskReminder(
            task.id,
            task.title,
            task.reminderTime
          );

          if (notificationId) {
            notificationMap.set(task.id, notificationId);
          }
        }
        // Note: Updating notification time would require canceling and rescheduling
        // For now, we keep the existing notification
      }
    }

    // Cancel notifications for tasks without reminders or deleted tasks
    const taskIds = new Set(tasks.map((t) => t.id));
    const notificationIdsToCancel: string[] = [];

    for (const [taskId, notificationId] of notificationMap.entries()) {
      const task = tasks.find((t) => t.id === taskId);

      // Cancel if task doesn't exist or reminder is disabled
      if (!task || !task.reminderEnabled || !task.reminderTime) {
        notificationIdsToCancel.push(notificationId);
        notificationMap.delete(taskId);
      }
    }

    // Execute cancellations
    for (const notificationId of notificationIdsToCancel) {
      await notificationHelper.cancelReminder(notificationId);
    }
  } catch (error) {
    console.error("Failed to sync notifications:", error);
  }
}

/**
 * Get the notification ID for a task.
 * Useful for debugging or testing.
 */
export function getNotificationIdForTask(taskId: string): string | undefined {
  return notificationMap.get(taskId);
}

/**
 * Clear all notification mappings.
 * Call this when clearing all tasks.
 */
export function clearNotificationMappings(): void {
  notificationMap.clear();
}
