# Calendar Plus - AI Context Guide

> **Purpose:** Provide AI models with essential context to modify this Electron + React app without breaking it.

---

## Tech Stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Desktop  | Electron 29 (Main + Renderer process)                  |
| Frontend | React 18 + TypeScript + Vite                           |
| Styling  | Tailwind CSS + `clsx` + `framer-motion` for animations |
| Icons    | `lucide-react`                                         |
| Charts   | `recharts`, `react-activity-calendar`                  |
| Dates    | `date-fns`                                             |
| AI       | Google Gemini API (`@google/generative-ai`)            |

---

## Project Structure

```
CalendarPlus/
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

| File            | Purpose                                |
| --------------- | -------------------------------------- |
| `Dashboard.tsx` | Main view with widgets, events, trends |
| `Calendar.tsx`  | Monthly calendar view, event CRUD      |
| `Timer.tsx`     | Timer/stopwatch with history           |
| `Board.tsx`     | Interactive whiteboard with sticky notes, backgrounds, calculator, per-board settings |
| `Settings.tsx`  | App configuration                      |
| `Github.tsx`    | GitHub profile & contributions         |
| `Stats.tsx`     | Fortnite creator statistics            |

### Contexts (`src/contexts/`)

| File                      | State Managed                 | Hook                |
| ------------------------- | ----------------------------- | ------------------- |
| `ThemeContext.tsx`        | `theme`, `accentColor`        | `useTheme()`        |
| `NotificationContext.tsx` | Toast notifications           | `useNotification()` |
| `TimerContext.tsx`        | Active timer, history, alerts | `useTimer()`        |

### Important Components (`src/components/`)

| File                    | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `Sidebar.tsx`           | Navigation with reorderable items, feature toggles |
| `AiQuickAddModal.tsx`   | Natural language event creation (Ctrl+M)           |
| `TaskTrendChart.tsx`    | Completion rate graph with time range selection    |
| `TimerAlertOverlay.tsx` | Timer completion alert + mini indicator            |
| `SetupWizard.tsx`       | First-run onboarding flow                          |

---

## Architecture Patterns

### 1. Page Navigation

```tsx
// App.tsx manages currentPage state
const [currentPage, setCurrentPage] = useState<Page>("dashboard");

// Page type defined in types.ts
type Page =
  | "dashboard"
  | "calendar"
  | "stats"
  | "settings"
  | "drawing"
  | "github"
  | "dev"
  | "custom"
  | "timer";

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
  time: string; // "HH:mm" format
  importance: "low" | "medium" | "high" | "misc";
  completed?: boolean;
  completedLate?: boolean;
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

| Handler                       | Purpose                         |
| ----------------------------- | ------------------------------- |
| `get-data` / `save-data`      | Calendar notes CRUD             |
| `get-boards` / `save-boards`  | Whiteboard data                 |
| `get-global-setting`          | Synced settings (theme, accent) |
| `save-global-setting`         | Persist synced settings         |
| `get-device-setting`          | Local settings (API keys)       |
| `save-device-setting`         | Persist local settings          |
| `parse-natural-language-note` | AI: text → structured event     |
| `generate-ai-overview`        | AI: daily briefing generation   |
| `flash-window`                | Flash taskbar (timer alerts)    |
| `get-github-username`         | GitHub integration              |
| `get-creator-stats`           | Fortnite API stats              |

---

## Recent Feature Updates (V5.2+)

### Board/Whiteboard Enhancements

The Board feature has undergone significant improvements to provide a comprehensive digital whiteboard experience:

#### Sticky Notes System
- **Multiple Note Types**: Standard notes, lined notes, and calculator notes
- **Customizable Styles**: 
  - Background colors (yellow, blue, green, pink, white)
  - Text colors and font families
  - Lined backgrounds with proper spacing
- **Interactive Features**:
  - Drag and drop with smooth animations
  - Resizable notes with preserved aspect ratios
  - Context menus for note management (edit, duplicate, delete)
  - Auto-centering and zoom controls

#### Board Management
- **Multiple Boards**: Create, rename, and delete separate boards
- **Per-Board Settings**: Each board saves its own font family and background style
- **Board Backgrounds**: 
  - Grid patterns
  - Dotted patterns
  - Solid colors
  - Dark mode compatible rendering
- **Board Sidebar**: Quick navigation between boards with sorting options
- **Board Preview**: Screenshot previews on dashboard with high-quality rendering

#### Calculator Notes
- Functional calculator embedded in sticky notes
- Standard arithmetic operations
- Persistent results on the note

### Dashboard Enhancements

The Dashboard has received several UX and layout improvements:

#### Grid Layout System
- **Row Height Resizing**: Dynamically adjust widget container heights
- **Widget Combining**: Merge adjacent widgets in the same row
- **Responsive Design**: Maintains layout across different screen sizes

#### Board Preview Widget
- **Live Preview**: Display a screenshot of the currently active board
- **Auto-Centering**: Automatically centers and zooms to show all notes
- **Quick Navigation**: Click to navigate directly to the Board page
- **High-Quality Rendering**: Improved screenshot quality and zoom levels

#### Widget Improvements
- **Consistent Header Styles**: Unified design across all dashboard containers
- **Time Format Toggle**: Switch between 12H and 24H time formats globally
- **Improved Event Display**: Click events to edit them directly
- **Chart Range Persistence**: Task Trends chart remembers selected time range

### Timer Feature

A new dedicated Timer page and context system:

- **Quick Timer Modal** (`Ctrl+Enter`): Fast access to preset timers
- **Timer History**: Track all completed timer sessions
- **Alert System**: Flash window and show overlay when timer completes
- **Mini Indicator**: Shows active timer status in sidebar
- **Stopwatch Mode**: Alternative to countdown timers

### Recurring Events

Enhanced recurring event management:

- **Recurring Options**: Daily, weekly, fortnightly, monthly recurrence
- **Series Grouping**: Recurring events grouped by series in Dashboard
- **Completion Tracking**: Shows completion status (e.g., "1/3 completed")
- **Smart Deletion**: Option to delete entire series or single instances
- **Recurring Icon**: Visual indicator for recurring event cards

### Custom Widgets

- **Custom Page Support**: Add user-defined pages to sidebar
- **Sidebar Reordering**: Drag and drop to reorganize navigation items
- **Feature Toggles**: Enable/disable features from settings

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

| Data Type       | Location                                              |
| --------------- | ----------------------------------------------------- |
| Calendar data   | `OneDrive/CalendarPlus/` or `Documents/CalendarPlus/` |
| Global settings | Same folder as calendar data                          |
| Device settings | `%APPDATA%/calendar-plus/device-settings.json`        |
| Timer history   | `localStorage` key: `timer-history`                   |
| Feature toggles | `localStorage` key: `feature-toggles`                 |
| Sidebar order   | `localStorage` key: `sidebar-order`                   |

---

## Keyboard Shortcuts

| Shortcut        | Action                  |
| --------------- | ----------------------- |
| `Ctrl+M`        | Open AI Quick Add modal |
| `Ctrl+Enter`    | Open Quick Timer modal  |
| `Ctrl+,`        | Open Settings           |
| `Space` (Timer) | Start/Pause timer       |
| `Esc` (Timer)   | Stop/Reset timer        |

---

_Last updated: December 27, 2025 (v5.2.3)_
