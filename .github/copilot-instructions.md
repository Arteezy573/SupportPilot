# Support Pilot - Copilot Instructions

## Project Overview
Desktop Electron application for support engineers to analyze logs, emails, and create structured livesite tickets using AI assistance.

**Tech Stack**: React 18 + TypeScript + Fluent UI v9 + Electron

## File Structure
```
src/
├── sources/
│   ├── main.ts                     # Electron main process
│   ├── preload.ts                  # IPC bridge
│   ├── renderer/
│   │   ├── index.tsx               # React entry point
│   │   ├── App.tsx                 # Root layout component
│   │   ├── components/             # UI components
│   │   ├── hooks/useChat.ts        # Chat state management
│   │   └── styles/theme.ts         # Fluent UI themes
│   └── types/
│       ├── chat.ts                 # Message, AgentAction, SupportSession
│       └── electron.ts             # IPC definitions
└── tests/                          # Mirror structure of sources/
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