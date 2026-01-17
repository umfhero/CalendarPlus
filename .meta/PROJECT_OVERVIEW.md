# Thoughts+ - AI Context Guide

> **Purpose:** Provide AI models with essential context to modify this Electron + React app without breaking it.

> ⚠️ **AI Development Note:** Do NOT use browser tools or browser_subagent to test changes. The app runs via `npm run dev` and the user tests in their own Electron environment. TypeScript compilation (`npx tsc --noEmit`) is sufficient for verification.

> 🚨 **CRITICAL: Data Safety During Development**
>
> **The app now includes AUTOMATED Data Isolation logic in `electron/main.ts`!**
>
> When running in Dev Mode (`npm run dev`):
> 1. The app automatically uses a separate `ThoughtsPlus-Dev` folder.
> 2. It copies production data to this folder on startup (if missing).
> 3. It **ignores** saved data paths in `settings.json` to prevent accidental production overwrite.
>
> **You can now safely run `npm run dev` without manual configuration.**

---

## Tech Stack

| Layer    | Technology                                                       |
| -------- | ---------------------------------------------------------------- |
| Desktop  | Electron 29 (Main + Renderer process)                            |
| Frontend | React 18 + TypeScript + Vite                                     |
| Styling  | Tailwind CSS + `clsx` + `framer-motion` for animations           |
| Icons    | `lucide-react`                                                   |
| Charts   | `recharts`, `react-activity-calendar`                            |
| Dates    | `date-fns`                                                       |
| Run Code | **Pyodide** (Python in WebAssembly), JavaScript eval             |
| AI       | Multi-provider: Google Gemini + Perplexity AI (optional feature) |
| Markdown | **Prism.js** for syntax highlighting                             |
| i18n     | 10 languages supported (EN, ES, FR, DE, PT, JA, ZH, KO, IT, RU)  |

---

## Project Structure

```
ThoughtsPlus/
├── electron/
│   ├── main.ts          # Electron main process - IPC handlers, window, AI calls
│   └── preload.ts       # Secure IPC bridge (exposes window.ipcRenderer)
├── src/
│   ├── App.tsx          # Root component - routing, global state, providers
│   ├── types.ts         # TypeScript types (Page, Note, NotesData, etc.)
│   ├── main.tsx         # React entry point
│   ├── components/      # Reusable UI components
│   ├── contexts/        # React Context providers (Theme, Notification, Timer)
│   ├── pages/           # Full page components
│   ├── utils/           # Helper functions
│   └── styles/          # Global CSS
├── public/              # Static assets
└── package.json
```

---

## Key Files & Their Roles

### Pages (`src/pages/`)

| File            | Purpose                                                                               |
| --------------- | ------------------------------------------------------------------------------------- |
| `Dashboard.tsx` | Main view with customizable widgets (briefing, events, trends, boards, GitHub)       |
| `Calendar.tsx`  | Monthly calendar view with event CRUD, recurrence, and importance levels             |
| `Timer.tsx`     | Timer/stopwatch with microwave-style input, history, and mini indicator              |
| `Board.tsx`     | Interactive whiteboard with sticky notes, backgrounds, calculator, drag handles      |
| `Nerdbook.tsx`  | **Standalone Jupyter-style Notebook** for code execution (JS/Python) & rich notes    |
| `Notebook.tsx`  | **Notebook Hub** - Central page for Quick Notes, Nerdbooks, and Boards               |
| `Workspace.tsx` | **IDE-style workspace** with file tree, tabbed editors, and Quick Notes integration  |
| `Progress.tsx`  | Weekly/monthly analytics with completion trends, streaks, and task management        |
| `Settings.tsx`  | App configuration (API keys, themes, shortcuts, features, data path, language)       |
| `Github.tsx`    | GitHub profile with 2D/3D contribution visualization                                 |
| `Stats.tsx`     | Fortnite creator statistics and analytics                                            |
| `Dev.tsx`       | **Hidden developer tools** for testing notifications, mock mode, and debugging       |
| `Drawing.tsx`   | Legacy drawing page (deprecated, replaced by Board.tsx)                              |

