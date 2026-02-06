# Daily Task & Reminder App - Design Document

## Overview
A minimal, offline-first mobile app for managing daily tasks with optional reminders. Built for one-handed usage on mobile portrait orientation (9:16).

## Design Principles
- **Simplicity First**: One main screen, minimal navigation
- **Offline-First**: All data stored locally using AsyncStorage and SQLite
- **One-Handed Usage**: Primary actions (FAB, checkboxes) positioned for thumb reach
- **iOS-First Aesthetic**: Follows Apple Human Interface Guidelines (HIG)

---

## Screen List

### 1. **Home Screen (Task List)**
- **Primary Content**: 
  - List of tasks with checkboxes
  - Each task shows: title, optional note preview, completion status
  - Completed tasks appear with strikethrough and reduced opacity
  
- **Key Elements**:
  - Header: "Daily Tasks" title
  - Task list (FlatList with RecyclerView-like performance)
  - Floating Action Button (FAB) in bottom-right corner
  - Swipe-to-delete gesture (optional, secondary action)
  - Tap task to edit/view details

- **Functionality**:
  - Display all tasks sorted by: incomplete first, then by creation date
  - Tap checkbox to toggle completion status
  - Long-press or swipe task to delete
  - Tap FAB to open "Add Task" dialog

### 2. **Add/Edit Task Dialog (Bottom Sheet)**
- **Primary Content**:
  - Task title input field (required)
  - Optional note text area
  - Optional reminder toggle
  - Reminder time picker (if reminder enabled)
  
- **Key Elements**:
  - Title: "New Task" or "Edit Task"
  - Input fields with clear labels
  - Cancel and Save buttons
  - Keyboard handling (dismiss on save)

- **Functionality**:
  - Validate title is not empty before save
  - Save task to local database
  - If reminder enabled, schedule local notification
  - Close dialog on save/cancel

---

## Primary Content and Functionality

### Task Model
```
Task {
  id: string (UUID)
  title: string (required)
  note: string (optional)
  isCompleted: boolean (default: false)
  reminderEnabled: boolean (default: false)
  reminderTime: Date (optional, ISO string)
  createdAt: Date (ISO string)
  updatedAt: Date (ISO string)
}
```

### Core Operations
1. **Create Task**: User taps FAB → enters title + optional note + optional reminder → saves
2. **Mark Complete**: User taps checkbox → task toggles completion status
3. **Delete Task**: User swipes/long-presses task → confirms delete → task removed
4. **Edit Task**: User taps task → opens dialog with pre-filled data → saves changes
5. **Set Reminder**: User enables reminder toggle → picks time → notification scheduled

---

## Key User Flows

### Flow 1: Add a Daily Task
1. User opens app → sees empty or populated task list
2. User taps FAB (bottom-right corner)
3. Bottom sheet slides up with "New Task" form
4. User enters task title (e.g., "Buy groceries")
5. User optionally adds note (e.g., "Milk, bread, eggs")
6. User optionally enables reminder and picks time (e.g., 5:00 PM)
7. User taps "Save" → task added to list, notification scheduled if reminder enabled
8. Bottom sheet closes, user sees updated task list

### Flow 2: Mark Task as Complete
1. User sees task in list
2. User taps checkbox next to task
3. Task immediately toggles: unchecked → checked (or vice versa)
4. Completed tasks move to bottom of list (optional visual feedback: strikethrough)
5. Data persisted to local storage

### Flow 3: Delete a Task
1. User sees task in list
2. User swipes left on task (or long-presses)
3. Delete button/action appears
4. User confirms delete
5. Task removed from list and database

### Flow 4: Receive a Reminder
1. User has set a reminder for a task
2. At scheduled time, local notification fires
3. User sees notification on lock screen or notification center
4. User taps notification → app opens, task highlighted or scrolled into view
5. User can mark task complete or dismiss notification

---

## Color Scheme

### Brand Colors
- **Primary**: `#0a7ea4` (iOS blue)
- **Background**: `#ffffff` (light) / `#151718` (dark)
- **Surface**: `#f5f5f5` (light) / `#1e2022` (dark)
- **Text (Foreground)**: `#11181C` (light) / `#ECEDEE` (dark)
- **Muted Text**: `#687076` (light) / `#9BA1A6` (dark)
- **Success**: `#22C55E` (for completed tasks)
- **Error**: `#EF4444` (for delete actions)
- **Border**: `#E5E7EB` (light) / `#334155` (dark)

### Usage
- **Primary buttons**: FAB, Save button
- **Checkboxes**: Green when checked (success color)
- **Completed tasks**: Muted text + strikethrough
- **Delete actions**: Red (error color)

---

## Layout Details

### Home Screen Layout (Portrait 9:16)
```
┌─────────────────────────────┐
│  Daily Tasks                │  ← Header (safe area top)
├─────────────────────────────┤
│ ☐ Buy groceries             │
│   Milk, bread, eggs         │
├─────────────────────────────┤
│ ☑ Exercise (completed)      │  ← Strikethrough
├─────────────────────────────┤
│ ☐ Call mom                  │
│                             │
│                             │
│                             │
│                             │
│                             │
│                    ┌─────┐  │
│                    │  +  │  │  ← FAB (bottom-right, thumb reach)
│                    └─────┘  │
└─────────────────────────────┘
```

### Add Task Dialog Layout
```
┌─────────────────────────────┐
│ New Task                    │  ← Title
├─────────────────────────────┤
│ Task Title                  │
│ ┌─────────────────────────┐ │
│ │ Buy groceries           │ │  ← Required input
│ └─────────────────────────┘ │
│                             │
│ Note (optional)             │
│ ┌─────────────────────────┐ │
│ │ Milk, bread, eggs       │ │  ← Optional input
│ └─────────────────────────┘ │
│                             │
│ ☐ Set Reminder              │  ← Toggle
│                             │
│ ┌─────────────────────────┐ │
│ │ Cancel      │    Save    │ │  ← Action buttons
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

---

## Interaction Patterns

### Feedback & Haptics
- **Checkbox tap**: Light haptic feedback + immediate visual toggle
- **FAB tap**: Scale animation (0.97) + haptic
- **Delete action**: Confirmation dialog before deletion
- **Save task**: Haptic feedback + dialog closes

### Gestures
- **Tap checkbox**: Toggle completion
- **Tap task**: Open edit dialog
- **Swipe left on task**: Show delete action
- **Tap FAB**: Open add task dialog
- **Tap outside dialog**: Close dialog (cancel)

---

## Technical Implementation Notes

### Data Persistence
- Use AsyncStorage for task list (JSON serialization)
- Fallback to SQLite via Expo if performance issues arise
- No cloud sync required (offline-first)

### Notifications
- Use `expo-notifications` for local notifications
- Schedule with `expo-task-manager` or `expo-background-fetch` if needed
- Request notification permission on Android 13+ only

### State Management
- Use React Context + `useReducer` for task state
- Persist to AsyncStorage on every state change
- No Redux or complex state management needed

### Performance
- Use FlatList for task list (not ScrollView + map)
- Memoize task item components to prevent re-renders
- Lazy-load task details only when needed

---

## Accessibility Considerations
- All interactive elements have sufficient touch targets (44pt minimum)
- Checkbox and buttons have clear labels
- Color is not the only indicator (use text + icons)
- Support dark mode automatically via system settings

---

## Success Metrics
- ✅ App loads in < 2 seconds
- ✅ Adding a task takes < 5 seconds
- ✅ Task list remains responsive with 100+ tasks
- ✅ Notifications fire within 1 minute of scheduled time
- ✅ No data loss on app restart
