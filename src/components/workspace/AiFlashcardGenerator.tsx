import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { WorkspaceFile } from '../../types/workspace';

interface AiFlashcardGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    initialFileId?: string;
    workspaceFiles: WorkspaceFile[];
    sidebarWidth: number;
    onGenerate: (fileIds: string[], deckName: string, cardCount: number) => Promise<void>;
}

export function AiFlashcardGenerator({
    isOpen,
    onClose,
    initialFileId,
    workspaceFiles,
    sidebarWidth,
    onGenerate,
}: AiFlashcardGeneratorProps) {
    const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
    const [deckName, setDeckName] = useState('');
    const [cardCount, setCardCount] = useState(20);
    const [cardCountInput, setCardCountInput] = useState('20');
    const [isGenerating, setIsGenerating] = useState(false);

    // Initialize with the initial file if provided
    useEffect(() => {
        if (initialFileId && isOpen) {
            setSelectedFileIds([initialFileId]);
            const file = workspaceFiles.find(f => f.id === initialFileId);
            if (file) {
                setDeckName(`${file.name} Flashcards`);
            }
        } else {
            // Reset when closing
            setCardCountInput('20');
        }
    }, [initialFileId, isOpen, workspaceFiles]);

    const handleAddFile = (fileId: string) => {
        if (!selectedFileIds.includes(fileId)) {
            setSelectedFileIds([...selectedFileIds, fileId]);
        }
    };

    const handleRemoveFile = (fileId: string) => {
        setSelectedFileIds(selectedFileIds.filter(id => id !== fileId));
    };

    const handleGenerate = async () => {
        if (selectedFileIds.length === 0 || !deckName.trim()) return;

        setIsGenerating(true);
        try {
            await onGenerate(selectedFileIds, deckName.trim(), cardCount);
            onClose();
            // Reset state
            setSelectedFileIds([]);
            setDeckName('');
            setCardCount(20);
            setCardCountInput('20');
        } catch (error) {
            console.error('Failed to generate flashcards:', error);
            alert('Failed to generate flashcards. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    // Filter files that can be used for flashcard generation (exclude flashcards themselves)
    const availableFiles = workspaceFiles.filter(f =>
        f.type !== 'flashcards' && !selectedFileIds.includes(f.id)
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 z-40"
                        onClick={onClose}
                    />

                    {/* Sidebar Panel */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed right-0 top-0 bottom-0 w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700"
                        style={{ left: `${sidebarWidth}px` }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Generate Flashcards
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {/* Deck Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Deck Name
                                </label>
                                <input
                                    type="text"
                                    value={deckName}
                                    onChange={(e) => setDeckName(e.target.value)}
                                    placeholder="e.g., Biology Chapter 3"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 text-gray-900 dark:text-white"
                                    style={{ '--tw-ring-color': 'var(--accent-primary)' } as React.CSSProperties}
                                />
                            </div>

                            {/* Card Count */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Number of Cards
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={cardCountInput}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow empty or numeric input only
                                        if (value === '' || /^\d+$/.test(value)) {
                                            setCardCountInput(value);
                                        }
                                    }}
                                    onBlur={() => {
                                        // Validate and clamp on blur
                                        const num = parseInt(cardCountInput) || 20;
                                        const clamped = Math.max(1, Math.min(20, num));
                                        setCardCount(clamped);
                                        setCardCountInput(clamped.toString());
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.currentTarget.blur();
                                        }
                                    }}
                                    className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-none focus:ring-2 text-gray-900 dark:text-white"
                                    style={{ '--tw-ring-color': 'var(--accent-primary)' } as React.CSSProperties}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Between 1 and 20 cards
                                </p>
                            </div>

                            {/* Selected Files */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Source Notes ({selectedFileIds.length})
                                </label>
                                <div className="space-y-2">
                                    {selectedFileIds.map(fileId => {
                                        const file = workspaceFiles.find(f => f.id === fileId);
                                        if (!file) return null;
                                        return (
                                            <div
                                                key={fileId}
                                                className="flex items-center justify-between p-2 rounded-lg bg-gray-100 dark:bg-gray-700"
                                            >
                                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                                    {file.name}
                                                </span>
                                                <button
                                                    onClick={() => handleRemoveFile(fileId)}
                                                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Add More Files */}
                            {availableFiles.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Add More Notes
                                    </label>
                                    <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                                        {availableFiles.map(file => (
                                            <button
                                                key={file.id}
                                                onClick={() => handleAddFile(file.id)}
                                                className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                                            >
                                                <Plus className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-900 dark:text-white truncate">
                                                    {file.name}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Info */}
                            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    AI will analyze your notes and generate flashcards with questions and answers.
                                    This uses minimal tokens for efficiency.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={handleGenerate}
                                disabled={selectedFileIds.length === 0 || !deckName.trim() || isGenerating}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                style={{ backgroundColor: 'var(--accent-primary)' }}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-5 h-5" />
                                        <span>Generate Flashcards</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