#### Detailed Page Descriptions

**Dashboard** - Customizable widget layout with AI briefing, upcoming events, task trends, board previews, and GitHub activity. Supports multiple layout presets and resizable panels.

**Calendar** - Monthly view with event creation, editing, and deletion. Supports recurring events, importance levels, completion tracking, and AI-powered natural language input.

**Timer** - Microwave-style timer with rapid input, stopwatch mode, session history, and persistent tracking. Includes mini indicator in sidebar and quick access modal.

**Board** - Infinite canvas whiteboard with sticky notes (standard, lined, calculator), drag handles, clipboard paste, text formatting, and per-board customization.

**Nerdbook** - Jupyter-style notebook with markdown, code (JS/Python via Pyodide), and text cells. Features syntax highlighting, cell management, and keyboard shortcuts.

**Notebook Hub** - Central page combining Quick Notes, Nerdbooks, and Boards with unified search, recent items, and quick creation.

**Workspace** - IDE-style file explorer with tree view, tabbed editors, drag-and-drop organization, and file-based storage (.exec, .brd, .nt files).

**Progress** - Analytics dashboard with weekly/monthly completion charts, streak tracking, task management, and time range filtering.

**Settings** - Comprehensive configuration including themes, colors, language (10 options), AI providers, API keys, shortcuts, features, and data paths.

**GitHub** - Contribution visualization with 2D calendar and 3D skyline views, year selection, and activity statistics.

**Stats** - Fortnite creator analytics with island plays, retention metrics, and historical data tracking.

**Dev** (Hidden) - Developer tools for testing notifications, toggling mock mode, and debugging features.

### Contexts (`src/contexts/`)

| File                      | State Managed                 | Hook                |
| ------------------------- | ----------------------------- | ------------------- |
| `ThemeContext.tsx`        | `theme`, `accentColor`        | `useTheme()`        |
| `NotificationContext.tsx` | Toast notifications           | `useNotification()` |
| `TimerContext.tsx`        | Active timer, history, alerts | `useTimer()`        |

### Important Components (`src/components/`)

| File                     | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `Sidebar.tsx`            | Navigation with reorderable items, feature toggles |
| `AiQuickAddModal.tsx`    | Natural language event creation (Ctrl+M)           |
| `TaskTrendChart.tsx`     | Completion rate graph with time range selection    |
| `TimerAlertOverlay.tsx`  | Timer completion alert + mini indicator            |
| `SetupWizard.tsx`        | First-run onboarding flow                          |
| `ShortcutsOverlay.tsx`   | Dynamic Ctrl shortcuts overlay (syncs with Settings) |
| `KeyboardShortcuts.tsx`  | Customizable keyboard shortcuts in Settings        |
| `QuickCaptureOverlay.tsx`| Global quick note capture (Ctrl+Shift+N)           |
| `MarkdownContextMenu.tsx`| Right-click formatting menu for markdown cells     |
| `CustomThemeEditor.tsx`  | Create and manage custom color themes              |
| `LanguageSelector.tsx`   | Language selection dropdown (10 languages)         |

### Workspace Components (`src/components/workspace/`)

| File                     | Purpose                                            |
| ------------------------ | -------------------------------------------------- |
| `FileTree.tsx`           | Hierarchical file/folder browser with drag-drop   |
| `FileTreeNode.tsx`       | Individual tree node with context menu            |
| `TabBar.tsx`             | Multi-tab editor interface                         |
| `ContentArea.tsx`        | Main editor area with tab management               |
| `WelcomeView.tsx`        | Landing page when no files are open                |
| `NerdbookEditor.tsx`     | Jupyter-style notebook editor (.exec files)        |
| `BoardEditor.tsx`        | Whiteboard editor (.brd files)                     |
| `TextNoteEditor.tsx`     | Simple text/markdown editor (.nt files)            |
| `LinkedNotesGraph.tsx`   | Force-directed graph visualization of note links   |
| `MentionAutocomplete.tsx`| @ mention autocomplete dropdown                    |
| `ImageEditor.tsx`        | Visual image resize and crop tool                  |
| `ImageGallery.tsx`       | Gallery view of all workspace images               |

