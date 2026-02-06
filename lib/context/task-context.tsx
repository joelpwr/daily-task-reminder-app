/**
 * Task Context & Reducer
 * 
 * This implements the state management for tasks using React Context + useReducer.
 * In MVVM architecture, this is similar to the ViewModel.
 * 
 * Why this approach:
 * - Simpler than Redux for this use case
 * - Built into React, no external dependencies
 * - useReducer makes state transitions predictable
 * - Context allows any component to access task state
 * 
 * Pattern:
 * 1. Define state shape and action types
 * 2. Create reducer function (pure function that updates state)
 * 3. Create context and provider component
 * 4. Wrap app with provider
 * 5. Use useTaskContext() hook in components
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Task, CreateTaskPayload, UpdateTaskPayload } from "@/lib/types/task";
import * as taskRepository from "@/lib/repository/task-repository";
import * as taskStorage from "@/lib/storage/task-storage";

/**
 * State shape for the task context.
 */
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  selectedTaskId: string | null;
}

/**
 * Action types for the reducer.
 * Each action represents a state change.
 */
type TaskAction =
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "UPDATE_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string }
  | { type: "TOGGLE_TASK"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SELECT_TASK"; payload: string | null }
  | { type: "CLEAR_ERROR" };

/**
 * Context type definition.
 */
interface TaskContextType {
  state: TaskState;
  loadTasks: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<Task>;
  updateTask: (id: string, payload: UpdateTaskPayload) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskCompletion: (id: string) => Promise<void>;
  selectTask: (id: string | null) => void;
  clearError: () => void;
}

/**
 * Create the context with undefined default.
 * We'll check for undefined in the hook to catch usage errors.
 */
const TaskContext = createContext<TaskContextType | undefined>(undefined);

/**
 * Reducer function: pure function that takes current state and action,
 * returns new state.
 * 
 * Why use a reducer:
 * - Predictable state transitions
 * - Easy to test
 * - Handles complex state updates
 */
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case "SET_TASKS":
      return { ...state, tasks: action.payload, loading: false };

    case "ADD_TASK":
      return { ...state, tasks: [action.payload, ...state.tasks] };

    case "UPDATE_TASK": {
      const index = state.tasks.findIndex((t) => t.id === action.payload.id);
      if (index === -1) return state;

      const newTasks = [...state.tasks];
      newTasks[index] = action.payload;
      return { ...state, tasks: newTasks };
    }

    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };

    case "TOGGLE_TASK": {
      const index = state.tasks.findIndex((t) => t.id === action.payload);
      if (index === -1) return state;

      const newTasks = [...state.tasks];
      newTasks[index] = {
        ...newTasks[index],
        isCompleted: !newTasks[index].isCompleted,
      };
      return { ...state, tasks: newTasks };
    }

    case "SET_LOADING":
      return { ...state, loading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "SELECT_TASK":
      return { ...state, selectedTaskId: action.payload };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
}

/**
 * Initial state.
 */
const initialState: TaskState = {
  tasks: [],
  loading: true,
  error: null,
  selectedTaskId: null,
};

/**
 * Provider component.
 * Wrap your app with this to provide task context to all children.
 */
export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  /**
   * Load all tasks from storage on mount.
   */
  const loadTasks = useCallback(async () => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      const tasks = await taskRepository.getAllTasksSorted();
      dispatch({ type: "SET_TASKS", payload: tasks });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load tasks";
      dispatch({ type: "SET_ERROR", payload: message });
      console.error("Error loading tasks:", error);
    }
  }, []);

  /**
   * Initialize storage and load tasks on mount.
   */
  useEffect(() => {
    const init = async () => {
      await taskStorage.initializeStorage();
      await loadTasks();
    };
    init();
  }, [loadTasks]);

  /**
   * Create a new task.
   */
  const createTask = useCallback(
    async (payload: CreateTaskPayload): Promise<Task> => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const newTask = await taskRepository.createTask(payload);
        dispatch({ type: "ADD_TASK", payload: newTask });
        return newTask;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to create task";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    []
  );

  /**
   * Update an existing task.
   */
  const updateTaskFn = useCallback(
    async (id: string, payload: UpdateTaskPayload): Promise<Task | null> => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const updated = await taskRepository.updateTask(id, payload);
        if (updated) {
          dispatch({ type: "UPDATE_TASK", payload: updated });
        }
        return updated;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to update task";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    []
  );

  /**
   * Delete a task.
   */
  const deleteTaskFn = useCallback(async (id: string): Promise<void> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });
      const deleted = await taskRepository.deleteTask(id);
      if (deleted) {
        dispatch({ type: "DELETE_TASK", payload: id });
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete task";
      dispatch({ type: "SET_ERROR", payload: message });
      throw error;
    }
  }, []);

  /**
   * Toggle task completion status.
   */
  const toggleTaskCompletionFn = useCallback(
    async (id: string): Promise<void> => {
      try {
        dispatch({ type: "SET_ERROR", payload: null });
        const updated = await taskRepository.toggleTaskCompletion(id);
        if (updated) {
          dispatch({ type: "UPDATE_TASK", payload: updated });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to toggle task completion";
        dispatch({ type: "SET_ERROR", payload: message });
        throw error;
      }
    },
    []
  );

  /**
   * Select a task (for editing or viewing details).
   */
  const selectTask = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_TASK", payload: id });
  }, []);

  /**
   * Clear error message.
   */
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: TaskContextType = {
    state,
    loadTasks,
    createTask,
    updateTask: updateTaskFn,
    deleteTask: deleteTaskFn,
    toggleTaskCompletion: toggleTaskCompletionFn,
    selectTask,
    clearError,
  };

  return (
    <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
  );
}

/**
 * Hook to use the task context.
 * Must be called from a component inside TaskProvider.
 * Throws error if used outside provider.
 */
export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return context;
}
