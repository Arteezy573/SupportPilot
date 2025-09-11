# Development Hot Reload Setup

This document describes the hot reload configuration for the Support Pilot renderer process.

## Hot Reload Configuration

### Webpack Dev Configuration (`webpack.dev.config.js`)

The development configuration includes:
- **React Fast Refresh**: Preserves component state during hot reloads
- **Hot Module Replacement (HMR)**: Updates modules without full page reload
- **Source Maps**: `eval-source-map` for fast rebuilds with debugging support
- **TypeScript Transpilation**: Fast compilation with `transpileOnly: true`
- **Dev Server**: Serves files from memory for faster reloads

### Key Features

1. **React Fast Refresh Plugin**: 
   - Preserves React component state during updates
   - Handles component error boundaries
   - Only reloads changed components

2. **Development Server**:
   - Runs on `http://localhost:9000`
   - Hot reload and live reload enabled
   - CORS and CSP headers configured for Electron

3. **Performance Optimizations**:
   - Transpile-only TypeScript compilation for speed
   - Runtime chunk splitting for better HMR
   - Memory-based file serving (no disk writes)

## Available Scripts

### Basic Development Scripts
- `npm run dev:server` - Start webpack dev server with hot reload
- `npm run dev:main` - Build main process in watch mode
- `npm run dev:preload` - Build preload script in watch mode

### Combined Workflows
- `npm run dev:hot` - Start main + preload watch + dev server
- `npm run start:hot` - Full hot reload workflow with Electron
- `npm run start:watch` - Standard development with file watching

## Usage Instructions

### Method 1: Hot Reload with Electron (Recommended)
```bash
npm run start:hot
```
This will:
1. Build main process in watch mode
2. Build preload script in watch mode  
3. Wait for builds to complete
4. Start webpack dev server with hot reload
5. Wait for dev server to be ready
6. Launch Electron with development mode

### Method 2: Manual Development
```bash
# Terminal 1: Start main process watch
npm run dev:main

# Terminal 2: Start preload watch  
npm run dev:preload

# Terminal 3: Start dev server
npm run dev:server

# Terminal 4: Start Electron (after builds complete)
npm run electron:dev
```

### Method 3: Dev Server Only (for testing)
```bash
npm run dev:server
# Then open http://localhost:9000 in browser
```

## Hot Reload Testing

The hot reload setup includes:
- **Component State Preservation**: React state persists during component updates
- **Fast Compilation**: TypeScript changes compile in ~50-100ms
- **Automatic Browser Refresh**: Changes appear instantly without manual refresh
- **Error Overlay**: Build errors displayed in the browser (disabled for Electron)

## Configuration Files

- `webpack.dev.config.js` - Hot reload webpack configuration
- `tsconfig.renderer.json` - TypeScript config for renderer process
- `src/sources/renderer/index.tsx` - React entry point with hot reload support
- `scripts/dev-setup.js` - Development orchestration script (excluded from ESLint)
- `eslint.config.js` - ESLint configuration with scripts directory excluded

## Troubleshooting

### Common Issues

1. **Port 9000 in use**: Change port in `webpack.dev.config.js`
2. **HMR not working**: Ensure React Fast Refresh plugin is enabled
3. **Slow compilation**: Check TypeScript `transpileOnly` setting
4. **CSP errors**: Verify Content Security Policy headers in dev server config

### Debug Commands
```bash
# Check dev server status
curl http://localhost:9000

# Validate webpack config
npx webpack --config webpack.dev.config.js --validate

# TypeScript compilation check
npx tsc --noEmit --project tsconfig.renderer.json
```

## Performance Metrics

Typical hot reload performance:
- **Initial compilation**: ~1-2 seconds
- **Hot updates**: ~50-100ms  
- **Full reload**: ~200-500ms
- **Memory usage**: Files served from memory (no disk I/O)

This setup provides a fast, efficient development experience with instant feedback for React component changes.
