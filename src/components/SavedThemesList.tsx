import { useState } from 'react';
import { Check, Trash2, RefreshCw, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { SavedTheme } from '../contexts/ThemeContext';

interface SavedThemesListProps {
    themes: SavedTheme[];
    activeThemeId?: string;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string) => void;
}

export function SavedThemesList({
    themes,
    activeThemeId,
    onSelect,
    onDelete,
    onUpdate
}: SavedThemesListProps) {
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteConfirmId(id);
    };

    const handleConfirmDelete = (id: string) => {
        onDelete(id);
        setDeleteConfirmId(null);
    };

    const handleCancelDelete = () => {
        setDeleteConfirmId(null);
    };

    if (themes.length === 0) {
        return (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <Palette className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No saved themes yet</p>
                <p className="text-xs mt-1">Save your custom theme to see it here</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Saved Themes ({themes.length})
                </span>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {themes.map((theme) => {
                    const isActive = theme.id === activeThemeId;
                    const isDeleting = deleteConfirmId === theme.id;

                    return (
                        <motion.div
                            key={theme.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={clsx(
                                "p-3 rounded-xl border transition-all",
                                isActive
                                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                                    : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                            )}
                        >
                            <AnimatePresence mode="wait">
                                {isDeleting ? (
                                    <motion.div
                                        key="delete-confirm"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                                            Delete "{theme.name}"?
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleConfirmDelete(theme.id)}
                                                className="px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
                                            >
                                                Delete
                                            </button>
                                            <button
                                                onClick={handleCancelDelete}
                                                className="p-1.5 rounded-lg bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-300 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="theme-info"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Color preview dots */}
                                            <div className="flex -space-x-1 shrink-0">
                                                <div
                                                    className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                                                    style={{ backgroundColor: theme.colors.backgroundColor }}
                                                    title="Background"
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                                                    style={{ backgroundColor: theme.colors.sidebarBackground }}
                                                    title="Sidebar"
                                                />
                                                <div
                                                    className="w-4 h-4 rounded-full border-2 border-white dark:border-gray-800"
                                                    style={{ backgroundColor: theme.accentColor }}
                                                    title="Accent"
                                                />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">
                                                        {theme.name}
                                                    </span>
                                                    {isActive && (
                                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(theme.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            {!isActive && (
                                                <button
                                                    onClick={() => onSelect(theme.id)}
                                                    className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition-colors"
                                                    title="Load theme"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                            {isActive && (
                                                <button
                                                    onClick={() => onUpdate(theme.id)}
                                                    className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 transition-colors"
                                                    title="Update with current settings"
                                                >
                                                    <RefreshCw className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteClick(theme.id)}
                                                className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors"
                                                title="Delete theme"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
