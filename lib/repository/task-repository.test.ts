/**
 * Task Repository Tests
 * 
 * Tests for business logic layer.
 * Verifies validation, sorting, filtering, and searching.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as taskRepository from "./task-repository";
import * as taskStorage from "@/lib/storage/task-storage";
import { Task } from "@/lib/types/task";

// Mock taskStorage
vi.mock("@/lib/storage/task-storage", () => ({
  getAllTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTaskCompletion: vi.fn(),
  getTaskById: vi.fn(),
  getTasksWithReminders: vi.fn(),
}));

describe("Task Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("should validate that title is required", async () => {
      await expect(
        taskRepository.createTask({
          title: "",
          priority: "medium",
          reminderEnabled: false,
        })
      ).rejects.toThrow("Task title is required");
    });

    it("should validate that title is not just whitespace", async () => {
      await expect(
        taskRepository.createTask({
          title: "   ",
          priority: "medium",
          reminderEnabled: false,
        })
      ).rejects.toThrow("Task title is required");
    });

    it("should trim whitespace from title", async () => {
      const mockTask: Task = {
        id: "1",
        title: "Buy groceries",
        priority: "medium",
        isCompleted: false,
        reminderEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(taskStorage.createTask).mockResolvedValue(mockTask);

      await taskRepository.createTask({
        title: "  Buy groceries  ",
        priority: "medium",
        reminderEnabled: false,
      });

      expect(taskStorage.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Buy groceries",
        })
      );
    });

    it("should trim whitespace from note", async () => {
      const mockTask: Task = {
        id: "1",
        title: "Buy groceries",
        note: "Milk, bread",
        priority: "medium",
        isCompleted: false,
        reminderEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      vi.mocked(taskStorage.createTask).mockResolvedValue(mockTask);

      await taskRepository.createTask({
        title: "Buy groceries",
        note: "  Milk, bread  ",
        priority: "medium",
        reminderEnabled: false,
      });

      expect(taskStorage.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          note: "Milk, bread",
        })
      );
    });
  });

  describe("getAllTasksSorted", () => {
    it("should return tasks sorted by completion status and priority", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          priority: "low",
          isCompleted: true,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Task 2",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "3",
          title: "Task 3",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const sorted = await taskRepository.getAllTasksSorted();

      // High priority incomplete task should come first
      expect(sorted[0].id).toBe("3");
      expect(sorted[0].priority).toBe("high");
      // Medium priority incomplete task second
      expect(sorted[1].id).toBe("2");
      expect(sorted[1].priority).toBe("medium");
      // Completed task last
      expect(sorted[2].isCompleted).toBe(true);
    });

    it("should sort incomplete tasks by priority (high > medium > low)", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Low priority",
          priority: "low",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "High priority",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "3",
          title: "Medium priority",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const sorted = await taskRepository.getAllTasksSorted();

      expect(sorted[0].priority).toBe("high");
      expect(sorted[1].priority).toBe("medium");
      expect(sorted[2].priority).toBe("low");
    });

    it("should return empty array if no tasks", async () => {
      vi.mocked(taskStorage.getAllTasks).mockResolvedValue([]);

      const sorted = await taskRepository.getAllTasksSorted();

      expect(sorted).toEqual([]);
    });
  });

  describe("getIncompleteTasks", () => {
    it("should return only incomplete tasks sorted by priority", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          priority: "low",
          isCompleted: true,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Task 2",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "3",
          title: "Task 3",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const incomplete = await taskRepository.getIncompleteTasks();

      expect(incomplete).toHaveLength(2);
      expect(incomplete[0].priority).toBe("high");
      expect(incomplete[1].priority).toBe("medium");
    });
  });

  describe("getCompletedTasks", () => {
    it("should return only completed tasks", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          priority: "high",
          isCompleted: true,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Task 2",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const completed = await taskRepository.getCompletedTasks();

      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe("1");
    });
  });

  describe("searchTasks", () => {
    it("should search tasks by title", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Buy groceries",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Call mom",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const results = await taskRepository.searchTasks("groceries");

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("should search tasks by note", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Shopping",
          note: "Buy milk and bread",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Call mom",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const results = await taskRepository.searchTasks("milk");

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe("1");
    });

    it("should be case-insensitive", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Buy Groceries",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const results = await taskRepository.searchTasks("GROCERIES");

      expect(results).toHaveLength(1);
    });

    it("should return all tasks if query is empty", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Task 2",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const results = await taskRepository.searchTasks("");

      expect(results).toHaveLength(2);
    });
  });

  describe("getTasksByPriority", () => {
    it("should filter tasks by priority", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "High priority task",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Medium priority task",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "3",
          title: "Another high priority",
          priority: "high",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const results = await taskRepository.getTasksByPriority("high");

      expect(results).toHaveLength(2);
      expect(results.every((t) => t.priority === "high")).toBe(true);
    });
  });

  describe("getTaskStatistics", () => {
    it("should calculate correct statistics", async () => {
      const now = new Date();
      const mockTasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          priority: "high",
          isCompleted: true,
          reminderEnabled: true,
          reminderTime: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "2",
          title: "Task 2",
          priority: "medium",
          isCompleted: false,
          reminderEnabled: true,
          reminderTime: now.toISOString(),
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
        {
          id: "3",
          title: "Task 3",
          priority: "low",
          isCompleted: false,
          reminderEnabled: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      ];

      vi.mocked(taskStorage.getAllTasks).mockResolvedValue(mockTasks);

      const stats = await taskRepository.getTaskStatistics();

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.incomplete).toBe(2);
      expect(stats.withReminders).toBe(2);
    });
  });
});
