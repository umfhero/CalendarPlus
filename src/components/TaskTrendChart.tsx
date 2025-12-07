import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from 'recharts';
import clsx from 'clsx';
import { TrendingUp, TrendingDown, Sparkles } from 'lucide-react';
import { NotesData } from '../App';
import { format, parseISO } from 'date-fns';
import confetti from 'canvas-confetti';

interface TaskTrendChartProps {
  notes: NotesData;
}

type TimeRange = '1W' | '1M' | 'ALL';

interface TaskPoint {
  taskIndex: number;
  score: number | null; // Actual score (null for projections)
  projectedScore: number | null; // Projected score for upcoming
  displayScore: number; // The score to display on chart (actual or projected)
  date: string;
  displayDate: string;
  taskTitle: string;
  wasCompleted: boolean;
  wasMissed: boolean;
  isProjection: boolean;
  segmentColor: string | null; // Color of line from previous point to this point
  segmentDashed: boolean; // Whether segment should be dashed
  dotColor: string | null; // Color of dot at this point
}

const TaskTrendChart: React.FC<TaskTrendChartProps> = ({ notes }) => {
  const [range, setRange] = useState<TimeRange>('1W');
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const handleRangeChange = (newRange: TimeRange) => {
    setRange(newRange);
    setHasTriggeredConfetti(false);
  };

  // Build chart data - task by task points
  const { chartData, summaryStats } = useMemo(() => {
    const today = new Date();
    const now = new Date();
    
    // Get all dates with tasks, sorted chronologically
    const allDates = Object.keys(notes)
      .filter(dateKey => notes[dateKey] && notes[dateKey].length > 0)
      .sort();
    
    if (allDates.length === 0) {
      return { 
        chartData: [], 
        summaryStats: { totalTasks: 0, completedTasks: 0, missedTasks: 0, overallRate: 0, earlyCount: 0, lateCount: 0 } 
      };
    }

    // Filter by range
    let filteredDates = allDates;
    const rangeStart = new Date(today);
    const rangeEnd = new Date(today);
    
    if (range === '1W') {
      rangeStart.setDate(rangeStart.getDate() - 7);
      rangeEnd.setDate(rangeEnd.getDate() + 7);
      filteredDates = allDates.filter(d => {
        const date = new Date(d);
        return date >= rangeStart && date <= rangeEnd;
      });
    } else if (range === '1M') {
      rangeStart.setDate(rangeStart.getDate() - 30);
      rangeEnd.setDate(rangeEnd.getDate() + 30);
      filteredDates = allDates.filter(d => {
        const date = new Date(d);
        return date >= rangeStart && date <= rangeEnd;
      });
    }

    if (filteredDates.length === 0) {
      return { 
        chartData: [], 
        summaryStats: { totalTasks: 0, completedTasks: 0, missedTasks: 0, overallRate: 0, earlyCount: 0, lateCount: 0 } 
      };
    }

    // Collect all tasks in chronological order
    interface Task {
      date: string;
      displayDate: string;
      title: string;
      time: string;
      completed: boolean;
      isPast: boolean;
    }

    const tasks: Task[] = [];
    filteredDates.forEach(dateKey => {
      const dayNotes = notes[dateKey] || [];
      dayNotes.forEach(note => {
        const [hours, minutes] = note.time.split(':').map(Number);
        const taskDateTime = new Date(parseISO(dateKey));
        taskDateTime.setHours(hours, minutes, 0, 0);
        const isPast = taskDateTime.getTime() < now.getTime();
        
        tasks.push({
          date: dateKey,
          displayDate: format(parseISO(dateKey), 'MMM d'),
          title: note.title,
          time: note.time,
          completed: note.completed || false,
          isPast,
        });
      });
    });

    // Sort by date and time
    tasks.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.time.localeCompare(b.time);
    });

    // Build points - one per task
    let score = 0;
    let completedTasks = 0;
    let missedTasks = 0;
    let earlyCount = 0;
    let lateCount = 0;

    const points: TaskPoint[] = [];
    
    // Starting point at 0
    points.push({
      taskIndex: 0,
      score: 0,
      projectedScore: null,
      displayScore: 0,
      date: tasks[0]?.date || '',
      displayDate: 'Start',
      taskTitle: 'Start',
      wasCompleted: false,
      wasMissed: false,
      isProjection: false,
      segmentColor: null,
      segmentDashed: false,
      dotColor: null,
    });

    let lastActualIndex = 0;
    let lastActualScore = 0;

    tasks.forEach((task, index) => {
      const taskNum = index + 1;
      const isMissed = task.isPast && !task.completed;
      const prevScore = score;
      
      // Update score: +1 for completed, -1 for missed, 0 for upcoming
      if (task.completed) {
        score += 1;
        completedTasks++;
        
        // Check timing
        const [hours, minutes] = task.time.split(':').map(Number);
        const taskDateTime = new Date(parseISO(task.date));
        taskDateTime.setHours(hours, minutes, 0, 0);
        const daysDiff = Math.floor((taskDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff > 1) earlyCount++;
        else if (task.isPast) lateCount++;
      } else if (isMissed) {
        score -= 1;
        missedTasks++;
      }
      
      const isActual = task.isPast || task.completed;
      if (isActual) {
        lastActualIndex = taskNum;
        lastActualScore = score;
      }
      
      // Determine segment color based on movement
      const scoreDiff = score - prevScore;
      let segmentColor: string | null = null;
      let segmentDashed = false;
      let dotColor: string | null = null;
      
      if (isActual) {
        // Actual task - green if up, red if down
        if (scoreDiff > 0) {
          segmentColor = '#10b981'; // Green
          dotColor = '#10b981';
        } else if (scoreDiff < 0) {
          segmentColor = '#f43f5e'; // Red
          dotColor = '#f43f5e';
        } else {
          segmentColor = '#9ca3af'; // Gray for flat
          dotColor = '#9ca3af';
        }
      } else {
        // Projection - gray dashed
        segmentColor = '#d1d5db';
        segmentDashed = true;
        dotColor = null; // No dot for projections
      }
      
      const projectedScore = !isActual ? (lastActualScore + (taskNum - lastActualIndex)) : null;
      
      const point: TaskPoint = {
        taskIndex: taskNum,
        score: isActual ? score : null,
        projectedScore,
        displayScore: isActual ? score : projectedScore!,
        date: task.date,
        displayDate: task.displayDate,
        taskTitle: task.title,
        wasCompleted: task.completed,
        wasMissed: isMissed,
        isProjection: !isActual,
        segmentColor,
        segmentDashed,
        dotColor,
      };
      
      points.push(point);
    });

    const totalTasks = tasks.length;
    const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    return { 
      chartData: points, 
      summaryStats: { 
        totalTasks, 
        completedTasks, 
        missedTasks,
        overallRate,
        earlyCount,
        lateCount 
      } 
    };
  }, [notes, range]);

  // Re-trigger animation when data changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [chartData]);

  // Trigger confetti when 100% completion
  useEffect(() => {
    const isPerfectScore = summaryStats.totalTasks > 0 && 
                           summaryStats.completedTasks === summaryStats.totalTasks;
    
    // Reset confetti flag when not at 100%
    if (!isPerfectScore && hasTriggeredConfetti) {
      setHasTriggeredConfetti(false);
    }
    
    // Trigger confetti when at 100% and haven't triggered yet
    if (isPerfectScore && !hasTriggeredConfetti) {
      setHasTriggeredConfetti(true);
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [summaryStats.completedTasks, summaryStats.totalTasks, hasTriggeredConfetti]);

  const getRateColor = (rate: number) => {
    if (rate >= 70) return { text: 'text-emerald-500', bg: 'bg-emerald-500', hex: '#10b981' };
    if (rate >= 40) return { text: 'text-amber-500', bg: 'bg-amber-500', hex: '#f59e0b' };
    return { text: 'text-rose-500', bg: 'bg-rose-500', hex: '#f43f5e' };
  };

  const colors = getRateColor(summaryStats.overallRate);
  
  // Get trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return 0;
    const firstScore = chartData[0].score;
    const lastScore = chartData[chartData.length - 1].score;
    const diff = lastScore - firstScore;
    return diff > 0 ? 1 : diff < 0 ? -1 : 0;
  }, [chartData]);

  const gradientId = `areaGradient-${animationKey}`;
  const projectedGradientId = `projectedGradient-${animationKey}`;

  if (summaryStats.totalTasks === 0) {
    return (
      <div ref={containerRef} className="h-full w-full flex flex-col items-center justify-center text-center p-4">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No tasks yet</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">Add events to track your progress</p>
      </div>
    );
  }

  const isPerfect = summaryStats.completedTasks === summaryStats.totalTasks && summaryStats.missedTasks === 0;
  const maxScore = summaryStats.totalTasks; // Maximum possible score

  return (
    <div ref={containerRef} className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-1 px-1">
        <div>
          <div className="flex items-center gap-2">
            <span className={clsx("text-3xl font-bold tracking-tight", isPerfect ? "text-emerald-500" : colors.text)}>
              {summaryStats.overallRate}%
            </span>
            {isPerfect && (
              <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            )}
            {trend !== 0 && !isPerfect && (
              <div className={clsx(
                "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full",
                trend > 0 
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
              )}>
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
            <span>{summaryStats.completedTasks} done</span>
            {summaryStats.missedTasks > 0 && (
              <span className="text-rose-500">• {summaryStats.missedTasks} missed</span>
            )}
            {summaryStats.earlyCount > 0 && (
              <span className="text-cyan-500">• {summaryStats.earlyCount} early</span>
            )}
            {summaryStats.lateCount > 0 && (
              <span className="text-amber-500">• {summaryStats.lateCount} late</span>
            )}
          </div>
        </div>
        <div className="flex bg-gray-100/80 dark:bg-gray-700/80 rounded-lg p-0.5">
          {['1W', '1M', 'ALL'].filter(r => containerWidth > 280 || r !== 'ALL').map((r) => (
            <button
              key={r}
              onClick={() => handleRangeChange(r as TimeRange)}
              className={clsx(
                "px-2 py-0.5 rounded text-[11px] font-medium transition-all",
                range === r 
                  ? "bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-gray-100" 
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 min-h-0 mt-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-gray-400">No tasks in this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              key={animationKey}
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            >
              <defs>
                <linearGradient id={projectedGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d1d5db" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#d1d5db" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.hex} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={colors.hex} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              
              {/* Projection area (gray) */}
              <Area
                type="monotone"
                dataKey="projectedScore"
                stroke="none"
                fill={`url(#${projectedGradientId})`}
                isAnimationActive={false}
              />
              
              {/* Main score area - only actual scores */}
              <Area
                type="monotone"
                dataKey="score"
                stroke="none"
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
              
              {/* Main line with custom segment rendering */}
              <Line
                type="monotone"
                dataKey="displayScore"
                stroke="transparent"
                strokeWidth={0}
                dot={false}
                isAnimationActive={false}
                shape={(props: any) => {
                  const { points } = props;
                  if (!points || points.length < 2) return null;
                  
                  // Generate smooth curved path using catmull-rom or monotone cubic
                  const generateSmoothPath = (p1: any, p2: any) => {
                    // Simple quadratic bezier for smooth curves
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    
                    // Control point offset (adjust this for curve smoothness)
                    const smoothness = Math.min(Math.abs(dx) * 0.2, 20);
                    
                    // Create smooth curve
                    return `M ${p1.x},${p1.y} C ${p1.x + smoothness},${p1.y} ${p2.x - smoothness},${p2.y} ${p2.x},${p2.y}`;
                  };
                  
                  return (
                    <g>
                      {points.map((point: any, index: number) => {
                        if (index === 0) return null;
                        
                        const prevPoint = points[index - 1];
                        const currentData = chartData[index];
                        
                        if (!currentData || !currentData.segmentColor) return null;
                        
                        const path = generateSmoothPath(prevPoint, point);
                        
                        return (
                          <path
                            key={`segment-${index}`}
                            d={path}
                            fill="none"
                            stroke={currentData.segmentColor}
                            strokeWidth={3}
                            strokeDasharray={currentData.segmentDashed ? "5 5" : undefined}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        );
                      })}
                    </g>
                  );
                }}
              />
              
              {/* Dots at each actual point */}
              <Line
                type="monotone"
                dataKey="displayScore"
                stroke="transparent"
                strokeWidth={0}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload.dotColor) return null;
                  
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={payload.dotColor}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
                isAnimationActive={false}
              />
              
              <XAxis 
                dataKey="taskIndex" 
                stroke="transparent"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                label={{ value: 'Tasks', position: 'insideBottom', offset: -5, fill: '#9ca3af', fontSize: 10 }}
              />
              <YAxis 
                domain={[(dataMin: number) => Math.min(dataMin - 1, -1), (dataMax: number) => Math.max(dataMax + 1, chartData.length + 1)]}
                stroke="transparent"
                tick={{ fill: '#9ca3af', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={35}
                label={{ value: 'Score', angle: -90, position: 'insideLeft', fill: '#9ca3af', fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fff',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  padding: '10px 14px',
                  fontSize: '12px',
                }}
                formatter={(_value: any, name: string, props: any) => {
                  const data = props.payload as TaskPoint;
                  if (name === 'score') {
                    const status = data.wasCompleted 
                      ? '✅ Completed' 
                      : data.wasMissed 
                      ? '❌ Missed' 
                      : '⏳ Upcoming';
                    
                    return [
                      `Score: ${data.score} • ${status}`,
                      data.taskTitle
                    ];
                  }
                  return null;
                }}
                labelFormatter={() => ''}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Bottom status */}
      <div className="flex items-center justify-between px-1 pt-2 border-t border-gray-100/50 dark:border-gray-700/30 mt-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[9px] text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <span className="text-[9px] text-gray-400">Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-gray-300 border-t-2 border-dashed border-gray-300"></div>
            <span className="text-[9px] text-gray-400">Ideal</span>
          </div>
        </div>
        <div className={clsx(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full",
          isPerfect
            ? "bg-gradient-to-r from-emerald-100 to-cyan-100 dark:from-emerald-900/30 dark:to-cyan-900/30 text-emerald-600 dark:text-emerald-400"
            : summaryStats.overallRate >= 70 
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
            : summaryStats.overallRate >= 40
            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
            : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400"
        )}>
          {isPerfect ? '🎉 Perfect!' : 
           summaryStats.overallRate >= 70 ? '🔥 On fire!' : 
           summaryStats.overallRate >= 40 ? '💪 Keep going' : '📈 Room to grow'}
        </div>
      </div>
    </div>
  );
};

export default TaskTrendChart;
