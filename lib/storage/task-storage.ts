/**
 * Task Storage Layer
 * 
 * This module handles all persistence operations for tasks.
 * In a native Android app, this would be the Room DAO (Data Access Object).
 * Here, we use AsyncStorage (React Native's local key-value store).
 * 
 * Why AsyncStorage:
 * - Simple, no setup required
 * - Persists data across app restarts
 * - Good performance for small datasets (< 10MB)
 * - Works offline
 * 
 * For larger apps, you could upgrade to SQLite via expo-sqlite.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Task, CreateTaskPayload, UpdateTaskPayload } from "@/lib/types/task";

// Key for storing tasks in AsyncStorage
const TASKS_STORAGE_KEY = "daily_tasks";

/**
 * Generate a simple UUID v4 compatible ID for React Native.
 * Uses Math.random() which is sufficient for client-side task IDs.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Initialize storage (create empty array if no tasks exist).
 * Call this once when the app starts.
 */
export async function initializeStorage(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    if (!existing) {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
    }
  } catch (error) {
    console.error("Failed to initialize storage:", error);
  }
}

/**
 * Get all tasks from storage.
 * Returns an empty array if no tasks exist.
 * Migrates old tasks to include category field if missing.
 */
export async function getAllTasks(): Promise<Task[]> {
  try {
    const data = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
    if (!data) {
      return [];
    }
    const tasks = JSON.parse(data) as Task[];
    
    // Migration: Add category field to old tasks
    const migratedTasks = tasks.map((task) => ({
      ...task,
      category: task.category || "personal", // Default to personal for old tasks
    }));
    
    // Save migrated tasks if any were updated
    const needsMigration = tasks.some((task) => !task.category);
    if (needsMigration) {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(migratedTasks));
    }
    
    return migratedTasks;
  } catch (error) {
    console.error("Failed to get tasks:", error);
    return [];
  }
}

/**
 * Get a single task by ID.
 * Returns null if task not found.
 */
export async function getTaskById(id: string): Promise<Task | null> {
  try {
    const tasks = await getAllTasks();
    return tasks.find((t) => t.id === id) || null;
  } catch (error) {
    console.error("Failed to get task:", error);
    return null;
  }
}

/**
 * Create a new task.
 * Generates a UUID and timestamps automatically.
 * Returns the created task.
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  try {
    const now = new Date().toISOString();
    const newTask: Task = {
      id: generateUUID(),
      title: payload.title,
      note: payload.note,
      isCompleted: false,
      priority: payload.priority,
      category: payload.category,
      reminderEnabled: payload.reminderEnabled,
      reminderTime: payload.reminderTime,
      createdAt: now,
      updatedAt: now,
    };

    const tasks = await getAllTasks();
    tasks.push(newTask);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));

    return newTask;
  } catch (error) {
    console.error("Failed to create task:", error);
    throw error;
  }
}

/**
 * Update an existing task.
 * Only updates fields that are provided.
 * Returns the updated task.
 */
export async function updateTask(
  id: string,
  payload: UpdateTaskPayload
): Promise<Task | null> {
  try {
    const tasks = await getAllTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      console.warn(`Task with id ${id} not found`);
      return null;
    }

    const now = new Date().toISOString();
    const updatedTask: Task = {
      ...tasks[index],
      ...payload,
      updatedAt: now,
    };

    tasks[index] = updatedTask;
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));

    return updatedTask;
  } catch (error) {
    console.error("Failed to update task:", error);
    throw error;
  }
}

/**
 * Delete a task by ID.
 * Returns true if deleted, false if not found.
 */
export async function deleteTask(id: string): Promise<boolean> {
  try {
    const tasks = await getAllTasks();
    const index = tasks.findIndex((t) => t.id === id);

    if (index === -1) {
      console.warn(`Task with id ${id} not found`);
      return false;
    }

    tasks.splice(index, 1);
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));

    return true;
  } catch (error) {
    console.error("Failed to delete task:", error);
    throw error;
  }
}

/**
 * Delete all tasks (use with caution).
 * Useful for testing or resetting the app.
 */
export async function deleteAllTasks(): Promise<void> {
  try {
    await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error("Failed to delete all tasks:", error);
    throw error;
  }
}

/**
 * Toggle task completion status.
 * Shorthand for updating just the isCompleted field.
 */
export async function toggleTaskCompletion(id: string): Promise<Task | null> {
  try {
    const task = await getTaskById(id);
    if (!task) {
      return null;
    }

    return updateTask(id, { isCompleted: !task.isCompleted });
  } catch (error) {
    console.error("Failed to toggle task completion:", error);
    throw error;
  }
}

/**
 * Get all tasks that have reminders enabled.
 * Used for scheduling notifications.
 */
export async function getTasksWithReminders(): Promise<Task[]> {
  try {
    const tasks = await getAllTasks();
    return tasks.filter((t) => t.reminderEnabled && t.reminderTime);
  } catch (error) {
    console.error("Failed to get tasks with reminders:", error);
    return [];
  }
}
