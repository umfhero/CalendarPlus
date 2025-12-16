# Project Overview: Calendar Plus

https://open-meteo.com/en/docs

## 1. Introduction

**Calendar Plus** (v5.0.0) is a Windows desktop calendar application designed for speed, simplicity, and "frictionless" event management. It leverages AI for natural language event creation and offers features like multi-device sync, GitHub activity tracking, creator analytics, and automatic updates.

**Core Philosophy:** "No friction, no fuss."
**Target Audience:** Users who want a fast, keyboard-centric calendar with modern integrations.

## 2. Technical Stack

### Frontend (Renderer Process)

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, `clsx`, `tailwind-merge`
- **Icons:** `lucide-react`
- **Animations:** `framer-motion`
- **Charts/Data Viz:** `recharts`, `react-activity-calendar`, `react-github-calendar`
- **Utilities:** `date-fns` (date manipulation), `papaparse` (CSV parsing)

### Backend (Main Process)

- **Runtime:** Electron (v29.1.0)
- **Language:** TypeScript
- **AI Integration:** Google Generative AI SDK (`@google/generative-ai`)
- **Auto-Updates:** `electron-updater`
- **Packaging:** Electron Builder (NSIS installer)

## 3. Architecture & Data Flow

### 3.1. Electron Structure

- **Main Process (`electron/main.ts`):**
  - Handles application lifecycle, window creation, and native OS interactions.
  - Manages file system operations (reading/writing data).
  - Exposes functionality to the renderer via IPC (Inter-Process Communication).
  - Handles API calls to Google Gemini (to keep keys secure/centralized).
- **Preload Script (`electron/preload.ts`):**
  - Bridges the Main and Renderer processes.
  - Exposes a safe `window.ipcRenderer` API to the frontend.

### 3.2. Data Persistence

The application follows an "Offline-First" approach with local JSON storage.

#### Storage Locations

- **Primary Data File:** `calendar-data.json` - Stores all events, notes, drawing data
- **Global Settings:** `settings.json` - Synced settings (theme, data path preference)
- **Device Settings:** `%APPDATA%/calendar-plus/device-settings.json` - Local-only settings (window size, divider positions, device-specific API keys)

#### Data Path Resolution (v5.1.4+)

The app uses an intelligent folder detection system to locate existing data:

1. **Startup Detection (`loadSettings()` in `electron/main.ts`):**

   - First checks `settings.json` for a custom `dataPath` preference
   - If no custom path, searches OneDrive/Documents folders in priority order:
     - `A - CalendarPlus` (current recommended folder name)
     - `A - Calendar Pro` (legacy V4.5 folder)
     - `CalendarPlus` (fallback)
   - For each folder, verifies `calendar-data.json` exists before selecting
   - Falls back to `OneDrive/Documents/CalendarPlus` if nothing found

2. **Dynamic Path Changes:**

   - Users can change data location via Settings → Data Storage
   - Two methods supported:
     - **Folder Picker Dialog:** Click "Change" button (`select-data-folder` IPC handler)
     - **Manual Entry:** Type/paste path directly (`set-data-path` IPC handler)
   - Both methods immediately:
     - Update `currentDataPath` variable in main process
     - Update `globalSettingsPath` to new folder's `settings.json`
     - Save preference to `settings.json`
     - Log the path change with detailed diagnostics
     - Trigger automatic data reload in frontend

3. **Automatic Data Reload System:**
   - When data path changes, Settings page dispatches `data-path-changed` event
   - App.tsx listens for this event and calls `loadNotes()`
   - New data loads immediately without app restart
   - Console logs show full reload process for debugging

#### Data Structure Normalization

**Problem (V4.5 → V5 Migration):**

- V4.5 stored notes as single objects: `{ "2025-12-15": { id, title, ... } }`
- V5 expects arrays: `{ "2025-12-15": [{ id, title, ... }] }`

**Solution (`get-data` handler):**

- Automatically detects single-object notes
- Wraps them in arrays: `[{ id, title, ... }]`
- Saves normalized structure back to disk
- Logs each normalization for transparency

#### Legacy V4.5 Migration

**Automatic Migration Flow:**

- If `calendar-data.json` doesn't exist, checks for `A - Calendar Pro/notes.json`
- Converts V4.5 structure (Year → Month → Day) to V5 format (YYYY-MM-DD)
- Migrates all notes to new structure
- Saves to current data path
- Only runs once per folder

#### Sync Mechanism

