# Daily Task & Reminder App

A minimal, offline-first mobile app for managing daily tasks with optional reminders. Built with React Native, Expo, and TypeScript following MVVM architecture principles.

## Overview

This app helps users remember small daily tasks with a clean, simple interface. All data is stored locally on the device—no cloud sync, no user accounts, no ads.

### Key Features

- **Add Tasks**: Create tasks with a title and optional note
- **Mark Complete**: Toggle task completion status with a checkbox
- **Delete Tasks**: Remove tasks you no longer need
- **Set Reminders**: Optional local notifications at a specific time
- **Offline-First**: All data persists locally using AsyncStorage
- **Dark Mode Support**: Automatically adapts to system theme

## Architecture

This app follows the **MVVM (Model-View-ViewModel)** pattern, similar to native Android development with Room, ViewModel, and Repository.

### Layer Structure

```
┌─────────────────────────────────────────┐
│           UI Layer (React)              │
│  - Home Screen (app/(tabs)/index.tsx)   │
│  - TaskItem Component                   │
│  - AddTaskDialog Component              │
│  - DeleteConfirmationDialog             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      State Management (Context)         │
│  - TaskContext (task-context.tsx)       │
│  - useTaskContext() Hook                │
│  - useReducer for predictable updates   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│     Business Logic (Repository)         │
│  - task-repository.ts                   │
│  - Validation & Sorting                 │
│  - Search & Statistics                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Data Layer (Storage)               │
│  - task-storage.ts (AsyncStorage)       │
│  - CRUD Operations                      │
│  - Persistence & Serialization          │
└─────────────────────────────────────────┘
```

## Project Structure

```
daily-task-reminder-app/
├── app/
│   ├── _layout.tsx              # Root layout with providers
│   └── (tabs)/
│       ├── _layout.tsx          # Tab navigation
│       └── index.tsx            # Home screen (MAIN SCREEN)
├── components/
│   ├── task-item.tsx            # Individual task display
│   ├── add-task-dialog.tsx      # Create/edit task form
│   ├── delete-confirmation-dialog.tsx
│   └── screen-container.tsx     # SafeArea wrapper
├── lib/
│   ├── types/
│   │   └── task.ts              # Task TypeScript interfaces
│   ├── storage/
│   │   └── task-storage.ts      # AsyncStorage CRUD (like Room DAO)
│   ├── repository/
│   │   └── task-repository.ts   # Business logic (like Repository)
│   ├── context/
│   │   └── task-context.tsx     # State management (like ViewModel)
│   └── notifications/
│       └── notification-helper.ts # Reminder scheduling
├── hooks/
│   ├── use-task-notifications.ts # Sync reminders with tasks
│   ├── use-colors.ts            # Theme colors hook
│   └── use-color-scheme.ts      # Dark mode detection
├── design.md                    # UI/UX design document
├── todo.md                      # Feature tracking
└── README_APP.md               # This file
```

## Data Model

### Task Type

```typescript
interface Task {
  id: string;                    // UUID
  title: string;                 // Required
  note?: string;                 // Optional
  isCompleted: boolean;          // Completion status
  reminderEnabled: boolean;      // Reminder toggle
  reminderTime?: string;         // ISO string (e.g., "2024-01-15T14:30:00Z")
  createdAt: string;             // ISO string
  updatedAt: string;             // ISO string
}
```

## Key Components

### 1. **Home Screen** (`app/(tabs)/index.tsx`)

The main screen displaying all tasks. Features:
- Task list with FlatList (optimized for performance)
- Floating Action Button (FAB) to add new tasks
- Empty state when no tasks exist
- Error banner for displaying errors
- Haptic feedback on interactions

### 2. **TaskItem Component** (`components/task-item.tsx`)

Renders a single task in the list:
- Checkbox to toggle completion
- Task title with strikethrough when completed
- Optional note preview
- Reminder indicator (if reminder is set)
- Delete button

### 3. **AddTaskDialog** (`components/add-task-dialog.tsx`)

