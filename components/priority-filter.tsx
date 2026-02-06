/**
 * PriorityFilter Component
 * 
 * Horizontal filter buttons to show tasks by priority level.
 * Allows users to filter tasks: All, High, Medium, Low.
 */

import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { TaskPriority, PRIORITY_CONFIG } from "@/lib/types/task";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface PriorityFilterProps {
  /**
   * Current selected filter.
   * "all" shows all tasks, or a specific priority level.
   */
  selectedFilter: "all" | TaskPriority;
  
  /**
   * Called when user taps a filter button.
   */
  onFilterChange: (filter: "all" | TaskPriority) => void;
}

/**
 * PriorityFilter component.
 * 
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ [All] [High] [Medium] [Low]         │
 * └─────────────────────────────────────┘
 * 
 * Selected filter is highlighted with color.
 */
export function PriorityFilter({
  selectedFilter,
  onFilterChange,
}: PriorityFilterProps) {
  const colors = useColors();

  const filters: Array<{ id: "all" | TaskPriority; label: string }> = [
    { id: "all", label: "All" },
    { id: "high", label: "High" },
    { id: "medium", label: "Medium" },
    { id: "low", label: "Low" },
  ];

  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        const isColorFilter = filter.id !== "all";
        const backgroundColor = isSelected
          ? isColorFilter
            ? PRIORITY_CONFIG[filter.id as TaskPriority].color
            : colors.primary
          : colors.surface;
        const textColor = isSelected ? "white" : colors.foreground;

        return (
          <Pressable
            key={filter.id}
            onPress={() => onFilterChange(filter.id)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor,
                borderColor: isSelected ? backgroundColor : colors.border,
              },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: textColor,
                  fontWeight: isSelected ? "600" : "500",
                },
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  filterButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonText: {
    fontSize: 14,
  },
});
