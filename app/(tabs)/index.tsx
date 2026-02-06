/**
 * Home Screen - Daily Task & Reminder App
 * 
 * Main screen showing:
 * - List of all tasks
 * - Floating Action Button (FAB) to add new task
 * - Task completion toggle
 * - Task deletion
 * - Empty state when no tasks exist
 * 
 * Architecture: MVVM pattern
 * - useTaskContext() provides state and actions (ViewModel)
 * - Components render based on state
 * - User interactions dispatch actions through context
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { ScreenContainer } from "@/components/screen-container";
import { TaskItem } from "@/components/task-item";
import { AddTaskDialog } from "@/components/add-task-dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { PriorityFilter } from "@/components/priority-filter";
import { CompletionFilter, CompletionFilterType } from "@/components/completion-filter";
import { CategoryFilter } from "@/components/category-filter";
import { TaskSearch } from "@/components/task-search";
import { TaskStatistics } from "@/components/task-statistics";
import { TaskPriority, TaskCategory } from "@/lib/types/task";
import { useTaskContext } from "@/lib/context/task-context";
import { useColors } from "@/hooks/use-colors";
import { useTaskNotifications } from "@/hooks/use-task-notifications";
import { TaskFormData } from "@/lib/types/task";
import * as Haptics from "expo-haptics";

/**
 * Home Screen Component
 * 
 * Layout:
 * ┌─────────────────────────────┐
 * │ Daily Tasks                 │  ← Header
 * ├─────────────────────────────┤
 * │ ☐ Task 1                   │
 * │ ☑ Task 2 (completed)       │
 * │ ☐ Task 3                   │
 * │                             │
 * │                    ┌─────┐  │
 * │                    │  +  │  │  ← FAB
 * │                    └─────┘  │
 * └─────────────────────────────┘
 */