- Relies on OS-level file sync (OneDrive, Dropbox, Google Drive)
- Place data folder in synced directory for multi-device access
- App reads/writes directly to JSON files
- Changes sync automatically via cloud provider

#### Logging & Debugging (v5.1.2+)

All data operations log to both:

- **Main Process Console:** `console.log()` for terminal debugging
- **DevTools Console:** `win.webContents.executeJavaScript()` for user visibility

**Key Logs to Watch:**

```
📂 Reading data from: [path]
📂 File exists: [true/false]
📥 Raw data loaded. Has notes? [true/false]
📊 Raw notes keys: [count]
✅ Total fixed notes: [count]
🔄 Data path changed from: [old path]
🔄 Data path changed to: [new path]
📂 File exists at new location: [true/false]
```

Press **F12** or **Ctrl+Shift+I** to open DevTools and view these logs.

### 3.3. AI Integration

- **Feature:** "AI Quick Add" (Ctrl+M) & "Dynamic Briefing".
- **Quick Add Flow:**
  1. User types a natural language prompt (e.g., "Meeting with John tomorrow at 2pm").
  2. Frontend sends prompt to Main process via IPC.
  3. Main process calls Google Gemini API.
  4. API returns structured JSON (Title, Date, Time, Description).
  5. Frontend receives structured data and creates the event.
- **Briefing Flow:**
  1. Dashboard aggregates upcoming (14 days), recent past (7 days), and overdue tasks.
  2. Sends filtered list to AI model.
  3. AI generates a comforting summary using a specific persona:
     - **Tone:** Warm, comforting, casual (supportive friend).
     - **Structure:** Congratulates on recent completions -> Encourages immediate tasks -> Reminds of future deadlines.
     - **Prioritization:** Focuses on high urgency tasks if overwhelmed; emphasizes relaxation.
     - **Specifics:** Provides task-specific advice (e.g., "revise" for exams).
  4. Updates dynamically when tasks are marked complete.

## 4. Key Features & Implementation

### 4.1. Dashboard & Calendar

- **Dashboard:** Widget-based layout showing quick notes, upcoming events, and stats.
- **Calendar:** Custom implementation using `date-fns` for grid generation.
- **Quick Notes:** Simple text-based notes with "importance" flags.

### 4.2. Stats & Analytics

- **Creator Stats:** Visualizes Fortnite island performance.
  - **Implementation:** Currently parses a bundled CSV file (`src/EpicGamesCSV`) using `papaparse`.
  - **Configuration:** Users can input Creator Codes in Settings, though the visualization currently relies on the CSV data structure.
- **GitHub Stats:**
  - Uses `react-github-calendar` to display the contribution graph.
  - Fetches user profile data via GitHub API (configured in Settings).

### 4.3. Drawing / Whiteboard

- **Implementation:** Custom React component (`src/pages/Drawing.tsx`).
- **Features:** Multi-tab support, freehand drawing, text objects, image support.
- **Storage:** Canvas data is serialized and stored in the local JSON data.

### 4.4. Auto-Update System

- **Implementation:** Integrated `electron-updater` for seamless one-click updates.
- **Features:**
  - Automatic update check on startup (silent)
  - Manual check via Settings page
  - Download progress visualization
  - One-click install & restart
  - Preserves all user data during updates
- **Configuration:** Published to GitHub Releases with automatic versioning.
- **User Experience:** No manual downloads or complex installations - users click "Install & Restart" and the app handles the rest.

### 4.5. Mobile Support (Progressive Web App)

To circumvent app store fees while delivering a native-like experience, the mobile version is implemented as a Progressive Web App (PWA).

- **Architecture:**

  - **Shared Codebase:** Leverages the existing React components and logic from the desktop app, refactored into a shared core package or monorepo structure where applicable.
  - **Hosting:** Hosted on Vercel (Free Tier) for global edge distribution.

- **Core PWA Features:**

  - **Installability:** Uses a `manifest.json` to allow users to "Add to Home Screen" on iOS and Android. This removes browser chrome (URL bars) and gives the app a dedicated icon and standalone window context.
  - **Service Workers:** Handles asset caching (`vite-plugin-pwa`) to ensure the app loads instantly even on slow mobile networks.

- **Notifications (Lock Screen "Lite"):**
  - **Implementation:** Uses the Web Push API and Supabase Edge Functions.
  - **Functionality:** Instead of native widgets (which require paid store distribution), the app sends push notifications for upcoming tasks. These persist on the user's lock screen until cleared, effectively acting as a "task list" widget.

