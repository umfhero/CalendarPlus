# Build Instructions for ThoughtsPlus

## Platform-Specific Builds

### Windows (Current Platform)
```bash
npm run build
# or
npm run build:installer
```

This will create:
- `ThoughtsPlus-Setup-6.0.7.exe` (NSIS installer)
- `ThoughtsPlus 6.0.7.appx` (Windows Store package)

### macOS
**Note:** macOS builds should be created on a macOS machine for proper code signing.

```bash
npm run build:mac
```

This will create:
- `ThoughtsPlus-6.0.7-x64.dmg` (Intel Macs)
- `ThoughtsPlus-6.0.7-arm64.dmg` (Apple Silicon)
- `ThoughtsPlus-6.0.7-x64.zip` (Intel Macs - portable)
- `ThoughtsPlus-6.0.7-arm64.zip` (Apple Silicon - portable)

### Linux
**Note:** Linux builds should be created on a Linux machine or WSL2 for proper packaging.

```bash
npm run build:linux
```

This will create:
- `ThoughtsPlus-6.0.7-x86_64.AppImage` (Universal Linux)
- `ThoughtsPlus-6.0.7-amd64.deb` (Debian/Ubuntu)
- `ThoughtsPlus-6.0.7-x86_64.rpm` (Fedora/RHEL)

### Build All Platforms
```bash
npm run build:all
```

## Cross-Platform Building

### Using GitHub Actions (Recommended)
The best way to build for all platforms is using GitHub Actions CI/CD. Create `.github/workflows/build.yml`:

```yaml
name: Build Multi-Platform

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, ubuntu-latest, windows-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build:compile
      
      - name: Build for macOS
        if: matrix.os == 'macos-latest'
        run: npm run build:mac
      
      - name: Build for Linux
        if: matrix.os == 'ubuntu-latest'
        run: npm run build:linux
      
      - name: Build for Windows
        if: matrix.os == 'windows-latest'
        run: npm run build
      
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: release/*
```

### Using Docker for Linux Builds (Alternative)
```bash
docker run --rm -v ${PWD}:/project electronuserland/builder:wine npm run build:linux
```

## Troubleshooting

### Windows Symlink Issues
If you encounter symlink errors on Windows when building Linux packages, you need to either:
1. Run as Administrator
2. Enable Developer Mode in Windows Settings
3. Build on a Linux machine or WSL2

### macOS Code Signing
For distributing macOS builds, you'll need:
- Apple Developer account
- Valid code signing certificate
- Notarization setup

Add to package.json build config:
```json
"mac": {
  "identity": "Developer ID Application: Your Name (TEAM_ID)"
}
```

## Output Structure

All builds are placed in the `release/` directory:
```
release/
├── macos/
│   ├── ThoughtsPlus-6.0.7-x64.dmg
│   ├── ThoughtsPlus-6.0.7-arm64.dmg
│   └── ...
├── linux/
│   ├── ThoughtsPlus-6.0.7-x86_64.AppImage
│   ├── ThoughtsPlus-6.0.7-amd64.deb
│   └── ThoughtsPlus-6.0.7-x86_64.rpm
└── windows/
    ├── ThoughtsPlus-Setup-6.0.7.exe
    └── ThoughtsPlus 6.0.7.appx
```
