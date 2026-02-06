/**
 * Task Type Definition
 * 
 * This file defines the core data model for the Daily Task & Reminder app.
 * In a native Android app, this would be a Room Entity class.
 * Here, we use TypeScript interfaces for type safety.
 * 
 * Why this structure:
 * - `id`: Unique identifier for each task (UUID format)
 * - `title`: The main task description (required)
 * - `note`: Additional details or notes (optional)
 * - `isCompleted`: Track whether task is done
 * - `priority`: Task priority level (high, medium, low)
 * - `category`: Task category for organization
 * - `reminderEnabled`: Whether a reminder is set
 * - `reminderTime`: When the reminder should fire (ISO string)
 * - `createdAt` & `updatedAt`: Track task lifecycle
 */

/**
 * Priority levels for tasks.
 * Used for sorting and filtering.
 */
export type TaskPriority = "high" | "medium" | "low";

/**
 * Priority configuration with display info.
 */
export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  high: { label: "High", color: "#EF4444" },     // Red
  medium: { label: "Medium", color: "#F59E0B" }, // Amber
  low: { label: "Low", color: "#22C55E" },       // Green
};

/**
 * Task categories for organization.
 */
export type TaskCategory = "work" | "personal" | "shopping" | "health" | "finance" | "other";

/**
 * Category configuration with display info and colors.
 */
export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; color: string; icon: string }> = {
  work: { label: "Work", color: "#3B82F6", icon: "briefcase" },           // Blue
  personal: { label: "Personal", color: "#8B5CF6", icon: "person" },      // Purple
  shopping: { label: "Shopping", color: "#EC4899", icon: "cart" },        // Pink
  health: { label: "Health", color: "#10B981", icon: "fitness" },         // Green
  finance: { label: "Finance", color: "#F59E0B", icon: "cash" },          // Amber
  other: { label: "Other", color: "#6B7280", icon: "ellipsis-horizontal" }, // Gray
};

export interface Task {
  /** Unique identifier (UUID) */
  id: string;
  
  /** Task title/description (required) */
  title: string;
  
  /** Optional note or details about the task */
  note?: string;
  
  /** Whether the task is marked as completed */
  isCompleted: boolean;
  
  /** Priority level: high, medium, or low */
  priority: TaskPriority;
  
  /** Category for organization */
  category: TaskCategory;
  
  /** Whether a reminder notification is enabled for this task */
  reminderEnabled: boolean;
  
  /** ISO string of when the reminder should fire (e.g., "2024-01-15T14:30:00Z") */
  reminderTime?: string;
  
  /** ISO string of when the task was created */
  createdAt: string;
  
  /** ISO string of when the task was last updated */
  updatedAt: string;
}

/**
 * Form data for creating or editing a task.
 * This is what the user submits from the dialog.
 */
export interface TaskFormData {
  title: string;
  note?: string;
  priority: TaskPriority;
  category: TaskCategory;
  reminderEnabled: boolean;
  reminderTime?: string;
}

/**
 * Task creation payload (without id and timestamps).
 * Used internally when saving new tasks.
 */
export interface CreateTaskPayload {
  title: string;
  note?: string;
  priority: TaskPriority;
  category: TaskCategory;
  reminderEnabled: boolean;
  reminderTime?: string;
}

/**
 * Task update payload (only fields that can be changed).
 * Used when editing existing tasks.
 */
export interface UpdateTaskPayload {
  title?: string;
  note?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  reminderEnabled?: boolean;
  reminderTime?: string;
  isCompleted?: boolean;
}