Modal dialog for creating or editing tasks:
- Title input (required)
- Note input (optional)
- Reminder toggle
- Date/time picker for reminder time
- Form validation
- Save and cancel buttons

### 4. **TaskContext** (`lib/context/task-context.tsx`)

State management using React Context + useReducer:
- Loads tasks from AsyncStorage on app start
- Provides actions: createTask, updateTask, deleteTask, toggleTaskCompletion
- Handles loading and error states
- Similar to ViewModel in native Android MVVM

### 5. **TaskRepository** (`lib/repository/task-repository.ts`)

Business logic layer:
- Validates input data
- Sorts tasks (incomplete first, then by date)
- Searches tasks
- Provides statistics
- Similar to Repository pattern in native Android

### 6. **TaskStorage** (`lib/storage/task-storage.ts`)

Data persistence layer using AsyncStorage:
- CRUD operations (Create, Read, Update, Delete)
- Stores tasks as JSON
- Similar to Room DAO in native Android

### 7. **NotificationHelper** (`lib/notifications/notification-helper.ts`)

Handles local notifications:
- Requests notification permission (Android 13+)
- Schedules reminders using expo-notifications
- Cancels reminders when tasks are deleted
- Similar to AlarmManager/WorkManager in native Android

### 8. **useTaskNotifications Hook** (`hooks/use-task-notifications.ts`)

Syncs task reminders with scheduled notifications:
- Automatically schedules notifications for new tasks with reminders
- Cancels notifications for deleted tasks or disabled reminders
- Runs whenever tasks change

## Data Flow

### Creating a Task

```
User taps FAB
    ↓
AddTaskDialog opens
    ↓
User enters title, note, reminder
    ↓
User taps "Save"
    ↓
TaskContext.createTask() called
    ↓
TaskRepository.createTask() validates input
    ↓
TaskStorage.createTask() saves to AsyncStorage
    ↓
Task added to state
    ↓
useTaskNotifications syncs reminders
    ↓
Notification scheduled (if reminder enabled)
    ↓
Home screen re-renders with new task
```

### Toggling Task Completion

```
User taps checkbox
    ↓
TaskContext.toggleTaskCompletion() called
    ↓
TaskRepository.toggleTaskCompletion() updates isCompleted
    ↓
TaskStorage.updateTask() persists to AsyncStorage
    ↓
State updated
    ↓
Task item re-renders with strikethrough
```

### Deleting a Task

```
User taps delete button
    ↓
DeleteConfirmationDialog shown
    ↓
User confirms
    ↓
TaskContext.deleteTask() called
    ↓
TaskRepository.deleteTask() removes task
    ↓
TaskStorage.deleteTask() removes from AsyncStorage
    ↓
useTaskNotifications cancels reminder notification
    ↓
State updated
    ↓
Task removed from list
```

## Storage

All data is stored locally using **AsyncStorage**, which persists across app restarts.

### Storage Key

```
Key: "daily_tasks"
Value: JSON array of Task objects
```

