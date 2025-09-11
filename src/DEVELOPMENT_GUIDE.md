# Support Pilot - Development Launch Guide

## Complete Development Setup and Troubleshooting

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git (for source code)
- VS Code (recommended IDE)

## 🚀 Quick Start Development

### 1. One-Command Full Development Setup

```powershell
# Install dependencies, build, and start development
npm install && npm run build:dev && npm run start:dev
```

### 2. Step-by-Step Development Setup

#### Step 1: Install Dependencies

```powershell
npm install
```

#### Step 2: Build Development Assets

```powershell
# Build all components for development
npm run build:dev

# Or build individually for debugging:
npm run build:preload:dev  # IPC bridge (7.11 KiB)
npm run build:main:dev     # Main process (51.8 KiB)
npm run build:renderer:dev # React app (1.14 MiB with source maps)
```

#### Step 3: Launch Development Environment

**🔥 Recommended: Separate Terminal Windows**

```powershell
# Terminal 1 (Webpack Dev Server) - Keep this running
npm run dev:server

# Terminal 2 (Electron App) - Main development terminal
npm run build:main:dev     # Build main process first
npm run electron:dev       # Start Electron in development mode
```

**Option A: Concurrent Development (Alternative)**

```powershell
# Single terminal with concurrent processes
npm run dev:hot
```

**Option B: Watch Mode Development**

```powershell
# Start file watchers and Electron together
npm run start:watch
```

**Option C: Quick Restart Development**

```powershell
# Rebuild and restart (useful after main/preload changes)
npm run dev:restart
```

## 🔧 Development Modes

### Hot Reload Development (Recommended)

- **Dev Server**: Webpack serves React app on http://127.0.0.1:9000
- **Hot Module Replacement**: React Fast Refresh (~88ms updates)
- **DevTools**: Automatically opens for debugging
- **Live Updates**: Changes appear instantly without restart

### Build-Only Development

- **Static Files**: Loads from `dist/renderer/index.html`
- **Manual Refresh**: Requires app restart for changes
- **Debugging**: Full source maps available
- **Fallback**: Used when dev server unavailable

## 🐛 Troubleshooting Development Issues

### Issue 1: "ERR_CONNECTION_REFUSED" on localhost:9000

**Symptoms:**

```
(node:XXXX) electron: Failed to load URL: http://localhost:9000/ with error: ERR_CONNECTION_REFUSED
```

**Root Causes & Solutions:**

#### Cause A: IPv6/IPv4 Binding Conflict

```powershell
# Check what's listening on port 9000
netstat -an | findstr ":9000"

# If you see [::1]:9000 (IPv6) instead of 127.0.0.1:9000 (IPv4):
# ✅ FIXED: webpack.dev.config.js now uses host: "127.0.0.1"
# ✅ FIXED: main.ts now connects to "http://127.0.0.1:9000"
```

#### Cause B: Dev Server Not Running

```powershell
# Start the dev server first
npm run dev:server

# Verify it's running (should show webpack compilation success)
# Expected output: "webpack 5.101.3 compiled successfully"
```

#### Cause C: Port Conflict

```powershell
# Check if another process is using port 9000
netstat -ano | findstr ":9000"

# Kill conflicting process if needed
taskkill /F /PID <process_id>

# Or change port in webpack.dev.config.js
```

#### Cause D: Firewall/Network Issues

```powershell
# Test direct access to dev server
curl http://127.0.0.1:9000

# Or open in browser to verify server responds
start http://127.0.0.1:9000
```

### Issue 2: "Unable to load preload script"

**Solution:**

```powershell
# Ensure preload script exists
npm run build:preload:dev

# Verify file exists
Test-Path "dist/preload.js"  # Should return True
```

### Issue 3: React App Not Hot Reloading

**Check React Fast Refresh:**

```powershell
# Verify dev server is running with HMR
npm run dev:server

# Look for these messages:
# "webpack 5.101.3 compiled successfully"
# "[HMR] Hot Module Replacement enabled"
```

**Test Hot Reload:**

1. Make a change to `src/sources/renderer/index.tsx`
2. Save the file
3. Changes should appear in ~88ms without full reload

### Issue 4: Blank Screen in Development

**Debugging Steps:**

```powershell
# 1. Check console for errors (DevTools auto-opens)
# 2. Verify React app is building:
npm run build:renderer:dev

# 3. Test fallback loading:
# Stop dev server and restart Electron
# Should load from dist/renderer/index.html
```

### Issue 6: Terminal Management

**Best Practice: Separate Terminal Windows**

```powershell
# Terminal 1: Dedicated Dev Server (keep running)
npm run dev:server
# Leave this terminal open and running
# Watch for "webpack compiled successfully" messages

# Terminal 2: Main Development Terminal
npm run build:main:dev && npm run electron:dev
# Use this terminal for other commands
```

**If Dev Server Terminal Gets Killed:**

```powershell
# Simply restart the dev server in a new terminal
npm run dev:server

# The Electron app should automatically reconnect
# Or restart Electron: npm run electron:dev
```

**Managing Multiple Terminals:**

