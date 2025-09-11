# Support Pilot - Production Deployment Guide

## Complete Production Build and Launch Instructions

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for source code)

### 1. Production Build Process

#### Full Production Build

```powershell
# Clean previous builds
npm run clean

# Build all components in production mode (sequential to avoid conflicts)
npm run build

# Or build each component individually:
npm run build:preload   # Build preload script (IPC bridge)
npm run build:main      # Build main Electron process
npm run build:renderer  # Build React renderer with optimizations
```

#### Expected Output Structure

```
dist/
├── main.js              # Main Electron process (50.8 KiB)
├── main.js.map          # Source map for debugging
├── preload.js           # Secure IPC bridge (6.18 KiB)
├── preload.js.map       # Source map for debugging
└── renderer/            # React application files
    ├── index.html       # Entry HTML file (8.87 KiB)
    ├── renderer.js      # React app bundle (2.04 KiB minified)
    ├── vendors.js       # React/dependencies (137 KiB minified)
    └── *.map files      # Source maps for debugging
```

### 2. Production Launch Methods

#### Method 1: Direct Launch (Recommended for Testing)

```powershell
# Set production environment and launch
$env:NODE_ENV="production"
npx electron .
```

#### Method 2: Using npm Scripts

```powershell
# Build and launch production app
npm run start

# Or build separately then launch
npm run build
npm run electron
```

#### Method 3: Package for Distribution

```powershell
# Install electron-builder for packaging (if not already installed)
npm install --save-dev electron-builder

# Package for current platform
npm run dist

# Package for specific platforms
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

### 3. Production vs Development Differences

#### Production Mode Features:

- ✅ **Optimized Builds**: Minified and compressed bundles
- ✅ **No DevTools**: Developer tools disabled for security
- ✅ **Built Files**: Loads from `dist/renderer/index.html`
- ✅ **Enhanced Security**: Stricter content security policies
- ✅ **Better Performance**: Production React builds with optimizations
- ✅ **Smaller Bundle Size**: 139 KiB vs 1.14 MiB (development)

#### Development Mode Features:

- 🔧 **Hot Reload**: React Fast Refresh for rapid development
- 🔧 **DevTools**: Automatic developer tools opening
- 🔧 **Source Maps**: Full debugging capabilities
- 🔧 **Dev Server**: Webpack dev server on localhost:9000
- 🔧 **Fallback Loading**: Graceful fallback to built files if dev server unavailable

### 4. Environment Detection Logic

The application automatically detects the environment using:

1. **NODE_ENV Environment Variable** (primary)
2. **Electron Packaging Status** (fallback)

```typescript
// Environment detection priority:
if (process.env.NODE_ENV === "development") return true;
if (process.env.NODE_ENV === "production") return false;
return !app.isPackaged; // Fallback for unset NODE_ENV
```

### 5. Troubleshooting Production Issues

#### Common Issues and Solutions:

**Issue**: "Failed to load renderer files"

```
Solution: Ensure dist/renderer/ directory exists with index.html
Command: npm run build:renderer
```

**Issue**: "Preload script not found"

```
Solution: Ensure preload.js is in dist/ directory
Command: npm run build:preload
```

**Issue**: "App shows blank screen"

```
Solution: Check console for JavaScript errors in DevTools
Command: Set NODE_ENV=development and check logs
```

**Issue**: "Window state not persisting"

```
Solution: Check file permissions for window state JSON storage
Location: User data directory (app.getPath('userData'))
```

### 6. Performance Monitoring

#### Bundle Size Analysis

```powershell
# Analyze bundle sizes and dependencies
npx webpack-bundle-analyzer dist/renderer/vendors.js
```

#### Production Build Metrics

- **Main Process**: ~51 KiB (Electron backend)
- **Preload Script**: ~6 KiB (Security bridge)
- **React App**: ~139 KiB total (2 KiB app + 137 KiB vendors)
- **HTML Template**: ~9 KiB (Entry point)
- **Total App Size**: ~205 KiB (excluding Node.js/Electron runtime)

### 7. Security Considerations

#### Content Security Policy (Production)

```html
<meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; 
               script-src 'self'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self' data:;"
/>
```

#### Electron Security Features

- ✅ **Context Isolation**: Enabled (`contextIsolation: true`)
- ✅ **Node Integration**: Disabled (`nodeIntegration: false`)
- ✅ **Web Security**: Enabled (`webSecurity: true`)
- ✅ **Sandbox**: Disabled for preload access (`sandbox: false`)
- ✅ **Secure IPC**: All communication via contextBridge

### 8. Deployment Automation

#### GitHub Actions Workflow (Example)

```yaml
name: Build and Release
on:
    push:
        tags: ["v*"]

jobs:
    build:
        runs-on: windows-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - run: npm ci
            - run: npm run build
            - run: npm run dist
            - uses: actions/upload-artifact@v3
              with:
                  name: support-pilot-windows
                  path: dist/*.exe
```

### 9. Production Monitoring

#### Application Logs

- **Location**: Console output and log files
- **Levels**: DEBUG, INFO, WARN, ERROR
- **Window State**: Automatic persistence and restoration
- **Error Handling**: Graceful fallbacks and user notifications

#### Health Checks

```powershell
# Verify all production files exist
Test-Path "dist/main.js"      # Should return True
Test-Path "dist/preload.js"   # Should return True
Test-Path "dist/renderer/index.html" # Should return True
```

---

## Quick Production Launch Commands

```powershell
# One-command production build and launch
npm run clean && npm run build && $env:NODE_ENV="production" && npx electron .

# Or using the npm script
npm run start
```

**Ready for Production!** 🚀

The application now supports both development and production modes with optimized builds, proper environment detection, security features, and comprehensive error handling.
