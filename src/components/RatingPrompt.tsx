import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart } from 'lucide-react';
import { ratingPrompt } from '../utils/ratingPrompt';
import { showNativeStoreRating, isNativeRatingAvailable } from '../utils/windowsStoreRating';

/**
 * Rating Prompt Component
 * 
 * Shows a beautiful custom UI prompting users to rate ThoughtsPlus on the Windows Store.
 * 
 * NOTE: The native Windows Store rating dialog is NOT available because NodeRT
 * (the only WinRT binding for Node.js) is abandoned and incompatible with Node.js 24+.
 * The code below attempts to use it but will always fall back to the custom UI.
 * 
 * See docs/ENABLE_NATIVE_RATING.md for technical details.
 */

interface RatingPromptProps {
    onClose: () => void;
}

export function RatingPrompt({ onClose }: RatingPromptProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [useNativeDialog] = useState(() => isNativeRatingAvailable());

    // If native dialog is available, try to show it immediately
    useEffect(() => {
        if (useNativeDialog) {
            handleRateWithNative();
        }
    }, [useNativeDialog]);

    const handleRateWithNative = async () => {
        try {
            const result = await showNativeStoreRating();

            if (result === null) {
                // Native dialog not available, show custom UI
                return;
            }

            // Native dialog was shown
            if (result.success || result.status === 'succeeded') {
                ratingPrompt.markAsRated();
            } else if (result.status === 'canceled') {
                ratingPrompt.markAsDismissed();
            }
            // For network errors, don't mark as dismissed so we can try again later

            setIsVisible(false);
            setTimeout(onClose, 300);
        } catch (error) {
            console.error('Error showing native rating dialog:', error);
            // Fall back to custom UI by not closing
        }
    };

    const handleRate = async () => {
        try {
            // Mark as rated before opening store
            ratingPrompt.markAsRated();

            // Open Windows Store review page
            // @ts-ignore
            const success = await window.ipcRenderer?.invoke('open-store-review');

            if (!success) {
                console.warn('Failed to open Windows Store review page');
            }
        } catch (error) {
            console.error('Error opening store review:', error);
        }

        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleMaybeLater = () => {
        ratingPrompt.markAsMaybeLater(); // Will remind in 1 week
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    const handleDismiss = () => {
        ratingPrompt.markAsDismissed(); // Never show again
        setIsVisible(false);
        setTimeout(onClose, 300);
    };

    // If native dialog is being used, don't render custom UI
    if (useNativeDialog) {
        return null;
    }

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                        onClick={handleDismiss}
                    />

                    {/* Modal - Centered in viewport */}
                    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                            className="w-full max-w-md mx-4 pointer-events-auto"
                        >
                            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 relative border border-gray-200/50 dark:border-gray-700/50">
                                {/* Close button */}
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>

                                {/* Icon - No background */}
                                <div className="flex justify-center mb-6">
                                    <Heart
                                        className="text-red-500"
                                        size={40}
                                        fill="currentColor"
                                    />
                                </div>

                                {/* Content */}
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                        Enjoying ThoughtsPlus?
                                    </h2>
                                    <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Your feedback helps us improve and reach more users. Would you mind taking a moment to rate us on the Microsoft Store?
                                    </p>
                                </div>

                                {/* Actions - Clean buttons with no backgrounds */}
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={handleRate}
                                        className="w-full text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                    >
                                        Rate on Microsoft Store
                                    </button>
                                    <button
                                        onClick={handleMaybeLater}
                                        className="w-full text-gray-600 dark:text-gray-400 font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                                    >
                                        Maybe later
                                    </button>
                                </div>

                                {/* Small note */}
                                <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
                                    We'll remind you in a week if you choose "Maybe later"
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
