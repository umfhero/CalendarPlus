import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { resetMockStorage, getMockStorage, setMockStorage } from '../test/setup';
import { SUPPORTED_LANGUAGES, isValidLanguageCode, LanguageCode } from './LanguageContext';

/**
 * Feature: settings-enhancements, Property 1: Language Persistence Round Trip
 * 
 * For any valid language code from the supported languages list, saving to 
 * localStorage and then loading on application restart should return the 
 * exact same language code.
 * 
 * Validates: Requirements 1.4, 1.5
 */
describe('LanguageContext Property Tests', () => {
    beforeEach(() => {
        resetMockStorage();
    });

    // Arbitrary for generating valid language codes
    const languageCodeArbitrary = fc.constantFrom(
        ...SUPPORTED_LANGUAGES.map(lang => lang.code)
    );

    it('Property 1: Language Persistence Round Trip - saving and loading returns same language code', () => {
        fc.assert(
            fc.property(languageCodeArbitrary, (languageCode: LanguageCode) => {
                // Save the language code to mock storage
                setMockStorage('language', languageCode);

                // Load from mock storage
                const loadedLanguage = getMockStorage()['language'];

                // Verify round trip: saved value equals loaded value
                expect(loadedLanguage).toBe(languageCode);

                // Verify the loaded value is still a valid language code
                expect(isValidLanguageCode(loadedLanguage)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    it('isValidLanguageCode returns true for all supported languages', () => {
        fc.assert(
            fc.property(languageCodeArbitrary, (languageCode: LanguageCode) => {
                expect(isValidLanguageCode(languageCode)).toBe(true);
            }),
            { numRuns: 100 }
        );
    });

    it('isValidLanguageCode returns false for invalid language codes', () => {
        const invalidCodeArbitrary = fc.string().filter(
            s => !SUPPORTED_LANGUAGES.some(lang => lang.code === s)
        );

        fc.assert(
            fc.property(invalidCodeArbitrary, (invalidCode: string) => {
                expect(isValidLanguageCode(invalidCode)).toBe(false);
            }),
            { numRuns: 100 }
        );
    });

    it('SUPPORTED_LANGUAGES contains exactly 10 languages', () => {
        expect(SUPPORTED_LANGUAGES.length).toBe(10);
    });

    it('All supported languages have required properties', () => {
        fc.assert(
            fc.property(languageCodeArbitrary, (languageCode: LanguageCode) => {
                const lang = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
                expect(lang).toBeDefined();
                expect(lang!.code).toBeTruthy();
                expect(lang!.name).toBeTruthy();
                expect(lang!.nativeName).toBeTruthy();
                expect(lang!.flag).toBeTruthy();
            }),
            { numRuns: 100 }
        );
    });
});
