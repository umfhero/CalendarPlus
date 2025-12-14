import React, { useEffect, useState } from 'react';
import { CustomWidgetConfig, CustomWidgetDataPoint } from '../types';
import { fetchAndProcessData, getWidgetData } from '../utils/customWidgetManager';
import GenericTrendChart from './GenericTrendChart';
import { Trash2, RefreshCw, AlertCircle, Activity, DollarSign, Cloud, Rocket, Globe, Cpu, Database, BarChart2 } from 'lucide-react';

const ICONS: Record<string, any> = {
    Activity, DollarSign, Cloud, Rocket, Globe, Cpu, Database, BarChart2
};

interface CustomWidgetContainerProps {
    config: CustomWidgetConfig;
    onDelete?: () => void;
    isEditMode?: boolean;
}

export const CustomWidgetContainer: React.FC<CustomWidgetContainerProps> = ({ config, onDelete, isEditMode }) => {
    const [data, setData] = useState<CustomWidgetDataPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const renderIcon = () => {
        if (config.iconType === 'custom' && config.icon) {
            return <img src={config.icon} alt="icon" className="w-5 h-5 object-contain" />;
        }
        
        const IconComponent = config.icon && ICONS[config.icon] ? ICONS[config.icon] : Activity;
        return <IconComponent size={20} />;
    };

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            // First try to load local data
            const localData = getWidgetData(config.id);
            if (localData.length > 0) {
                setData(localData);
                setLoading(false);
            }

            // Then fetch new data
            const newData = await fetchAndProcessData(config);
            setData(newData);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        
        if (config.refreshInterval > 0) {
            const interval = setInterval(loadData, config.refreshInterval * 60 * 1000);
            return () => clearInterval(interval);
        }
    }, [config]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full min-h-[200px] relative group">
            {isEditMode && onDelete && (
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors z-10"
                >
                    <Trash2 size={16} />
                </button>
            )}

            {loading && data.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                    <RefreshCw className="animate-spin text-gray-400" />
                </div>
            ) : error && data.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-red-500 p-4 text-center">
                    <AlertCircle className="mb-2" />
                    <p className="text-sm">{error}</p>
                    <button onClick={loadData} className="mt-2 text-xs underline">Retry</button>
                </div>
            ) : (
                <GenericTrendChart 
                    data={data}
                    xKey="date"
                    yKey="value"
                    title={config.title}
                    color={config.color}
                    height={300}
                    icon={renderIcon()}
                />
            )}
        </div>
    );
};