- **VS Code**: Use integrated terminal split panes (`Ctrl+Shift+5`)
- **Windows Terminal**: Use tabs or panes
- **PowerShell**: Open multiple windows
- **Alternative**: Use `concurrently` with `npm run dev:hot`

### Issue 5: Window State Not Persisting

**Check JSON Storage:**

```powershell
# Window state is saved to user data directory
# Location: %APPDATA%/Support Pilot/window-state.json

# Verify permissions and file existence
Test-Path "$env:APPDATA/Support Pilot/window-state.json"
```

## 📁 Development File Structure

```
src/sources/
├── main.ts                 # Main Electron process
├── preload.ts              # Secure IPC bridge
├── renderer/               # React application
│   ├── index.tsx          # React entry point
│   ├── index.html         # HTML template
│   └── components/        # UI components (future)
├── ipc/
│   └── handlers.ts        # IPC channel handlers
├── types/
│   ├── entities.ts        # TypeScript interfaces
│   └── electron.ts        # Electron API types
└── utils/
    ├── environment.ts     # Environment detection
    ├── logger.ts          # Structured logging
    └── index.ts           # Utils exports

dist/ (Build Output)
├── main.js                # Built main process
├── preload.js             # Built preload script
└── renderer/              # Built React app
    ├── index.html         # Entry HTML
    ├── renderer.js        # React bundle
    └── vendors.js         # Dependencies
```

## ⚡ Development Performance

### Build Times (Development)

- **Main Process**: ~1000ms
- **Preload Script**: ~600ms
- **React App**: ~1200ms (with source maps)
- **Hot Reload Update**: ~88ms

### Memory Usage (Development)

- **Electron Main**: ~50-100 MB
- **Renderer Process**: ~200-400 MB (includes DevTools)
- **Webpack Dev Server**: ~100-200 MB

## 🔍 Debugging Tools

### DevTools (Auto-Opens in Development)

- **Console**: View logs and errors
- **Sources**: Debug TypeScript with source maps
- **Network**: Monitor requests and loading
- **Elements**: Inspect React components

### VS Code Integration

```json
// .vscode/launch.json (coming in task 2.10)
{
    "configurations": [
        {
            "name": "Debug Electron Main",
            "type": "node",
            "request": "attach",
            "port": 5858
        }
    ]
}
```

### Logging System

```typescript
// Available log levels in development
logger.debug("Detailed debugging information");
logger.info("General information");
logger.warn("Warning messages");
logger.error("Error messages");
```

## 🔄 Development Workflow

### Typical Development Session

```powershell
# 🔥 RECOMMENDED WORKFLOW:

# Terminal 1 (Dev Server) - Start once and leave running
npm run dev:server          # Webpack dev server on http://127.0.0.1:9000

# Terminal 2 (Main Development) - Your working terminal
npm run build:main:dev       # Build main process initially
npm run electron:dev         # Start Electron app

# When you make changes:
# - React components: Auto-reload via hot reload (~88ms)
# - Main/preload process: Run npm run build:main:dev, then restart electron:dev
# - Styles/assets: Auto-reload via dev server
```

**Alternative: Single Terminal Workflow**

```powershell
# If you prefer everything in one terminal
npm run dev:hot             # Starts all watchers concurrently
# Then in another terminal:
npm run electron:dev         # Start Electron
```

### Git Workflow Integration

```powershell
# Before committing, verify both modes work:
npm run build:dev && npm run electron:dev  # Test development
npm run build && npm run start            # Test production
```

## 🚀 Advanced Development

### Environment Variables

```powershell
# Force development mode
$env:NODE_ENV="development"
npm run electron

# Enable additional debugging
$env:ELECTRON_ENABLE_LOGGING="true"
$env:DEBUG="*"
npm run electron:dev
```

### Performance Profiling

```powershell
# Analyze bundle sizes
npx webpack-bundle-analyzer dist/renderer/vendors.js

# Memory usage profiling
npm run electron:inspect  # Enables Node.js inspector on port 5858
```

### Custom Scripts

```powershell
# Quick restart development
npm run dev:restart

# Clean and full rebuild
npm run clean && npm run build:dev

# Test hot reload functionality
npm run test:hot-reload
```

---

## 🎯 Development Checklist

### Before Starting Development:

- [ ] `npm install` completed successfully
- [ ] `npm run build:dev` builds without errors
- [ ] Dev server starts on http://127.0.0.1:9000
- [ ] Electron app connects to dev server
- [ ] Hot reload working (test with small change)
- [ ] DevTools opens automatically
- [ ] Window state persistence working

### Daily Development:

- [ ] Start dev server first (`npm run dev:server`)
- [ ] Start Electron second (`npm run electron:dev`)
- [ ] Verify hot reload on first change
- [ ] Check console for any errors
- [ ] Test fallback loading occasionally

### Before Committing:

- [ ] Development mode working
- [ ] Production build successful (`npm run build`)
- [ ] Production mode working (`npm run start`)
- [ ] No TypeScript errors
- [ ] ESLint passing

**Happy Developing!** 🎉

The development environment now provides seamless hot reload, robust error handling, and comprehensive debugging tools for efficient Support Pilot development.
