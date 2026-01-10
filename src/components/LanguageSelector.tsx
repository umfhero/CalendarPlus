import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Check } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../contexts/LanguageContext';

interface LanguageSelectorProps {
    compact?: boolean;
}

export function LanguageSelector({ compact = false }: LanguageSelectorProps) {
    const { language, setLanguage } = useLanguage();

    return (
        <div
            className={clsx(
                "grid gap-2",
                compact
                    ? "grid-cols-2 sm:grid-cols-3"
                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
            )}
        >
            {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;

                return (
                    <motion.button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title={lang.name}
                        className={clsx(
                            "relative flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left overflow-hidden min-w-0",
                            isSelected
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-sm"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        )}
                    >
                        {/* Flag emoji */}
                        <span
                            className="text-xl flex-shrink-0"
                            role="img"
                            aria-label={`${lang.name} flag`}
                        >
                            {lang.flag}
                        </span>

                        {/* Native name with truncation */}
                        <span
                            className={clsx(
                                "text-sm font-medium truncate flex-1 min-w-0",
                                isSelected
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-gray-700 dark:text-gray-300"
                            )}
                        >
                            {lang.nativeName}
                        </span>

                        {/* Selection indicator */}
                        {isSelected && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0"
                            >
                                <Check className="w-4 h-4 text-blue-500" />
                            </motion.div>
                        )}
                    </motion.button>
                );
            })}
        </div>
    );
}
