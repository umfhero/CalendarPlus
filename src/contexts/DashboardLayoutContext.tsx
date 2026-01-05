import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DashboardLayoutType = 'default' | 'focus-centric' | 'timeline-flow' | 'calendar-centric';
export type FontStyle = 'default' | 'playfair';

interface DashboardLayoutContextType {
    layoutType: DashboardLayoutType;
    setLayoutType: (type: DashboardLayoutType) => void;
    sidebarIconOnly: boolean;
    setSidebarIconOnly: (value: boolean) => void;
    // Computed: whether sidebar should show icon-only (either global setting or layout forces it)
    effectiveSidebarIconOnly: boolean;
    // Font preference for focus-centric
    focusCentricFont: FontStyle;
    setFocusCentricFont: (font: FontStyle) => void;
}

const DashboardLayoutContext = createContext<DashboardLayoutContextType | undefined>(undefined);

// Layouts that force icon-only sidebar
const ICON_ONLY_LAYOUTS: DashboardLayoutType[] = ['focus-centric'];

export function DashboardLayoutProvider({ children }: { children: ReactNode }) {
    const [layoutType, setLayoutTypeState] = useState<DashboardLayoutType>(() => {
        const saved = localStorage.getItem('dashboard_layout_type');
        return (saved as DashboardLayoutType) || 'default';
    });

    const [sidebarIconOnly, setSidebarIconOnlyState] = useState<boolean>(() => {
        const saved = localStorage.getItem('sidebar_icon_only');
        return saved === 'true';
    });

    const [focusCentricFont, setFocusCentricFontState] = useState<FontStyle>(() => {
        const saved = localStorage.getItem('focus_centric_font');
        return (saved as FontStyle) || 'playfair'; // Default to Playfair for focus-centric
    });

    // Computed: icon-only is true if global setting is on OR if current layout forces it
    const effectiveSidebarIconOnly = sidebarIconOnly || ICON_ONLY_LAYOUTS.includes(layoutType);

    const setLayoutType = (type: DashboardLayoutType) => {
        setLayoutTypeState(type);
        localStorage.setItem('dashboard_layout_type', type);
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('dashboard-layout-changed', { detail: { layoutType: type } }));
    };

    const setSidebarIconOnly = (value: boolean) => {
        setSidebarIconOnlyState(value);
        localStorage.setItem('sidebar_icon_only', value.toString());
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('sidebar-icon-only-changed', { detail: { iconOnly: value } }));
    };

    const setFocusCentricFont = (font: FontStyle) => {
        setFocusCentricFontState(font);
        localStorage.setItem('focus_centric_font', font);
    };

    // Listen for external changes (e.g., from Settings)
    useEffect(() => {
        const handleLayoutChange = (event: CustomEvent) => {
            setLayoutTypeState(event.detail.layoutType);
        };
        const handleIconOnlyChange = (event: CustomEvent) => {
            setSidebarIconOnlyState(event.detail.iconOnly);
        };

        window.addEventListener('dashboard-layout-changed', handleLayoutChange as EventListener);
        window.addEventListener('sidebar-icon-only-changed', handleIconOnlyChange as EventListener);

        return () => {
            window.removeEventListener('dashboard-layout-changed', handleLayoutChange as EventListener);
            window.removeEventListener('sidebar-icon-only-changed', handleIconOnlyChange as EventListener);
        };
    }, []);

    return (
        <DashboardLayoutContext.Provider value={{
            layoutType,
            setLayoutType,
            sidebarIconOnly,
            setSidebarIconOnly,
            effectiveSidebarIconOnly,
            focusCentricFont,
            setFocusCentricFont
        }}>
            {children}
        </DashboardLayoutContext.Provider>
    );
}

export function useDashboardLayout() {
    const context = useContext(DashboardLayoutContext);
    if (!context) {
        throw new Error('useDashboardLayout must be used within DashboardLayoutProvider');
    }
    return context;
}
