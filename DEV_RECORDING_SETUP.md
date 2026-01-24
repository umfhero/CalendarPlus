# Dev Recording Setup Guide

This setup allows you to record the app with sample developer/student data instead of your personal information.

## Quick Start

1. **Copy the sample data to your desktop:**
   ```powershell
   .\copy-dev-data.ps1
   ```

2. **Run the app in dev mode:**
   ```bash
   npm run dev
   ```

3. The app will automatically use the sample data from `C:\Users\umfhe\Desktop\ThoughtsPlusDevFolder`

## What Changed

### Code Changes
- **electron/main.ts**: Added `CUSTOM_DEV_FOLDER_PATH` constant that points to your desktop folder
- The path is only used in dev mode (`IS_DEV_MODE = true`)
- Production builds are unaffected

### Sample Data Created
- **dev-sample-data/**: Folder in the repo with all sample files
- **calendar-data.json**: Calendar events, tasks, and notes for a developer/student
- **workspace/**: Sample workspace files (notes, boards, notebooks)
- **copy-dev-data.ps1**: Script to copy data to desktop

## Sample Data Includes

### Calendar Events (7 events)
- CS 301 Data Structures Lecture
- Sprint Planning Meeting
- Web Development Workshop
- Office Hours with Prof. Johnson
- Code Review Session
- Study Group - Algorithms
- Hackathon Kickoff

### Tasks (8 tasks)
- React component refactoring
- Review pull requests
- Study for Data Structures exam
- Submit Algorithm Analysis assignment
- Debug authentication flow (completed)
- Update project documentation
- Team standup meeting
- Read Operating Systems chapter

### Workspace Files
- **Project Ideas.nt** - Brainstorming note
- **Study Notes - Data Structures.exec** - Notebook with code examples
- **Sprint 12 Planning.brd** - Kanban board

### Folders
- 📚 Study Materials
- 💼 Work Projects

## For Multi-Device Setup

If you work on multiple devices:

### Option 1: Copy to each device
Copy the `dev-sample-data` folder to the same location on each device

### Option 2: Use different paths per device
Modify `CUSTOM_DEV_FOLDER_PATH` in `electron/main.ts` for each device

### Option 3: Use default OneDrive location
Set `CUSTOM_DEV_FOLDER_PATH` to `null` to use `OneDrive/ThoughtsPlus-Dev`

## Resetting Data

To start fresh for a new recording:
```powershell
.\copy-dev-data.ps1
```

This will overwrite the desktop folder with fresh sample data.

## Important Notes

- ✅ Dev data is completely isolated from production data
- ✅ Your personal events/notes are safe in the production folder
- ✅ The custom path only applies in development mode
- ✅ Production builds use the normal OneDrive location
- ⚠️ Don't commit the desktop folder to git (it's for local use only)
- ⚠️ The `dev-sample-data` folder in the repo is safe to commit
