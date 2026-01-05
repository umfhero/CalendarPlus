import { DashboardLayoutType } from '../contexts/DashboardLayoutContext';

// Row configuration for each layout
export type DashboardRow = {
    id: string;
    widgets: string[]; // 1-2 widget IDs
    widthRatio?: number; // For 2-widget rows: left widget width percentage (0-100)
    height?: number; // Optional height
};

export interface LayoutConfig {
    id: DashboardLayoutType;
    name: string;
    description: string;
    rows: DashboardRow[];
    isEditable: boolean; // Only 'default' is editable
    forceIconOnlySidebar: boolean;
}

// Default layout - editable by user
export const DEFAULT_LAYOUT: LayoutConfig = {
    id: 'default',
    name: 'Classic Dashboard',
    description: 'Fully customizable widget-based layout',
    isEditable: true,
    forceIconOnlySidebar: false,
    rows: [
        { id: 'row-1', widgets: ['briefing'] },
        { id: 'row-2', widgets: ['main_content'] },
        { id: 'row-3', widgets: ['board'] },
        { id: 'row-4', widgets: ['github'] }
    ]
};

// Focus-Centric Minimalist Layout - based on reference image
// Clean, greeting-focused with minimal distractions
export const FOCUS_CENTRIC_LAYOUT: LayoutConfig = {
    id: 'focus-centric',
    name: 'Focus Centric',
    description: 'Minimalist view with greeting and priority tasks',
    isEditable: false,
    forceIconOnlySidebar: true,
    rows: [
        { id: 'focus-greeting', widgets: ['focus_greeting'] },
        { id: 'focus-tasks', widgets: ['focus_tasks'] }
    ]
};

// Timeline & Flow Layout - based on reference image  
// Vertical timeline on left, briefing + stats on right
export const TIMELINE_FLOW_LAYOUT: LayoutConfig = {
    id: 'timeline-flow',
    name: 'Timeline & Flow',
    description: 'Timeline view with progress tracking',
    isEditable: false,
    forceIconOnlySidebar: false,
    rows: [
        { id: 'timeline-main', widgets: ['timeline_view', 'briefing_stats'], widthRatio: 60 }
    ]
};

// Calendar-Centric Layout - based on reference image
// Large calendar on left, briefing + stats on right
export const CALENDAR_CENTRIC_LAYOUT: LayoutConfig = {
    id: 'calendar-centric',
    name: 'Calendar Centric',
    description: 'Calendar-focused with quick stats',
    isEditable: false,
    forceIconOnlySidebar: false,
    rows: [
        { id: 'calendar-main', widgets: ['calendar_view', 'briefing_stats'], widthRatio: 65 }
    ]
};

// All layout configs
export const LAYOUT_CONFIGS: Record<DashboardLayoutType, LayoutConfig> = {
    'default': DEFAULT_LAYOUT,
    'focus-centric': FOCUS_CENTRIC_LAYOUT,
    'timeline-flow': TIMELINE_FLOW_LAYOUT,
    'calendar-centric': CALENDAR_CENTRIC_LAYOUT
};

// Get layout config by type
export function getLayoutConfig(type: DashboardLayoutType): LayoutConfig {
    return LAYOUT_CONFIGS[type] || DEFAULT_LAYOUT;
}

// Get all layout types for selection UI
export function getAllLayoutTypes(): DashboardLayoutType[] {
    return ['default', 'focus-centric', 'timeline-flow', 'calendar-centric'];
}

// Layout metadata for UI display
export const LAYOUT_METADATA: Record<DashboardLayoutType, { icon: string; color: string }> = {
    'default': { icon: 'LayoutDashboard', color: '#3b82f6' },
    'focus-centric': { icon: 'Target', color: '#22c55e' },
    'timeline-flow': { icon: 'GitBranch', color: '#8b5cf6' },
    'calendar-centric': { icon: 'Calendar', color: '#f97316' }
};
