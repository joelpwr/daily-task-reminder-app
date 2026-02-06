/**
 * Task Repository
 * 
 * This layer sits between the UI and storage.
 * In MVVM architecture, the Repository handles data operations.
 * In native Android, this would be a Repository class that abstracts the DAO.
 * 
 * Responsibilities:
 * - Fetch and transform data from storage
 * - Apply business logic (sorting, filtering)
 * - Handle errors gracefully
 * - Provide a clean interface for the ViewModel
 */

import * as taskStorage from "@/lib/storage/task-storage";
import { Task, CreateTaskPayload, UpdateTaskPayload } from "@/lib/types/task";

/**
 * Priority order for sorting (high > medium > low).
 */
const PRIORITY_ORDER: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Get all tasks sorted by completion status, priority, and date.
 * Incomplete tasks appear first (sorted by priority, then date).
 * Completed tasks appear last (sorted by update date).
 */
export async function getAllTasksSorted(): Promise<Task[]> {
  const tasks = await taskStorage.getAllTasks();

  return tasks.sort((a, b) => {
    // If completion status differs, incomplete tasks come first
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }

    // For incomplete tasks, sort by priority (high > medium > low)
    if (!a.isCompleted && !b.isCompleted) {
      const priorityDiff =
        (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
    }

    // If same completion status and priority, sort by creation date (newest first)
    return (
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}

/**
 * Get incomplete tasks only.
 * Useful for showing "active" tasks.
 * Sorted by priority (high > medium > low), then by date.
 */
export async function getIncompleteTasks(): Promise<Task[]> {
  const tasks = await taskStorage.getAllTasks();
  return tasks
    .filter((t) => !t.isCompleted)
    .sort((a, b) => {
      // Sort by priority first
      const priorityDiff =
        (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
      if (priorityDiff !== 0) {
        return priorityDiff;
      }
      // Then by creation date (newest first)
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
}

/**
 * Get completed tasks only.
 * Useful for showing "done" tasks.
 */
export async function getCompletedTasks(): Promise<Task[]> {
  const tasks = await taskStorage.getAllTasks();
  return tasks
    .filter((t) => t.isCompleted)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

/**
 * Create a new task with validation.
 * Validates that title is not empty.
 */
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  // Validate required fields
  if (!payload.title || payload.title.trim().length === 0) {
    throw new Error("Task title is required");
  }

  // Trim whitespace
  const validatedPayload: CreateTaskPayload = {
    title: payload.title.trim(),
    note: payload.note?.trim(),
    priority: payload.priority,
    reminderEnabled: payload.reminderEnabled,
    reminderTime: payload.reminderTime,
  };

  return taskStorage.createTask(validatedPayload);
}

/**
 * Update a task with validation.
 * Only updates provided fields.
 */
export async function updateTask(
  id: string,
  payload: UpdateTaskPayload
): Promise<Task | null> {
  // Validate title if provided
  if (payload.title !== undefined && payload.title.trim().length === 0) {
    throw new Error("Task title cannot be empty");
  }

  // Trim whitespace
  const validatedPayload: UpdateTaskPayload = {
    title: payload.title?.trim(),
    note: payload.note?.trim(),
    priority: payload.priority,
    reminderEnabled: payload.reminderEnabled,
    reminderTime: payload.reminderTime,
    isCompleted: payload.isCompleted,
  };

  return taskStorage.updateTask(id, validatedPayload);
}

/**
 * Delete a task.
 */
export async function deleteTask(id: string): Promise<boolean> {
  return taskStorage.deleteTask(id);
}

/**
 * Toggle task completion.
 */
export async function toggleTaskCompletion(id: string): Promise<Task | null> {
  return taskStorage.toggleTaskCompletion(id);
}

/**
 * Get a single task by ID.
 */
export async function getTaskById(id: string): Promise<Task | null> {
  return taskStorage.getTaskById(id);
}

/**
 * Get tasks with reminders enabled.
 * Used for scheduling notifications.
 */
export async function getTasksWithReminders(): Promise<Task[]> {
  return taskStorage.getTasksWithReminders();
}

/**
 * Get tasks filtered by priority.
 * Returns tasks of specified priority level, sorted by completion and date.
 */
export async function getTasksByPriority(priority: string): Promise<Task[]> {
  const tasks = await taskStorage.getAllTasks();
  return tasks
    .filter((t) => t.priority === priority)
    .sort((a, b) => {
      // Incomplete tasks first
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // Then by creation date (newest first)
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
}

/**
 * Search tasks by title or note.
 * Case-insensitive partial matching.
 */
export async function searchTasks(query: string): Promise<Task[]> {
  if (!query || query.trim().length === 0) {
    return getAllTasksSorted();
  }

  const tasks = await taskStorage.getAllTasks();
  const lowerQuery = query.toLowerCase();

  return tasks
    .filter(
      (t) =>
        t.title.toLowerCase().includes(lowerQuery) ||
        (t.note && t.note.toLowerCase().includes(lowerQuery))
    )
    .sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      // Sort by priority for incomplete tasks
      if (!a.isCompleted && !b.isCompleted) {
        const priorityDiff =
          (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
        if (priorityDiff !== 0) {
          return priorityDiff;
        }
      }
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
}

/**
 * Get task statistics.
 * Useful for displaying summary information.
 */
export async function getTaskStatistics(): Promise<{
  total: number;
  completed: number;
  incomplete: number;
  withReminders: number;
}> {
  const tasks = await taskStorage.getAllTasks();
  const completed = tasks.filter((t) => t.isCompleted).length;
  const withReminders = tasks.filter((t) => t.reminderEnabled).length;

  return {
    total: tasks.length,
    completed,
    incomplete: tasks.length - completed,
    withReminders,
  };
}
