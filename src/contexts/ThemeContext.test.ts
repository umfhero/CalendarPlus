import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { resetMockStorage, getMockStorage, setMockStorage } from '../test/setup';
import {
    SavedTheme,
    CustomThemeColors,
    serializeThemes,
    deserializeThemes,
    generateUniqueThemeName,
    isValidSavedTheme,
    DEFAULT_CUSTOM_COLORS,
    computeDeleteThemeResult,
    computeCustomThemeCSSVariables,
    CUSTOM_THEME_CSS_VARIABLES,
} from './ThemeContext';

// Arbitrary for generating valid hex colors
const hexCharArbitrary = fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f');
const hexColorArbitrary = fc.tuple(
    hexCharArbitrary, hexCharArbitrary, hexCharArbitrary,
    hexCharArbitrary, hexCharArbitrary, hexCharArbitrary
).map(chars => `#${chars.join('')}`);

// Arbitrary for generating valid CustomThemeColors
const customThemeColorsArbitrary: fc.Arbitrary<CustomThemeColors> = fc.record({
    backgroundColor: hexColorArbitrary,
    textColor: hexColorArbitrary,
    sidebarBackground: hexColorArbitrary,
    borderColor: hexColorArbitrary,
    cardBackground: hexColorArbitrary,
});

// Arbitrary for generating valid SavedTheme objects
const savedThemeArbitrary: fc.Arbitrary<SavedTheme> = fc.record({
    id: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    accentColor: hexColorArbitrary,
    colors: customThemeColorsArbitrary,
    font: fc.constantFrom('Inter', 'Poppins', 'Outfit', 'Playfair Display', 'Architects Daughter'),
    createdAt: fc.integer({ min: 1577836800000, max: 1893456000000 }).map(ts => new Date(ts).toISOString()), // 2020-2030
});

// Arbitrary for generating arrays of SavedTheme
const savedThemesArrayArbitrary = fc.array(savedThemeArbitrary, { minLength: 0, maxLength: 10 });

describe('ThemeContext Property Tests', () => {
    beforeEach(() => {
        resetMockStorage();
    });

    /**
     * Feature: settings-enhancements, Property 2: Theme Serialization Round Trip
     * 
     * For any valid SavedTheme object with all required fields (id, name, accentColor, 
     * colors, font, createdAt), serializing to JSON and deserializing should produce 
     * an object with identical field values.
     * 
     * Validates: Requirements 7.4
     */
    describe('Property 2: Theme Serialization Round Trip', () => {
        it('serializing and deserializing a single theme returns equivalent object', () => {
            fc.assert(
                fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                    const themes = [theme];
                    const serialized = serializeThemes(themes);
                    const deserialized = deserializeThemes(serialized);

                    expect(deserialized.length).toBe(1);
                    expect(deserialized[0].id).toBe(theme.id);
                    expect(deserialized[0].name).toBe(theme.name);
                    expect(deserialized[0].accentColor).toBe(theme.accentColor);
                    expect(deserialized[0].font).toBe(theme.font);
                    expect(deserialized[0].createdAt).toBe(theme.createdAt);
                    expect(deserialized[0].colors.backgroundColor).toBe(theme.colors.backgroundColor);
                    expect(deserialized[0].colors.textColor).toBe(theme.colors.textColor);
                    expect(deserialized[0].colors.sidebarBackground).toBe(theme.colors.sidebarBackground);
                    expect(deserialized[0].colors.borderColor).toBe(theme.colors.borderColor);
                    expect(deserialized[0].colors.cardBackground).toBe(theme.colors.cardBackground);
                }),
                { numRuns: 100 }
            );
        });

        it('serializing and deserializing multiple themes preserves all themes', () => {
            fc.assert(
                fc.property(savedThemesArrayArbitrary, (themes: SavedTheme[]) => {
                    const serialized = serializeThemes(themes);
                    const deserialized = deserializeThemes(serialized);

                    expect(deserialized.length).toBe(themes.length);

                    for (let i = 0; i < themes.length; i++) {
                        expect(deserialized[i].id).toBe(themes[i].id);
                        expect(deserialized[i].name).toBe(themes[i].name);
                        expect(deserialized[i].accentColor).toBe(themes[i].accentColor);
                        expect(deserialized[i].colors).toEqual(themes[i].colors);
                    }
                }),
                { numRuns: 100 }
            );
        });
    });
});


