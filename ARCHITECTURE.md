# Daily Task & Reminder App - Architecture Guide

## Overview

This document explains the architecture of the Daily Task & Reminder app, which follows the **MVVM (Model-View-ViewModel)** pattern commonly used in native Android development.

## Why MVVM?

MVVM separates concerns into distinct layers, making the code:

- **Testable**: Each layer can be tested independently
- **Maintainable**: Changes to one layer don't affect others
- **Scalable**: Easy to add new features without breaking existing code
- **Reusable**: Business logic can be reused across different UI frameworks

## Architecture Layers

### 1. Model Layer (Data)

**Files**: `lib/types/task.ts`, `lib/storage/task-storage.ts`

The Model layer defines the data structure and handles persistence.

**Responsibilities**:

- Define Task interface with all properties
- Store and retrieve tasks from AsyncStorage
- Provide low-level CRUD operations
- Handle serialization/deserialization

**Key Files**:

- `lib/types/task.ts`: TypeScript interfaces for Task, TaskFormData, CreateTaskPayload, UpdateTaskPayload
- `lib/storage/task-storage.ts`: AsyncStorage operations (like Room DAO in Android)

**Example**:

```typescript
// Model: Define structure
interface Task {
  id: string;
  title: string;
  isCompleted: boolean;
  // ...
}

// Model: Persist data
await taskStorage.createTask({
  title: "Buy groceries",
  reminderEnabled: false,
});
```

### 2. Repository Layer (Business Logic)

**Files**: `lib/repository/task-repository.ts`

The Repository layer contains business logic and acts as a bridge between the ViewModel and Model.

**Responsibilities**:

- Validate input data
- Apply business rules (sorting, filtering, searching)
- Transform data for the UI
- Handle errors gracefully

**Key Concepts**:

- **Validation**: Ensure task title is not empty
- **Sorting**: Incomplete tasks first, then by creation date
- **Filtering**: Get tasks by completion status
- **Searching**: Find tasks by title or note

**Example**:

```typescript
// Repository: Apply business logic
export async function getAllTasksSorted(): Promise<Task[]> {
  const tasks = await taskStorage.getAllTasks();
  
  // Sort: incomplete first, then by date
  return tasks.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1;
    }
    return new Date(b.createdAt).getTime() - 
           new Date(a.createdAt).getTime();
  });
}

// Repository: Validate input
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  if (!payload.title || payload.title.trim().length === 0) {
    throw new Error("Task title is required");
  }
  
  return taskStorage.createTask(payload);
}
```

### 3. ViewModel Layer (State Management)

**Files**: `lib/context/task-context.tsx`

The ViewModel manages UI state and provides actions for the View to call.

**Responsibilities**:

- Maintain task state
- Provide actions (createTask, updateTask, deleteTask, etc.)
- Handle loading and error states
- Persist state changes to storage

**Implementation**: React Context + useReducer

**Why useReducer?**

- Predictable state transitions
- Easy to debug (log every action)
- Similar to Redux but simpler
- No external dependencies

**Example**:

```typescript
// ViewModel: Define state shape
interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

// ViewModel: Define actions
type TaskAction =
  | { type: "SET_TASKS"; payload: Task[] }
  | { type: "ADD_TASK"; payload: Task }
  | { type: "DELETE_TASK"; payload: string };

// ViewModel: Reducer function (pure)
function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case "ADD_TASK":
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case "DELETE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
}

// ViewModel: Provide context hook
export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTaskContext must be used within TaskProvider");
  }
  return context;
}
```

### 4. View Layer (UI)

**Files**: `app/(tabs)/index.tsx`, `components/task-item.tsx`, `components/add-task-dialog.tsx`

The View layer displays data and handles user interactions.

**Responsibilities**:

- Render UI components
- Handle user input
- Call ViewModel actions
- Display loading/error states
- Provide visual feedback (haptics, animations)

**Key Components**:

- **Home Screen**: Main task list view
- **TaskItem**: Individual task display
- **AddTaskDialog**: Create/edit task form
- **DeleteConfirmationDialog**: Confirm deletion

**Example**:

```typescript
// View: Use ViewModel
export default function HomeScreen() {
  const { state, createTask, deleteTask } = useTaskContext();
  
  // Handle user action
  const handleAddTask = async (formData: TaskFormData) => {
    await createTask(formData);
  };
  
  // Render UI
  return (
    <FlatList
      data={state.tasks}
      renderItem={({ item }) => (
        <TaskItem
          task={item}
          onDelete={() => deleteTask(item.id)}
        />
      )}
    />
  );
}
```

