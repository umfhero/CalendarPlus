import { Activity } from 'react-activity-calendar';

const CACHE_KEY = 'github_contributions_cache';

interface CachedData {
    timestamp: number;
    data: { [year: number]: Activity[] };
}

export async function fetchGithubContributions(username: string, year: number): Promise<Activity[]> {
    const currentYear = new Date().getFullYear();
    
    // For current year, always fetch fresh data to show latest commits
    // For past years, use cache if available
    if (year !== currentYear) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data } = JSON.parse(cached) as CachedData;
            if (data[year]) {
                return data[year];
            }
        }
    }

    try {
        const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=${year}`);
        if (!response.ok) {
            throw new Error('Failed to fetch contributions');
        }
        
        const json = await response.json();
        const activities: Activity[] = json.contributions.map((day: any) => ({
            date: day.date,
            count: day.count,
            level: day.level
        }));

        // Update cache
        const currentCache = localStorage.getItem(CACHE_KEY);
        let newCacheData: { [year: number]: Activity[] } = {};
        
        if (currentCache) {
            const parsed = JSON.parse(currentCache);
            newCacheData = parsed.data;
        }

        newCacheData[year] = activities;

        localStorage.setItem(CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: newCacheData
        }));

        return activities;
    } catch (error) {
        console.error('Error fetching Github contributions:', error);
        return [];
    }
}

export function getCachedContributions(year: number): Activity[] | null {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
        const { data } = JSON.parse(cached) as CachedData;
        return data[year] || null;
    }
    return null;
}
