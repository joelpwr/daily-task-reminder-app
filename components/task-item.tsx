/**
 * TaskItem Component
 * 
 * Displays a single task in the list.
 * Similar to a RecyclerView item in native Android.
 * 
 * Features:
 * - Checkbox to toggle completion
 * - Task title and note preview
 * - Tap to edit
 * - Swipe to delete (optional)
 * - Visual feedback for completed tasks
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { Task, CATEGORY_CONFIG, PRIORITY_CONFIG } from "@/lib/types/task";
import { useColors } from "@/hooks/use-colors";

interface TaskItemProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  onDelete: () => void;
}

/**
 * TaskItem component.
 * 
 * Layout:
 * ┌─────────────────────────────────┐
 * │ ☐ Task Title                    │
 * │   Optional note preview...      │
 * │                            [✕]  │
 * └─────────────────────────────────┘
 * 
 * Interactions:
 * - Tap checkbox: toggle completion
 * - Tap task: open edit dialog
 * - Tap delete icon: delete task
 */
export function TaskItem({
  task,
  onPress,
  onToggleComplete,
  onDelete,
}: TaskItemProps) {
  const colors = useColors();

  // Provide defaults for old tasks without category/priority
  const category = task.category || "personal";
  const priority = task.priority || "medium";

  const handleCheckboxPress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onToggleComplete();
  };

  const handleDeletePress = (e: GestureResponderEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
        },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.content}>
        {/* Checkbox */}
        <Pressable
          onPress={handleCheckboxPress}
          style={[
            styles.checkbox,
            {
              borderColor: task.isCompleted ? colors.success : colors.border,
              backgroundColor: task.isCompleted ? colors.success : "transparent",
            },
          ]}
        >
          {task.isCompleted && (
            <Ionicons
              name="checkmark"
              size={16}
              color={colors.background}
              style={{ marginTop: -1 }}
            />
          )}
        </Pressable>

        {/* Text Content */}
        <View style={styles.textContent}>
          {/* Category and Priority Badges */}
          <View style={styles.badgeRow}>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: CATEGORY_CONFIG[category].color + "20" },
              ]}
            >
              <Ionicons
                name={CATEGORY_CONFIG[category].icon as any}
                size={12}
                color={CATEGORY_CONFIG[category].color}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: CATEGORY_CONFIG[category].color },
                ]}
              >
                {CATEGORY_CONFIG[category].label}
              </Text>
            </View>

            <View
              style={[
                styles.priorityBadge,
                { backgroundColor: PRIORITY_CONFIG[priority].color + "20" },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: PRIORITY_CONFIG[priority].color },
                ]}
              >
                {PRIORITY_CONFIG[priority].label}
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.title,
              {
                color: task.isCompleted ? colors.muted : colors.foreground,
              },
              task.isCompleted && styles.completedTitle,
            ]}
            numberOfLines={1}
          >
            {task.title}
          </Text>

          {task.note && (
            <Text
              style={[
                styles.note,
                {
                  color: colors.muted,
                },
              ]}
              numberOfLines={1}
            >
              {task.note}
            </Text>
          )}

          {/* Reminder indicator */}
          {task.reminderEnabled && task.reminderTime && (
            <View style={styles.reminderBadge}>
              <Ionicons
                name="notifications"
                size={12}
                color={colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.reminderText, { color: colors.primary }]}>
                {formatReminderTime(task.reminderTime)}
              </Text>
            </View>
          )}
        </View>

        {/* Delete button */}
        <Pressable
          onPress={handleDeletePress}
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && { opacity: 0.6 },
          ]}
        >
          <Ionicons
            name="close-circle"
            size={24}
            color={colors.error}
            style={{ marginLeft: 8 }}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

/**
 * Format reminder time for display.
 * Input: ISO string (e.g., "2024-01-15T14:30:00Z")
 * Output: "2:30 PM" or "Today at 2:30 PM"
 */
function formatReminderTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();

    // Check if reminder is today
    const isToday =
      date.toDateString() === now.toDateString();

    // Format time
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const time = timeFormatter.format(date);
    return isToday ? `Today ${time}` : time;
  } catch {
    return "Reminder set";
  }
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 22,
  },
  completedTitle: {
    textDecorationLine: "line-through",
  },
  note: {
    fontSize: 14,
    lineHeight: 20,
  },
  reminderBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButton: {
    padding: 4,
    marginRight: -4,
  },
});