## 5. Project Structure

```
CalendarPlus/
├── electron/               # Electron Main process source
│   ├── main.ts             # Entry point
│   └── preload.ts          # IPC bridge
├── src/                    # React Renderer process source
│   ├── components/         # Reusable UI components (AiQuickAddModal, Sidebar, etc.)
│   ├── contexts/           # React Contexts (ThemeContext)
│   ├── EpicGamesCSV/       # Data source for stats (CSV files)
│   ├── pages/              # Main application views (Calendar, Dashboard, Stats, etc.)
│   ├── styles/             # Global CSS and Tailwind imports
│   ├── utils/              # Helper functions (statsManager, github)
│   ├── App.tsx             # Main React component / Router
│   └── main.tsx            # React entry point
├── public/                 # Static assets (icons, etc.)
├── release/                # Output directory for builds
├── package.json            # Dependencies and scripts
├── vite.config.ts          # Vite configuration
└── README.md               # User documentation
```

## 6. Setup & Development

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running Locally

- **Development Mode:**
  ```bash
  npm run dev
  ```
  This starts the Vite dev server and launches the Electron window.

### Building

- **Compile & Build:**
  ```bash
  npm run build
  ```
- **Create Installer (Windows):**
  ```bash
  npm run build:installer
  ```
  Generates an NSIS installer in the `release/` directory.

## 7. Configuration

**Environment Variables:** `.env` file is used for development secrets.

- `VITE_SUPABASE_URL`: The unique API URL for the backend database.
- `VITE_SUPABASE_ANON_KEY`: The public API key for client-side requests.
- `GOOGLE_GENERATIVE_AI_KEY`: API key for Gemini integration.

- **User Defaults:** `user-defaults.json` can be used to pre-seed configuration (GitHub username, Creator codes) for personal builds.

## 7.5. Critical Fixes Log (V5 Migration)

### V5.0.0 → V5.1.4: Data Loading & Migration Fixes

**Initial Problem (December 2025):**
Users upgrading from V4.5 to V5 reported empty calendars despite having data files.

**Root Causes Identified:**

1. **Folder Name Mismatch (V5.0.0-V5.0.2)**

   - V4.5 used folder: `OneDrive/A - Calendar Pro`
   - V5.0.0 only looked for: `OneDrive/CalendarPlus`
   - **Fix:** Added multi-folder search array with priority ordering

2. **Data Structure Incompatibility (V5.0.3-V5.0.4)**

   - V4.5 stored: `{ "2025-12-15": { id, title, ... } }` (single object)
   - V5 expected: `{ "2025-12-15": [{ id, title, ... }] }` (array)
   - **Fix:** Auto-normalize data on load, wrap single objects in arrays

3. **IPC Handler Registration Timing (V5.0.5-V5.0.7)**

   - Handlers registered AFTER window creation
   - Caused "No handler registered for 'get-data'" errors
   - **Fix:** Created `setupIpcHandlers()` function, called BEFORE `createWindow()`

4. **Missing Path Change Detection (V5.1.0-V5.1.2)**

   - Changing data path in UI didn't update `currentDataPath` variable
   - App continued reading from old location
   - **Fix:** Updated IPC handlers to modify global `currentDataPath` on path changes

5. **No Automatic Reload After Path Change (V5.1.3)**

   - Data path updated but UI didn't refresh
   - Required app restart to see new data
   - **Fix:** Added event system - Settings dispatches `data-path-changed`, App listens and calls `loadNotes()`

6. **Insufficient Debugging Visibility (V5.1.2-V5.1.4)**
   - Errors only logged to main process console
   - Users couldn't see what was happening
   - **Fix:** Dual logging system - all operations log to DevTools via `win.webContents.executeJavaScript()`

**Final Implementation (V5.1.4):**

✅ Multi-folder detection with file verification  
✅ Automatic data structure normalization  
✅ Legacy V4.5 migration support  
✅ Real-time path updates without restart  
✅ Event-driven data reload system  
✅ Comprehensive logging to DevTools  
✅ DevTools shortcuts (F12, Ctrl+Shift+I) in production

**Testing Protocol:**

1. Create test data folder on desktop
2. Change data path via Settings → Data Storage
3. Verify DevTools logs show path change and data reload
4. Confirm tasks appear immediately without restart
5. Switch back to original folder and verify data reloads

**Prevention Measures:**