---

## Architecture Patterns

### 1. Page Navigation

```tsx
// App.tsx manages currentPage state
const [currentPage, setCurrentPage] = useState<Page>("dashboard");

// Page type defined in types.ts
type Page =
  | "dashboard"   // Main dashboard with widgets
  | "calendar"    // Monthly calendar with events
  | "stats"       // Fortnite creator statistics
  | "settings"    // App configuration
  | "drawing"     // Legacy drawing (deprecated)
  | "github"      // GitHub contributions
  | "dev"         // Hidden developer tools
  | "custom"      // Custom widgets (future)
  | "timer"       // Timer/stopwatch
  | "progress"    // Analytics and trends
  | "notebook"    // Notebook hub (Quick Notes + Nerdbooks + Boards)
  | "workspace";  // IDE-style workspace

// ⚠️ IMPORTANT: "dev" page and dev tools (Ctrl+/) are HIDDEN FEATURES for developers only.
// - DO NOT show in shortcuts overlay, user documentation, or commit messages
// - DO NOT recommend or mention to users in any context
// - This is a SECRET shortcut for devs to test/review specific functions during development
// - Keep it completely hidden from end users

// Sidebar calls setPage() to navigate
<Sidebar currentPage={currentPage} setPage={setCurrentPage} />;
```

### 2. IPC Communication (Renderer ↔ Main)

```tsx
// In React (renderer) - call main process
const data = await window.ipcRenderer.invoke("get-data");
await window.ipcRenderer.invoke("save-data", newData);

// In electron/main.ts - handle calls
ipcMain.handle("get-data", async () => {
  /* return data */
});
ipcMain.handle("save-data", async (_, data) => {
  /* save data */
});
```

### 3. Feature Toggles

```tsx
// Stored in localStorage as 'feature-toggles'
const enabledFeatures = {
  calendar: true,
  drawing: true,
  stats: true,
  github: true,
  timer: true,
  notebook: true,
  workspace: true,
  aiDescriptions: true,
};

// Components check: if (enabledFeatures.timer) { render... }
// On change: window.dispatchEvent(new CustomEvent('feature-toggles-changed', { detail: newFeatures }));
```

### 4. Theme & Accent Color

```tsx
const { theme, accentColor } = useTheme();
// theme: 'light' | 'dark'
// accentColor: hex string like '#3b82f6'

// Use in styles:
style={{ backgroundColor: accentColor }}
style={{ backgroundColor: `${accentColor}15` }} // with transparency
className="dark:bg-gray-800" // Tailwind dark mode
```

### 5. Data Persistence

```tsx
// Calendar data - synced via OneDrive/Documents
await window.ipcRenderer.invoke("save-data", { notes: notesData });

// Local preferences - localStorage
localStorage.setItem("dashboard_use24HourTime", "true");
localStorage.setItem("taskTrendChart-timeRange", "1W");

// Device settings - local only (API keys, window state)
await window.ipcRenderer.invoke("save-device-setting", "apiKey", key);
```

---

## Data Types (`src/types.ts`)

```typescript
interface Note {
  id: string;
  title: string;
  description: string;
  summary?: string; // AI-generated summary
  time: string; // "HH:mm" format
  importance: "low" | "medium" | "high" | "misc";
  completed?: boolean;
  completedLate?: boolean;
  missed?: boolean; // Explicitly marked as missed
  recurrence?: {
    type: "daily" | "weekly" | "fortnightly" | "monthly";
    endDate?: string;
    count?: number;
  };
  seriesId?: string; // Groups recurring events
}

interface NotesData {
  [date: string]: Note[]; // Key is ISO date "YYYY-MM-DD"
}

// Nerdbook - Cell-based notebook system
type NerdCellType = "markdown" | "code" | "text";

interface NerdCell {
  id: string;
  type: NerdCellType;
  content: string;
  language?: string; // For code cells
  output?: string; // Execution output
  isExecuting?: boolean;
  executionError?: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface NerdNotebook {
  id: string;
  title: string;
  cells: NerdCell[];
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  color?: string;
}

// Workspace file types
type FileType = "exec" | "board" | "note";
// .exec = Nerdbook (executable notebook)
// .brd = Board (whiteboard)
// .nt = Note (text/markdown)

interface WorkspaceFile {
  id: string;
  name: string; // Without extension
  type: FileType;
  parentId: string | null; // null = root level
  createdAt: string;
  updatedAt: string;
  filePath?: string; // Full path on disk
}

interface WorkspaceFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  isQuickNotesFolder?: boolean; // Special folder for quick notes
}
```

