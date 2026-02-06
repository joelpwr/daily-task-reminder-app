/**
 * AddTaskDialog Component
 * 
 * A bottom sheet dialog for creating or editing tasks.
 * Similar to a Dialog or BottomSheetDialogFragment in native Android.
 * 
 * Features:
 * - Task title input (required)
 * - Optional note input
 * - Reminder toggle and time picker
 * - Form validation
 * - Save and cancel buttons
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/lib/utils";
import { Task, TaskFormData, TaskPriority, TaskCategory, PRIORITY_CONFIG, CATEGORY_CONFIG } from "@/lib/types/task";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

interface AddTaskDialogProps {
  visible: boolean;
  task?: Task | null;
  onClose: () => void;
  onSave: (data: TaskFormData) => Promise<void>;
}

/**
 * AddTaskDialog component.
 * 
 * Layout:
 * ┌─────────────────────────────┐
 * │ New Task              [✕]   │
 * ├─────────────────────────────┤
 * │ Task Title *                │
 * │ ┌─────────────────────────┐ │
 * │ │ Buy groceries           │ │
 * │ └─────────────────────────┘ │
 * │                             │
 * │ Note (optional)             │
 * │ ┌─────────────────────────┐ │
 * │ │ Milk, bread, eggs       │ │
 * │ └─────────────────────────┘ │
 * │                             │
 * │ ☐ Set Reminder              │
 * │                             │
 * │ ┌─────────────────────────┐ │
 * │ │ Cancel      │    Save    │ │
 * │ └─────────────────────────┘ │
 * └─────────────────────────────┘
 */
