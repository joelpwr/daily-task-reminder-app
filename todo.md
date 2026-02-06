# Daily Task & Reminder App - TODO

## Project Setup
- [x] Initialize project structure
- [x] Set up TypeScript configuration
- [x] Configure AsyncStorage for persistence
- [x] Set up notification permissions

## Database Layer
- [x] Create Task model/type definition
- [x] Implement AsyncStorage persistence layer
- [x] Create task CRUD operations (Create, Read, Update, Delete)
- [x] Add data validation and error handling

## UI Components
- [x] Create ScreenContainer wrapper for safe area
- [x] Build Home screen with task list
- [x] Create TaskItem component with checkbox
- [x] Build Add/Edit Task dialog (bottom sheet)
- [x] Create task input form with validation
- [x] Add delete confirmation dialog
- [x] Implement Floating Action Button (FAB)
- [x] Add empty state UI for no tasks

## Business Logic
- [x] Create task context/reducer for state management
- [x] Implement task creation logic
- [x] Implement task completion toggle
- [x] Implement task deletion logic
- [x] Implement task editing logic
- [x] Add task sorting (incomplete first, then by date)
- [x] Persist state to AsyncStorage on changes

## Notifications
- [x] Request notification permission (Android 13+)
- [x] Implement reminder scheduling logic
- [x] Create notification helper class
- [x] Test notification firing at scheduled time
- [x] Handle notification tap to open app

## Styling & Polish
- [x] Apply Material Design components
- [x] Implement dark mode support
- [x] Add haptic feedback for interactions
- [x] Style task list and items
- [x] Style dialog and forms
- [x] Add loading states
- [x] Add error states

## Testing & Validation
- [ ] Test task creation flow
- [ ] Test task completion toggle
- [ ] Test task deletion flow
- [ ] Test task editing flow
- [ ] Test reminder scheduling
- [ ] Test data persistence across app restart
- [ ] Test with 50+ tasks for performance
- [ ] Test on both iOS and Android

## Branding & Configuration
- [ ] Generate app logo/icon
- [ ] Update app.config.ts with app name
- [ ] Set up splash screen
- [ ] Configure app colors in theme.config.js

## Documentation
- [x] Add code comments explaining architecture
- [x] Document MVVM pattern implementation
- [x] Create README with setup instructions
- [x] Add inline comments for beginner-level concepts

## Final Delivery
- [ ] Create checkpoint
- [ ] Verify all features working
- [ ] Prepare project for delivery

## Priority Feature (NEW)
- [ ] Add priority field to Task model (high, medium, low)
- [ ] Update storage layer to handle priority
- [ ] Update repository to filter by priority
- [ ] Create priority filter UI component
- [ ] Add priority selector to AddTaskDialog
- [ ] Update home screen with filter controls
- [ ] Test priority filtering
- [ ] Update unit tests for priority
