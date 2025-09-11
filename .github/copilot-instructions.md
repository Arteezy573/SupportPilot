# 🧠 Copilot Instructions for Support Pilot
## 🔍 Project Summary
Electron desktop app for support engineers to analyze logs/emails and create structured livesite tickets using AI.
Stack: React 18 · TypeScript · Fluent UI v9 · Electron

## 📁 File Overview
src/
├── main.ts           # Electron main process
├── preload.ts        # Secure IPC bridge
├── ipc/handlers.ts   # IPC channel handlers
├── utils/            # Logging, env detection
├── types/            # Typed IPC + UI interfaces
└── renderer/         # React UI entry, components, hooks
tests/                # Mirrors src/ for unit tests


## 🧩 Key Components

SupportPilotHeader: Branding + history
SuggestedActions: Summarize + Create ICM
AgentMessageCard: AI response container
useChat: Chat state, file uploads, persistence

## 🔐 Electron Architecture
### Security-first 3-layer model:

Main Process: App lifecycle, window config, menu, single-instance enforcement
Preload Script: Typed API bridge via contextBridge, exposes window.electronAPI
IPC Handlers: Modular logic for app/window/supportPilot actions

IPC Flow:
React UI → window.electronAPI → ipcRenderer.invoke → ipcMain.handle → Response


## 🧪 Build & Test Enforcement
Copilot must ensure:

All code builds via npm run build
Tests pass via npm run test
Style checks via npm run format + npx eslint


## ⚙️ TypeScript & Webpack

Multiple tsconfig.*.json for main, preload, renderer, tests
Modular webpack.*.js configs for each target
Use path aliases (@/components, etc.)
Dev server: HMR on port 9000


## ✅ Design & Security Principles

Fluent UI tokens, dark/light themes
Accessibility + error/loading states
Context isolation, input validation, external link sandboxing
Typed { success, data?, error? } responses
Structured logging with correlation IDs

## 🧠 Copilot Guidance
When generating code:

Use existing types/interfaces
Respect IPC channel names and structure
Follow component architecture and file conventions
Always include error handling and logging
Ensure build/test/style scripts pass. The build command takes time, so make sure you wait and get the final terminal output showing 'webpack x.xxx compiled successfully in xxx ms' or any pack failures.