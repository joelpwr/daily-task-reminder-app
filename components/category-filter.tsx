/**
 * CategoryFilter Component
 * 
 * Horizontal scrollable filter for task categories.
 * Shows color-coded category chips with icons.
 */

import React from "react";
import { View, Pressable, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TaskCategory, CATEGORY_CONFIG } from "@/lib/types/task";
import { useColors } from "@/hooks/use-colors";

interface CategoryFilterProps {
  selectedFilter: "all" | TaskCategory;
  onFilterChange: (filter: "all" | TaskCategory) => void;
}

export function CategoryFilter({
  selectedFilter,
  onFilterChange,
}: CategoryFilterProps) {
  const colors = useColors();

  const filters: Array<{ id: "all" | TaskCategory; label: string; color?: string; icon?: string }> = [
    { id: "all", label: "All" },
    ...Object.entries(CATEGORY_CONFIG).map(([key, config]) => ({
      id: key as TaskCategory,
      label: config.label,
      color: config.color,
      icon: config.icon,
    })),
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => {
          const isSelected = selectedFilter === filter.id;
          const isAll = filter.id === "all";
          const backgroundColor = isSelected
            ? isAll
              ? colors.primary
              : filter.color
            : colors.surface;
          const textColor = isSelected ? "white" : colors.foreground;
          const borderColor = isSelected
            ? backgroundColor
            : colors.border;

          return (
            <Pressable
              key={filter.id}
              onPress={() => onFilterChange(filter.id)}
              style={({ pressed }) => [
                styles.filterChip,
                {
                  backgroundColor,
                  borderColor,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              {filter.icon && (
                <Ionicons
                  name={filter.icon as any}
                  size={16}
                  color={textColor}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.filterText,
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 6,
  },
  filterText: {
    fontSize: 14,
  },
});
