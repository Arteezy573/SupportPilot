# Support Pilot - Copilot Instructions

## Project Overview
Desktop Electron application for support engineers to analyze logs, emails, and create structured livesite tickets using AI assistance.

**Tech Stack**: React 18 + TypeScript + Fluent UI v9 + Electron

## File Structure
```
src/
├── sources/
│   ├── main.ts                     # Electron main process entry point
│   ├── preload.ts                  # Secure IPC bridge (contextBridge)
│   ├── ipc/
│   │   └── handlers.ts             # Modular IPC channel handlers
│   ├── utils/
│   │   ├── environment.ts          # Environment detection utilities
│   │   ├── logger.ts              # Structured logging system
│   │   └── index.ts               # Utils module exports
│   ├── types/
│   │   ├── main.ts                # Main process interfaces
│   │   ├── electron.ts            # IPC API definitions
│   │   └── chat.ts                # Chat/UI type definitions
│   └── renderer/
│       ├── index.tsx              # React entry point
│       ├── App.tsx                # Root layout component
│       ├── components/            # UI components
│       ├── hooks/useChat.ts       # Chat state management
│       └── styles/theme.ts        # Fluent UI themes
└── tests/                         # Mirror structure of sources/
```

## Component Architecture

### Header & Navigation
- **SupportPilotHeader**: Tool branding + ChatHistoryButton
- **GreetingText**: Personalized welcome + usage guidance

### User Actions
- **SuggestedActions**: Contains SummarizeIssueButton + CreateICMButton
- **MessageInputArea**: AttachFileButton + MessageInputField

### Agent Interface (ReAct Pattern)
- **AgentMessageCard**: Main container for AI responses
  - **AgentThoughtSection**: Shows reasoning process
  - **AgentActionSection**: Displays actions taken
  - **AgentResultExpandable**: Collapsible results (Fluent UI Accordion)
  - **AgentCitationsList**: References/sources (Fluent UI DetailsList)

### Core Functionality
- **useChat Hook**: Manages conversation state, file uploads, local persistence
- **File Handling**: Drag-and-drop support for logs/emails with preview

## Design Principles
- Follow Fluent UI design tokens for consistency
- Support dark/light themes
- Implement proper loading states and error handling
- Maintain accessibility standards
- Optimize for support engineering workflows

## Electron Architecture & IPC Communication

### Three-Layer Security Model
The application follows Electron's recommended security architecture with three distinct processes:

#### 1. **Main Process** (`src/sources/main.ts`)
- **Role**: Node.js backend process that manages application lifecycle and native OS integration
- **Responsibilities**:
  - Creates and manages BrowserWindow instances with security configurations
  - Handles application menu (File, Edit, View, Window) with keyboard shortcuts
  - Manages app lifecycle events (ready, window-all-closed, before-quit)
  - Enforces single-instance behavior and security policies
  - Sets up comprehensive window configuration with security hardening
- **Security Features**:
  - Context isolation enabled (`contextIsolation: true`)
  - Node integration disabled in renderer (`nodeIntegration: false`)
  - Web security enabled with content policy restrictions
  - Single-instance enforcement to prevent multiple app instances
- **Key Functions**:
  - `createMainWindow()`: Configures secure BrowserWindow with Support Pilot optimizations
  - `createApplicationMenu()`: Sets up native menu with IPC event triggers
  - Window state management and platform-specific optimizations

#### 2. **Preload Script** (`src/sources/preload.ts`)
- **Role**: Secure bridge between main and renderer processes using contextBridge
- **Security Context**: Runs in isolated context with access to both Node.js and DOM APIs
- **API Surface**: Exposes limited, typed APIs to renderer through `window.electronAPI`
- **API Categories**:
  - **App APIs**: Version and name information (`app.getVersion()`, `app.getName()`)
  - **Dialog APIs**: File selection dialogs (`dialog.openFile()`)
  - **Window APIs**: Window controls (`window.minimize()`, `window.maximize()`, `window.close()`)
  - **Shell APIs**: External link handling (`shell.openExternal()`)
  - **IPC Event APIs**: Menu event listeners (`ipc.onMenuNewSession()`, `ipc.onMenuFilesSelected()`)
  - **Support Pilot APIs**: Core business logic (`supportPilot.attachFiles()`, `supportPilot.analyzeLog()`, `supportPilot.processEmailThread()`)
- **Error Handling**: Comprehensive try-catch with structured error responses
- **Security Measures**: Disables Node.js globals in renderer context, freezes sensitive objects
- **Development Support**: Conditional dev-only APIs for debugging and testing

#### 3. **IPC Handlers** (`src/sources/ipc/handlers.ts`)
- **Role**: Modular IPC channel implementations that handle renderer requests
- **Architecture**: Organized into logical handler groups with dependency injection
- **Handler Categories**:
  - **App Handlers** (`setupAppHandlers()`): Basic application information
  - **Window Handlers** (`setupWindowHandlers(mainWindow)`): Window controls and file dialogs
  - **Support Pilot Handlers** (`setupSupportPilotHandlers(mainWindow)`): Business logic for log analysis and email processing
- **Type Safety**: Uses comprehensive TypeScript interfaces from `types/entities.ts`
- **Structured Logging**: Integrated logger with different levels (DEBUG, INFO, WARN, ERROR)
- **Error Resilience**: Graceful error handling with detailed error messages and fallbacks