## Data Flow

### Creating a Task (User Perspective)

```
User taps FAB
    ↓
AddTaskDialog opens (View)
    ↓
User enters title, note, reminder time
    ↓
User taps "Save"
    ↓
HomeScreen.handleAddTask() called (View)
    ↓
useTaskContext().createTask() called (ViewModel)
    ↓
taskRepository.createTask() validates input (Repository)
    ↓
taskStorage.createTask() saves to AsyncStorage (Model)
    ↓
Task added to state (ViewModel)
    ↓
useTaskNotifications syncs reminders (Side effect)
    ↓
Notification scheduled (Model)
    ↓
HomeScreen re-renders with new task (View)
```

### Toggling Task Completion (User Perspective)

```
User taps checkbox (View)
    ↓
TaskItem.onToggleComplete() called (View)
    ↓
useTaskContext().toggleTaskCompletion() called (ViewModel)
    ↓
taskRepository.toggleTaskCompletion() updates state (Repository)
    ↓
taskStorage.updateTask() persists to AsyncStorage (Model)
    ↓
State updated (ViewModel)
    ↓
TaskItem re-renders with strikethrough (View)
```

## Component Hierarchy

```
App (_layout.tsx)
├── ThemeProvider
├── TaskProvider (ViewModel)
└── Stack Navigation
    └── (tabs) Layout
        └── Home Screen (View)
            ├── Header
            ├── FlatList
            │   └── TaskItem (View)
            │       ├── Checkbox
            │       ├── Title
            │       ├── Note
            │       └── Delete Button
            ├── AddTaskDialog (View)
            │   ├── Title Input
            │   ├── Note Input
            │   ├── Reminder Toggle
            │   ├── Time Picker
            │   └── Save/Cancel Buttons
            ├── DeleteConfirmationDialog (View)
            │   ├── Message
            │   └── Confirm/Cancel Buttons
            └── FAB (Floating Action Button)
```

## State Management Flow

### Initial Load

```
App starts
    ↓
TaskProvider mounts
    ↓
useEffect: initializeStorage()
    ↓
useEffect: loadTasks()
    ↓
taskRepository.getAllTasksSorted()
    ↓
taskStorage.getAllTasks()
    ↓
Dispatch SET_TASKS action
    ↓
State updated with tasks
    ↓
Home Screen renders
```

### Task Creation

```
User submits form
    ↓
createTask(formData) called
    ↓
taskRepository.createTask(formData)
    ├─ Validate title
    └─ Call taskStorage.createTask()
    ↓
taskStorage.createTask(formData)
    ├─ Generate UUID
    ├─ Add timestamps
    └─ Save to AsyncStorage
    ↓
Dispatch ADD_TASK action
    ↓
State updated
    ↓
useTaskNotifications detects change
    ↓
Schedule notification (if reminder enabled)
    ↓
Home Screen re-renders
```

## Error Handling

Errors are handled at each layer:

### Model Layer

```typescript
// taskStorage.ts
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  try {
    // ... create task
  } catch (error) {
    console.error("Failed to create task:", error);
    throw error; // Propagate to Repository
  }
}
```

### Repository Layer

```typescript
// taskRepository.ts
export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  // Validate input
  if (!payload.title || payload.title.trim().length === 0) {
    throw new Error("Task title is required"); // Meaningful error
  }
  
  try {
    return taskStorage.createTask(payload);
  } catch (error) {
    console.error("Failed to create task:", error);
    throw error; // Propagate to ViewModel
  }
}
```

### ViewModel Layer

```typescript
// taskContext.tsx
const createTask = useCallback(
  async (payload: CreateTaskPayload): Promise<Task> => {
    try {
      dispatch({ type: "SET_ERROR", payload: null });
      const newTask = await taskRepository.createTask(payload);
      dispatch({ type: "ADD_TASK", payload: newTask });
      return newTask;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create task";
      dispatch({ type: "SET_ERROR", payload: message }); // Store error in state
      throw error; // Let View handle
    }
  },
  []
);
```

### View Layer

```typescript
// HomeScreen
const handleAddTask = useCallback(
  async (formData: TaskFormData) => {
    try {
      await createTask(formData);
      // Success: dialog closes, task appears
    } catch (error) {
      // Error is already in state.error
      // Display error banner to user
    }
  },
  [createTask]
);
```

