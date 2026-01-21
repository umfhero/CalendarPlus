import { useNotification } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';
import { AlertTriangle, ToggleLeft, ToggleRight, Trash2, RefreshCw, Rocket, MousePointerClick, Camera, Download, Palette, Star } from 'lucide-react';
import clsx from 'clsx';
import { ratingPrompt } from '../utils/ratingPrompt';

interface DevPageProps {
    isMockMode: boolean;
    toggleMockMode: () => void;
    onForceSetup: () => void;
    onForceSnapshot?: () => void;
    onForceRatingPrompt?: () => void;
}

export function DevPage({ isMockMode, toggleMockMode, onForceSetup, onForceSnapshot, onForceRatingPrompt }: DevPageProps) {
    const { addNotification } = useNotification();
    const { accentColor } = useTheme();

    const clearLocalStorage = () => {
        if (confirm('Are you sure you want to clear all local storage? This will reset feature toggles and other local settings.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const resetSetup = async () => {
        if (confirm('Are you sure you want to reset the setup wizard?')) {
            // @ts-ignore
            await window.ipcRenderer.invoke('reset-setup');
            window.location.reload();
        }
    };

    return (
        <div className="h-full p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 md:mb-8">Developer Tools</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8 w-full max-w-7xl mx-auto">

                {/* Column 1 - Simulators & Feature Flags */}
                <div className="space-y-4 sm:space-y-6">
                    {/* Mock Mode Toggle */}
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 border border-white/20 dark:border-gray-700/30 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Mock Dashboard</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Replace real data with mock tasks for screenshots/demos.
                                </p>
                            </div>
                            <button
                                onClick={toggleMockMode}
                                className="transition-colors hover:opacity-80"
                                style={{ color: isMockMode ? accentColor : 'inherit' }}
                            >
                                {isMockMode ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-gray-400" />}
                            </button>
                        </div>
                        {isMockMode && (
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Mock mode is active. Real data is hidden but safe.
                            </div>
                        )}
                    </div>

                    {/* Region Restriction Simulator */}
                    <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4 md:p-6 border border-white/20 dark:border-gray-700/30 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Simulate Region Block</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Test Gemini region restrictions without VPN.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const current = localStorage.getItem('dev_simulate_region_block') === 'true';
                                    localStorage.setItem('dev_simulate_region_block', (!current).toString());
                                    window.location.reload();
                                }}
                                className="transition-colors hover:opacity-80"
                                style={{ color: localStorage.getItem('dev_simulate_region_block') === 'true' ? accentColor : 'inherit' }}
                            >
                                {localStorage.getItem('dev_simulate_region_block') === 'true' ? <ToggleRight size={40} /> : <ToggleLeft size={40} className="text-gray-400" />}
                            </button>
                        </div>
                        {localStorage.getItem('dev_simulate_region_block') === 'true' && (
                            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-lg text-sm flex items-center gap-2">
                                <AlertTriangle size={16} />
                                Gemini API will fail with region error. Perplexity will work normally.
                            </div>
                        )}
                    </div>

                    {/* Feature Flags */}
                    <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-4 md:p-6 border border-purple-200 dark:border-purple-800/30 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">Feature Flags</h2>
                        <div className="space-y-4">
                            {/* Creator Stats Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">Creator Stats</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        Enable the 'Stats' page for content creators
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        const saved = localStorage.getItem('feature-toggles');
                                        const features = saved ? JSON.parse(saved) : {};
                                        const newValue = !features.stats;
                                        const newFeatures = { ...features, stats: newValue };

                                        localStorage.setItem('feature-toggles', JSON.stringify(newFeatures));
                                        window.dispatchEvent(new CustomEvent('feature-toggles-changed', { detail: newFeatures }));

                                        addNotification({
                                            title: newValue ? 'Stats Enabled' : 'Stats Disabled',
                                            message: newValue ? 'Creator Stats page is now visible in the sidebar.' : 'Creator Stats page has been hidden.',
                                            type: 'info',
                                            duration: 2000
                                        });
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className={clsx(
                                        "w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0",
                                        (() => {
                                            const saved = localStorage.getItem('feature-toggles');
                                            const features = saved ? JSON.parse(saved) : {};
                                            return features.stats;
                                        })()
                                            ? "bg-purple-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-4 h-4 rounded-full bg-white shadow-md transition-transform",
                                        (() => {
                                            const saved = localStorage.getItem('feature-toggles');
                                            const features = saved ? JSON.parse(saved) : {};
                                            return features.stats;
                                        })() ? "translate-x-4" : ""
                                    )} />
                                </button>
                            </div>

                            {/* Companion Mode Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">Companion Pets</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        Show a pet companion that floats on all pages
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        const current = localStorage.getItem('companion-mode') === 'true';
                                        const newValue = !current;
                                        localStorage.setItem('companion-mode', String(newValue));
                                        window.dispatchEvent(new CustomEvent('companion-mode-changed', { detail: newValue }));
                                        addNotification({
                                            title: newValue ? 'Companion Mode Enabled' : 'Companion Mode Disabled',
                                            message: newValue ? 'Your companion pet is now visible!' : 'Your companion pet has been hidden.',
                                            type: 'info',
                                            duration: 2000
                                        });
                                    }}
                                    className={clsx(
                                        "w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0",
                                        localStorage.getItem('companion-mode') === 'true'
                                            ? "bg-pink-500"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-4 h-4 rounded-full bg-white shadow-md transition-transform",
                                        localStorage.getItem('companion-mode') === 'true' ? "translate-x-4" : ""
                                    )} />
                                </button>
                            </div>

                            {/* Icon Gallery Link */}
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new CustomEvent('navigate-to-page', { detail: 'icons' }));
                                }}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-purple-200 dark:border-purple-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-purple-600 dark:text-purple-400"
                            >
                                <Palette size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Icon Gallery</div>
                                    <div className="text-xs opacity-80 truncate">Browse all Lucide icons used in the app</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 2 - Dashboard Tools */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 md:p-6 border border-blue-200 dark:border-blue-800/30 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">Dashboard Tools</h2>
                        <div className="space-y-4">
                            {/* Auto-Generate Briefing */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <div className="flex flex-col min-w-0 pr-2">
                                    <span className="font-medium text-gray-800 dark:text-gray-200 truncate">Auto-Generate Briefing</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                        Automatically generate AI briefing on Dashboard load
                                    </span>
                                </div>
                                <button
                                    onClick={() => {
                                        const current = localStorage.getItem('disable_auto_briefing') === 'true';
                                        localStorage.setItem('disable_auto_briefing', (!current).toString());
                                        addNotification({
                                            title: 'Setting Updated',
                                            message: `Auto-briefing ${!current ? 'disabled' : 'enabled'}`,
                                            type: 'success',
                                            duration: 2000
                                        });
                                        window.dispatchEvent(new Event('storage'));
                                    }}
                                    className={clsx(
                                        "w-10 h-6 rounded-full p-1 transition-colors duration-300 flex-shrink-0",
                                        localStorage.getItem('disable_auto_briefing') === 'true'
                                            ? "bg-gray-300 dark:bg-gray-600"
                                            : "bg-blue-500"
                                    )}
                                >
                                    <div className={clsx(
                                        "w-4 h-4 rounded-full bg-white shadow-md transition-transform",
                                        localStorage.getItem('disable_auto_briefing') === 'true' ? "" : "translate-x-4"
                                    )} />
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    localStorage.removeItem('dashboard_order');
                                    localStorage.removeItem('dashboard_hidden_widgets');
                                    addNotification({
                                        title: 'Layout Reset',
                                        message: 'Dashboard layout has been reset to default.',
                                        type: 'success',
                                        duration: 3000
                                    });
                                }}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                            >
                                <RefreshCw size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Reset Layout</div>
                                    <div className="text-xs opacity-80 truncate">Restores default widget order and visibility</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    localStorage.removeItem('dashboard_edit_tip_shown');
                                    addNotification({
                                        title: 'Tip Reset',
                                        message: 'Edit mode tip will appear next time you visit Dashboard.',
                                        type: 'info',
                                        duration: 3000
                                    });
                                }}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                            >
                                <MousePointerClick size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Reset "Edit Tip" History</div>
                                    <div className="text-xs opacity-80 truncate">Forces the "Press & Hold" helper to show again</div>
                                </div>
                            </button>

                            {/* Force Snapshot Button */}
                            {onForceSnapshot && (
                                <button
                                    onClick={() => {
                                        onForceSnapshot();
                                        addNotification({
                                            title: 'Snapshot Triggered',
                                            message: 'Navigate to Progress page to test snapshot creation.',
                                            type: 'info',
                                            duration: 3000
                                        });
                                    }}
                                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                                >
                                    <Camera size={20} className="flex-shrink-0" />
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-medium truncate">Force Snapshot</div>
                                        <div className="text-xs opacity-80 truncate">Test snapshot creation functionality</div>
                                    </div>
                                </button>
                            )}

                            {/* Force Update Notification */}
                            <button
                                onClick={() => {
                                    window.dispatchEvent(new Event('force-show-update-notification'));
                                    addNotification({
                                        title: 'Update Notification Triggered',
                                        message: 'The update notification should appear at the top.',
                                        type: 'info',
                                        duration: 2000
                                    });
                                }}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                            >
                                <Download size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Force Update Notification</div>
                                    <div className="text-xs opacity-80 truncate">Test the "Update Available" overlay</div>
                                </div>
                            </button>

                            {/* Force Rating Prompt */}
                            {onForceRatingPrompt && (
                                <button
                                    onClick={() => {
                                        onForceRatingPrompt();
                                        addNotification({
                                            title: 'Rating Prompt Triggered',
                                            message: 'The rating prompt should appear now.',
                                            type: 'info',
                                            duration: 2000
                                        });
                                    }}
                                    className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                                >
                                    <Star size={20} className="flex-shrink-0" />
                                    <div className="text-left flex-1 min-w-0">
                                        <div className="font-medium truncate">Force Rating Prompt</div>
                                        <div className="text-xs opacity-80 truncate">Test the Windows Store rating prompt</div>
                                    </div>
                                </button>
                            )}

                            {/* Reset Rating Prompt State */}
                            <button
                                onClick={() => {
                                    ratingPrompt.reset();
                                    addNotification({
                                        title: 'Rating Prompt Reset',
                                        message: 'Rating prompt state has been cleared. Complete 10 tasks to trigger it naturally.',
                                        type: 'success',
                                        duration: 3000
                                    });
                                }}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                            >
                                <RefreshCw size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Reset Rating Prompt State</div>
                                    <div className="text-xs opacity-80 truncate">Clear rating prompt history (sessions, tasks, dismissal)</div>
                                </div>
                            </button>

                            {/* Show Rating Prompt State */}
                            <button
                                onClick={() => {
                                    const state = ratingPrompt.getState();
                                    const message = `Sessions: ${state.sessionCount}, Tasks: ${state.tasksCompleted}, Rated: ${state.hasRated}, Dismissed: ${state.hasDismissed}`;
                                    addNotification({
                                        title: 'Rating Prompt State',
                                        message,
                                        type: 'info',
                                        duration: 5000
                                    });
                                    console.log('Rating Prompt State:', state);
                                }}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-blue-600 dark:text-blue-400"
                            >
                                <MousePointerClick size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Show Rating Prompt State</div>
                                    <div className="text-xs opacity-80 truncate">View current sessions, tasks, and status</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Column 3 - Danger Zone (at the bottom on mobile, separate column on desktop) */}
                <div className="md:col-span-2 xl:col-span-1">
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-4 md:p-6 border border-red-200 dark:border-red-800/30 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">⚠️ Danger Zone</h2>
                        <div className="space-y-4">
                            <button
                                onClick={onForceSetup}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                            >
                                <Rocket size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Force Onboarding (Demo Mode)</div>
                                    <div className="text-xs opacity-80 truncate">Launch the setup wizard safely without overwriting your settings</div>
                                </div>
                            </button>

                            <button
                                onClick={clearLocalStorage}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                            >
                                <Trash2 size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Clear All Local Storage</div>
                                    <div className="text-xs opacity-80 truncate">Resets EVERYTHING: features, settings, dashboard, etc.</div>
                                </div>
                            </button>

                            <button
                                onClick={resetSetup}
                                className="w-full flex items-center gap-3 p-4 rounded-lg border border-red-200 dark:border-red-800/30 bg-white/50 dark:bg-gray-800/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                            >
                                <RefreshCw size={20} className="flex-shrink-0" />
                                <div className="text-left flex-1 min-w-0">
                                    <div className="font-medium truncate">Reset Setup Wizard</div>
                                    <div className="text-xs opacity-80 truncate">Forces the setup wizard to run again on next launch</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