---

## Common Patterns

### Adding a New Page

1. Create `src/pages/NewPage.tsx`:

```tsx
export function NewPage({
  isSidebarCollapsed = false,
}: {
  isSidebarCollapsed?: boolean;
}) {
  const { accentColor } = useTheme();
  return <div className="h-full overflow-y-auto p-6">...</div>;
}
```

2. Add to `types.ts`:

```tsx
type Page = "..." | "newpage";
```

3. Add to `App.tsx`:

```tsx
import { NewPage } from "./pages/NewPage";
// In render:
{
  currentPage === "newpage" && (
    <NewPage isSidebarCollapsed={isSidebarCollapsed} />
  );
}
```

4. Add to `Sidebar.tsx`:

```tsx
// Add to order array, add icon import, add render block
```

### Adding a New IPC Handler

1. In `electron/main.ts` inside `setupIpcHandlers()`:

```typescript
ipcMain.handle("my-handler", async (_, arg1, arg2) => {
  // Do something
  return result;
});
```

2. Call from React:

```tsx
const result = await window.ipcRenderer.invoke("my-handler", arg1, arg2);
```

### Dashboard Container Style

```tsx
// Standard container with accent bar header
<motion.div className="p-6 md:p-8 rounded-[2rem] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-xl">
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <div
        className="w-1 h-4 rounded-full"
        style={{ backgroundColor: accentColor }}
      ></div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
        Container Title
      </p>
    </div>
    {/* Optional icon on right */}
    <div
      className="p-2.5 rounded-xl"
      style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
    >
      <Icon className="w-4 h-4" />
    </div>
  </div>
  {/* Content */}
</motion.div>
```

---

## Key IPC Handlers

| Handler                       | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `get-data` / `save-data`      | Calendar notes CRUD                          |
| `get-boards` / `save-boards`  | Whiteboard data                              |
| `get-workspace` / `save-workspace` | Workspace state and settings            |
| `save-workspace-file`         | Save individual workspace files (.exec, .brd, .nt) |
| `load-workspace-file`         | Load workspace file content                  |
| `list-workspace-files`        | List files in workspace directory            |
| `delete-workspace-file`       | Delete a workspace file from disk            |
| `save-pasted-image`           | Save clipboard image to workspace/assets/    |
| `list-workspace-images`       | List all images in workspace assets          |
| `delete-workspace-image`      | Delete an image from workspace assets        |
| `show-item-in-folder`         | Open file location in Windows Explorer       |
| `get-global-setting`          | Synced settings (theme, accent, language)    |
| `save-global-setting`         | Persist synced settings                      |
| `get-device-setting`          | Local settings (encrypted API keys)          |
| `save-device-setting`         | Persist local settings with DPAPI encrypt    |
| `parse-natural-language-note` | AI: text → structured event (multi-provider) |
| `generate-ai-overview`        | AI: daily briefing generation                |
| `generate-nerdbook-backbone`  | AI: generate notebook structure              |
| `generate-ai-note-content`    | AI: generate board note content              |
| `validate-api-key`            | Test AI provider API key validity            |
| `get-provider-api-key`        | Get encrypted API key for provider           |
| `set-provider-api-key`        | Save encrypted API key for provider          |
| `get-ai-provider`             | Get current AI provider (gemini/perplexity)  |
| `set-ai-provider`             | Set current AI provider                      |
| `flash-window`                | Flash taskbar (timer alerts)                 |
| `set-taskbar-badge`           | Show notification count on taskbar           |
| `clear-taskbar-badge`         | Clear taskbar notification badge             |
| `get-github-username`         | GitHub integration                           |
| `get-creator-stats`           | Fortnite API stats                           |
| `set-quick-capture-enabled`   | Enable/disable global quick capture hotkey   |
| `set-quick-capture-hotkey`    | Change quick capture keyboard shortcut       |
| `get-quick-capture-hotkey`    | Get current quick capture hotkey             |
| `close-quick-capture`         | Close quick capture overlay                  |
| `open-external-link`          | Open URL in system browser                   |
| `log-error`                   | Log renderer errors to main process          |
| `open-dev-tools`              | Open DevTools from renderer                  |

