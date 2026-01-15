import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Wand2, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../contexts/ThemeContext';
import { NerdCell, NerdCellType } from '../types';

interface AiBackboneModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (cells: NerdCell[]) => void;
    existingContent: string;
}

export function AiBackboneModal({ isOpen, onClose, onGenerate, existingContent }: AiBackboneModalProps) {
    const { accentColor } = useTheme();
    const [userRequest, setUserRequest] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [previewCells, setPreviewCells] = useState<{ type: NerdCellType; content: string }[] | null>(null);

    const handleGenerate = async () => {
        if (!userRequest.trim()) return;

        setIsProcessing(true);
        setErrorMessage(null);
        setPreviewCells(null);

        try {
            // @ts-ignore
            const result = await window.ipcRenderer?.invoke('generate-nerdbook-backbone', userRequest, existingContent);

            if (result?.error === 'API_KEY_MISSING') {
                setErrorMessage('Please configure your AI API key in Settings → AI Configuration.');
                return;
            }

            if (result?.error) {
                setErrorMessage(result.message || 'Failed to generate backbone. Please try again.');
                return;
            }

            if (result?.cells && Array.isArray(result.cells)) {
                setPreviewCells(result.cells);
            } else {
                setErrorMessage('AI returned an invalid response. Please try rephrasing your request.');
            }
        } catch (error: any) {
            console.error('AI Backbone Error:', error);
            setErrorMessage('An error occurred. Please check your API key and try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirm = () => {
        if (!previewCells) return;

        const newCells: NerdCell[] = previewCells.map(cell => ({
            id: crypto.randomUUID(),
            type: cell.type,
            content: cell.content,
            createdAt: new Date().toISOString(),
        }));

        onGenerate(newCells);
        resetAndClose();
    };

    const resetAndClose = () => {
        setUserRequest('');
        setPreviewCells(null);
        setErrorMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={resetAndClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-white/60 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2 text-lg font-bold text-gray-800 dark:text-gray-100">
                        <Wand2 className="w-5 h-5" style={{ color: accentColor }} />
                        AI Backbone Generator
                    </div>
                    <button
                        onClick={resetAndClose}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <AnimatePresence mode="wait">
                        {!previewCells ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                {/* Info box */}
                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>How it works:</strong> Describe what you want to learn or add to your notes.
                                        The AI will create a structure with headings, code templates, and prompts for you to fill in.
                                    </p>
                                </div>

                                {errorMessage && (
                                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        What would you like to add?
                                    </label>
                                    <textarea
                                        value={userRequest}
                                        onChange={(e) => setUserRequest(e.target.value)}
                                        placeholder="e.g., 'Add Python variables section' or 'Create a section about loops with examples' or 'Add notes about React hooks'"
                                        className="w-full h-32 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 resize-none font-medium"
                                        style={{ '--tw-ring-color': `${accentColor}50` } as any}
                                        autoFocus
                                        spellCheck={true}
                                    />
                                </div>

                                <button
                                    onClick={handleGenerate}
                                    disabled={!userRequest.trim() || isProcessing}
                                    className="w-full py-4 rounded-xl text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                                    style={{
                                        backgroundColor: accentColor,
                                        boxShadow: `0 10px 25px -5px ${accentColor}30`
                                    }}
                                >
                                    {isProcessing ? (
                                        <>
                                            <Sparkles className="w-5 h-5 animate-spin" />
                                            Generating Structure...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="w-5 h-5" />
                                            Generate Backbone
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                        Preview ({previewCells.length} cells)
                                    </h3>
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                        Ready to add
                                    </span>
                                </div>

                                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                                    {previewCells.map((cell, index) => (
                                        <div
                                            key={index}
                                            className={clsx(
                                                "p-3 rounded-lg border text-sm",
                                                cell.type === 'code'
                                                    ? "bg-gray-900 border-gray-700 font-mono text-gray-300"
                                                    : cell.type === 'markdown'
                                                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-gray-700 dark:text-gray-300"
                                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                                            )}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={clsx(
                                                    "text-xs px-2 py-0.5 rounded font-medium",
                                                    cell.type === 'code'
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : cell.type === 'markdown'
                                                            ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                            : "bg-gray-500/20 text-gray-600 dark:text-gray-400"
                                                )}>
                                                    {cell.type}
                                                </span>
                                            </div>
                                            <pre className="whitespace-pre-wrap text-xs leading-relaxed overflow-hidden max-h-32">
                                                {cell.content.length > 300
                                                    ? cell.content.substring(0, 300) + '...'
                                                    : cell.content}
                                            </pre>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setPreviewCells(null)}
                                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold transition-all"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        className="flex-1 py-3 rounded-xl text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                                        style={{
                                            backgroundColor: accentColor,
                                            boxShadow: `0 10px 25px -5px ${accentColor}30`
                                        }}
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        Add to Notebook
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
