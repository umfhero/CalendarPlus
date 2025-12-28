import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Calendar, Sparkles, AlertCircle, ThumbsUp, ChevronDown, ChevronRight } from 'lucide-react';
import { NotesData } from '../types';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    LabelList
} from 'recharts';
import clsx from 'clsx';
import { format, startOfWeek, endOfWeek, parseISO, isThisWeek, getWeek, addWeeks, getMonth, getYear } from 'date-fns';

interface ProgressPageProps {
    notes: NotesData;
    isSidebarCollapsed?: boolean;
}

interface WeekData {
    weekNumber: number;
    weekLabel: string;
    dateRange: string;
    startDate: Date;
    endDate: Date;
    totalTasks: number;
    completedTasks: number;
    lateTasks: number;
    missedTasks: number;
    completionRate: number;
    score: number;
    isCurrentWeek: boolean;
    weekScore: number;
    isEmpty: boolean;
    month: number;
    year: number;
}

interface MonthGroup {
    month: number;
    year: number;
    monthName: string;
    weeks: WeekData[];
    totalTasks: number;
    completedTasks: number;
    avgRate: number;
}

export function ProgressPage({ notes, isSidebarCollapsed = false }: ProgressPageProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());

    const toggleMonth = (monthKey: string) => {
        setCollapsedMonths(prev => {
            const next = new Set(prev);
            if (next.has(monthKey)) {
                next.delete(monthKey);
            } else {
                next.add(monthKey);
            }
            return next;
        });
    };

    useEffect(() => {
        const checkMobile = () => {
            const sidebarWidth = isSidebarCollapsed ? 0 : 240;
            const availableWidth = window.innerWidth - sidebarWidth;
            setIsMobile(availableWidth < 900);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, [isSidebarCollapsed]);

    // Process notes into weekly data with continuous weeks
    const { weeklyData, monthlyGroups, currentWeek, previousWeeks, totalScore, streak, averageRate } = useMemo(() => {
        const now = new Date();
        const weekMap = new Map<string, WeekData>();

        // Process all notes
        Object.entries(notes).forEach(([dateStr, dayNotes]) => {
            const date = parseISO(dateStr);
            const weekStart = startOfWeek(date, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const weekNum = getWeek(date, { weekStartsOn: 1 });

            if (!weekMap.has(weekKey)) {
                const yearSuffix = String(getYear(weekStart)).slice(-2);
                weekMap.set(weekKey, {
                    weekNumber: weekNum,
                    weekLabel: `Week ${weekNum}'${yearSuffix}`,
                    dateRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
                    startDate: weekStart,
                    endDate: weekEnd,
                    totalTasks: 0,
                    completedTasks: 0,
                    lateTasks: 0,
                    missedTasks: 0,
                    completionRate: 0,
                    score: 0,
                    isCurrentWeek: isThisWeek(date, { weekStartsOn: 1 }),
                    weekScore: 0,
                    isEmpty: false,
                    month: getMonth(weekStart),
                    year: getYear(weekStart)
                });
            }

            const weekData = weekMap.get(weekKey)!;

            dayNotes.forEach(note => {
                const [hours, minutes] = note.time.split(':').map(Number);
                const taskDateTime = new Date(date);
                taskDateTime.setHours(hours, minutes, 0, 0);
                const isPast = taskDateTime.getTime() < now.getTime();

                // Count ALL tasks for the week (so future weeks with tasks show up)
                weekData.totalTasks++;

                // Check if explicitly marked as missed - this takes precedence
                if (note.missed) {
                    weekData.missedTasks++;
                    weekData.weekScore -= 1;
                } else if (note.completed) {
                    weekData.completedTasks++;
                    if (note.completedLate) {
                        weekData.lateTasks++;
                        weekData.weekScore += 0.5;
                    } else {
                        weekData.weekScore += 1;
                    }
                } else if (isPast && !note.completed) {
                    // Past and not completed and not explicitly missed - auto-missed
                    weekData.missedTasks++;
                    weekData.weekScore -= 1;
                }
                // Future uncompleted tasks don't affect score yet
            });
        });

        // Get weeks with tasks, sorted by date
        const weeksWithTasks = Array.from(weekMap.values())
            .filter(w => w.totalTasks > 0)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        if (weeksWithTasks.length === 0) {
            return {
                weeklyData: [],
                monthlyGroups: [],
                currentWeek: undefined,
                previousWeeks: [],
                totalScore: 0,
                streak: 0,
                averageRate: 0
            };
        }

        // Get first and last week with tasks (include future weeks too)
        const firstWeekWithTasks = weeksWithTasks[0].startDate;
        const lastWeekWithTasks = weeksWithTasks[weeksWithTasks.length - 1].startDate;
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

        // Show up to whichever is later: current week or last week with tasks
        const lastWeekToShow = lastWeekWithTasks > currentWeekStart ? lastWeekWithTasks : currentWeekStart;

        // Build continuous week array from first week to current/last week
        const allWeeks: WeekData[] = [];
        let currentWeekPointer = new Date(firstWeekWithTasks);

        while (currentWeekPointer <= lastWeekToShow) {
            const weekStart = startOfWeek(currentWeekPointer, { weekStartsOn: 1 });
            const weekEnd = endOfWeek(currentWeekPointer, { weekStartsOn: 1 });
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const weekNum = getWeek(currentWeekPointer, { weekStartsOn: 1 });

            const existingWeek = weekMap.get(weekKey);

            if (existingWeek && existingWeek.totalTasks > 0) {
                allWeeks.push({
                    ...existingWeek,
                    completionRate: existingWeek.totalTasks > 0
                        ? Math.round((existingWeek.completedTasks / existingWeek.totalTasks) * 100)
                        : 0
                });
            } else {
                // Empty week
                const yearSuffix = String(getYear(weekStart)).slice(-2);
                allWeeks.push({
                    weekNumber: weekNum,
                    weekLabel: `Week ${weekNum}'${yearSuffix}`,
                    dateRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`,
                    startDate: weekStart,
                    endDate: weekEnd,
                    totalTasks: 0,
                    completedTasks: 0,
                    lateTasks: 0,
                    missedTasks: 0,
                    completionRate: 0,
                    score: 0,
                    isCurrentWeek: isThisWeek(currentWeekPointer, { weekStartsOn: 1 }),
                    weekScore: 0,
                    isEmpty: true,
                    month: getMonth(weekStart),
                    year: getYear(weekStart)
                });
            }

            currentWeekPointer = addWeeks(currentWeekPointer, 1);
        }

        // Calculate running score
        let runningScore = 0;
        allWeeks.forEach(week => {
            runningScore += week.weekScore;
            week.score = runningScore;
        });

        // Group by month for calendar view
        const monthMap = new Map<string, MonthGroup>();
        allWeeks.forEach(week => {
            const monthKey = `${week.year}-${week.month}`;
            if (!monthMap.has(monthKey)) {
                monthMap.set(monthKey, {
                    month: week.month,
                    year: week.year,
                    monthName: format(new Date(week.year, week.month, 1), 'MMMM yyyy'),
                    weeks: [],
                    totalTasks: 0,
                    completedTasks: 0,
                    avgRate: 0
                });
            }
            const monthGroup = monthMap.get(monthKey)!;
            monthGroup.weeks.push(week);
            monthGroup.totalTasks += week.totalTasks;
            monthGroup.completedTasks += week.completedTasks;
        });

        // Calculate average rate for each month
        const sortedMonths = Array.from(monthMap.values())
            .map(m => ({
                ...m,
                avgRate: m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0
            }))
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // Find current week and previous weeks
        const currentWeekData = allWeeks.find(w => w.isCurrentWeek);
        const previousWeeksData = allWeeks.filter(w => !w.isCurrentWeek && w.startDate < now && !w.isEmpty);

        // Calculate streak (consecutive weeks with >= 70% completion, only counting non-empty weeks)
        let streakCount = 0;
        const nonEmptyWeeks = allWeeks.filter(w => !w.isEmpty);
        for (let i = nonEmptyWeeks.length - 1; i >= 0; i--) {
            if (nonEmptyWeeks[i].completionRate >= 70) {
                streakCount++;
            } else {
                break;
            }
        }

        // Calculate average completion rate (only non-empty weeks)
        const avgRate = nonEmptyWeeks.length > 0
            ? Math.round(nonEmptyWeeks.reduce((sum, w) => sum + w.completionRate, 0) / nonEmptyWeeks.length)
            : 0;

        return {
            weeklyData: allWeeks,
            monthlyGroups: sortedMonths,
            currentWeek: currentWeekData,
            previousWeeks: previousWeeksData,
            totalScore: runningScore,
            streak: streakCount,
            averageRate: avgRate
        };
    }, [notes]);

    // Calculate comparison to last week
    const lastWeek = previousWeeks[previousWeeks.length - 1];
    const weekComparison = currentWeek && lastWeek
        ? currentWeek.completionRate - lastWeek.completionRate
        : 0;

    // Get rate color
    const getRateColor = (rate: number) => {
        if (rate >= 70) return { text: 'text-emerald-500', bg: 'bg-emerald-500', hex: '#10b981' };
        if (rate >= 40) return { text: 'text-amber-500', bg: 'bg-amber-500', hex: '#f59e0b' };
        return { text: 'text-rose-500', bg: 'bg-rose-500', hex: '#f43f5e' };
    };

    // Chart data (only non-empty weeks for cleaner charts)
    const chartData = weeklyData
        .filter(week => !week.isEmpty)
        .map(week => {
            const yearSuffix = String(week.year).slice(-2);
            return {
                name: `W${week.weekNumber}'${yearSuffix}`,
                fullName: week.weekLabel,
                dateRange: week.dateRange,
                completed: week.completedTasks,
                late: week.lateTasks,
                missed: week.missedTasks,
                rate: week.completionRate,
                // Give 0% weeks a minimum visible height so they show in chart
                displayRate: week.completionRate === 0 ? 3 : week.completionRate,
                score: week.score,
                weekScore: week.weekScore,
                isCurrentWeek: week.isCurrentWeek,
                year: week.year
            };
        });

    // Calculate best week (only non-empty)
    const nonEmptyWeeks = weeklyData.filter(w => !w.isEmpty);
    const bestWeek = [...nonEmptyWeeks].sort((a, b) => b.completionRate - a.completionRate)[0];

    return (
        <div className="p-10 space-y-8 h-full overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">Progress Tracker</h1>
                    <p className="text-gray-500 dark:text-gray-400">Detailed weekly progress analysis</p>
                </div>
            </div>

            {/* Summary Stats Grid */}
            <div className={clsx("grid gap-6", isMobile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4")}>
                {/* Current Week Card - Uses accent color with transparency */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl relative overflow-hidden"
                    style={{ background: 'color-mix(in srgb, var(--accent-primary) 12%, white)', border: '1px solid color-mix(in srgb, var(--accent-primary) 20%, white)' }}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)' }} />
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent-primary) 8%, transparent)' }}>
                            <Calendar className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <h3 className="font-bold" style={{ color: 'var(--accent-primary)' }}>This Week</h3>
                    </div>
                    <div className="flex items-end gap-2">
                        <p className="text-4xl font-bold text-gray-900 dark:text-white">{currentWeek?.completionRate ?? 0}%</p>
                        {weekComparison !== 0 && (
                            <div className={clsx("flex items-center gap-1 text-sm font-medium mb-1", weekComparison > 0 ? "text-emerald-500" : "text-rose-500")}>
                                {weekComparison > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {weekComparison > 0 ? '+' : ''}{weekComparison}%
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {currentWeek?.completedTasks ?? 0} of {currentWeek?.totalTasks ?? 0} tasks completed
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Total Score</h3>
                    <div className="flex items-end gap-2">
                        <p className={clsx("text-3xl font-bold", totalScore >= 0 ? "text-emerald-500" : "text-rose-500")}>
                            {totalScore >= 0 ? '+' : ''}{totalScore.toFixed(1)}
                        </p>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cumulative performance</p>
                </motion.div>

                {/* Streak Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Streak</h3>
                    <div className="flex items-end gap-2">
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{streak}</p>
                        <span className="text-lg text-gray-500 dark:text-gray-400 mb-0.5">weeks</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Consecutive 70%+ weeks</p>
                </motion.div>

                {/* Average Rate Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4">Average Rate</h3>
                    <p className={clsx("text-3xl font-bold", getRateColor(averageRate).text)}>{averageRate}%</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All-time average</p>
                </motion.div>
            </div>

            {/* Weekly Completion Chart - Full Width */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                style={{ height: '360px' }}
            >
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-xl" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', color: 'var(--accent-primary)' }}>
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Weekly Completion</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Completion rate by week</p>
                    </div>
                </div>
                <div className="h-[calc(100%-80px)]">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="transparent" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                                <YAxis stroke="transparent" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                                <Tooltip
                                    wrapperStyle={{ outline: 'none' }}
                                    contentStyle={{ backgroundColor: 'transparent', border: 'none', padding: 0 }}
                                    content={({ payload }) => {
                                        if (!payload || !payload[0]) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 min-w-[200px]">
                                                <div className="font-bold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
                                                    {data.fullName}
                                                    {data.isCurrentWeek && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)', color: 'var(--accent-primary)' }}>Current</span>}
                                                </div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{data.dateRange}</p>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500 dark:text-gray-400">Completion:</span>
                                                        <span className={clsx("font-bold", getRateColor(data.rate).text)}>{data.rate}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-emerald-500">Completed:</span>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{data.completed}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-amber-500">Late:</span>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{data.late}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-rose-500">Missed:</span>
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{data.missed}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey="displayRate" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.isCurrentWeek ? 'var(--accent-primary)' : getRateColor(entry.rate).hex}
                                            opacity={entry.isCurrentWeek ? 1 : 0.85}
                                        />
                                    ))}
                                    <LabelList
                                        dataKey="isCurrentWeek"
                                        position="bottom"
                                        content={({ x, width, value, viewBox }) => {
                                            if (!value) return null;
                                            const labelX = (x as number) + (width as number) / 2;
                                            // Position below the X-axis labels
                                            const labelY = (viewBox as { height: number }).height + 42;
                                            return (
                                                <text
                                                    x={labelX}
                                                    y={labelY}
                                                    fill="var(--accent-primary)"
                                                    textAnchor="middle"
                                                    fontSize={10}
                                                    fontWeight="bold"
                                                >
                                                    Current
                                                </text>
                                            );
                                        }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400">
                            <p>No data available</p>
                        </div>
                    )}
                </div>
            </motion.div>


            {/* Monthly Calendar View */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl" style={{ background: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)' }}>
                            <Calendar className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Progress Calendar</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Weekly overview by month</p>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <span className="text-gray-500 dark:text-gray-400">70%+</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-amber-500" />
                            <span className="text-gray-500 dark:text-gray-400">40-69%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose-500" />
                            <span className="text-gray-500 dark:text-gray-400">&lt;40%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-600" />
                            <span className="text-gray-500 dark:text-gray-400">No tasks</span>
                        </div>
                    </div>
                </div>

                {monthlyGroups.length > 0 ? (
                    <div className="space-y-6">
                        {[...monthlyGroups].reverse().map((monthGroup, mIndex) => {
                            const monthKey = `${monthGroup.year}-${monthGroup.month}`;
                            const isCollapsed = collapsedMonths.has(monthKey);
                            return (
                                <motion.div
                                    key={monthKey}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.05 * mIndex }}
                                    className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                                >
                                    {/* Month Header - Clickable */}
                                    <button
                                        onClick={() => toggleMonth(monthKey)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? (
                                                <ChevronRight className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{monthGroup.monthName}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                                                {monthGroup.weeks.filter(w => !w.isEmpty).length} weeks with tasks
                                            </span>
                                        </div>
                                        {monthGroup.totalTasks > 0 && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500 dark:text-gray-400">{monthGroup.completedTasks}/{monthGroup.totalTasks} tasks</span>
                                                <span className={clsx("text-sm font-bold px-2 py-0.5 rounded-full", getRateColor(monthGroup.avgRate).text, getRateColor(monthGroup.avgRate).bg + '/20')}>
                                                    {monthGroup.avgRate}%
                                                </span>
                                            </div>
                                        )}
                                    </button>

                                    {/* Weeks Grid - Collapsible */}
                                    {!isCollapsed && (
                                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {monthGroup.weeks.map((week) => (
                                                <div
                                                    key={week.weekLabel + week.dateRange}
                                                    className={clsx(
                                                        "p-3 rounded-xl border transition-all relative",
                                                        week.isEmpty
                                                            ? "bg-gray-50 dark:bg-gray-700/20 border-gray-100 dark:border-gray-700 opacity-60"
                                                            : week.isCurrentWeek
                                                                ? "border-2"
                                                                : "bg-gray-50/50 dark:bg-gray-700/30 border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                                                    )}
                                                    style={week.isCurrentWeek ? { borderColor: 'var(--accent-primary)', backgroundColor: 'color-mix(in srgb, var(--accent-primary) 5%, transparent)' } : undefined}
                                                >
                                                    {/* Current week indicator */}
                                                    {week.isCurrentWeek && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }} />
                                                    )}

                                                    {/* Week header */}
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">W{week.weekNumber}'{String(week.year).slice(-2)}</span>
                                                        {!week.isEmpty && (
                                                            <div className={clsx("w-2.5 h-2.5 rounded-full", getRateColor(week.completionRate).bg)} />
                                                        )}
                                                        {week.isEmpty && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-600" />
                                                        )}
                                                    </div>

                                                    {/* Date range */}
                                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-2">{week.dateRange}</p>

                                                    {!week.isEmpty ? (
                                                        <>
                                                            {/* Completion rate */}
                                                            <p className={clsx("text-lg font-bold", getRateColor(week.completionRate).text)}>
                                                                {week.completionRate}%
                                                            </p>

                                                            {/* Task counts - completed, late, missed, pending */}
                                                            {(() => {
                                                                const pendingTasks = week.totalTasks - week.completedTasks - week.missedTasks;
                                                                return (
                                                                    <>
                                                                        <div className="flex items-center gap-2 mt-1 text-[10px]">
                                                                            <span className="text-emerald-500">{week.completedTasks - week.lateTasks}</span>
                                                                            <span className="text-amber-500">{week.lateTasks}</span>
                                                                            <span className="text-rose-500">{week.missedTasks}</span>
                                                                            {pendingTasks > 0 && <span className="text-gray-400">{pendingTasks}</span>}
                                                                        </div>

                                                                        {/* Mini progress bar */}
                                                                        <div className="mt-2 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                            <div className="h-full flex">
                                                                                <div className="bg-emerald-500" style={{ width: `${week.totalTasks > 0 ? ((week.completedTasks - week.lateTasks) / week.totalTasks) * 100 : 0}%` }} />
                                                                                <div className="bg-amber-500" style={{ width: `${week.totalTasks > 0 ? (week.lateTasks / week.totalTasks) * 100 : 0}%` }} />
                                                                                <div className="bg-rose-500" style={{ width: `${week.totalTasks > 0 ? (week.missedTasks / week.totalTasks) * 100 : 0}%` }} />
                                                                                {/* Pending tasks shown as gray */}
                                                                                <div className="bg-gray-300 dark:bg-gray-500" style={{ width: `${week.totalTasks > 0 ? (pendingTasks / week.totalTasks) * 100 : 0}%` }} />
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                );
                                                            })()}

                                                            {/* Badges - show for all weeks */}
                                                            <div className="mt-2 flex items-center gap-1 text-[10px]">
                                                                {week.isCurrentWeek ? (
                                                                    <span className="px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-primary) 20%, transparent)', color: 'var(--accent-primary)' }}>
                                                                        Current
                                                                    </span>
                                                                ) : week === bestWeek ? (
                                                                    <span className="px-1.5 py-0.5 rounded font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                        <Sparkles className="w-3 h-3" /> Best
                                                                    </span>
                                                                ) : week.completionRate < 40 ? (
                                                                    <span className="px-1.5 py-0.5 rounded font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                                                        <AlertCircle className="w-3 h-3" /> Low
                                                                    </span>
                                                                ) : week.completionRate < 70 ? (
                                                                    <span className="px-1.5 py-0.5 rounded font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                                                        <ThumbsUp className="w-3 h-3" /> OK
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-1.5 py-0.5 rounded font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                                                        Good
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No tasks</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No weekly data yet</p>
                        <p className="text-sm">Complete some tasks to see your progress!</p>
                    </div>
                )}
            </motion.div>

            {/* Scoring System Explanation */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-gray-700"
            >
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-4">How Scoring Works</h3>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">+1</div>
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">On-time Completion</p>
                            <p className="text-gray-500 dark:text-gray-400">Tasks completed before the due time</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">+0.5</div>
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">Late Completion</p>
                            <p className="text-gray-500 dark:text-gray-400">Tasks completed after the due time</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">-1</div>
                        <div>
                            <p className="font-medium text-gray-700 dark:text-gray-200">Missed Task</p>
                            <p className="text-gray-500 dark:text-gray-400">Tasks not completed before due time</p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