---

## Recent Version History

### V5.8.0 - The Workspace Update

_Focus: IDE-style workspace, Quick Notes integration, Nerdbook enhancements, and Windows Store improvements._

#### New Features

- **IDE-Style Workspace**:
  - **File Tree**: Browse and manage files in a tree structure with sorting options
  - **Tabbed Editors**: Open multiple files in tabs with syntax highlighting
  - **Quick Notes Integration**: Quick Capture notes automatically appear in workspace
  - **Welcome View**: Clean landing page when no files are open

- **Quick Notes System**:
  - **Quick Capture Overlay**: Global hotkey (Ctrl+Shift+N) to capture notes from anywhere
  - **Workspace Integration**: Quick notes saved as markdown files in workspace
  - **Improved Focus Detection**: Better window focus handling for quick capture

- **Nerdbook Enhancements**:
  - **@ Mention Note Linking**: Link notes together with Obsidian-style @ mentions
    - Autocomplete dropdown when typing `@`
    - Support for spaces via `@"note with spaces"` syntax
    - Highlighted mentions in preview (valid = colored, invalid = strikethrough)
    - Click to navigate between linked notes
    - Keyboard navigation (arrow keys, Enter/Tab, Escape)
  - **Linked Notes Graph**: Interactive force-directed graph visualization
    - Physics-based node positioning with drag support
    - Pan and zoom controls
    - Cascading reveal animation
    - File type colors (Blue=notebooks, Purple=boards, Green=notes)
    - Clickable legend to filter by type
    - Hover lines show connections
  - **Image Support**: Full markdown image syntax with dimensions and crop
    - `![alt](url)`, `![alt](url =300x200)`, `![alt](url =300x200 crop)`
    - Paste images directly from clipboard (Ctrl+V)
    - Visual image editor with width/height controls and crop toggle
    - Images saved to `workspace/assets/` with unique filenames
  - **Image Gallery**: View all pasted images with thumbnails, delete or show in folder
  - **Table Support**: Insert tables via right-click menu
    - Tab key navigates to next cell
    - Shift+Tab navigates to previous cell
    - Auto-creates new row when Tab pressed at last cell
  - **Smart Markdown Context Menu**: Right-click formatting menu
    - Bold, Italic, Strikethrough, Inline Code
    - Headings (H1, H2, H3)
    - Lists (Bullet, Numbered, Checkbox)
    - Tables, Links, Quotes, Code Blocks, Dividers
    - Ctrl+Right-click shows browser's native spell checker
  - **Improved Line Breaks**: Preserves user's line breaks in markdown preview
  - **Python Execution**: Run Python code cells with Pyodide (WebAssembly)
  - **Code Cell Themes**: Toggle between dark and light syntax highlighting
  - **Always-Visible Actions**: Cell action buttons now always visible for better UX
  - **Improved Cell Navigation**: Better keyboard shortcuts for cell management

- **Windows Store Auto-Launch**:
  - **APPX Support**: Proper startup registration for Microsoft Store builds
  - **electron-winstore-auto-launch**: Uses Windows StartupTask extension
  - **Default Enabled**: Auto-launch enabled by default on first run
  - **Removed Toggle**: Simplified UX by removing manual toggle (users can disable via Task Manager)

