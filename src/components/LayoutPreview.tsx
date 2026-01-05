import { DashboardLayoutType } from '../contexts/DashboardLayoutContext';

interface LayoutPreviewProps {
    layoutType: DashboardLayoutType;
    isSelected?: boolean;
    isDark?: boolean;
    accentColor?: string;
}

/**
 * Mini visual mockup preview of each dashboard layout
 * Used in Settings and SetupWizard for layout selection
 */
export function LayoutPreview({ layoutType, isSelected = false, isDark = false, accentColor = '#3b82f6' }: LayoutPreviewProps) {
    const bg = isDark ? '#1f2937' : '#ffffff';
    const textMain = isDark ? '#f3f4f6' : '#111827';
    const textMuted = isDark ? '#6b7280' : '#9ca3af';
    const border = isDark ? '#374151' : '#e5e7eb';
    const sidebarBg = isDark ? '#111827' : '#f9fafb';
    const cardBg = isDark ? '#374151' : '#f3f4f6';

    const renderLayout = () => {
        switch (layoutType) {
            case 'default':
                return <DefaultLayoutPreview bg={bg} sidebarBg={sidebarBg} textMain={textMain} textMuted={textMuted} border={border} accent={accentColor} cardBg={cardBg} />;
            case 'focus-centric':
                return <FocusCentricPreview bg={bg} textMain={textMain} textMuted={textMuted} border={border} accent={accentColor} cardBg={cardBg} />;
            case 'timeline-flow':
                return <TimelineFlowPreview bg={bg} sidebarBg={sidebarBg} textMain={textMain} textMuted={textMuted} border={border} accent={accentColor} cardBg={cardBg} />;
            case 'calendar-centric':
                return <CalendarCentricPreview bg={bg} sidebarBg={sidebarBg} textMain={textMain} textMuted={textMuted} border={border} accent={accentColor} cardBg={cardBg} />;
            default:
                return <DefaultLayoutPreview bg={bg} sidebarBg={sidebarBg} textMain={textMain} textMuted={textMuted} border={border} accent={accentColor} cardBg={cardBg} />;
        }
    };

    return (
        <div 
            className="w-full h-full min-h-[120px] rounded-xl overflow-hidden border shadow-sm transition-all"
            style={{ 
                backgroundColor: bg, 
                borderColor: isSelected ? accentColor : border,
                borderWidth: isSelected ? '2px' : '1px'
            }}
        >
            {renderLayout()}
        </div>
    );
}

// Props type for sub-previews
interface PreviewProps {
    bg?: string;
    sidebarBg?: string;
    textMain?: string;
    textMuted: string;
    border: string;
    accent: string;
    cardBg: string;
}

// Default Layout: Sidebar + stacked widgets
function DefaultLayoutPreview({ sidebarBg, textMuted, border, accent, cardBg }: PreviewProps) {
    return (
        <div className="w-full h-full flex">
            {/* Sidebar */}
            <div className="w-[50px] h-full border-r p-2 flex flex-col gap-2" style={{ backgroundColor: sidebarBg, borderColor: border }}>
                <div className="w-4 h-4 rounded-full mb-2" style={{ backgroundColor: accent }} />
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-1.5 w-8 rounded-full opacity-40" style={{ backgroundColor: textMuted }} />
                ))}
            </div>
            {/* Content - stacked widgets */}
            <div className="flex-1 p-2 flex flex-col gap-1.5">
                <div className="h-8 rounded-lg" style={{ backgroundColor: cardBg }} />
                <div className="flex-1 rounded-lg" style={{ backgroundColor: cardBg }} />
                <div className="h-6 rounded-lg" style={{ backgroundColor: cardBg }} />
            </div>
        </div>
    );
}

// Focus Centric: Icon sidebar + centered greeting + task list
function FocusCentricPreview({ bg, textMain, textMuted, border, accent, cardBg }: PreviewProps) {
    return (
        <div className="w-full h-full flex">
            {/* Icon-only sidebar */}
            <div className="w-[30px] h-full border-r p-1.5 flex flex-col items-center gap-2" style={{ backgroundColor: bg, borderColor: border }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-3 h-3 rounded opacity-30" style={{ backgroundColor: textMuted }} />
                ))}
            </div>
            {/* Centered content */}
            <div className="flex-1 p-3 flex flex-col items-center justify-center">
                {/* Greeting */}
                <div className="h-3 w-24 rounded-full mb-1" style={{ backgroundColor: textMain, opacity: 0.8 }} />
                <div className="h-2 w-32 rounded-full mb-3 opacity-50" style={{ backgroundColor: textMuted }} />
                {/* Task cards */}
                <div className="w-full max-w-[100px] space-y-1.5">
                    <div className="h-5 rounded-lg border" style={{ backgroundColor: cardBg, borderColor: border }} />
                    <div className="h-5 rounded-lg border" style={{ backgroundColor: cardBg, borderColor: border }} />
                </div>
            </div>
        </div>
    );
}

