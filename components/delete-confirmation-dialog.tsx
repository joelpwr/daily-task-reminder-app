/**
 * DeleteConfirmationDialog Component
 * 
 * A simple alert dialog for confirming task deletion.
 * Similar to AlertDialog in native Android.
 */

import React from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
} from "react-native";
import { useColors } from "@/hooks/use-colors";

interface DeleteConfirmationDialogProps {
  visible: boolean;
  taskTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * DeleteConfirmationDialog component.
 * 
 * Asks user to confirm before deleting a task.
 */
export function DeleteConfirmationDialog({
  visible,
  taskTitle,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmationDialogProps) {
  const colors = useColors();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        ]}
      >
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
              },
            ]}
          >
            Delete Task?
          </Text>

          <Text
            style={[
              styles.message,
              {
                color: colors.muted,
              },
            ]}
          >
            Are you sure you want to delete "{taskTitle}"? This action cannot be undone.
          </Text>

          <View style={styles.buttons}>
            <Pressable
              onPress={onCancel}
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
              onPress={onConfirm}
              disabled={loading}
              style={({ pressed }) => [
                styles.deleteButton,
                {
                  backgroundColor: colors.error,
                },
                pressed && { opacity: 0.8 },
                loading && { opacity: 0.6 },
              ]}
            >
              <Text style={styles.deleteButtonText}>
                {loading ? "Deleting..." : "Delete"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    marginHorizontal: 32,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
