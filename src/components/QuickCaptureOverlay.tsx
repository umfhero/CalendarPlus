import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Sparkles } from 'lucide-react';
import { QuickNote } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface QuickCaptureOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveNote: (note: QuickNote) => void;
    wasTriggeredFromHidden?: boolean; // True if triggered from global hotkey while window was hidden
}

// Generate a UUID (use crypto if available, fallback to simple implementation)
function generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function QuickCaptureOverlay({ isOpen, onClose, onSaveNote, wasTriggeredFromHidden }: QuickCaptureOverlayProps) {
    const { accentColor } = useTheme();
    const [content, setContent] = useState('');
    const [hasTyped, setHasTyped] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-focus on open
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            // Small delay to ensure the element is fully rendered
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setContent('');
            setHasTyped(false);
        }
    }, [isOpen]);

    // Save and close function
    const saveAndClose = useCallback(async () => {
        console.log('[QuickCapture] saveAndClose called, content length:', content.length, 'wasTriggeredFromHidden:', wasTriggeredFromHidden);

        if (content.trim()) {
            const note: QuickNote = {
                id: generateUUID(),
                content: content.trim(),
                createdAt: new Date().toISOString(),
            };
            console.log('[QuickCapture] Saving note with id:', note.id, 'content:', note.content.substring(0, 50));
            onSaveNote(note);
        }

        // If triggered from global hotkey while window was hidden, minimize it back
        if (wasTriggeredFromHidden) {
            console.log('[QuickCapture] Window was hidden before, calling IPC to minimize...');
            try {
                // @ts-ignore
                const result = await window.ipcRenderer?.invoke('close-quick-capture', true);
                console.log('[QuickCapture] IPC close-quick-capture result:', result);
            } catch (e) {
                console.warn('[QuickCapture] Failed to close quick capture via IPC:', e);
            }
        } else {
            console.log('[QuickCapture] Window was NOT hidden before, not minimizing');
        }

        onClose();
    }, [content, onClose, onSaveNote, wasTriggeredFromHidden]);

    // Handle keyboard input
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // ESC always closes (with save if there's content)
        if (e.key === 'Escape') {
            e.preventDefault();
            saveAndClose();
            return;
        }

        // Track if user has started typing real content
        if (!hasTyped && content.length > 0) {
            setHasTyped(true);
        }
    }, [hasTyped, content, saveAndClose]);

    // Close on backdrop click
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            saveAndClose();
        }
    }, [saveAndClose]);

    // Listen for global ESC to close (when overlay is open)
    useEffect(() => {
        if (!isOpen) return;

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Only handle ESC if not focused on textarea (textarea handles its own ESC)
            if (e.key === 'Escape' && document.activeElement !== textareaRef.current) {
                saveAndClose();
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [isOpen, saveAndClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    onClick={handleBackdropClick}
                >
                    {/* Dark backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Quick Capture Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="relative z-10 w-full max-w-2xl mx-4"
                    >
                        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: accentColor, boxShadow: `0 10px 15px -3px ${accentColor}40` }}
                                    >
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Capture</h2>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Start typing... ESC to save & close</p>
                                    </div>
                                </div>
                                <button
                                    onClick={saveAndClose}
                                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Content Area */}
                            <div className="p-6">
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="What's on your mind? Jot it down quickly..."
                                    className="w-full h-48 px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl resize-none focus:outline-none focus:ring-2 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base"
                                    style={{
                                        '--tw-ring-color': `${accentColor}50`,
                                        borderColor: content.trim() ? accentColor : undefined
                                    } as React.CSSProperties}
                                    autoFocus
                                />

                                {/* Helper Text */}
                                <div className="mt-4 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                        <Sparkles className="w-4 h-4" />
                                        <span>Auto-saves to Notebook</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 dark:text-gray-500">
                                            {content.length} characters
                                        </span>
                                        {content.trim() && (
                                            <motion.span
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium"
                                            >
                                                Ready to save
                                            </motion.span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Press <kbd className="px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono">ESC</kbd> or click outside to save & close
                                </p>
                                <button
                                    onClick={saveAndClose}
                                    className="px-4 py-2 rounded-lg text-white font-medium text-sm transition-all shadow-lg hover:brightness-110"
                                    style={{
                                        backgroundColor: accentColor,
                                        boxShadow: `0 10px 15px -3px ${accentColor}40`
                                    }}
                                >
                                    {content.trim() ? 'Save Note' : 'Close'}
                                </button>
                            </div>
                        </div>

                        {/* Visual accent */}
                        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${accentColor}20` }} />
                        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: `${accentColor}20` }} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
