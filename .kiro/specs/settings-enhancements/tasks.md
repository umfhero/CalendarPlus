# Implementation Plan: Settings Enhancements

## Overview

This implementation plan covers the addition of language selection with flags, compact appearance controls, and a custom theme system to the Thoughts+ Settings page. Tasks are ordered to build incrementally, with core infrastructure first, then UI components, and finally integration.

## Tasks

- [x] 1. Create Language System Infrastructure
  - [x] 1.1 Create LanguageContext with supported languages array
    - Create `src/contexts/LanguageContext.tsx`
    - Define LanguageCode type and LanguageOption interface
    - Implement SUPPORTED_LANGUAGES array with 10 languages (en, es, fr, de, pt, ja, zh, ko, it, ru)
    - Include native names and emoji flags for each language
    - Implement language state with localStorage persistence
    - _Requirements: 1.1, 1.3, 1.4, 1.5_

  - [x] 1.2 Write property test for language persistence round trip
    - **Property 1: Language Persistence Round Trip**
    - **Validates: Requirements 1.4, 1.5**

- [x] 2. Extend ThemeContext for Custom Themes
  - [x] 2.1 Add custom theme types and state to ThemeContext
    - Add CustomThemeColors interface
    - Add SavedTheme interface
    - Extend theme type to include 'custom'
    - Add customThemeColors state
    - Add savedThemes state array
    - _Requirements: 4.1, 7.1, 7.2, 7.3_

  - [x] 2.2 Implement custom theme persistence functions
    - Implement saveCurrentTheme(name) function
    - Implement loadTheme(id) function
    - Implement deleteTheme(id) function
    - Implement updateTheme(id) function
    - Add localStorage read/write for custom-themes
    - Handle duplicate names with numeric suffix
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.2, 6.3, 6.5_

  - [x] 2.3 Write property test for theme serialization round trip
    - **Property 2: Theme Serialization Round Trip**
    - **Validates: Requirements 7.4**

  - [x] 2.4 Write property test for theme name uniqueness
    - **Property 3: Theme Name Uniqueness**
    - **Validates: Requirements 5.5**

  - [x] 2.5 Write property test for saved themes persistence
    - **Property 4: Saved Themes Persistence Round Trip**
    - **Validates: Requirements 5.2, 5.3, 5.4**

  - [x] 2.6 Implement active theme deletion fallback
    - When deleting active custom theme, revert to 'light'
    - Update theme state and CSS variables
    - _Requirements: 6.6_

  - [x] 2.7 Write property test for active theme deletion fallback
    - **Property 5: Active Theme Deletion Fallback**
    - **Validates: Requirements 6.6**

  - [x] 2.8 Write property test for theme data structure completeness
    - **Property 6: Theme Data Structure Completeness**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [x] 3. Checkpoint - Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Custom Theme CSS Application
  - [x] 4.1 Apply custom theme colors to CSS variables
    - Update useEffect in ThemeContext to handle 'custom' theme
    - Set CSS variables for backgroundColor, textColor, sidebarBackground, borderColor, cardBackground
    - Ensure real-time updates when colors change
    - _Requirements: 4.4_

  - [x] 4.2 Write property test for theme loading applies all colors
    - **Property 7: Theme Loading Applies All Colors**
    - **Validates: Requirements 6.2**

- [x] 5. Create Language Selector UI Component
  - [x] 5.1 Create LanguageSelector component
    - Create `src/components/LanguageSelector.tsx`
    - Render grid of language options
    - Display flag emoji and native name for each language
    - Show visual selection indicator for current language
    - Add hover tooltip with English name
    - Apply text-overflow and truncation CSS for long names
    - _Requirements: 1.1, 1.2, 1.6, 2.1, 2.2, 2.3_

- [x] 6. Create Custom Theme Editor Components
  - [x] 6.1 Create CustomThemeEditor component
    - Create `src/components/CustomThemeEditor.tsx`
    - Add color picker for background color
    - Add color picker for text color
    - Add color picker for sidebar background
    - Add color picker for border color
    - Add color picker for card background
    - Wire onChange to update customThemeColors in context
    - _Requirements: 4.2, 4.3_

  - [x] 6.2 Create ThemePreview component for custom themes
    - Update existing AppPreview or create new ThemePreview component
    - Accept custom colors as props
    - Render mini app preview with sidebar, content, cards
    - Update in real-time as colors change
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 6.3 Create SavedThemesList component
    - Create `src/components/SavedThemesList.tsx`
    - Display list of saved themes with names
    - Add select button to load theme
    - Add delete button with confirmation modal
    - Add update/overwrite button
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

- [x] 7. Checkpoint - UI Components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrate into Settings Page
  - [x] 8.1 Add Language section to Settings page
    - Add new section container with Globe icon
    - Integrate LanguageSelector component
    - Position appropriately in settings layout
    - _Requirements: 1.1_

  - [x] 8.2 Redesign Appearance section for compactness
    - Reduce accent color grid size (smaller buttons)
    - Reduce font preview card sizes
    - Decrease vertical spacing between sections
    - Ensure minimum 32px touch targets maintained
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 8.3 Add Custom theme option to theme selector
    - Add third theme button for "Custom"
    - Show CustomThemeEditor when Custom is selected
    - Show SavedThemesList below editor
    - Add "Save Theme" button with name input
    - _Requirements: 4.1, 4.2, 5.1_

- [x] 9. Add Text Overflow Prevention
  - [x] 9.1 Apply overflow prevention CSS to Settings containers
    - Add overflow-hidden, text-overflow: ellipsis to label containers
    - Add whitespace-nowrap or word-wrap as appropriate
    - Test with longest translated strings
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 10. Wire Up LanguageContext Provider
  - [x] 10.1 Add LanguageProvider to App.tsx
    - Import LanguageProvider
    - Wrap app with LanguageProvider
    - Ensure proper provider nesting order
    - _Requirements: 1.5_

- [x] 11. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify language selection persists across app restart
  - Verify custom themes save and load correctly
  - Verify appearance section is more compact
  - Verify no text overflow in any language

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript and follows existing project patterns