// Timeline Flow: Sidebar + timeline on left + briefing/stats on right
function TimelineFlowPreview({ sidebarBg, textMuted, border, accent, cardBg }: PreviewProps) {
    return (
        <div className="w-full h-full flex">
            {/* Sidebar */}
            <div className="w-[40px] h-full border-r p-1.5 flex flex-col gap-1.5" style={{ backgroundColor: sidebarBg, borderColor: border }}>
                <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: accent }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-1 w-6 rounded-full opacity-40" style={{ backgroundColor: textMuted }} />
                ))}
            </div>
            {/* Main content */}
            <div className="flex-1 flex p-2 gap-2">
                {/* Timeline column */}
                <div className="w-[45%] flex flex-col items-start gap-2">
                    {/* Progress bar */}
                    <div className="flex gap-2 text-[6px] mb-1 w-full">
                        <span style={{ color: accent }}>60%</span>
                        <span style={{ color: textMuted }}>40%</span>
                    </div>
                    {/* Timeline items */}
                    <div className="relative pl-2 flex-1 w-full">
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded" style={{ backgroundColor: accent, opacity: 0.3 }} />
                        <div className="space-y-2">
                            {[1, 2].map(i => (
                                <div key={i} className="flex items-start gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full mt-0.5 -ml-[5px]" style={{ backgroundColor: accent }} />
                                    <div className="flex-1">
                                        <div className="h-4 rounded" style={{ backgroundColor: cardBg }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Right column - briefing + stats */}
                <div className="w-[55%] flex flex-col gap-1.5">
                    <div className="flex-1 rounded-lg p-1" style={{ backgroundColor: cardBg }}>
                        <div className="h-1 w-8 rounded-full mb-1" style={{ backgroundColor: accent, opacity: 0.5 }} />
                        <div className="h-1 w-full rounded-full opacity-30" style={{ backgroundColor: textMuted }} />
                    </div>
                    <div className="h-8 rounded-lg p-1" style={{ backgroundColor: cardBg }}>
                        <div className="h-full flex items-center justify-center">
                            <div className="w-6 h-6 rounded" style={{ backgroundColor: accent, opacity: 0.2 }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Calendar Centric: Sidebar + large calendar + briefing/stats
function CalendarCentricPreview({ sidebarBg, textMuted, border, accent, cardBg }: PreviewProps) {
    return (
        <div className="w-full h-full flex">
            {/* Sidebar */}
            <div className="w-[40px] h-full border-r p-1.5 flex flex-col gap-1.5" style={{ backgroundColor: sidebarBg, borderColor: border }}>
                <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: accent }} />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-1 w-6 rounded-full opacity-40" style={{ backgroundColor: textMuted }} />
                ))}
            </div>
            {/* Main content */}
            <div className="flex-1 flex p-2 gap-2">
                {/* Calendar */}
                <div className="w-[60%] rounded-lg p-1.5" style={{ backgroundColor: cardBg }}>
                    {/* Month header */}
                    <div className="flex justify-between items-center mb-1">
                        <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: textMuted, opacity: 0.6 }} />
                        <div className="h-2 px-1 rounded text-[5px]" style={{ backgroundColor: accent, color: 'white' }}>Today</div>
                    </div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-0.5 mb-1">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} className="text-[4px] text-center opacity-50" style={{ color: textMuted }}>{d}</div>
                        ))}
                    </div>
                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 gap-0.5">
                        {Array.from({ length: 21 }).map((_, i) => (
                            <div
                                key={i}
                                className="aspect-square rounded-sm flex items-center justify-center text-[4px]"
                                style={{
                                    backgroundColor: i === 10 ? accent : 'transparent',
                                    color: i === 10 ? 'white' : textMuted,
                                    opacity: i === 10 ? 1 : 0.5
                                }}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
                {/* Right column - briefing + stats */}
                <div className="w-[40%] flex flex-col gap-1.5">
                    <div className="flex-1 rounded-lg p-1" style={{ backgroundColor: cardBg }}>
                        <div className="h-1 w-6 rounded-full mb-1" style={{ backgroundColor: accent, opacity: 0.5 }} />
                        <div className="space-y-0.5">
                            <div className="h-1 w-full rounded-full opacity-30" style={{ backgroundColor: textMuted }} />
                            <div className="h-1 w-4/5 rounded-full opacity-30" style={{ backgroundColor: textMuted }} />
                        </div>
                    </div>
                    <div className="h-10 rounded-lg p-1 flex flex-col" style={{ backgroundColor: cardBg }}>
                        <div className="text-[5px] mb-0.5" style={{ color: textMuted }}>Task trends</div>
                        <div className="flex-1 flex items-end gap-0.5">
                            {[40, 60, 30, 80, 50, 70, 100].map((h, i) => (
                                <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: accent, opacity: 0.4 + (i * 0.08) }} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LayoutPreview;
