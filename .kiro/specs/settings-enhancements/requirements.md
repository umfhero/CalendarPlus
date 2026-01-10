# Requirements Document

## Introduction

This document specifies the requirements for enhancing the Settings page in Thoughts+ with three major features: a language selection system with visual flags for non-native English speakers, a redesigned appearance section with more compact controls, and a custom theme system allowing users to create, save, and manage personalized themes.

## Glossary

- **Settings_Page**: The application settings interface where users configure preferences
- **Language_Selector**: A UI component allowing users to select their preferred display language
- **Language_Flag**: A visual country/region flag icon representing a language option
- **Appearance_Section**: The settings area containing theme, accent color, and font options
- **Custom_Theme**: A user-created theme configuration storing accent color, app colors, and font preferences
- **Theme_Manager**: The system responsible for creating, saving, loading, and deleting custom themes
- **Theme_Preset**: A predefined theme configuration (Light, Dark, or Custom)
- **Accent_Color**: The primary highlight color used throughout the application UI
- **App_Colors**: The set of background, text, and border colors defining the theme appearance
- **i18n_System**: The internationalization system managing translations and locale settings

## Requirements

### Requirement 1: Language Selection

**User Story:** As a non-native English speaker, I want to select my preferred language with visual flags, so that I can use the application in my native language and easily identify language options.

#### Acceptance Criteria

1. THE Settings_Page SHALL display a Language section with a dropdown or grid of language options
2. WHEN displaying language options, THE Language_Selector SHALL show both the language name in its native script and a corresponding country/region flag icon
3. THE Language_Selector SHALL support at minimum: English, Spanish, French, German, Portuguese, Japanese, Chinese (Simplified), Korean, Italian, and Russian
4. WHEN a user selects a language, THE i18n_System SHALL persist the selection to local storage
5. WHEN the application loads, THE i18n_System SHALL apply the previously selected language preference
6. THE Language_Selector SHALL display the current language selection clearly with visual indication

### Requirement 2: Text Overflow Prevention

**User Story:** As a user viewing the application in different languages, I want all text to be properly formatted without overflow, so that the interface remains clean and readable regardless of language.

#### Acceptance Criteria

1. WHEN displaying translated text, THE Settings_Page SHALL ensure text does not overflow container boundaries
2. THE Settings_Page SHALL use text truncation with ellipsis for labels that exceed container width
3. THE Settings_Page SHALL use appropriate CSS properties (text-overflow, overflow-hidden, whitespace-nowrap or word-wrap) to prevent layout breaking
4. WHEN containers have fixed widths, THE Settings_Page SHALL ensure text wraps appropriately or truncates gracefully

### Requirement 3: Compact Appearance Controls

**User Story:** As a user, I want the accent color and font selection areas to be more compact, so that I have more screen space for other settings and can see all options without excessive scrolling.

#### Acceptance Criteria

1. THE Appearance_Section SHALL display accent color options in a more compact grid layout
2. THE Appearance_Section SHALL display font options in a more compact format with smaller preview text
3. THE Appearance_Section SHALL reduce vertical spacing between color and font sections
4. THE Appearance_Section SHALL maintain usability with adequately sized touch/click targets (minimum 32px)

### Requirement 4: Custom Theme Option

**User Story:** As a user, I want a third theme option called "Custom" alongside Light and Dark modes, so that I can have full control over my application's appearance.

#### Acceptance Criteria

1. THE Appearance_Section SHALL display three theme options: Light, Dark, and Custom
2. WHEN the Custom theme is selected, THE Appearance_Section SHALL display additional controls for customizing app colors
3. THE Custom theme controls SHALL allow selection of: background color, text color, sidebar background color, border color, and card background color
4. WHEN Custom theme is active, THE Theme_Manager SHALL apply the custom colors to the application in real-time

### Requirement 5: Custom Theme Persistence

**User Story:** As a user, I want to save multiple custom themes with names, so that I can switch between different personalized appearances.

#### Acceptance Criteria

1. THE Theme_Manager SHALL allow users to save the current custom theme configuration with a user-provided name
2. THE Theme_Manager SHALL persist saved custom themes to local storage
3. WHEN the application loads, THE Theme_Manager SHALL restore the list of saved custom themes
4. THE Theme_Manager SHALL allow users to have multiple saved custom themes (minimum 10)
5. THE Theme_Manager SHALL prevent duplicate theme names by appending a number suffix if needed

### Requirement 6: Custom Theme Management

**User Story:** As a user, I want to load, edit, and delete my saved custom themes, so that I can manage my theme collection effectively.

#### Acceptance Criteria

1. THE Theme_Manager SHALL display a list of saved custom themes with their names
2. WHEN a user selects a saved theme, THE Theme_Manager SHALL load and apply that theme's configuration
3. THE Theme_Manager SHALL allow users to delete saved custom themes
4. WHEN deleting a theme, THE Theme_Manager SHALL show a confirmation prompt
5. THE Theme_Manager SHALL allow users to update/overwrite an existing saved theme with current settings
6. IF the currently active custom theme is deleted, THEN THE Theme_Manager SHALL revert to the default Light theme

### Requirement 7: Custom Theme Data Structure

**User Story:** As a developer, I want custom themes to store all relevant appearance settings, so that themes are complete and self-contained.

#### Acceptance Criteria

1. THE Custom_Theme data structure SHALL store: theme name, accent color, background color, text color, sidebar background color, border color, card background color, and selected font
2. THE Custom_Theme data structure SHALL include a unique identifier for each saved theme
3. THE Custom_Theme data structure SHALL include a creation timestamp
4. WHEN serializing custom themes, THE Theme_Manager SHALL encode them using JSON format

### Requirement 8: Theme Preview

**User Story:** As a user, I want to see a preview of my custom theme settings, so that I can visualize changes before applying them.

#### Acceptance Criteria

1. THE Appearance_Section SHALL display a live preview of the custom theme as colors are adjusted
2. THE preview SHALL update in real-time as the user modifies color values
3. THE preview SHALL show representative UI elements including sidebar, content area, and cards
