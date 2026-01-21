/**
 * Rating Prompt Manager
 * 
 * Handles non-intrusive app rating prompts for Windows Store.
 * Based on UX best practices:
 * - Only prompt after positive user experiences
 * - Track usage to avoid premature prompts
 * - Never show more than once if dismissed via X or app close
 * - "Maybe later" allows re-prompting after 1 week
 * - Easy to dismiss permanently
 */

export interface RatingPromptState {
    hasRated: boolean;
    hasDismissed: boolean; // Dismissed via X or close - never show again
    sessionCount: number;
    tasksCompleted: number;
    lastPromptDate: string | null;
    maybeLaterDate: string | null; // When user clicked "Maybe later"
    firstLaunchDate: string;
}

const STORAGE_KEY = 'rating_prompt_state';
const MIN_SESSIONS = 5; // Minimum app launches before prompting
const MIN_TASKS_COMPLETED = 10; // Minimum completed tasks before prompting
const DAYS_SINCE_INSTALL = 3; // Minimum days since first launch
const MAYBE_LATER_DAYS = 7; // Days to wait after "Maybe later"

export class RatingPromptManager {
    private state: RatingPromptState;

    constructor() {
        this.state = this.loadState();
    }

    private loadState(): RatingPromptState {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch {
                // Fall through to default
            }
        }

        // Default state for new users
        return {
            hasRated: false,
            hasDismissed: false,
            sessionCount: 0,
            tasksCompleted: 0,
            lastPromptDate: null,
            maybeLaterDate: null,
            firstLaunchDate: new Date().toISOString(),
        };
    }

    private saveState(): void {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    /**
     * Increment session count (call on app startup)
     */
    incrementSession(): void {
        this.state.sessionCount++;
        this.saveState();
    }

    /**
     * Track task completion (call when user completes a task)
     */
    trackTaskCompletion(): void {
        this.state.tasksCompleted++;
        this.saveState();
    }

    /**
     * Check if we should show the rating prompt
     * Returns true only if all conditions are met
     */
    shouldShowPrompt(): boolean {
        // Never show if already rated or permanently dismissed
        if (this.state.hasRated || this.state.hasDismissed) {
            return false;
        }

        // Check if "Maybe later" cooldown is active
        if (this.state.maybeLaterDate) {
            const daysSinceMaybeLater = this.getDaysSince(this.state.maybeLaterDate);
            if (daysSinceMaybeLater < MAYBE_LATER_DAYS) {
                return false;
            }
        }

        // Check minimum sessions
        if (this.state.sessionCount < MIN_SESSIONS) {
            return false;
        }

        // Check minimum tasks completed
        if (this.state.tasksCompleted < MIN_TASKS_COMPLETED) {
            return false;
        }

        // Check days since install
        const daysSinceInstall = this.getDaysSinceInstall();
        if (daysSinceInstall < DAYS_SINCE_INSTALL) {
            return false;
        }

        return true;
    }

    /**
     * Get days since first launch
     */
    private getDaysSinceInstall(): number {
        return this.getDaysSince(this.state.firstLaunchDate);
    }

    /**
     * Get days since a specific date
     */
    private getDaysSince(dateString: string): number {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    /**
     * Mark that user has rated the app
     */
    markAsRated(): void {
        this.state.hasRated = true;
        this.state.lastPromptDate = new Date().toISOString();
        this.saveState();
    }

    /**
     * Mark that user dismissed the prompt (X button or close)
     * This is permanent - never show again
     */
    markAsDismissed(): void {
        this.state.hasDismissed = true;
        this.state.lastPromptDate = new Date().toISOString();
        this.saveState();
    }

    /**
     * Mark that user clicked "Maybe later"
     * This allows re-prompting after 1 week
     */
    markAsMaybeLater(): void {
        this.state.maybeLaterDate = new Date().toISOString();
        this.state.lastPromptDate = new Date().toISOString();
        this.saveState();
    }

    /**
     * Get current state (for debugging)
     */
    getState(): RatingPromptState {
        return { ...this.state };
    }

    /**
     * Reset state (for testing only)
     */
    reset(): void {
        localStorage.removeItem(STORAGE_KEY);
        this.state = this.loadState();
    }
}

// Singleton instance
export const ratingPrompt = new RatingPromptManager();
