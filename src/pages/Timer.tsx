import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, StopCircle, RotateCcw, Clock, Timer as TimerIcon, History, Trash2, Plus, Minus } from 'lucide-react';
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
    const [showHistory, setShowHistory] = useState(false);
    
    const inputRef = useRef<HTMLInputElement>(null);

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

    const circumference = 2 * Math.PI * 140; // radius = 140

    return (
        <div className="h-full overflow-y-auto custom-scrollbar">
            <div className="p-6 md:p-10 max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Timer</h1>
                            <p className="text-gray-500 dark:text-gray-400">Stay focused and track your time</p>
                        </div>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={clsx(
                                "p-3 rounded-xl transition-colors",
                                showHistory
                                    ? "bg-gray-200 dark:bg-gray-700"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            )}
                        >
                            <History className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Timer Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1"
                    >
                        {/* Tab Switcher */}
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-8">
                            {(['timer', 'stopwatch'] as TabType[]).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={clsx(
                                        "flex-1 py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2",
                                        activeTab === tab
                                            ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                                            : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    )}
                                >
                                    {tab === 'timer' ? <TimerIcon className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                    {tab === 'timer' ? 'Timer' : 'Stopwatch'}
                                </button>
                            ))}
                        </div>

                        {/* Timer Display */}
                        <div className="flex flex-col items-center">
                            {/* Circular Progress Ring */}
                            <div className="relative w-72 h-72 md:w-80 md:h-80 mb-8">
                                <svg className="w-full h-full transform -rotate-90">
                                    {/* Background circle */}
                                    <circle
                                        cx="50%"
                                        cy="50%"
                                        r="140"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        className="text-gray-200 dark:text-gray-700"
                                    />
                                    {/* Progress circle */}
                                    {activeTimer && (
                                        <motion.circle
                                            cx="50%"
                                            cy="50%"
                                            r="140"
                                            fill="none"
                                            stroke={accentColor}
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={activeTimer.type === 'timer' 
                                                ? circumference - (progress / 100) * circumference
                                                : 0
                                            }
                                            initial={{ strokeDashoffset: circumference }}
                                            animate={{ 
                                                strokeDashoffset: activeTimer.type === 'timer' 
                                                    ? circumference - (progress / 100) * circumference
                                                    : 0
                                            }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    )}
                                </svg>

                                {/* Time Display */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {activeTimer ? (
                                        <>
                                            <motion.span
                                                key={activeTimer.remaining}
                                                initial={{ scale: 1.05, opacity: 0.8 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="text-5xl md:text-6xl font-mono font-bold text-gray-900 dark:text-white tracking-tight"
                                            >
                                                {formatTime(activeTimer.remaining)}
                                            </motion.span>
                                            {activeTimer.label && (
                                                <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                                    {activeTimer.label}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                                {activeTimer.isRunning ? 'Running' : 'Paused'}
                                            </span>
                                        </>
                                    ) : activeTab === 'timer' ? (
                                        <div className="flex items-center gap-2">
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => adjustTime('minutes', 1)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-5 h-5 text-gray-400" />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={customMinutes}
                                                    onChange={(e) => setCustomMinutes(Math.max(0, Math.min(99, parseInt(e.target.value) || 0)))}
                                                    className="w-20 text-center text-5xl font-mono font-bold text-gray-900 dark:text-white bg-transparent outline-none"
                                                    min="0"
                                                    max="99"
                                                />
                                                <button
                                                    onClick={() => adjustTime('minutes', -1)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Minus className="w-5 h-5 text-gray-400" />
                                                </button>
                                                <span className="text-xs text-gray-400 mt-1">minutes</span>
                                            </div>
                                            <span className="text-5xl font-mono font-bold text-gray-400 mb-8">:</span>
                                            <div className="flex flex-col items-center">
                                                <button
                                                    onClick={() => adjustTime('seconds', 5)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Plus className="w-5 h-5 text-gray-400" />
                                                </button>
                                                <input
                                                    type="number"
                                                    value={customSeconds.toString().padStart(2, '0')}
                                                    onChange={(e) => setCustomSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                                                    className="w-20 text-center text-5xl font-mono font-bold text-gray-900 dark:text-white bg-transparent outline-none"
                                                    min="0"
                                                    max="59"
                                                />
                                                <button
                                                    onClick={() => adjustTime('seconds', -5)}
                                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                >
                                                    <Minus className="w-5 h-5 text-gray-400" />
                                                </button>
                                                <span className="text-xs text-gray-400 mt-1">seconds</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-5xl md:text-6xl font-mono font-bold text-gray-900 dark:text-white">
                                            0:00
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Label Input */}
                            {!activeTimer && (
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={customLabel}
                                    onChange={(e) => setCustomLabel(e.target.value)}
                                    placeholder="Add a label (optional)"
                                    className="w-full max-w-xs mb-6 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-none outline-none text-center text-gray-700 dark:text-gray-200 placeholder-gray-400"
                                />
                            )}

                            {/* Control Buttons */}
                            <div className="flex items-center gap-4">
                                {activeTimer ? (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={activeTimer.isRunning ? pauseTimer : resumeTimer}
                                            className="p-4 rounded-2xl text-white shadow-lg transition-colors"
                                            style={{ backgroundColor: accentColor }}
                                        >
                                            {activeTimer.isRunning ? (
                                                <Pause className="w-8 h-8" />
                                            ) : (
                                                <Play className="w-8 h-8" />
                                            )}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={stopTimer}
                                            className="p-4 rounded-2xl bg-red-500 text-white shadow-lg"
                                        >
                                            <StopCircle className="w-8 h-8" />
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
                                        className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-lg flex items-center gap-2"
                                        style={{ backgroundColor: accentColor }}
                                    >
                                        <Play className="w-6 h-6" />
                                        Start
                                    </motion.button>
                                )}
                            </div>

                            <p className="text-xs text-gray-400 mt-4">
                                Press <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">Space</kbd> to start/pause, <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">Esc</kbd> to stop
                            </p>
                        </div>

                        {/* Quick Presets */}
                        {!activeTimer && activeTab === 'timer' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="mt-10"
                            >
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4 text-center">Quick Start</h3>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {quickPresets.map((preset) => (
                                        <motion.button
                                            key={preset.label}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleQuickStart(preset)}
                                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium transition-colors"
                                        >
                                            {preset.label}
                                        </motion.button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* History Panel */}
                    <AnimatePresence>
                        {showHistory && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="w-full lg:w-80"
                            >
                                <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-100">History</h3>
                                        {history.length > 0 && (
                                            <button
                                                onClick={clearHistory}
                                                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>

                                    {history.length === 0 ? (
                                        <div className="text-center py-8">
                                            <Clock className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                            <p className="text-sm text-gray-400">No timer history yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                                            {history.map((item, index) => (
                                                <motion.div
                                                    key={item.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="p-2 rounded-lg"
                                                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                                                        >
                                                            {item.type === 'timer' ? (
                                                                <TimerIcon className="w-4 h-4" />
                                                            ) : (
                                                                <Clock className="w-4 h-4" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800 dark:text-gray-100">
                                                                {formatTimeVerbose(item.duration)}
                                                            </p>
                                                            <p className="text-xs text-gray-400">
                                                                {item.label || item.type}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => startTimer(item.duration, item.label)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                                                            title="Start again"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                                                        </button>
                                                        <button
                                                            onClick={() => deleteHistoryItem(item.id)}
                                                            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Popular durations from history */}
                                    {history.length >= 3 && (
                                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                            <p className="text-xs text-gray-400 mb-2">Frequently used</p>
                                            <div className="flex flex-wrap gap-1">
                                                {Array.from(new Set(history.map(h => h.duration)))
                                                    .slice(0, 4)
                                                    .map((duration) => (
                                                        <button
                                                            key={duration}
                                                            onClick={() => startTimer(duration)}
                                                            className="px-2 py-1 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors"
                                                        >
                                                            {formatTimeVerbose(duration)}
                                                        </button>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

export default TimerPage;