- All data operations now log path, existence check, and record count
- Settings page shows current data path at all times
- IPC handlers validate path changes before committing
- Event system ensures UI stays synchronized with backend state

## 8. Known Issues / To Do

- **Resolved:** AI API Quota/Key Issue: The "404 Not Found" errors have been resolved by implementing a robust model fallback system. The app now prioritizes `gemini-2.5-flash` and `gemini-2.5-flash-lite`, falling back to `gemini-2.0-flash-exp`, `gemini-1.5-flash`, and `gemini-1.5-pro` if necessary.

## 9. Troubleshooting Data Loading Issues

### Data Not Appearing After Update

**Symptoms:** Events/notes don't show after installing new version

**Solution:**

1. Open DevTools (F12)
2. Check console for data path logs:
   ```
   📂 Reading data from: [path]
   📂 File exists: [true/false]
   ```
3. If path is wrong:
   - Go to Settings → Data Storage
   - Click "Change" and select correct folder
   - Or manually paste correct path: `C:\Users\[YourName]\OneDrive\A - CalendarPlus`

### Testing Data Loading

**Create Test Environment:**

1. Create folder: `C:\Users\[YourName]\Desktop\CalendarPlus-TestData`
2. Add test `calendar-data.json`:
   ```json
   {
     "notes": {
       "2025-12-20": [
         {
           "id": "test-1",
           "title": "Test Task",
           "time": "10:00",
           "importance": "high"
         }
       ]
     }
   }
   ```
3. In app Settings → Data Storage, change path to test folder
4. Watch DevTools console for:
   ```
   🔄 Data folder selected via dialog
   🔄 Data path changed to: C:\Users\...\CalendarPlus-TestData\calendar-data.json
   📂 File exists at new location: true
   🔄 Reloading data from new path...
   📊 Raw notes keys: 1
   ```
5. Test task should appear immediately on Dashboard/Calendar

### Data Path Not Updating

**Symptoms:** Changed data path in settings but still reading from old location

**Cause:** Missing IPC handler updates (fixed in v5.1.3+)

**Verify Fix:**

- Check version in Settings → About
- Should be v5.1.3 or higher
- Look for these logs after changing path:
  ```
  🔄 Data path changed from: [old]
  🔄 Data path changed to: [new]
  🔄 Global settings path: [new folder]\settings.json
  ```

### Notes Stored as Objects Instead of Arrays

**Symptoms:** Error logs mentioning "wrapping single note in array"

**This is normal!** The app auto-fixes V4.5 data format:

```
✅ Fixed date 2025-12-15: wrapped single note in array
💾 Normalized calendar-data.json structure. Saving...
✅ Fixed data saved successfully.
```

After first load, the file is permanently upgraded to V5 format.

## 10. IPC Architecture Reference

### Critical Data Path Handlers

**File:** `electron/main.ts`

1. **`get-data`** - Load all calendar data

   - Reads from `currentDataPath`
   - Auto-migrates V4.5 legacy data
   - Normalizes single-object notes to arrays
   - Logs entire process to DevTools

2. **`save-data`** - Save calendar data

   - Writes to `currentDataPath`
   - Creates directory if missing
   - Returns success/failure status

3. **`select-data-folder`** - Folder picker dialog

   - Shows native folder selection dialog
   - Updates `currentDataPath` and `globalSettingsPath`
   - Saves preference to `settings.json`
   - Logs full path change with file existence check
   - Returns new path to frontend

4. **`set-data-path`** - Manual path entry

   - Updates `currentDataPath` and `globalSettingsPath`
   - Saves preference to `settings.json`
   - Logs full path change with diagnostics
   - Returns new path to frontend

5. **`save-global-setting`** - Save synced settings
   - Writes to `globalSettingsPath`
   - If key is `dataPath`, updates `currentDataPath` variable
   - Logs data path changes

### Frontend Event System

**File:** `src/App.tsx`, `src/pages/Settings.tsx`

**Event Flow for Data Path Changes:**

1. User changes path in Settings (via dialog or manual entry)
2. Settings page calls IPC handler (`select-data-folder` or `set-data-path`)
3. Main process updates paths and saves to `settings.json`
4. Settings page calls `get-data` to fetch new data
5. Settings page dispatches custom event: `data-path-changed`
6. App.tsx event listener receives event
7. App.tsx calls `loadNotes()` to refresh state
8. Dashboard/Calendar re-render with new data

**Key Code Pattern:**

