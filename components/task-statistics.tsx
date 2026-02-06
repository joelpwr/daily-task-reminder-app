/**
 * TaskStatistics Component
 * 
 * Displays task completion statistics and progress.
 * Shows: total tasks, completed, pending, and completion percentage.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { Task } from "@/lib/types/task";

interface TaskStatisticsProps {
  tasks: Task[];
}

export function TaskStatistics({ tasks }: TaskStatisticsProps) {
  const colors = useColors();

  const total = tasks.length;
  const completed = tasks.filter((t) => t.isCompleted).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const withReminders = tasks.filter((t) => t.reminderEnabled).length;

  if (total === 0) {
    return null; // Don't show stats when there are no tasks
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.foreground }]}>
            Progress
          </Text>
          <Text style={[styles.progressPercentage, { color: colors.primary }]}>
            {completionRate}%
          </Text>
        </View>
        <View
          style={[
            styles.progressBarBackground,
            { backgroundColor: colors.border },
          ]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                backgroundColor: colors.success,
                width: `${completionRate}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Statistics Grid */}
      <View style={styles.statsGrid}>
        {/* Total Tasks */}
        <View style={styles.statItem}>
          <Ionicons
            name="list-outline"
            size={20}
            color={colors.primary}
            style={styles.statIcon}
          />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {total}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Total
          </Text>
        </View>

        {/* Completed Tasks */}
        <View style={styles.statItem}>
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={colors.success}
            style={styles.statIcon}
          />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {completed}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Done
          </Text>
        </View>

        {/* Pending Tasks */}
        <View style={styles.statItem}>
          <Ionicons
            name="time-outline"
            size={20}
            color={colors.error}
            style={styles.statIcon}
          />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {pending}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Pending
          </Text>
        </View>

        {/* Tasks with Reminders */}
        <View style={styles.statItem}>
          <Ionicons
            name="notifications-outline"
            size={20}
            color={colors.primary}
            style={styles.statIcon}
          />
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {withReminders}
          </Text>
          <Text style={[styles.statLabel, { color: colors.muted }]}>
            Reminders
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: "700",
  },
  progressBarBackground: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statIcon: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
});
