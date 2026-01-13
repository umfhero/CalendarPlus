import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, Trash2, Edit2, Clock, SortAsc, SortDesc, Check, X } from 'lucide-react';
import { QuickNote } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

interface NotebookPageProps {
    notes: QuickNote[];
    onDeleteNote: (noteId: string) => void;
    onUpdateNote: (note: QuickNote) => void;
}

export function NotebookPage({ notes, onDeleteNote, onUpdateNote }: NotebookPageProps) {
    const { accentColor } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    // Filter and sort notes
    const filteredNotes = useMemo(() => {
        let result = [...notes];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(note =>
                note.content.toLowerCase().includes(query)
            );
        }

        // Sort by date
        result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    }, [notes, searchQuery, sortOrder]);

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (days === 1) {
            return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    };

    // Handle edit save
    const handleSaveEdit = (noteId: string) => {
        const note = notes.find(n => n.id === noteId);
        if (note && editContent.trim()) {
            onUpdateNote({
                ...note,
                content: editContent.trim(),
                updatedAt: new Date().toISOString(),
            });
        }
        setEditingNoteId(null);
        setEditContent('');
    };

    // Handle edit cancel
    const handleCancelEdit = () => {
        setEditingNoteId(null);
        setEditContent('');
    };

    // Start editing a note
    const startEditing = (note: QuickNote) => {
        setEditingNoteId(note.id);
        setEditContent(note.content);
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` }}
                    >
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notebook</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {notes.length} {notes.length === 1 ? 'note' : 'notes'} • Quick captured thoughts
                        </p>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 w-64 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 text-sm"
                            style={{ '--tw-ring-color': `${accentColor}50` } as React.CSSProperties}
                        />
                    </div>

                    {/* Sort Toggle */}
                    <button
                        onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                        className="p-2.5 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
                        style={{ '--hover-border': accentColor } as React.CSSProperties}
                        title={sortOrder === 'newest' ? 'Showing newest first' : 'Showing oldest first'}
                    >
                        {sortOrder === 'newest' ? (
                            <SortDesc className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        ) : (
                            <SortAsc className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        )}
                    </button>
                </div>
            </div>

            {/* Notes Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredNotes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div
                            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                            style={{ backgroundColor: `${accentColor}15` }}
                        >
                            <BookOpen className="w-10 h-10" style={{ color: accentColor }} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {searchQuery ? 'No notes found' : 'No notes yet'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                            {searchQuery
                                ? 'Try a different search term'
                                : 'Use the global hotkey (Ctrl+Shift+N) anywhere to quickly capture a thought!'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence mode="popLayout">
                            {filteredNotes.map((note, index) => (
                                <motion.div
                                    key={note.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 30,
                                        delay: index * 0.05
                                    }}
                                    className="group relative"
                                >
                                    <div className={clsx(
                                        "bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300",
                                        "hover:shadow-lg dark:hover:shadow-gray-900/20"
                                    )}
                                        style={{ '--hover-shadow': `${accentColor}15` } as React.CSSProperties}
                                    >
                                        {/* Note Content */}
                                        <div className="p-4">
                                            {editingNoteId === note.id ? (
                                                <div className="space-y-3">
                                                    <textarea
                                                        value={editContent}
                                                        onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full h-32 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 resize-none focus:outline-none focus:ring-2 text-sm"
                                                        style={{ '--tw-ring-color': `${accentColor}50` } as React.CSSProperties}
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSaveEdit(note.id)}
                                                            className="p-2 rounded-lg text-white hover:brightness-110 transition-all"
                                                            style={{ backgroundColor: accentColor }}
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed line-clamp-6 whitespace-pre-wrap">
                                                        {note.content}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {editingNoteId !== note.id && (
                                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{formatDate(note.createdAt)}</span>
                                                    {note.updatedAt && (
                                                        <span className="text-gray-400">• edited</span>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => startEditing(note)}
                                                        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                                        style={{ '--hover-color': accentColor } as React.CSSProperties}
                                                        title="Edit"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>

                                                    {deleteConfirmId === note.id ? (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => {
                                                                    onDeleteNote(note.id);
                                                                    setDeleteConfirmId(null);
                                                                }}
                                                                className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                                title="Confirm delete"
                                                            >
                                                                <Check className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                onClick={() => setDeleteConfirmId(null)}
                                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setDeleteConfirmId(note.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-500 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
