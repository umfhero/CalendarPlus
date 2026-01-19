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
├── .meta/               # Project documentation and reference files
│   ├── PROJECT_OVERVIEW.md  # This file - AI context guide
│   └── ICON_REFERENCE.md    # Icon usage reference (text version)
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
| `Stats.tsx`     | Fortnite creator statistics and analytics (hidden by default, enable in Dev Tools)   |
| `Dev.tsx`       | **Hidden developer tools** (Ctrl+/) for feature flags, mock mode, and debugging      |
| `IconGallery.tsx` | **Visual icon reference** showing all Lucide icons with search and copy             |

#### Detailed Page Descriptions

**Dashboard** - Customizable widget layout with AI briefing, upcoming events, task trends, board previews, and GitHub activity. Supports multiple layout presets and resizable panels.

**Calendar** - Monthly view with event creation, editing, and deletion. Supports recurring events, importance levels, completion tracking, and AI-powered natural language input.

**Timer** - Microwave-style timer with rapid input, stopwatch mode, session history, and persistent tracking. Includes mini indicator in sidebar and quick access modal.

**Board** - Infinite canvas whiteboard with sticky notes (standard, lined, calculator), drag handles, clipboard paste, text formatting, and per-board customization.

**Nerdbook** - Jupyter-style notebook with markdown, code (JS/Python via Pyodide), and text cells. Features syntax highlighting, cell management, and keyboard shortcuts.

**Notebook Hub** - Central page combining Quick Notes, Nerdbooks, and Boards with unified search, recent items, and quick creation.

**Workspace** - IDE-style file explorer with tree view, tabbed editors, drag-and-drop organization, and file-based storage (.exec, .brd, .nt files). Features:
- **@ Connections Panel**: Right-click files to view and manage @ mention connections
- **Linked Notes Graph**: Force-directed visualization of note connections
- **Image Gallery**: View all workspace images in a gallery format
- **Open File**: Right-click empty space to open external .md files (auto-converts to .exec)

**Progress** - Analytics dashboard with weekly/monthly completion charts, streak tracking, task management, and time range filtering.

**Settings** - Comprehensive configuration including themes, colors, language (10 options), AI providers, API keys, shortcuts, features, and data paths.

**GitHub** - Contribution visualization with 2D calendar and 3D skyline views, year selection, and activity statistics.

**Stats** - Fortnite creator analytics with island plays, retention metrics, and historical data tracking. Hidden by default.

**Dev Tools** (Ctrl+/) - Hidden developer page with:
- **Simulators**: Mock Dashboard mode, Region block testing
- **Feature Flags**: Creator Stats, Companion Pets, Icon Gallery access
- **Dashboard Tools**: Reset layout, Auto-briefing toggle, Force snapshot, Update notification

**Icon Gallery** - Visual reference of ~150 Lucide icons organized by category with search and click-to-copy functionality. Access via Dev Tools.

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
| `FileTree.tsx`           | Hierarchical file/folder browser with drag-drop, context menu |
| `FileTreeNode.tsx`       | Individual tree node with context menu            |
| `TabBar.tsx`             | Multi-tab editor interface                         |
| `ContentArea.tsx`        | Main editor area with tab management               |
| `WelcomeView.tsx`        | Landing page when no files are open                |
| `NerdbookEditor.tsx`     | Jupyter-style notebook editor (.exec files)        |
| `BoardEditor.tsx`        | Whiteboard editor (.brd files)                     |
| `TextNoteEditor.tsx`     | Simple text/markdown editor (.nt files)            |
| `LinkedNotesGraph.tsx`   | Force-directed graph visualization of note links   |
| `ConnectionsPanel.tsx`   | Sidebar panel for managing @ connections           |
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
  | "workspace"   // IDE-style workspace
  | "icons";      // Icon Gallery (dev reference)

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
| `open-workspace-file-dialog`  | Open file dialog (supports .md import)       |
| `add-connection-to-file`      | Add @ mention connection to file             |
| `remove-connection-from-file` | Remove @ mention connection from file        |
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

### V6.0.4 - Workspace Enhancements (Current)

_Focus: File explorer improvements, @ Connections UI, Icon Gallery, and Markdown import._

#### New Features

- **@ Connections Panel**: 
  - Right-click any file in the explorer to view and manage @ connections
  - Sidebar panel extends from file tree (no modal overlay)
  - Add/remove connections with search filter
  - View both outgoing and incoming connections

- **Open File from Context Menu**:
  - Right-click on empty space in file explorer
  - "Open File..." option opens native file dialog
  - Supports .exec, .brd, .nt, and .md files

- **Markdown Import**:
  - Select any .md file to automatically convert to .exec notebook
  - Content placed in a single markdown cell
  - Original filename preserved

- **Icon Gallery**:
  - Visual reference of ~150 Lucide icons used in the app
  - 21 categories organized by purpose
  - Search functionality with instant filtering
  - Click any icon to copy its name
  - Usage badges show where icons are used
  - Access via Dev Tools (Ctrl+/ → Icon Gallery)

- **Improved Context Menu Behavior**:
  - Right-click on different files opens new menu directly
  - No need to left-click to close previous menu first

#### Developer Tools Improvements

- Removed Test Notifications section (no longer used)
- Reorganized into cleaner 3-column layout
- Danger Zone moved to bottom/separate column
- Added Icon Gallery access button

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
  - **Linked Notes Graph**: Interactive force-directed graph visualization
  - **Image Support**: Full markdown image syntax with dimensions and crop
  - **Image Gallery**: View all pasted images with thumbnails
  - **Table Support**: Insert tables via right-click menu
  - **Smart Markdown Context Menu**: Right-click formatting menu
  - **Python Execution**: Run Python code cells with Pyodide

- **Windows Store Auto-Launch**: APPX support with electron-winstore-auto-launch

---

## Styling Conventions

- **Rounded corners:** `rounded-2xl` (cards), `rounded-[2rem]` (large containers)
- **Shadows:** `shadow-xl shadow-gray-200/50 dark:shadow-gray-900/50`
- **Dark mode:** Always include `dark:` variants
- **Spacing:** `p-6 md:p-8` for responsive padding
- **Accent color:** Use `accentColor` from `useTheme()`, not hardcoded colors
- **Animations:** Use `framer-motion` with `motion.div`, `AnimatePresence`
- **Scrollbars:** Use `custom-scrollbar` class for thin auto-hiding scrollbars

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

### Version Update Process

When releasing a new version, update the following files **in order**:

| File | Location | What to Update |
|------|----------|----------------|
| `package.json` | Root | `"version": "X.X.X"` - Primary version source |
| `version.json` | Root | `"msstore_version": "X.X.X"` - MS Store badge sync |
| `src/utils/version.ts` | Source | `APP_VERSION = 'X.X.X'` - Fallback for UI display |

### Building for Microsoft Store

**Quick Build Commands:**
```bash
# 1. Verify TypeScript compiles
npx tsc --noEmit

# 2. Compile the application
npm run build:compile

# 3. Build APPX package for Microsoft Store
npx electron-builder --win appx
```

**Output location**: `release/ThoughtsPlus [version].appx`

---

_Last updated: January 19, 2026 (v6.0.4)_
