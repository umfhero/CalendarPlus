import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Type definitions
export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'pt' | 'ja' | 'zh' | 'ko' | 'it' | 'ru';

export interface LanguageOption {
    code: LanguageCode;
    name: string;           // English name
    nativeName: string;     // Name in native script
    flag: string;           // Emoji flag
}

// Supported languages array with 10 languages
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

// Context type definition
interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: string) => string; // Translation function placeholder
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to validate language code
export function isValidLanguageCode(code: string): code is LanguageCode {
    return SUPPORTED_LANGUAGES.some(lang => lang.code === code);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<LanguageCode>('en');
    const [_isInitialized, setIsInitialized] = useState(false);

    // Load language from storage on mount
    useEffect(() => {
        const loadLanguage = async () => {
            try {
                const savedLanguage = await window.ipcRenderer?.invoke('get-global-setting', 'language');
                if (savedLanguage && isValidLanguageCode(savedLanguage)) {
                    setLanguageState(savedLanguage);
                }
            } catch (e) {
                console.log('Using default English language');
            } finally {
                setIsInitialized(true);
            }
        };
        loadLanguage();
    }, []);

    // Set language and persist to storage
    const setLanguage = async (newLanguage: LanguageCode) => {
        if (!isValidLanguageCode(newLanguage)) {
            console.error('Invalid language code:', newLanguage);
            return;
        }
        setLanguageState(newLanguage);
        try {
            await window.ipcRenderer?.invoke('save-global-setting', 'language', newLanguage);
        } catch (e) {
            console.error('Failed to save language setting', e);
        }
    };

    // Translation function placeholder - returns key for now
    // This can be extended later with actual translations
    const t = (key: string): string => {
        return key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
}
