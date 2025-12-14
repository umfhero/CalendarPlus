import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GenericTrendChartProps {
  data: any[];
  xKey: string;
  yKey: string;
  title: string;
  color: string;
  height?: number;
  icon?: React.ReactNode;
}

type TimeRange = '1M' | '1Y' | 'ALL';

const GenericTrendChart: React.FC<GenericTrendChartProps> = ({ 
  data, 
  xKey,
  yKey,
  title, 
  color, 
  height = 300,
  icon
}) => {
  const [range, setRange] = useState<TimeRange>('1M');
  const [pageOffset, setPageOffset] = useState(0);
  const [, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setPageOffset(0);
  };

  const handlePrev = () => setPageOffset(prev => prev + 1);
  const handleNext = () => setPageOffset(prev => Math.max(0, prev - 1));

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Sort data by date just in case
    const sortedData = [...data].sort((a, b) => new Date(a[xKey]).getTime() - new Date(b[xKey]).getTime());

    if (range === 'ALL') return sortedData;

    const days = range === '1M' ? 30 : 365;
    
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - (pageOffset * days));
    
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    return sortedData.filter(item => {
      const d = new Date(item[xKey]);
      return d >= startDate && d <= endDate;
    });
  }, [data, range, pageOffset, xKey]);

  const trendPercentage = useMemo(() => {
    if (filteredData.length < 2) return 0;
    const first = Number(filteredData[0][yKey]);
    const last = Number(filteredData[filteredData.length - 1][yKey]);
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [filteredData, yKey]);

  const currentValue = useMemo(() => {
      if (filteredData.length === 0) return 0;
      return Number(filteredData[filteredData.length - 1][yKey]);
  }, [filteredData, yKey]);

  const getDateRangeLabel = () => {
    if (range === 'ALL') return 'All Time';
    if (filteredData.length === 0) return 'No Data';
    const start = new Date(filteredData[0][xKey]);
    const end = new Date(filteredData[filteredData.length - 1][xKey]);
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  };

  return (
    <div ref={containerRef} className="w-full flex flex-col" style={{ height }}>
      <div className="flex justify-between items-center mb-4 px-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
             <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                 {currentValue.toLocaleString()}
             </span>
             <span className={clsx(
               "text-xs font-bold",
               trendPercentage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
             )}>
               {trendPercentage > 0 ? '+' : ''}{trendPercentage.toFixed(1)}%
             </span>
             <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">{getDateRangeLabel()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {range !== 'ALL' && (
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
              <button 
                onClick={handlePrev}
                className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
              <button 
                onClick={handleNext}
                disabled={pageOffset === 0}
                className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>
          )}
          
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            {(['1M', '1Y', 'ALL'] as TimeRange[]).map((r) => (
              <button
                key={r}
                onClick={() => handleRangeChange(r)}
                className={clsx(
                  "px-3 py-1 text-xs font-medium rounded-md transition-all",
                  range === r 
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm" 
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id={`color${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
            <XAxis 
              dataKey={xKey} 
              tickFormatter={(str) => {
                const d = new Date(str);
                return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
              }}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(17, 24, 39, 0.8)', 
                border: 'none', 
                borderRadius: '8px',
                color: '#F3F4F6'
              }}
              itemStyle={{ color: color }}
              labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
              labelFormatter={(label) => new Date(label).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <Area 
              type="monotone" 
              dataKey={yKey} 
              stroke={color} 
              fillOpacity={1} 
              fill={`url(#color${title.replace(/\s+/g, '')})`} 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default GenericTrendChart;