## Notifications Integration

### NotificationHelper (Model)

Low-level notification operations:

```typescript
export async function scheduleTaskReminder(
  taskId: string,
  taskTitle: string,
  reminderTime: string
): Promise<string | null> {
  // Schedule notification with expo-notifications
  // Return notification ID
}
```

### useTaskNotifications Hook (ViewModel)

Syncs tasks with notifications:

```typescript
export function useTaskNotifications(tasks: Task[]): void {
  useEffect(() => {
    syncNotifications(tasks);
  }, [tasks]);
}
```

### Home Screen (View)

Uses the hook:

```typescript
export default function HomeScreen() {
  const { state } = useTaskContext();
  
  // Automatically syncs notifications when tasks change
  useTaskNotifications(state.tasks);
  
  // ...
}
```

## Performance Optimizations

### 1. Memoization

```typescript
// Prevent unnecessary re-renders
const handleAddTask = useCallback(async (formData) => {
  await createTask(formData);
}, [createTask]);

// Memoize components
const TaskItem = React.memo(({ task, onPress }) => {
  // Only re-render if task or onPress changes
});
```

### 2. FlatList

```typescript
// Use FlatList for large lists
<FlatList
  data={state.tasks}
  renderItem={renderTaskItem}
  keyExtractor={(item) => item.id}
  scrollEnabled={true}
/>

// Never use ScrollView + .map()
// ❌ Bad: <ScrollView>{tasks.map(...)}</ScrollView>
```

### 3. Lazy Loading

```typescript
// Load tasks on demand
const [editingTask, setEditingTask] = useState<string | null>(null);
const editingTaskData = editingTask
  ? state.tasks.find((t) => t.id === editingTask)
  : null;
```

## Testing Strategy

### Unit Tests (Repository)

```typescript
describe("Task Repository", () => {
  it("should validate task title", async () => {
    expect(() => {
      taskRepository.createTask({ title: "", reminderEnabled: false });
    }).toThrow("Task title is required");
  });
  
  it("should sort tasks correctly", async () => {
    const tasks = await taskRepository.getAllTasksSorted();
    // Verify incomplete tasks come first
  });
});
```

### Integration Tests (ViewModel + Model)

```typescript
describe("Task Context", () => {
  it("should create and persist task", async () => {
    const { result } = renderHook(() => useTaskContext(), {
      wrapper: TaskProvider,
    });
    
    await act(async () => {
      await result.current.createTask({ title: "Test" });
    });
    
    expect(result.current.state.tasks).toHaveLength(1);
  });
});
```

### E2E Tests (View + ViewModel + Model)

```typescript
describe("Home Screen", () => {
  it("should create task from UI", async () => {
    render(<HomeScreen />);
    
    fireEvent.press(screen.getByTestId("fab"));
    fireEvent.changeText(screen.getByTestId("title-input"), "Buy milk");
    fireEvent.press(screen.getByTestId("save-button"));
    
    expect(screen.getByText("Buy milk")).toBeOnTheScreen();
  });
});
```

## Scaling Considerations

### Adding New Features

1. **Define Model**: Create new types in `lib/types/`
2. **Add Storage**: Implement CRUD in `lib/storage/`
3. **Add Repository**: Add business logic in `lib/repository/`
4. **Add ViewModel**: Add actions in `lib/context/`
5. **Add View**: Create UI components

### Migrating to Backend

1. Replace `taskStorage` with API calls
2. Keep `taskRepository` interface the same
3. Update `taskContext` to handle async operations
4. Add caching layer if needed

### Upgrading Storage

```typescript
// Current: AsyncStorage
// Future: SQLite (expo-sqlite)
// Future: Cloud (Firebase, Supabase)

// The Repository layer stays the same!
// Only taskStorage implementation changes
```

## Summary

The MVVM architecture provides a clear separation of concerns:

| Layer | Responsibility | Example |
|-------|---|---|
| **View** | Display UI, handle user input | HomeScreen, TaskItem |
| **ViewModel** | Manage state, provide actions | TaskContext, useReducer |
| **Repository** | Business logic, validation | taskRepository.ts |
| **Model** | Data structure, persistence | taskStorage.ts, Task interface |

This structure makes the app **testable**, **maintainable**, and **scalable**.