```typescript
// Settings.tsx - After path change
window.dispatchEvent(
  new CustomEvent("data-path-changed", {
    detail: { path: newPath, data: newData },
  })
);

// App.tsx - Listen for changes
useEffect(() => {
  const handleDataPathChange = () => {
    loadNotes(); // Reload from new location
  };
  window.addEventListener("data-path-changed", handleDataPathChange);
  return () =>
    window.removeEventListener("data-path-changed", handleDataPathChange);
}, []);
```

## 11. Planned Roadmap

- **Implementation:** Integrated `electron-updater` for seamless one-click updates.
- **Features:**

### 4.5. Responsive Design & Mobile Experience (v5.1.0)

- **Smart Layout Engine:**
  - Dynamically detects "mobile" state based on available viewport width (accounting for sidebar toggle).
  - Switches to a stacked layout when width < 900px.
- **Adaptive Dashboard:**
  - **Independent Resizing:** In mobile/stacked view, each container (Events, Trends, Briefing, GitHub, Stats) has its own independent height state.
  - **Touch-Friendly Controls:** Replaced global sliders with individual "drag handles" at the bottom of each card for intuitive resizing on smaller screens.
  - **Layout Fixes:** Optimized flexbox layouts for Briefing and GitHub cards to handle overflow and resizing gracefully without UI breakage.

### Data Persistence & Sync (Migration to v2)

The application is transitioning from a local-only JSON architecture to a cloud-hybrid model to support multi-device syncing and mobile access.

- **Primary Database (Cloud):** Supabase (PostgreSQL).

  - **Role:** Acts as the single source of truth for all events, settings, and user data.
  - **Tiers:** Utilises the free tier (500MB storage, 50,000 MAU) to maintain zero cost.

- **Sync Engine:**

  - **Realtime:** Uses Supabase Realtime subscriptions (`postgres_changes`) to push updates instantly between Desktop and Mobile.
  - **Optimistic UI:** The frontend updates the UI immediately upon user action (e.g., creating a task) while the network request resolves in the background, ensuring the "snappy" feel remains.

- **Authentication:**

  - **Provider:** Supabase Auth (configured with Google OAuth).
  - **Security:** Row Level Security (RLS) policies ensure users can strictly access only their own data records.

- **Legacy/Offline Support:**
  - The app retains a local caching mechanism (localStorage/IndexedDB) to allow viewing the calendar when offline. Changes made offline are queued and replayed to Supabase upon reconnection.

### Distribution & Updates (Microsoft Store)

- **Primary Distribution:** Microsoft Store.

  - **Rationale:** Solves the "Unknown Publisher" (SmartScreen) warning without requiring expensive annual EV code-signing certificates ($300+/yr). Microsoft signs the package upon Store submission.
  - **Cost Strategy:** Utilises the one-time individual developer registration fee (~$19 USD) for lifetime access, adhering to the "low cost" constraint.

- **Packaging:**

  - **Format:** The Electron app is packaged as an `.msix` or a Store-compatible `.exe` (Win32 App) using `electron-builder` configurations.
  - **CI/CD:** GitHub Actions pipeline builds the artifact and can optionally automate submission to the Microsoft Partner Center.

- **Update Mechanism:**
  - **Store Build:** Updates are handled entirely by the Microsoft Store infrastructure. When a new version is published to the Store, Windows automatically downloads and installs it for the user in the background.
  - **Direct Download (Fallback):** The app retains `electron-updater` logic for users who prefer downloading the portable `.exe` directly from GitHub Releases, though these users may encounter SmartScreen warnings.

### Advanced Appearance & Customization

- **Custom Fonts:** Allow users to upload and preload custom fonts.
- **Extended Accent Colors:** Apply accent colors to more UI elements, including setting icons and dashboard widget backgrounds.

### Dashboard Enhancements

- **Edit Mode:** Enable users to rearrange dashboard widgets.
- **New Widgets:** Add more widget options to the dashboard.

### Core Logic Improvements

- **API Logic Refactor:** Redo the API logic to fix breaking fallback mechanisms.
- **Third-Party Imports:** Support importing external calendars with selective add/remove capabilities.

### AI & Productivity

- **AI Quick Note:** Add a repeating toggle (e.g., "repeat every X times" or "every X days").

### Settings & Management

- **Notification Toggle:** Simple toggle to enable/disable notifications.
- **Settings Export/Import:** "One-click" export of all settings and data into a single package for easy transfer to another machine.
- **Factory Reset:** "Start Clean" button to wipe all data and restart the onboarding process.