- **Dynamic Shortcuts Overlay**:
  - **Synced with Settings**: Ctrl overlay now reflects customized shortcuts
  - **Real-time Updates**: Changes in Settings immediately update the overlay
  - **Disabled Shortcuts Hidden**: Only enabled shortcuts appear in overlay

- **Dashboard Improvements**:
  - **Unified Scrollbars**: Events container now uses consistent thin scrollbar style
  - **Briefing Autoscaling**: Briefing text now flush with container, autoscales to fit content
  - **No Internal Scrollbars**: Briefing container removed to prevent nested scrolling

#### Improvements

- **File Access Safety**:
  - **Mutex Pattern**: Prevents race conditions during file operations
  - **Atomic Writes**: Write to temp file then rename to prevent corruption
  - **Better Error Handling**: Graceful recovery from file access issues

- **Board Editor Refactor**: Improved board editing experience
- **File Tree Sorting**: Sort files by name, date, or type
- **Context Menu Positioning**: Fixed cutoff issues at bottom of screen

---

## Styling Conventions

- **Rounded corners:** `rounded-2xl` (cards), `rounded-[2rem]` (large containers)
- **Shadows:** `shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50`
- **Dark mode:** Always include `dark:` variants
- **Spacing:** `p-6 md:p-8` for responsive padding
- **Accent color:** Use `accentColor` from `useTheme()`, not hardcoded colors
- **Animations:** Use `framer-motion` with `motion.div`, `AnimatePresence`

---

## File Locations

| Data Type         | Location                                              |
| ----------------- | ----------------------------------------------------- |
| Calendar data     | `OneDrive/ThoughtsPlus/` or `Documents/ThoughtsPlus/` |
| Workspace files   | `OneDrive/ThoughtsPlus/workspace/` (or Documents)     |
| Workspace assets  | `OneDrive/ThoughtsPlus/workspace/assets/` (images)    |
| Global settings   | Same folder as calendar data                          |
| Device settings   | `%APPDATA%/thoughts-plus/device-settings.json`        |
| Timer history     | `localStorage` key: `timer-history`                   |
| Feature toggles   | `localStorage` key: `feature-toggles`                 |
| Sidebar order     | `localStorage` key: `sidebar-order`                   |
| Keyboard shortcuts| `localStorage` key: `keyboard-shortcuts`              |
| Custom themes     | `localStorage` key: `custom-themes`                   |
| Dashboard layout  | `localStorage` key: `dashboard_layout_v2`             |

---

## Keyboard Shortcuts

| Shortcut          | Action                       |
| ----------------- | ---------------------------- |
| `Ctrl+M`          | Open AI Quick Add modal      |
| `Ctrl+Enter`      | Open Quick Timer modal       |
| `Ctrl+Shift+N`    | Quick Capture (global)       |
| `Ctrl+S`          | Open Settings                |
| `Ctrl+D`          | Open Dashboard               |
| `Ctrl+C`          | Open Calendar                |
| `Ctrl+T`          | Open Timer                   |
| `Ctrl+B`          | Open Board                   |
| `Ctrl+G`          | Open GitHub                  |
| `Ctrl+P`          | Open Progress                |
| `Ctrl+N`          | Open Notebook                |
| `Ctrl+W`          | Open Workspace               |
| `Ctrl+/`          | Open Dev Tools (hidden)      |
| `Space` (Timer)   | Start/Pause timer            |
| `Esc` (Timer)     | Stop/Reset timer             |

### Nerdbook Shortcuts (Markdown Cells)

| Shortcut          | Action                       |
| ----------------- | ---------------------------- |
| `Ctrl+B`          | Bold text                    |
| `Ctrl+I`          | Italic text                  |
| `Ctrl+Shift+S`    | Strikethrough text           |
| `Ctrl+\``         | Inline code                  |
| `Ctrl+K`          | Insert link                  |
| `Enter`           | Smart list continuation      |
| `Tab`             | Table navigation / List indent |
| `Shift+Tab`       | Previous table cell / Unindent |
| `Right-click`     | Formatting context menu      |
| `Ctrl+Right-click`| Browser spell checker        |
| `Ctrl+V`          | Paste image from clipboard   |