export default function HomeScreen() {
  const colors = useColors();
  const { state, createTask, updateTask, deleteTask, toggleTaskCompletion } =
    useTaskContext();
  
  // Sync task reminders with notifications
  useTaskNotifications(state.tasks);

  // Dialog states
  const [addDialogVisible, setAddDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTaskForDelete, setSelectedTaskForDelete] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  
  // Filter states
  const [priorityFilter, setPriorityFilter] = useState<"all" | TaskPriority>("all");
  const [completionFilter, setCompletionFilter] = useState<CompletionFilterType>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | TaskCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");

  /**
   * Handle notification tap - opens the task for editing.
   */
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const taskId = response.notification.request.content.data?.taskId as string | undefined;
        if (taskId && typeof taskId === "string") {
          // Check if task still exists
          const task = state.tasks.find((t) => t.id === taskId);
          if (task) {
            // Open the task for editing
            setEditingTask(taskId);
            setAddDialogVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
      }
    );

    return () => subscription.remove();
  }, [state.tasks]);

  /**
   * Handle adding a new task.
   */
  const handleAddTask = useCallback(
    async (formData: TaskFormData) => {
      try {
        await createTask(formData);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        console.error("Error creating task:", error);
      }
    },
    [createTask]
  );

  /**
   * Handle updating an existing task.
   */
  const handleUpdateTask = useCallback(
    async (formData: TaskFormData) => {
      if (!editingTask) return;

      try {
        await updateTask(editingTask, {
          title: formData.title,
          note: formData.note,
          priority: formData.priority,
          category: formData.category,
          reminderEnabled: formData.reminderEnabled,
          reminderTime: formData.reminderTime,
        });
        setEditingTask(null);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        console.error("Error updating task:", error);
      }
    },
    [editingTask, updateTask]
  );

  /**
   * Handle opening add dialog.
   */
  const handleOpenAddDialog = useCallback(() => {
    setEditingTask(null);
    setAddDialogVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  /**
   * Handle opening edit dialog for a task.
   */
  const handleEditTask = useCallback((taskId: string) => {
    setEditingTask(taskId);
    setAddDialogVisible(true);
  }, []);

  /**
   * Handle toggling task completion.
   */
  const handleToggleComplete = useCallback(
    async (taskId: string) => {
      try {
        await toggleTaskCompletion(taskId);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        console.error("Error toggling task:", error);
      }
    },
    [toggleTaskCompletion]
  );

  /**
   * Handle opening delete confirmation dialog.
   */
  const handleOpenDeleteDialog = useCallback((taskId: string) => {
    setSelectedTaskForDelete(taskId);
    setDeleteDialogVisible(true);
  }, []);

  /**
   * Handle confirming task deletion.
   */
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTaskForDelete) return;

    try {
      await deleteTask(selectedTaskForDelete);
      setDeleteDialogVisible(false);
      setSelectedTaskForDelete(null);
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  }, [selectedTaskForDelete, deleteTask]);

  /**
   * Get the task being edited for the dialog.
   */
  const editingTaskData = editingTask
    ? state.tasks.find((t) => t.id === editingTask)
    : null;

  /**
   * Get the task being deleted for the confirmation dialog.
   */
  const deletingTaskData = selectedTaskForDelete
    ? state.tasks.find((t) => t.id === selectedTaskForDelete)
    : null;

  /**
   * Filter tasks based on selected priority filter.
   */
  const filteredTasks = useMemo(() => {
    let tasks = state.tasks;

    // Apply completion filter
    if (completionFilter === "active") {
      tasks = tasks.filter((task) => !task.isCompleted);
    } else if (completionFilter === "completed") {
      tasks = tasks.filter((task) => task.isCompleted);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      tasks = tasks.filter((task) => task.priority === priorityFilter);
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      tasks = tasks.filter((task) => task.category === categoryFilter);
    }

    // Apply search filter
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          (task.note && task.note.toLowerCase().includes(query))
      );
    }

    return tasks;
  }, [state.tasks, priorityFilter, completionFilter, categoryFilter, searchQuery]);

  /**
   * Render a task item.
   */
  const renderTaskItem = ({ item }: { item: any }) => (
    <TaskItem
      task={item}
      onPress={() => handleEditTask(item.id)}
      onToggleComplete={() => handleToggleComplete(item.id)}
      onDelete={() => handleOpenDeleteDialog(item.id)}
    />
  );

  /**
   * Render empty state.
   */
  const renderEmptyState = () => {
    const hasFilters = 
      priorityFilter !== "all" || 
      completionFilter !== "all" || 
      categoryFilter !== "all" || 
      searchQuery.trim().length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name={hasFilters ? "filter-outline" : "checkmark-done-circle-outline"}
          size={64}
          color={colors.muted}
          style={{ marginBottom: 16 }}
        />
        <Text
          style={[
            styles.emptyTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          {hasFilters ? "No Tasks Found" : "No Tasks Yet"}
        </Text>
        <Text
          style={[
            styles.emptySubtitle,
            {
              color: colors.muted,
            },
          ]}
        >
          {hasFilters
            ? "Try adjusting your filters or search query"
            : "Tap the + button to create your first task"}
        </Text>
      </View>
    );
  };

  /**
   * Render loading state.
   */
  if (state.loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="flex-1 p-0">
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.foreground,
            },
          ]}
        >
          Daily Tasks
        </Text>
        <Text
          style={[
            styles.headerSubtitle,
            {
              color: colors.muted,
            },
          ]}
        >
          {filteredTasks.length} of {state.tasks.length} task{state.tasks.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {/* Task Statistics */}
      <TaskStatistics tasks={state.tasks} />

      {/* Search Bar */}
      <TaskSearch value={searchQuery} onChangeText={setSearchQuery} />

      {/* Completion Filter */}
      <CompletionFilter
        selectedFilter={completionFilter}
        onFilterChange={setCompletionFilter}
      />

      {/* Category Filter */}
      <CategoryFilter
        selectedFilter={categoryFilter}
        onFilterChange={setCategoryFilter}
      />

      {/* Priority Filter */}
      <PriorityFilter
        selectedFilter={priorityFilter}
        onFilterChange={setPriorityFilter}
      />

      {/* Task List */}
      <FlatList
        data={filteredTasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        scrollEnabled={true}
        contentContainerStyle={
          filteredTasks.length === 0 ? { flexGrow: 1 } : undefined
        }
      />

      {/* Error Message */}
      {state.error && (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: colors.error + "20",
              borderTopColor: colors.error,
            },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={16}
            color={colors.error}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.errorText,
              {
                color: colors.error,
              },
            ]}
          >
            {state.error}
          </Text>
        </View>
      )}

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={handleOpenAddDialog}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: colors.primary,
          },
          pressed && { transform: [{ scale: 0.95 }], opacity: 0.9 },
        ]}
      >
        <Ionicons name="add" size={32} color="white" />
      </Pressable>

      {/* Add/Edit Task Dialog */}
      <AddTaskDialog
        visible={addDialogVisible}
        task={editingTaskData}
        onClose={() => {
          setAddDialogVisible(false);
          setEditingTask(null);
        }}
        onSave={editingTask ? handleUpdateTask : handleAddTask}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        visible={deleteDialogVisible}
        taskTitle={deletingTaskData?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteDialogVisible(false);
          setSelectedTaskForDelete(null);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
