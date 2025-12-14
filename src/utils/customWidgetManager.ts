import { CustomWidgetConfig, CustomWidgetDataPoint } from '../types';

const CONFIG_STORAGE_KEY = 'calendar_plus_custom_widgets_configs';
const DATA_STORAGE_PREFIX = 'calendar_plus_custom_widgets_data_';

// Helper to access nested properties safely
const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const getWidgetConfigs = (): CustomWidgetConfig[] => {
    try {
        const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error('Failed to load widget configs', e);
        return [];
    }
};

export const saveWidgetConfig = (config: CustomWidgetConfig) => {
    const configs = getWidgetConfigs();
    const index = configs.findIndex(c => c.id === config.id);
    if (index >= 0) {
        configs[index] = config;
    } else {
        configs.push(config);
    }
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(configs));
    window.dispatchEvent(new Event('custom-widgets-changed'));
};

export const deleteWidgetConfig = (id: string) => {
    const configs = getWidgetConfigs();
    const newConfigs = configs.filter(c => c.id !== id);
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(newConfigs));
    localStorage.removeItem(`${DATA_STORAGE_PREFIX}${id}`);
    window.dispatchEvent(new Event('custom-widgets-changed'));
};

export const getWidgetData = (id: string): CustomWidgetDataPoint[] => {
    try {
        const stored = localStorage.getItem(`${DATA_STORAGE_PREFIX}${id}`);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        console.error(`Failed to load data for widget ${id}`, e);
        return [];
    }
};

export const saveWidgetData = (id: string, data: CustomWidgetDataPoint[]) => {
    localStorage.setItem(`${DATA_STORAGE_PREFIX}${id}`, JSON.stringify(data));
};

export const fetchAndProcessData = async (config: CustomWidgetConfig): Promise<CustomWidgetDataPoint[]> => {
    try {
        // Block known dead APIs
        if (config.apiUrl.includes('boredapi.com')) {
             throw new Error('API is no longer available');
        }

        const response = await fetch(config.apiUrl, {
            headers: config.headers,
        });
        
        if (response.status === 429) {
            console.warn(`Rate limit exceeded for ${config.title}. Using cached data.`);
            const cached = getWidgetData(config.id);
            if (cached.length > 0) return cached;
            throw new Error('Rate limit exceeded. Try again later.');
        }

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const json = await response.json();
        let newData: CustomWidgetDataPoint[] = [];

        if (config.isAccumulative) {
            // Accumulative: Fetch single value, append to history
            const rawValue = config.yKey ? getValue(json, config.yKey) : json;
            const value = Number(rawValue);
            const date = new Date().toISOString(); // Use current time for accumulative
            
            if (isNaN(value)) {
                console.warn(`Fetched value is not a number: ${rawValue}`);
                return getWidgetData(config.id);
            }

            const point: CustomWidgetDataPoint = { date, value };
            
            // Load existing data to append
            const existingData = getWidgetData(config.id);
            newData = [...existingData, point];
            
        } else {
            // Not accumulative: Fetch array, map to points
            const list = config.dataKey ? getValue(json, config.dataKey) : json;
            
            if (!Array.isArray(list)) {
                throw new Error('Fetched data is not an array');
            }

            newData = list.map((item: any) => {
                const dateVal = getValue(item, config.xKey);
                const valueVal = getValue(item, config.yKey);
                
                // Try to parse date
                let dateStr = '';
                if (dateVal) {
                    const d = new Date(dateVal);
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toISOString();
                    }
                }

                return {
                    date: dateStr,
                    value: Number(valueVal) || 0
                };
            }).filter(p => p.date); // Filter invalid dates
        }

        // Save the processed data
        saveWidgetData(config.id, newData);
        return newData;

    } catch (error) {
        console.error('Error fetching widget data:', error);
        throw error;
    }
};