### Example Storage

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "note": "Milk, bread, eggs",
    "isCompleted": false,
    "reminderEnabled": true,
    "reminderTime": "2024-01-15T14:30:00Z",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "title": "Exercise",
    "note": null,
    "isCompleted": true,
    "reminderEnabled": false,
    "reminderTime": null,
    "createdAt": "2024-01-15T09:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
  }
]
```

## Notifications

Reminders use **expo-notifications**, which provides a cross-platform API for local notifications.

### Permission Handling

- **Android 13+**: Requests POST_NOTIFICATIONS permission
- **iOS**: Requests alert, badge, and sound permissions
- **Web**: Not supported

### Notification Flow

1. User sets reminder when creating/editing a task
2. `useTaskNotifications` hook detects the change
3. `NotificationHelper.scheduleTaskReminder()` schedules the notification
4. At the scheduled time, the notification fires
5. User can tap the notification to open the app
6. Notification ID is stored in memory for cancellation

### Cancellation

Notifications are automatically cancelled when:
- Task is deleted
- Reminder is disabled
- App is uninstalled

## Styling

The app uses **NativeWind** (Tailwind CSS for React Native) for styling.

### Color Tokens

| Token | Light | Dark |
|-------|-------|------|
| `primary` | #0a7ea4 | #0a7ea4 |
| `background` | #ffffff | #151718 |
| `surface` | #f5f5f5 | #1e2022 |
| `foreground` | #11181C | #ECEDEE |
| `muted` | #687076 | #9BA1A6 |
| `border` | #E5E7EB | #334155 |
| `success` | #22C55E | #4ADE80 |
| `error` | #EF4444 | #F87171 |

### Theme Support

The app automatically adapts to the system's dark/light mode preference using `useColorScheme()` hook.

## Performance Considerations

### FlatList Optimization

- Uses `FlatList` instead of `ScrollView` + `.map()` for better performance
- Memoizes task item components to prevent unnecessary re-renders
- Supports 100+ tasks without noticeable lag

### State Management

- `useReducer` provides predictable state updates
- Context prevents prop drilling
- Callbacks are memoized with `useCallback` to prevent re-renders

### Storage

- AsyncStorage is sufficient for < 10MB of data
- For larger datasets, consider migrating to SQLite via expo-sqlite

## Permissions

The app requests minimal permissions:

- **POST_NOTIFICATIONS** (Android 13+): Required for reminders
- **ALERT, BADGE, SOUND** (iOS): Required for reminders

No sensitive permissions are requested (location, contacts, camera, etc.).

## Testing

### Manual Testing Checklist

- [ ] Create a task with title only
- [ ] Create a task with title and note
- [ ] Create a task with reminder
- [ ] Mark task as complete (checkbox)
- [ ] Edit a task
- [ ] Delete a task (with confirmation)
- [ ] Verify reminder notification fires at scheduled time
- [ ] Verify data persists after app restart
- [ ] Test with 50+ tasks for performance
- [ ] Test dark mode toggle
- [ ] Test on both iOS and Android

### Unit Testing

To add unit tests, use Vitest (already included):

```bash
pnpm test
```

Example test:

```typescript
import { describe, it, expect } from "vitest";
import * as taskRepository from "@/lib/repository/task-repository";

describe("Task Repository", () => {
  it("should validate task title", async () => {
    expect(() => {
      taskRepository.createTask({ title: "", reminderEnabled: false });
    }).toThrow("Task title is required");
  });
});
```

## Troubleshooting

### Tasks not persisting

- Check AsyncStorage permissions
- Verify `initializeStorage()` is called on app start
- Check browser console for errors

### Reminders not firing

- Verify notification permission is granted
- Check that reminder time is in the future
- On Android, ensure POST_NOTIFICATIONS permission is granted
- Check notification settings in system settings

### Performance issues

- Use React DevTools Profiler to identify slow components
- Check if FlatList is being used (not ScrollView + map)
- Verify memoization is working correctly

## Future Enhancements

Possible features to add:

- Task categories/tags
- Recurring tasks
- Task priority levels
- Search functionality
- Task statistics dashboard
- Export tasks to CSV
- Cloud sync (requires backend)
- User accounts (requires backend)

## Code Comments

The codebase includes detailed comments explaining:
- Architecture patterns (MVVM)
- Why each component exists
- How data flows through the app
- Beginner-level concepts

All comments are written for developers new to React Native and MVVM patterns.

## Dependencies

Key dependencies:

- **react-native**: Core framework
- **expo**: Development platform
- **expo-notifications**: Local notifications
- **expo-router**: Navigation
- **nativewind**: Tailwind CSS support
- **@react-native-async-storage/async-storage**: Local storage
- **uuid**: Generate unique IDs
- **@react-native-community/datetimepicker**: Date/time picker

## License

This is a demonstration project for learning MVVM architecture in React Native.

## Support

For issues or questions, refer to:
- [React Native Documentation](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [NativeWind Documentation](https://www.nativewind.dev)