### IPC Communication Flow
```
Renderer Process (React UI)
    ↓ window.electronAPI.supportPilot.analyzeLog(content)
Preload Script (contextBridge)
    ↓ ipcRenderer.invoke("support-pilot:analyze-log", content)
Main Process (IPC Handlers)
    ↓ setupSupportPilotHandlers() → ipcMain.handle("support-pilot:analyze-log", ...)
Business Logic (File Processing, AI Analysis)
    ↓ Structured Response with success/error states
Main Process (Response)
    ↑ Returns typed response (AnalyzeLogResponse)
Preload Script (Type Validation)
    ↑ Error handling and type consistency
Renderer Process (UI Update)
    ↑ Updates UI with analysis results or error states
```

### Data Flow Architecture
1. **User Action**: User attaches files or submits content in React UI
2. **API Call**: React components call `window.electronAPI.supportPilot.*` methods
3. **IPC Bridge**: Preload script converts calls to `ipcRenderer.invoke()` with channel names
4. **Handler Routing**: Main process routes to appropriate handler function based on channel
5. **Business Logic**: Handlers process files, analyze logs, extract email data
6. **Response Flow**: Structured responses flow back through IPC bridge to UI
7. **UI Update**: React components update state and render results/errors

### Type Safety & Error Handling
- **End-to-End Types**: TypeScript interfaces ensure type safety from UI to backend
- **Structured Responses**: All APIs return consistent `{ success: boolean, data?, error? }` format
- **Error Boundaries**: Multiple layers of error handling prevent crashes
- **Logging Integration**: Structured logging with correlation IDs for debugging
- **Memory Management**: Automatic cleanup of IPC listeners to prevent memory leaks

### Security Considerations
- **Principle of Least Privilege**: Renderer only has access to explicitly exposed APIs
- **Input Validation**: All IPC inputs are validated and sanitized
- **File Access Controls**: File operations limited to specific types and size restrictions
- **External Content**: Links open in external browser, not within app
- **Development vs Production**: Different security policies for dev and production modes

## Build System Architecture

### TypeScript Configuration Structure
The project uses multiple TypeScript configurations for different build targets:

- **`tsconfig.json`** - Main configuration with strict type checking
  - Target: ES2022 with DOM libraries
  - React JSX support with modern transform (`"jsx": "react-jsx"`)
  - Path aliases for clean imports (`@/components/*`, `@/hooks/*`, etc.)
  - Excludes MCP server files and focuses on Electron app sources
  - Strict mode enabled for comprehensive type safety

- **`tsconfig.main.json`** - Electron main process configuration
  - Extends base config for main.ts and preload.ts
  - CommonJS modules for Node.js compatibility
  - Node.js types only (no DOM/React types)
  - Outputs compiled JavaScript for Electron main process

- **`tsconfig.renderer.json`** - React renderer process configuration
  - ESNext modules for modern React development
  - DOM and React type definitions
  - Targets renderer components, hooks, and UI code
  - Optimized for browser-like environment within Electron

- **`tsconfig.test.json`** - Testing environment configuration
  - Jest and React Testing Library type definitions
  - CommonJS modules for test runner compatibility
  - Targets all test files with proper testing types

### Webpack Configuration Structure
Multi-target webpack setup for Electron application development:

- **`webpack.common.js`** - Shared base configuration
  - TypeScript compilation with ts-loader
  - Path alias resolution matching TypeScript paths
  - Asset handling (CSS, images, fonts)
  - Source map generation for debugging
  - Development and production mode support

- **`webpack.main.config.js`** - Main Electron process
  - Target: `electron-main` for Node.js environment
  - Entry: `src/sources/main.ts`
  - Uses `tsconfig.main.json` for compilation
  - Electron externals to avoid bundling native modules
  - No minification for better debugging

- **`webpack.preload.config.js`** - Preload script
  - Target: `electron-preload` for secure context bridge
  - Entry: `src/sources/preload.ts`
  - Isolated bundle for security between main/renderer
  - Node.js compatibility with Electron APIs

- **`webpack.renderer.config.js`** - React renderer process
  - Target: `electron-renderer` for browser-like environment
  - Entry: `src/sources/renderer/index.tsx`
  - Uses `tsconfig.renderer.json` for React compilation
  - HTML template generation with HtmlWebpackPlugin
  - Code splitting for vendor libraries
  - Optimized for React/DOM development

- **`webpack.dev.config.js`** - Development server
  - Hot module replacement for fast development
  - Development server on port 9000
  - Source maps for debugging
  - Content Security Policy headers

- **`webpack.config.js`** - Combined multi-target build
  - Exports array of all configurations
  - Enables building main, preload, and renderer simultaneously
  - Supports both development and production modes

### Build Scripts Purpose
- **`build`** - Complete production build (clean + all targets)
- **`build:main`** - Main process only (for debugging main process)
- **`build:preload`** - Preload script only (for IPC debugging)
- **`build:renderer`** - React app only (for UI development)
- **`dev`** - Watch mode for all processes (full development)
- **`dev:server`** - Hot reload server (UI-focused development)
- **`start:dev`** - Complete development workflow with Electron launch

### Reminder
After making changes to TypeScript or Webpack configuration files, make sure to:
1. Run `npm run format` to ensure code style consistency.
1. Run `npx eslint` for tests and sources code to catch linting issues.
1. Run `npm run test` to ensure all tests pass.