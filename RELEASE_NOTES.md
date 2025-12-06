# Calendar Plus v4.5.0 Release Notes

## 🎉 What's New

### Setup Wizard

- **First-Run Onboarding**: New interactive setup wizard guides you through initial configuration
- **Data Location Selection**: Choose where to store your calendar data (local or cloud sync)
- **Easy Integration Setup**: Configure API keys, GitHub profile, and analytics in one streamlined flow
- **Multi-Device Ready**: Setup wizard helps you configure cloud sync for seamless multi-device usage

### UI/UX Improvements

- **Refreshed Application Tour**: Updated screenshots and documentation in README
- **Improved Image Quality**: Enhanced visibility and clarity of all interface screenshots
- **Better Documentation**: Clearer getting started guide with step-by-step instructions

### Bug Fixes & Polish

- **TypeScript Cleanup**: Fixed unused variable warnings in SetupWizard component
- **Build Process**: Improved packaging workflow for more reliable installer generation

## 📦 Installation

### Windows Installer (Recommended)

Download `Calendar Plus Setup 4.5.0.exe` and run the installer. Follow the setup wizard to install Calendar Plus on your system.

**Features:**

- Guided installation wizard
- Desktop shortcut creation
- Start Menu integration
- Clean uninstallation support
- User-level installation (no admin required)

**Size:** ~147 MB

## 🚀 Usage

1. Run the installer
2. Complete the first-run setup wizard:
   - Choose your data storage location (local or cloud)
   - Configure integrations (optional)
   - Customize your preferences
3. Launch Calendar Plus from desktop shortcut or Start Menu
4. Use keyboard shortcuts for quick navigation (Ctrl+1-5)
5. Access Settings anytime to adjust configurations

## 🛠️ Technical Details

- **Built with:** Electron 29.4.6, React 18, TypeScript, Vite
- **Platform:** Windows x64
- **Compression:** zlib
- **Installation:** User-level install (no admin rights required)

## 🔧 System Requirements

- **OS:** Windows 10 or later (64-bit)
- **RAM:** 4GB minimum, 8GB recommended
- **Disk Space:** 300MB free space
- **Display:** 1280x720 minimum resolution

## 📝 Notes

- The setup wizard only appears on first run
- All settings can be reconfigured anytime via Settings page
- Cloud sync works with OneDrive, Dropbox, or any cloud folder
- Feature toggles and preferences sync automatically across devices

## 🐛 Known Issues

None reported for v4.5.0

## 💬 Feedback

Found a bug or have a suggestion? [Open an issue on GitHub](https://github.com/umfhero/CalendarPlus/issues/new)

---

**Previous Versions:**

- v4.0: User-configurable integrations, multi-device sync
- v3.x: Feature toggles, customizable dashboard
- v2.x: Initial feature set with calendar, drawing, GitHub stats
- v1.x: Basic calendar functionality
