# Cross-Platform Build Guide for ThoughtsPlus

This guide explains how to build ThoughtsPlus for Windows, macOS, and Linux.

## Quick Start

### Automated Builds (Recommended)

The easiest way to build for all platforms is using GitHub Actions:

1. Push a tag to trigger the workflow:
   ```bash
   git tag v6.0.8
   git push origin v6.0.8
   ```

2. GitHub Actions will automatically build for all platforms and create a release

3. Download artifacts from the Actions tab or the Releases page

### Manual Builds

#### Prerequisites
- Node.js 18 or later
- npm or yarn
- Platform-specific tools (see below)

#### Build Commands

```bash
# Install dependencies
npm install

# Build for current platform
npm run build

# Build for specific platforms
npm run build:mac      # macOS only
npm run build:linux    # Linux only
npm run build:all      # All platforms (requires proper environment)
```

## Platform-Specific Instructions

### Windows

**Requirements:**
- Windows 10 or later
- Node.js 18+
- Visual Studio Build Tools (for native modules)

**Build:**
```bash
npm install
npm run build
```

**Output:**
- `release/ThoughtsPlus-Setup-6.0.7.exe` - NSIS installer
- `release/ThoughtsPlus 6.0.7.appx` - Microsoft Store package

**Notes:**
- Building on Windows creates both EXE and APPX packages
- APPX requires Windows 10 SDK for signing (optional for development)

### macOS

**Requirements:**
- macOS 10.13 or later
- Xcode Command Line Tools: `xcode-select --install`
- Node.js 18+

**Build:**
```bash
npm install
npm run build:mac
```

**Output:**
- `release/ThoughtsPlus-6.0.7-x64.dmg` - Intel Mac installer
- `release/ThoughtsPlus-6.0.7-arm64.dmg` - Apple Silicon installer
- `release/ThoughtsPlus-6.0.7-x64.zip` - Intel Mac portable
- `release/ThoughtsPlus-6.0.7-arm64.zip` - Apple Silicon portable

**Code Signing (Optional):**

For distribution outside development, you'll need an Apple Developer account:

1. Get a Developer ID certificate from Apple
2. Add to package.json:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)",
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "build/entitlements.mac.plist",
     "entitlementsInherit": "build/entitlements.mac.plist"
   }
   ```

3. Notarize the app:
   ```bash
   npm run build:mac
   xcrun notarytool submit release/ThoughtsPlus-6.0.7-x64.dmg \
     --apple-id "your@email.com" \
     --password "app-specific-password" \
     --team-id "TEAM_ID"
   ```

### Linux

**Requirements:**
- Ubuntu 20.04+ / Debian 10+ / Fedora 35+ (or equivalent)
- Node.js 18+
- Build essentials: `sudo apt install build-essential`

**Build:**
```bash
npm install
npm run build:linux
```

**Output:**
- `release/ThoughtsPlus-6.0.7-x86_64.AppImage` - Universal Linux
- `release/ThoughtsPlus-6.0.7-amd64.deb` - Debian/Ubuntu
- `release/ThoughtsPlus-6.0.7-x86_64.rpm` - Fedora/RHEL

**Notes:**
- AppImage is the most portable format
- DEB and RPM require distribution-specific dependencies

## Cross-Platform Building

### Building macOS on Windows/Linux

Not officially supported, but possible with:

1. **Using GitHub Actions** (Recommended)
   - Push code to GitHub
   - Let Actions build on macOS runners
   - Download artifacts

2. **Using OSX Cross** (Advanced)
   - Requires macOS SDK (legal gray area)
   - Complex setup, not recommended

### Building Linux on Windows

**Option 1: WSL2 (Recommended)**
```bash
# Install WSL2
wsl --install

# Inside WSL2
cd /mnt/c/path/to/project
npm install
npm run build:linux
```

**Option 2: Docker**
```bash
docker run --rm -v ${PWD}:/project electronuserland/builder:wine \
  /bin/bash -c "cd /project && npm install && npm run build:linux"
```

**Option 3: GitHub Actions**
- Use the provided workflow file
- Builds automatically on Linux runners

### Building Windows on macOS/Linux

**Using Wine (Limited Support):**
```bash
# Install Wine
brew install wine  # macOS
sudo apt install wine  # Linux

# Build
npm run build
```

**Better: Use GitHub Actions**
- Builds on native Windows runners
- Proper signing and packaging

## Troubleshooting

### Windows: Symlink Errors
```
Error: A required privilege is not held by the client
```

**Solution:**
1. Run as Administrator, OR
2. Enable Developer Mode in Windows Settings, OR
3. Build on Linux/WSL2

### macOS: Code Signing Failed
```
Error: No identity found for signing
```

**Solution:**
- For development: Set `CSC_IDENTITY_AUTO_DISCOVERY=false`
- For distribution: Get Apple Developer certificate

### Linux: Missing Dependencies
```
Error: cannot find -lxxx
```

**Solution:**
```bash
# Ubuntu/Debian
sudo apt install build-essential libx11-dev libxkbfile-dev

# Fedora
sudo dnf groupinstall "Development Tools"
sudo dnf install libX11-devel
```

### All Platforms: Native Module Errors
```
Error: The module was compiled against a different Node.js version
```

**Solution:**
```bash
# Clear and rebuild
rm -rf node_modules
npm install
npm run build:compile
```

## CI/CD Setup

### GitHub Actions (Included)

The repository includes `.github/workflows/build-release.yml` which:
- Builds on all three platforms
- Creates release artifacts
- Publishes to GitHub Releases on tags

**Usage:**
```bash
# Create and push a tag
git tag v6.0.8
git push origin v6.0.8

# GitHub Actions will automatically:
# 1. Build for Windows, macOS, and Linux
# 2. Create a GitHub Release
# 3. Upload all installers
```

### Manual Release Process

1. Update version in `package.json` and `version.json`
2. Commit changes: `git commit -am "Bump version to 6.0.8"`
3. Create tag: `git tag v6.0.8`
4. Push: `git push && git push --tags`
5. Wait for GitHub Actions to complete
6. Edit release notes on GitHub

## Distribution

### Windows
- **Primary:** Microsoft Store (automatic updates)
- **Alternative:** GitHub Releases (manual updates)

### macOS
- **Primary:** GitHub Releases
- **Future:** Mac App Store (requires paid Apple Developer account)

### Linux
- **Primary:** GitHub Releases
- **Future:** Snap Store, Flathub, AUR

## File Size Optimization

Current build sizes:
- Windows EXE: ~150 MB
- macOS DMG: ~180 MB (per architecture)
- Linux AppImage: ~170 MB

**Optimization tips:**
1. Enable ASAR packaging (currently disabled)
2. Remove unused dependencies
3. Use webpack/vite tree-shaking
4. Compress assets

## Support

For build issues:
- Check [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md)
- Open an issue: https://github.com/umfhero/ThoughtsPlus/issues
- Discord: (coming soon)
