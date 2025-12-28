import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, StopCircle, RotateCcw, Clock, Timer as TimerIcon, History, Trash2, Plus, Minus, ChevronDown, ChevronUp, BarChart2, Info } from 'lucide-react';
import { useTimer, formatTime, formatTimeVerbose } from '../contexts/TimerContext';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface QuickTimerPreset {
    label: string;
    seconds: number;
}

const quickPresets: QuickTimerPreset[] = [
    { label: '1m', seconds: 60 },
    { label: '5m', seconds: 300 },
    { label: '10m', seconds: 600 },
    { label: '15m', seconds: 900 },
    { label: '25m', seconds: 1500 },
    { label: '30m', seconds: 1800 },
    { label: '45m', seconds: 2700 },
    { label: '1h', seconds: 3600 },
];

type TabType = 'timer' | 'stopwatch';

export function TimerPage({ isSidebarCollapsed: _isSidebarCollapsed = false }: { isSidebarCollapsed?: boolean }) {
    const { activeTimer, history, startTimer, startStopwatch, pauseTimer, resumeTimer, stopTimer, clearHistory, deleteHistoryItem } = useTimer();
    const { accentColor } = useTheme();

    const [activeTab, setActiveTab] = useState<TabType>('timer');
    const [customMinutes, setCustomMinutes] = useState(5);
    const [customSeconds, setCustomSeconds] = useState(0);
    const [customLabel, setCustomLabel] = useState('');
    const [isCompactMode, setIsCompactMode] = useState(false);
    const [showStats, setShowStats] = useState(true);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive detection
    useEffect(() => {
        const checkSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.offsetWidth;
                setIsCompactMode(width < 480);
            }
        };

        checkSize();
        // ... (rest of observer logic)
        const observer = new ResizeObserver(checkSize);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // Focus management
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Space to start/pause
            if (e.code === 'Space' && !e.target?.toString().includes('Input')) {
                e.preventDefault();
                if (activeTimer) {
                    activeTimer.isRunning ? pauseTimer() : resumeTimer();
                } else if (activeTab === 'timer') {
                    handleStartTimer();
                } else {
                    startStopwatch(customLabel || undefined);
                }
            }
            // Escape to stop
            if (e.code === 'Escape' && activeTimer) {
                stopTimer();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeTimer, activeTab, customMinutes, customSeconds, customLabel]);

    const handleStartTimer = () => {
        const totalSeconds = customMinutes * 60 + customSeconds;
        if (totalSeconds > 0) {
            startTimer(totalSeconds, customLabel || undefined);
        }
    };

    const handleQuickStart = (preset: QuickTimerPreset) => {
        startTimer(preset.seconds, preset.label);
    };

    const adjustTime = (type: 'minutes' | 'seconds', delta: number) => {
        if (type === 'minutes') {
            setCustomMinutes(Math.max(0, Math.min(99, customMinutes + delta)));
        } else {
            setCustomSeconds(Math.max(0, Math.min(59, customSeconds + delta)));
        }
    };

    // Calculate progress for circular indicator
    const progress = activeTimer?.type === 'timer' && activeTimer.duration > 0
        ? ((activeTimer.duration - activeTimer.remaining) / activeTimer.duration) * 100
        : 0;

    // Calculate stats - memoized to prevent re-renders on timer tick
    const statsData = useMemo(() => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todaysTimers = history.filter(h => new Date(h.completedAt) >= todayStart);
        const totalTodaySeconds = todaysTimers.reduce((acc, h) => acc + h.duration, 0);
        const timerCount = history.filter(h => h.type === 'timer').length;
        const stopwatchCount = history.filter(h => h.type === 'stopwatch').length;
        return { todaysTimers, totalTodaySeconds, timerCount, stopwatchCount };
    }, [history]); // Only recalculate when history changes, not on every tick

    const { todaysTimers, totalTodaySeconds, timerCount, stopwatchCount } = statsData;

    // Memoize Quick Stats Sidebar to prevent flickering on timer tick
    const QuickStatsSidebar = useMemo(() => (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={clsx(
                "flex flex-col gap-3",
                isCompactMode ? "w-full" : "w-64 shrink-0"
            )}
        >
            {/* Collapsible Header for compact mode */}
            {isCompactMode && (
                <button
                    onClick={() => setShowStats(!showStats)}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex items-center gap-2">
                        <BarChart2 className="w-4 h-4" style={{ color: accentColor }} />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Quick Stats</span>
                    </div>
                    {showStats ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
            )}

            <AnimatePresence>
                {(showStats || !isCompactMode) && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className={clsx(
                            "flex gap-3 overflow-hidden",
                            isCompactMode ? "flex-row flex-wrap" : "flex-col"
                        )}
                    >
                        {/* Today's Focus Time */}
                        <div className={clsx(
                            "p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm",
                            isCompactMode ? "flex-1 min-w-[140px]" : ""
                        )}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }}></div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Today's Focus</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-800 dark:text-white">
                                {formatTimeVerbose(totalTodaySeconds)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{todaysTimers.length} sessions</p>
                        </div>

                        {/* Timer vs Stopwatch Stats */}
                        <div className={clsx(
                            "p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm",
                            isCompactMode ? "flex-1 min-w-[140px]" : ""
                        )}>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-4 rounded-full" style={{ backgroundColor: accentColor }}></div>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Session Types</span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Timers</span>
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-white">{timerCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <span className="text-sm text-gray-600 dark:text-gray-300">Stopwatches</span>
                                    </div>
                                    <span className="font-bold text-gray-800 dark:text-white">{stopwatchCount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Info */}
                        <div className={clsx(
                            "p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm",
                            isCompactMode ? "flex-1 min-w-[140px]" : ""
                        )}>
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4" style={{ color: accentColor }} />
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Quick Tips</span>
                            </div>
                            <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                                <li>• <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono text-[10px]">Space</kbd> Start/Pause</li>
                                <li>• <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700 font-mono text-[10px]">Esc</kbd> Stop timer</li>
                            </ul>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    ), [isCompactMode, showStats, setShowStats, accentColor, totalTodaySeconds, todaysTimers, timerCount, stopwatchCount]);

    return (
        <div ref={containerRef} className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-4 md:p-6 lg:p-10 h-full flex flex-col justify-center w-full">

                <div className={clsx(
                    "flex gap-6 items-start h-full",
                    isCompactMode ? "flex-col" : "flex-row"
                )}>

                    {/* Left Column: Quick Presets (Vertical) */}
                    {!isCompactMode && !activeTimer && activeTab === 'timer' && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col gap-3 py-10 h-full justify-center"
                        >
                            {quickPresets.map((preset) => (
                                <motion.button
                                    key={preset.label}
                                    whileHover={{
                                        scale: 1.1,
                                        backgroundColor: accentColor,
                                        color: '#ffffff',
                                        borderColor: accentColor
                                    }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleQuickStart(preset)}
                                    className="w-16 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors flex items-center justify-center font-medium text-gray-600 dark:text-gray-300 text-sm"
                                >
                                    {preset.label}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}

                    {/* Main Timer Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1 min-w-0 flex flex-col h-full relative"
                    >
                        {/* Label Input (Moved from bottom) */}
                        {!activeTimer && (
                            <div className="relative w-full flex justify-center pt-8 pb-4 shrink-0 z-20">
                                <div className="relative w-full max-w-sm">
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={customLabel}
                                        onChange={(e) => setCustomLabel(e.target.value)}
                                        placeholder="What are you working on?"
                                        className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-center text-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-gray-400"
                                    />
                                    {customLabel && (
                                        <button
                                            onClick={() => setCustomLabel('')}
                                            className="absolute right-4 top-1/2 translate-y-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Timer Display */}
                        <div className="flex-1 flex items-center justify-center min-h-0 w-full">
                            {/* Circular Progress Ring */}
                            <div
                                className={clsx(
                                    "relative w-full max-w-[50vh] aspect-square flex items-center justify-center",
                                    isCompactMode ? "max-w-[300px]" : ""
                                )}
                                style={{ containerType: 'inline-size' }}
                            >
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-xl" viewBox="0 0 400 400">
                                    <circle
                                        cx="200"
                                        cy="200"
                                        r="180"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="16"
                                        className="text-gray-200 dark:text-gray-800"
                                    />
                                    {activeTimer && (
                                        <motion.circle
                                            cx="200"
                                            cy="200"
                                            r="180"
                                            fill="none"
                                            stroke={accentColor}
                                            strokeWidth="16"
                                            strokeLinecap="round"
                                            strokeDasharray={2 * Math.PI * 180}
                                            strokeDashoffset={activeTimer.type === 'timer'
                                                ? (2 * Math.PI * 180) - (progress / 100) * (2 * Math.PI * 180)
                                                : 0
                                            }
                                            initial={{ strokeDashoffset: 2 * Math.PI * 180 }}
                                            animate={{
                                                strokeDashoffset: activeTimer.type === 'timer'
                                                    ? (2 * Math.PI * 180) - (progress / 100) * (2 * Math.PI * 180)
                                                    : 0
                                            }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    )}
                                </svg>

                                {/* Time Display Center */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <div className="pointer-events-auto flex flex-col items-center">
                                        {activeTimer ? (
                                            <>
                                                <motion.span
                                                    key={activeTimer.remaining}
                                                    initial={{ scale: 1.05, opacity: 0.8 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="font-mono font-bold text-gray-900 dark:text-white tracking-tight tabular-nums block text-center leading-none text-[22cqw]"
                                                >
                                                    {formatTime(activeTimer.remaining)}
                                                </motion.span>
                                                <span className="font-medium text-gray-400 uppercase tracking-widest block text-center mt-[4cqw] text-[3.5cqw]">
                                                    {activeTimer.isRunning ? 'Focusing' : 'Paused'}
                                                </span>
                                                {activeTimer.label && (
                                                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 max-w-[60cqw] truncate border border-gray-200 dark:border-gray-700 mx-auto mt-[4cqw] text-[3cqw] px-[3cqw] py-[0.5cqw]">
                                                        {activeTimer.label}
                                                    </div>
                                                )}
                                            </>
                                        ) : activeTab === 'timer' ? (
                                            <div className="flex items-center gap-[2cqw]">
                                                {/* Minutes Input */}
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="number"
                                                            value={customMinutes}
                                                            onChange={(e) => setCustomMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                                                            className="text-center font-mono font-bold text-gray-900 dark:text-white bg-transparent outline-none p-0 w-[32cqw] leading-none text-[22cqw]"
                                                            placeholder="00"
                                                        />
                                                    </div>
                                                    <span className="uppercase font-bold text-gray-400 mt-[2cqw] text-[3cqw]">Min</span>
                                                </div>

                                                <span className="font-mono font-bold text-gray-300 dark:text-gray-700 pb-[8cqw] leading-none text-[20cqw]">:</span>

                                                {/* Seconds Input */}
                                                <div className="flex flex-col items-center">
                                                    <div className="flex items-center justify-center">
                                                        <input
                                                            type="number"
                                                            value={customSeconds.toString().padStart(2, '0')}
                                                            onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                                            className="text-center font-mono font-bold text-gray-900 dark:text-white bg-transparent outline-none p-0 w-[32cqw] leading-none text-[22cqw]"
                                                            placeholder="00"
                                                        />
                                                    </div>
                                                    <span className="uppercase font-bold text-gray-400 mt-[2cqw] text-[3cqw]">Sec</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="font-mono font-bold text-gray-300 dark:text-gray-600 tabular-nums tracking-tighter block text-center leading-none text-[22cqw]">
                                                0:00
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Controls for Manual Adjust (Only on Hover & Not Running) */}
                                {!activeTimer && activeTab === 'timer' && !isCompactMode && (
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-[2cqw] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-full">
                                        <div className="pointer-events-auto flex flex-col gap-[2cqw] -translate-x-2">
                                            <button onClick={() => adjustTime('minutes', 1)} className="p-[2cqw] rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-500 hover:text-blue-500 hover:scale-110 transition-all border border-gray-100 dark:border-gray-700">
                                                <Plus className="w-[4cqw] h-[4cqw]" />
                                            </button>
                                            <button onClick={() => adjustTime('minutes', -1)} className="p-[2cqw] rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-500 hover:text-red-500 hover:scale-110 transition-all border border-gray-100 dark:border-gray-700">
                                                <Minus className="w-[4cqw] h-[4cqw]" />
                                            </button>
                                        </div>
                                        <div className="pointer-events-auto flex flex-col gap-[2cqw] translate-x-2">
                                            <button onClick={() => adjustTime('seconds', 10)} className="p-[2cqw] rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-500 hover:text-blue-500 hover:scale-110 transition-all border border-gray-100 dark:border-gray-700">
                                                <Plus className="w-[4cqw] h-[4cqw]" />
                                            </button>
                                            <button onClick={() => adjustTime('seconds', -10)} className="p-[2cqw] rounded-full bg-white dark:bg-gray-800 shadow-lg text-gray-500 hover:text-red-500 hover:scale-110 transition-all border border-gray-100 dark:border-gray-700">
                                                <Minus className="w-[4cqw] h-[4cqw]" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom Controls - Sticks to bottom */}
                        <div className="shrink-0 w-full flex flex-col items-center justify-end z-10">
                            {/* Small Toggle Switch */}
                            {!activeTimer && (
                                <div className="flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-lg mb-6">
                                    <button
                                        onClick={() => setActiveTab('timer')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                            activeTab === 'timer'
                                                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        Timer
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('stopwatch')}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                                            activeTab === 'stopwatch'
                                                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                                                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                        )}
                                    >
                                        Stopwatch
                                    </button>
                                </div>
                            )}

                            {/* Control Buttons */}
                            <div className="flex items-center gap-4">
                                {activeTimer ? (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={activeTimer.isRunning ? pauseTimer : resumeTimer}
                                            className="h-20 w-20 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            {activeTimer.isRunning ? (
                                                <Pause className="w-10 h-10 fill-current" />
                                            ) : (
                                                <Play className="w-10 h-10 fill-current ml-1" />
                                            )}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={stopTimer}
                                            className="h-20 w-20 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 shadow-lg hover:scale-105 active:scale-95 transition-all"
                                        >
                                            <StopCircle className="w-8 h-8 fill-current" />
                                        </motion.button>
                                    </>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            if (activeTab === 'timer') {
                                                handleStartTimer();
                                            } else {
                                                startStopwatch(customLabel || undefined);
                                            }
                                        }}
                                        className="h-16 w-48 rounded-2xl flex items-center justify-center gap-3 text-white font-bold text-xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <Play className="w-7 h-7 fill-current" />
                                        Start
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Sidebar Column: Quick Stats + History */}
                    <div className={clsx(
                        "flex flex-col gap-3",
                        isCompactMode ? "w-full" : "w-64 shrink-0 h-full overflow-hidden"
                    )}>
                        {/* Quick Stats Sidebar */}
                        {QuickStatsSidebar}

                        {/* History Panel */}
                        <div className="p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm flex-1 min-h-0 flex flex-col">
                            <div className="flex items-center justify-between mb-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <History className="w-4 h-4" style={{ color: accentColor }} />
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">History</span>
                                </div>
                                {history.length > 0 && (
                                    <button
                                        onClick={clearHistory}
                                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="text-center py-4">
                                    <Clock className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                                    <p className="text-xs text-gray-400">No history yet</p>
                                </div>
                            ) : (
                                <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
                                    {history.map((item, index) => (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className="p-2 rounded-lg shrink-0"
                                                    style={{
                                                        backgroundColor: item.type === 'timer'
                                                            ? 'rgba(16, 185, 129, 0.15)'
                                                            : 'rgba(59, 130, 246, 0.15)',
                                                        color: item.type === 'timer'
                                                            ? '#10b981'
                                                            : '#3b82f6'
                                                    }}
                                                >
                                                    {item.type === 'timer' ? <TimerIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                                                        {formatTimeVerbose(item.duration)}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                                        {item.label || new Date(item.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <button
                                                    onClick={() => startTimer(item.duration, item.label)}
                                                    className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                                </button>
                                                <button
                                                    onClick={() => deleteHistoryItem(item.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default TimerPage;