/**
 * Feature: settings-enhancements, Property 3: Theme Name Uniqueness
 * 
 * For any sequence of theme save operations using the same name, all resulting 
 * stored theme names should be unique, with numeric suffixes appended to duplicates 
 * (e.g., "My Theme", "My Theme (2)", "My Theme (3)").
 * 
 * Validates: Requirements 5.5
 */
describe('Property 3: Theme Name Uniqueness', () => {
    it('generateUniqueThemeName produces unique names for duplicate base names', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                fc.integer({ min: 2, max: 10 }),
                (baseName: string, count: number) => {
                    const themes: SavedTheme[] = [];
                    const generatedNames: string[] = [];

                    // Simulate saving themes with the same base name multiple times
                    for (let i = 0; i < count; i++) {
                        const uniqueName = generateUniqueThemeName(baseName, themes);
                        generatedNames.push(uniqueName);

                        // Add a mock theme with this name
                        themes.push({
                            id: `id_${i}`,
                            name: uniqueName,
                            accentColor: '#000000',
                            colors: DEFAULT_CUSTOM_COLORS,
                            font: 'Inter',
                            createdAt: new Date().toISOString(),
                        });
                    }

                    // All generated names should be unique
                    const uniqueNames = new Set(generatedNames);
                    expect(uniqueNames.size).toBe(count);

                    // First name should be the base name
                    expect(generatedNames[0]).toBe(baseName);

                    // Subsequent names should have numeric suffixes
                    for (let i = 1; i < count; i++) {
                        expect(generatedNames[i]).toBe(`${baseName} (${i + 1})`);
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('generateUniqueThemeName returns base name when no duplicates exist', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
                savedThemesArrayArbitrary,
                (baseName: string, existingThemes: SavedTheme[]) => {
                    // Filter out any themes that would conflict with baseName
                    const nonConflictingThemes = existingThemes.filter(
                        t => t.name !== baseName && !t.name.startsWith(`${baseName} (`)
                    );

                    const uniqueName = generateUniqueThemeName(baseName, nonConflictingThemes);
                    expect(uniqueName).toBe(baseName);
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Feature: settings-enhancements, Property 4: Saved Themes Persistence Round Trip
 * 
 * For any collection of saved themes (up to the maximum limit), saving to localStorage 
 * and reloading the application should restore all themes with their complete 
 * configurations intact.
 * 
 * Validates: Requirements 5.2, 5.3, 5.4
 */
describe('Property 4: Saved Themes Persistence Round Trip', () => {
    it('saving themes to storage and loading them back preserves all theme data', () => {
        fc.assert(
            fc.property(savedThemesArrayArbitrary, (themes: SavedTheme[]) => {
                // Serialize themes (simulating save to localStorage)
                const serialized = serializeThemes(themes);

                // Store in mock storage
                setMockStorage('custom-themes', serialized);

                // Load from mock storage (simulating app reload)
                const loadedJson = getMockStorage()['custom-themes'];
                const loadedThemes = deserializeThemes(loadedJson);

                // Verify all themes are restored
                expect(loadedThemes.length).toBe(themes.length);

                // Verify each theme's complete configuration
                for (let i = 0; i < themes.length; i++) {
                    const original = themes[i];
                    const loaded = loadedThemes[i];

                    expect(loaded.id).toBe(original.id);
                    expect(loaded.name).toBe(original.name);
                    expect(loaded.accentColor).toBe(original.accentColor);
                    expect(loaded.font).toBe(original.font);
                    expect(loaded.createdAt).toBe(original.createdAt);
                    expect(loaded.colors.backgroundColor).toBe(original.colors.backgroundColor);
                    expect(loaded.colors.textColor).toBe(original.colors.textColor);
                    expect(loaded.colors.sidebarBackground).toBe(original.colors.sidebarBackground);
                    expect(loaded.colors.borderColor).toBe(original.colors.borderColor);
                    expect(loaded.colors.cardBackground).toBe(original.colors.cardBackground);
                }
            }),
            { numRuns: 100 }
        );
    });

    it('supports storing up to 10 themes (minimum requirement)', () => {
        fc.assert(
            fc.property(
                fc.array(savedThemeArbitrary, { minLength: 10, maxLength: 10 }),
                (themes: SavedTheme[]) => {
                    const serialized = serializeThemes(themes);
                    setMockStorage('custom-themes', serialized);

                    const loadedJson = getMockStorage()['custom-themes'];
                    const loadedThemes = deserializeThemes(loadedJson);

                    expect(loadedThemes.length).toBe(10);
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Feature: settings-enhancements, Property 5: Active Theme Deletion Fallback
 * 
 * For any scenario where the currently active custom theme is deleted, the 
 * application should automatically revert to the Light theme as the active theme.
 * 
 * Validates: Requirements 6.6
 */
describe('Property 5: Active Theme Deletion Fallback', () => {
    it('deleting the active theme triggers fallback to light', () => {
        fc.assert(
            fc.property(
                fc.array(savedThemeArbitrary, { minLength: 1, maxLength: 10 }),
                fc.nat(),
                (themes: SavedTheme[], indexSeed: number) => {
                    // Ensure unique IDs by modifying them
                    const uniqueThemes = themes.map((t, i) => ({ ...t, id: `${t.id}_${i}` }));

                    // Pick a random theme to be the active one
                    const activeIndex = indexSeed % uniqueThemes.length;
                    const activeThemeId = uniqueThemes[activeIndex].id;

                    // Delete the active theme
                    const result = computeDeleteThemeResult(uniqueThemes, activeThemeId, activeThemeId);

                    // Should trigger fallback to light
                    expect(result.shouldFallbackToLight).toBe(true);
                    expect(result.newActiveThemeId).toBe(null);

                    // Theme should be removed from list
                    expect(result.updatedThemes.length).toBe(uniqueThemes.length - 1);
                    expect(result.updatedThemes.find(t => t.id === activeThemeId)).toBeUndefined();
                }
            ),
            { numRuns: 100 }
        );
    });

    it('deleting a non-active theme does not trigger fallback', () => {
        fc.assert(
            fc.property(
                fc.array(savedThemeArbitrary, { minLength: 2, maxLength: 10 }),
                fc.nat(),
                fc.nat(),
                (themes: SavedTheme[], activeIndexSeed: number, deleteIndexSeed: number) => {
                    // Ensure unique IDs by modifying them
                    const uniqueThemes = themes.map((t, i) => ({ ...t, id: `${t.id}_${i}` }));

                    // Pick different themes for active and delete
                    const activeIndex = activeIndexSeed % uniqueThemes.length;
                    let deleteIndex = deleteIndexSeed % uniqueThemes.length;
                    if (deleteIndex === activeIndex) {
                        deleteIndex = (deleteIndex + 1) % uniqueThemes.length;
                    }

                    const activeThemeId = uniqueThemes[activeIndex].id;
                    const themeToDeleteId = uniqueThemes[deleteIndex].id;

                    // Delete a non-active theme
                    const result = computeDeleteThemeResult(uniqueThemes, themeToDeleteId, activeThemeId);

                    // Should NOT trigger fallback
                    expect(result.shouldFallbackToLight).toBe(false);
                    expect(result.newActiveThemeId).toBe(activeThemeId);

                    // Theme should be removed from list
                    expect(result.updatedThemes.length).toBe(uniqueThemes.length - 1);
                    expect(result.updatedThemes.find(t => t.id === themeToDeleteId)).toBeUndefined();

                    // Active theme should still exist
                    expect(result.updatedThemes.find(t => t.id === activeThemeId)).toBeDefined();
                }
            ),
            { numRuns: 100 }
        );
    });
});


/**
 * Feature: settings-enhancements, Property 6: Theme Data Structure Completeness
 * 
 * For any saved custom theme, the data structure should contain all required fields: 
 * a unique id, name, accentColor, colors object (with backgroundColor, textColor, 
 * sidebarBackground, borderColor, cardBackground), font, and createdAt timestamp.
 * 
 * Validates: Requirements 7.1, 7.2, 7.3
 */
describe('Property 6: Theme Data Structure Completeness', () => {
    it('isValidSavedTheme validates all required fields are present', () => {
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                // A properly generated theme should always be valid
                expect(isValidSavedTheme(theme)).toBe(true);

                // Verify all required fields exist
                expect(typeof theme.id).toBe('string');
                expect(typeof theme.name).toBe('string');
                expect(typeof theme.accentColor).toBe('string');
                expect(typeof theme.font).toBe('string');
                expect(typeof theme.createdAt).toBe('string');

                // Verify colors object has all required fields
                expect(typeof theme.colors.backgroundColor).toBe('string');
                expect(typeof theme.colors.textColor).toBe('string');
                expect(typeof theme.colors.sidebarBackground).toBe('string');
                expect(typeof theme.colors.borderColor).toBe('string');
                expect(typeof theme.colors.cardBackground).toBe('string');
            }),
            { numRuns: 100 }
        );
    });

    it('isValidSavedTheme rejects themes with missing required fields', () => {
        // Test missing id
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const { id, ...themeWithoutId } = theme;
                expect(isValidSavedTheme(themeWithoutId)).toBe(false);
            }),
            { numRuns: 100 }
        );

        // Test missing name
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const { name, ...themeWithoutName } = theme;
                expect(isValidSavedTheme(themeWithoutName)).toBe(false);
            }),
            { numRuns: 100 }
        );

        // Test missing colors
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const { colors, ...themeWithoutColors } = theme;
                expect(isValidSavedTheme(themeWithoutColors)).toBe(false);
            }),
            { numRuns: 100 }
        );

        // Test missing color property
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const { backgroundColor, ...colorsWithoutBg } = theme.colors;
                const themeWithIncompleteColors = { ...theme, colors: colorsWithoutBg };
                expect(isValidSavedTheme(themeWithIncompleteColors)).toBe(false);
            }),
            { numRuns: 100 }
        );
    });

    it('isValidSavedTheme rejects non-object values', () => {
        expect(isValidSavedTheme(null)).toBe(false);
        expect(isValidSavedTheme(undefined)).toBe(false);
        expect(isValidSavedTheme('string')).toBe(false);
        expect(isValidSavedTheme(123)).toBe(false);
        expect(isValidSavedTheme([])).toBe(false);
    });

    it('saved themes after serialization round trip maintain completeness', () => {
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const serialized = serializeThemes([theme]);
                const deserialized = deserializeThemes(serialized);

                expect(deserialized.length).toBe(1);
                expect(isValidSavedTheme(deserialized[0])).toBe(true);

                // Verify all fields are present after round trip
                const loaded = deserialized[0];
                expect(loaded.id).toBeDefined();
                expect(loaded.name).toBeDefined();
                expect(loaded.accentColor).toBeDefined();
                expect(loaded.font).toBeDefined();
                expect(loaded.createdAt).toBeDefined();
                expect(loaded.colors.backgroundColor).toBeDefined();
                expect(loaded.colors.textColor).toBeDefined();
                expect(loaded.colors.sidebarBackground).toBeDefined();
                expect(loaded.colors.borderColor).toBeDefined();
                expect(loaded.colors.cardBackground).toBeDefined();
            }),
            { numRuns: 100 }
        );
    });
});