> **Note:** Shortcuts are customizable in Settings. The Ctrl overlay dynamically reflects your configured shortcuts.

---

## Microsoft Store Distribution & Updates

### Build Configuration

**Distribution Method**: Microsoft Store (MSIX/APPX package)

- Updates handled automatically through Microsoft Store
- No manual code signing required (Microsoft signs apps for free)
- Clean install/uninstall experience for users

### Package Configuration (`package.json`)

```json
{
  "name": "thoughts-plus",
  "version": "5.7.1",
  "author": "umf",
  "productName": "Thoughts+",
  "build": {
    "appId": "com.thoughtsplus.app",
    "productName": "Thoughts+",
    "publish": {
      "provider": "github",
      "owner": "umfhero",
      "repo": "ThoughtsPlus"
    },
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "appx", "arch": ["x64"] }
      ],
      "legalTrademarks": "Thoughts+",
      "publisherName": "umf"
    },
    "appx": {
      "displayName": "Thoughts+",
      "publisherDisplayName": "umf",
      "identityName": "ThoughtsPlus",
      "publisher": "CN=umf",
      "backgroundColor": "#F3F4F6"
    },
    "nsis": {
      "oneClick": true,
      "perMachine": true,
      "shortcutName": "Thoughts+",
      "uninstallDisplayName": "Thoughts+"
    }
  }
}
```

### Building for Microsoft Store

1. **Compile app**: `npm run build:compile`
2. **Build MSIX package**: `npx electron-builder --win appx`
3. **Output location**: `release/Thoughts+ [version].appx`

### Prerequisites

- **Windows Developer Mode** must be enabled (Settings → For developers → Developer Mode ON)
  - Required to avoid symlink permission errors during build
  - Allows electron-builder to extract winCodeSign tools properly

### Microsoft Store Submission Checklist

- ✅ MSIX package format (not EXE/MSI)
- ✅ Silent install support (handled by MSIX)
- ✅ Proper Add/Remove Programs entries (publisher: "umf", app: "Thoughts+")
- ✅ Code signing handled by Microsoft Store
- ✅ App updates delivered automatically via Store

### Important Notes

- **No self-signed certificates needed** - Microsoft Store signs the package
- **Validation errors** from EXE/MSI format are avoided with MSIX
- **Auto-updates** work seamlessly through Windows Store mechanisms
- All future releases should use MSIX format for consistency

---

## Microsoft Store APPX Certification Notes

### v5.7.x - AI Feature Certification

The AI Quick-Add feature is **completely optional** and not required for the application to function. All core features (Board, Timer, Calendar, Notes, Stats) work fully offline without any API keys.

**Why AI features may not work during certification (outside developer control):**

- Regional restrictions (Google blocks Gemini in certain countries)
- API usage limits exceeded (free tier tokens depleted)
- Temporary service outages from the AI provider

These are third-party API limitations, not application bugs. The app handles these gracefully with clear error messages. If AI validation fails during review, this is expected behavior - the app is fully functional without AI.

### v5.6.0 - Blank Screen Fix

Fixed critical blank white screen issue when app launches in Microsoft Store APPX certification environment.

### Root Causes

- External Google Fonts CDN loading in sandboxed APPX environment
- Absolute asset paths incompatible with file:// protocol
- No error boundary for handling failures
- Missing startup diagnostics

### Fixes Implemented

1. **vite.config.ts** - Added `base: './'` for relative paths
2. **index.html** - Removed Google Fonts CDN links, fixed asset paths
3. **src/styles/index.css** - Replaced external imports with local font definitions
4. **src/components/ErrorBoundary.tsx** - New error boundary component
5. **src/main.tsx** - Added error boundary wrapper and startup logging
6. **electron/main.ts** - Added IPC handlers for error logging
7. **src/assets/fonts/fonts.css** - Local font definitions with system fallbacks

### Testing

- Build: `npm run build`
- Run: `./release/win-unpacked/Thoughts+.exe`
- Verify: App launches without blank screen, all pages load, no console errors

---

_Last updated: January 17, 2026 (v5.8.0)_
