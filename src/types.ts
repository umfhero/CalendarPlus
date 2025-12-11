export type Page = 'dashboard' | 'calendar' | 'stats' | 'settings' | 'drawing' | 'github' | 'dev';

export interface Note {
    id: string;
    title: string;
    description: string;
    summary?: string;
    time: string;
    importance: 'low' | 'medium' | 'high' | 'misc';
    completed?: boolean;
    completedLate?: boolean;
    recurrence?: {
        type: 'daily' | 'weekly' | 'fortnightly' | 'monthly';
        endDate?: string; // ISO date string
        count?: number;
    };
    seriesId?: string;
}

export interface NotesData {
    [date: string]: Note[];
}