/**
 * Feature: settings-enhancements, Property 7: Theme Loading Applies All Colors
 * 
 * For any saved custom theme that is loaded/selected, all color values from that theme 
 * (accentColor, backgroundColor, textColor, sidebarBackground, borderColor, cardBackground) 
 * should be applied to the corresponding CSS variables.
 * 
 * Validates: Requirements 6.2
 */
describe('Property 7: Theme Loading Applies All Colors', () => {
    it('computeCustomThemeCSSVariables maps all color properties to CSS variables', () => {
        fc.assert(
            fc.property(customThemeColorsArbitrary, (colors: CustomThemeColors) => {
                const cssVariables = computeCustomThemeCSSVariables(colors);

                // Verify all CSS variables are set
                expect(cssVariables['--custom-bg']).toBe(colors.backgroundColor);
                expect(cssVariables['--custom-text']).toBe(colors.textColor);
                expect(cssVariables['--custom-sidebar']).toBe(colors.sidebarBackground);
                expect(cssVariables['--custom-border']).toBe(colors.borderColor);
                expect(cssVariables['--custom-card']).toBe(colors.cardBackground);
            }),
            { numRuns: 100 }
        );
    });

    it('all custom theme color properties have corresponding CSS variable mappings', () => {
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const cssVariables = computeCustomThemeCSSVariables(theme.colors);

                // Verify the mapping covers all color properties
                const colorKeys = Object.keys(theme.colors) as (keyof CustomThemeColors)[];
                const cssVarKeys = Object.keys(CUSTOM_THEME_CSS_VARIABLES) as (keyof typeof CUSTOM_THEME_CSS_VARIABLES)[];

                // Every color property should have a CSS variable mapping
                expect(colorKeys.length).toBe(cssVarKeys.length);

                // Each color property should map to a CSS variable
                for (const colorKey of colorKeys) {
                    const cssVarName = CUSTOM_THEME_CSS_VARIABLES[colorKey];
                    expect(cssVarName).toBeDefined();
                    expect(cssVariables[cssVarName as keyof typeof cssVariables]).toBe(theme.colors[colorKey]);
                }
            }),
            { numRuns: 100 }
        );
    });

    it('CSS variable values match theme colors exactly after computation', () => {
        fc.assert(
            fc.property(savedThemeArbitrary, (theme: SavedTheme) => {
                const cssVariables = computeCustomThemeCSSVariables(theme.colors);

                // Simulate a mock CSS variable getter that returns computed values
                const mockCSSVariables: Record<string, string> = { ...cssVariables };
                const getCSSVariable = (name: string): string => mockCSSVariables[name] || '';

                // Verify each color from the theme matches the CSS variable
                expect(getCSSVariable('--custom-bg')).toBe(theme.colors.backgroundColor);
                expect(getCSSVariable('--custom-text')).toBe(theme.colors.textColor);
                expect(getCSSVariable('--custom-sidebar')).toBe(theme.colors.sidebarBackground);
                expect(getCSSVariable('--custom-border')).toBe(theme.colors.borderColor);
                expect(getCSSVariable('--custom-card')).toBe(theme.colors.cardBackground);
            }),
            { numRuns: 100 }
        );
    });

    it('loading different themes produces different CSS variable values', () => {
        fc.assert(
            fc.property(
                savedThemeArbitrary,
                savedThemeArbitrary,
                (theme1: SavedTheme, theme2: SavedTheme) => {
                    // Skip if themes have identical colors
                    const colorsMatch =
                        theme1.colors.backgroundColor === theme2.colors.backgroundColor &&
                        theme1.colors.textColor === theme2.colors.textColor &&
                        theme1.colors.sidebarBackground === theme2.colors.sidebarBackground &&
                        theme1.colors.borderColor === theme2.colors.borderColor &&
                        theme1.colors.cardBackground === theme2.colors.cardBackground;

                    if (colorsMatch) {
                        return true; // Skip this case
                    }

                    const cssVars1 = computeCustomThemeCSSVariables(theme1.colors);
                    const cssVars2 = computeCustomThemeCSSVariables(theme2.colors);

                    // At least one CSS variable should be different
                    const hasDifference =
                        cssVars1['--custom-bg'] !== cssVars2['--custom-bg'] ||
                        cssVars1['--custom-text'] !== cssVars2['--custom-text'] ||
                        cssVars1['--custom-sidebar'] !== cssVars2['--custom-sidebar'] ||
                        cssVars1['--custom-border'] !== cssVars2['--custom-border'] ||
                        cssVars1['--custom-card'] !== cssVars2['--custom-card'];

                    expect(hasDifference).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});
