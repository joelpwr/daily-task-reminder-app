/**
 * CompletionFilter Component
 * 
 * Filter buttons to show tasks by completion status.
 * Allows users to filter: All, Active (incomplete), Completed.
 */

import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/use-colors";

export type CompletionFilterType = "all" | "active" | "completed";

interface CompletionFilterProps {
  selectedFilter: CompletionFilterType;
  onFilterChange: (filter: CompletionFilterType) => void;
}

export function CompletionFilter({
  selectedFilter,
  onFilterChange,
}: CompletionFilterProps) {
  const colors = useColors();

  const filters: Array<{ id: CompletionFilterType; label: string }> = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
  ];

  return (
    <View style={styles.container}>
      {filters.map((filter) => {
        const isSelected = selectedFilter === filter.id;
        const backgroundColor = isSelected ? colors.primary : colors.surface;
        const textColor = isSelected ? "white" : colors.foreground;

        return (
          <Pressable
            key={filter.id}
            onPress={() => onFilterChange(filter.id)}
            style={({ pressed }) => [
              styles.filterButton,
              {
                backgroundColor,
                borderColor: isSelected ? colors.primary : colors.border,
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
    paddingVertical: 8,
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