export function AddTaskDialog({
  visible,
  task,
  onClose,
  onSave,
}: AddTaskDialogProps) {
  const colors = useColors();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("personal");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize form with task data if editing.
   */
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNote(task.note || "");
      setPriority(task.priority);
      setCategory(task.category);
      setReminderEnabled(task.reminderEnabled);
      if (task.reminderTime) {
        setReminderTime(new Date(task.reminderTime));
      }
    } else {
      setTitle("");
      setNote("");
      setPriority("medium");
      setCategory("personal");
      setReminderEnabled(false);
      setReminderTime(new Date());
    }
    setError(null);
    setShowDatePicker(false);
    setShowTimePicker(false);
  }, [task, visible]);

  /**
   * Handle date picker change (Android).
   */
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    
    if (event.type === "set" && selectedDate) {
      // Update the date part, keep the time part
      const newDate = new Date(reminderTime);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setReminderTime(newDate);
      
      // On Android, show time picker after date is selected
      if (Platform.OS === "android") {
        setTimeout(() => setShowTimePicker(true), 100);
      }
    }
  };

  /**
   * Handle time picker change (Android).
   */
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (event.type === "set" && selectedDate) {
      // Update the time part, keep the date part
      const newDate = new Date(reminderTime);
      newDate.setHours(selectedDate.getHours());
      newDate.setMinutes(selectedDate.getMinutes());
      setReminderTime(newDate);
    }
  };

  /**
   * Open date/time picker based on platform.
   */
  const handleOpenPicker = () => {
    if (Platform.OS === "android") {
      // On Android, show date picker first
      setShowDatePicker(true);
    } else {
      // On iOS, show combined picker
      setShowTimePicker(true);
    }
  };

  /**
   * Validate and save task.
   */
  const handleSave = async () => {
    // Validate title
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData: TaskFormData = {
        title: title.trim(),
        note: note.trim() || undefined,
        priority,
        category,
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime.toISOString() : undefined,
      };

      await onSave(formData);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save task";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const isEditing = !!task;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: colors.background }]}
      >
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
            {isEditing ? "Edit Task" : "New Task"}
          </Text>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && { opacity: 0.6 },
            ]}
          >
            <Ionicons
              name="close"
              size={28}
              color={colors.foreground}
            />
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Error message */}
          {error && (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: colors.error + "20",
                  borderColor: colors.error,
                },
              ]}
            >
              <Ionicons
                name="alert-circle"
                size={16}
                color={colors.error}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Task Title Input */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.foreground,
                },
              ]}
            >
              Task Title <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="What do you need to do?"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              editable={!loading}
              maxLength={100}
            />
          </View>

          {/* Note Input */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.foreground,
                },
              ]}
            >
              Note (optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.noteInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: colors.foreground,
                },
              ]}
              placeholder="Add additional details..."
              placeholderTextColor={colors.muted}
              value={note}
              onChangeText={setNote}
              editable={!loading}
              multiline
              maxLength={500}
            />
          </View>

          {/* Priority Selector */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.foreground,
                },
              ]}
            >
              Priority
            </Text>
            <View style={styles.priorityButtons}>
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPriority(p)}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.priorityButton,
                    {
                      backgroundColor:
                        priority === p
                          ? PRIORITY_CONFIG[p].color
                          : colors.surface,
                      borderColor:
                        priority === p
                          ? PRIORITY_CONFIG[p].color
                          : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text
                    style={[
                      styles.priorityButtonText,
                      {
                        color:
                          priority === p ? "white" : colors.foreground,
                      },
                    ]}
                  >
                    {PRIORITY_CONFIG[p].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.field}>
            <Text
              style={[
                styles.label,
                {
                  color: colors.foreground,
                },
              ]}
            >
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {(Object.keys(CATEGORY_CONFIG) as TaskCategory[]).map((c) => (
                <Pressable
                  key={c}
                  onPress={() => setCategory(c)}
                  disabled={loading}
                  style={({ pressed }) => [
                    styles.categoryButton,
                    {
                      backgroundColor:
                        category === c
                          ? CATEGORY_CONFIG[c].color
                          : colors.surface,
                      borderColor:
                        category === c
                          ? CATEGORY_CONFIG[c].color
                          : colors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Ionicons
                    name={CATEGORY_CONFIG[c].icon as any}
                    size={20}
                    color={category === c ? "white" : colors.foreground}
                    style={{ marginBottom: 4 }}
                  />
                  <Text
                    style={[
                      styles.categoryButtonText,
                      {
                        color:
                          category === c ? "white" : colors.foreground,
                      },
                    ]}
                  >
                    {CATEGORY_CONFIG[c].label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Reminder Toggle */}
          <View
            style={[
              styles.reminderContainer,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.reminderHeader}>
              <Ionicons
                name="notifications"
                size={20}
                color={colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  styles.reminderLabel,
                  {
                    color: colors.foreground,
                  },
                ]}
              >
                Set Reminder
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              disabled={loading}
              trackColor={{
                false: colors.border,
                true: colors.primary + "50",
              }}
              thumbColor={reminderEnabled ? colors.primary : colors.muted}
            />
          </View>

          {/* Reminder Time Picker */}
          {reminderEnabled && (
            <View style={styles.field}>
              <Text
                style={[
                  styles.label,
                  {
                    color: colors.foreground,
                  },
                ]}
              >
                Reminder Time
              </Text>
              <Pressable
                onPress={handleOpenPicker}
                disabled={loading}
                style={[
                  styles.timeButton,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="time"
                  size={18}
                  color={colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.timeButtonText,
                    {
                      color: colors.foreground,
                    },
                  ]}
                >
                  {reminderTime.toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Date Picker (Android - Date only) */}
          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={reminderTime}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
          
          {/* Time Picker (Android - Time only, iOS - DateTime combined) */}
          {showTimePicker && (
            <DateTimePicker
              value={reminderTime}
              mode={Platform.OS === "ios" ? "datetime" : "time"}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
              minimumDate={Platform.OS === "ios" ? new Date() : undefined}
            />
          )}
          
          {/* iOS Done Button */}
          {showTimePicker && Platform.OS === "ios" && (
            <Pressable
              onPress={() => setShowTimePicker(false)}
              style={[
                styles.timePickerDone,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.timePickerDoneText}>Done</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Pressable
            onPress={onClose}
            disabled={loading}
            style={({ pressed }) => [
              styles.cancelButton,
              {
                borderColor: colors.border,
              },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text
              style={[
                styles.cancelButtonText,
                {
                  color: colors.foreground,
                },
              ]}
            >
              Cancel
            </Text>
          </Pressable>

          <Pressable
            onPress={handleSave}
            disabled={loading}
            style={({ pressed }) => [
              styles.saveButton,
              {
                backgroundColor: colors.primary,
              },
              pressed && { opacity: 0.8 },
              loading && { opacity: 0.6 },
            ]}
          >
            <Text style={styles.saveButtonText}>
              {loading ? "Saving..." : isEditing ? "Update" : "Save"}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
  },
  noteInput: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  reminderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  reminderHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  timeButtonText: {
    fontSize: 16,
    flex: 1,
  },
  timePickerDone: {
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 8,
    borderRadius: 8,
  },
  timePickerDoneText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  saveButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  priorityButtons: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
  },
  priorityButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    width: "31%",
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
