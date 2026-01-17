import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, SkipForward, AlertCircle } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { checkSpelling, replaceWord, SpellingError } from '../../utils/spellChecker';
import clsx from 'clsx';

interface SpellCheckerModalProps {
    isOpen: boolean;
    content: string;
    onClose: () => void;
    onApply: (correctedContent: string) => void;
}

export function SpellCheckerModal({ isOpen, content, onClose, onApply }: SpellCheckerModalProps) {
    const { accentColor } = useTheme();
    const [errors, setErrors] = useState<SpellingError[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [correctedContent, setCorrectedContent] = useState(content);
    const [isChecking, setIsChecking] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);

    // Check spelling when modal opens
    useEffect(() => {
        if (isOpen) {
            setIsChecking(true);
            setCorrectedContent(content);
            setCurrentIndex(0);
            setSelectedSuggestion(null);

            checkSpelling(content).then(foundErrors => {
                setErrors(foundErrors);
                setIsChecking(false);
            });
        }
    }, [isOpen, content]);

    const currentError = errors[currentIndex];

    const handleReplace = (replacement: string) => {
        if (!currentError) return;

        // Replace the word in the corrected content
        const newContent = replaceWord(correctedContent, currentError, replacement);
        setCorrectedContent(newContent);

        // Update error indices for remaining errors
        const lengthDiff = replacement.length - currentError.word.length;
        const updatedErrors = errors.map((error, idx) => {
            if (idx <= currentIndex) return error;
            return {
                ...error,
                startIndex: error.startIndex + lengthDiff,
                endIndex: error.endIndex + lengthDiff
            };
        });

        // Remove current error and move to next
        const newErrors = updatedErrors.filter((_, idx) => idx !== currentIndex);
        setErrors(newErrors);
        setSelectedSuggestion(null);

        // Stay at same index (which now points to next error)
        if (currentIndex >= newErrors.length) {
            setCurrentIndex(Math.max(0, newErrors.length - 1));
        }
    };

    const handleSkip = () => {
        if (currentIndex < errors.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedSuggestion(null);
        }
    };

    const handleApply = () => {
        onApply(correctedContent);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
                onClick={(e) => e.target === e.currentTarget && handleCancel()}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className={clsx(
                        "relative w-[500px] max-h-[80vh] rounded-2xl overflow-hidden",
                        "bg-white dark:bg-gray-800",
                        "border border-gray-200 dark:border-gray-700",
                        "shadow-2xl flex flex-col"
                    )}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Spell Checker
                        </h3>
                        <button
                            onClick={handleCancel}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {isChecking ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-pulse text-gray-500">Checking spelling...</div>
                            </div>
                        ) : errors.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Check className="w-12 h-12 text-green-500 mb-3" />
                                <p className="text-lg font-medium text-gray-900 dark:text-white">
                                    No spelling errors found!
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Your text looks great.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Progress */}
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <span>Error {currentIndex + 1} of {errors.length}</span>
                                    <div className="flex-1 mx-4 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-300"
                                            style={{
                                                width: `${((currentIndex + 1) / errors.length) * 100}%`,
                                                backgroundColor: accentColor
                                            }}
                                        />
                                    </div>
                                </div>

                                {currentError && (
                                    <>
                                        {/* Misspelled Word */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Misspelled Word
                                            </label>
                                            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                <AlertCircle className="w-5 h-5 text-red-500" />
                                                <span className="text-lg font-mono text-red-700 dark:text-red-400">
                                                    {currentError.word}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Suggestions */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Suggestions
                                            </label>
                                            {currentError.suggestions.length > 0 ? (
                                                <div className="space-y-2">
                                                    {currentError.suggestions.map((suggestion, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => setSelectedSuggestion(suggestion)}
                                                            className={clsx(
                                                                "w-full px-4 py-3 rounded-lg text-left transition-all",
                                                                "border-2",
                                                                selectedSuggestion === suggestion
                                                                    ? "border-current bg-opacity-10"
                                                                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600",
                                                                "text-gray-900 dark:text-white font-medium"
                                                            )}
                                                            style={{
                                                                borderColor: selectedSuggestion === suggestion ? accentColor : undefined,
                                                                backgroundColor: selectedSuggestion === suggestion ? `${accentColor}20` : undefined
                                                            }}
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-gray-500 italic">
                                                    No suggestions available
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                onClick={() => selectedSuggestion && handleReplace(selectedSuggestion)}
                                                disabled={!selectedSuggestion}
                                                className={clsx(
                                                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg",
                                                    "text-white font-medium transition-opacity",
                                                    !selectedSuggestion && "opacity-50 cursor-not-allowed"
                                                )}
                                                style={{ backgroundColor: accentColor }}
                                            >
                                                <Check className="w-4 h-4" />
                                                Replace
                                            </button>
                                            <button
                                                onClick={handleSkip}
                                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                            >
                                                <SkipForward className="w-4 h-4" />
                                                Skip
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleApply}
                            className="px-4 py-2 rounded-lg text-white font-medium"
                            style={{ backgroundColor: accentColor }}
                        >
                            Apply Changes
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
