# Source Code Structure

This directory contains the complete source code for the Support Pilot Electron application.

## Directory Structure

```
src/
├── sources/                    # Application source code
│   ├── main.ts                # Electron main process entry point
│   ├── preload.ts             # Secure IPC bridge script
│   ├── renderer/              # React renderer process
│   │   ├── index.html         # Main HTML template
│   │   ├── index.tsx          # React application entry point
│   │   ├── App.tsx            # Root React component
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   └── styles/            # Styling and theme configuration
│   └── types/                 # TypeScript type definitions
│       ├── chat.ts            # Chat-related interfaces
│       └── electron.ts        # Electron IPC type definitions
└── tests/                     # Test files (mirrors sources structure)
    ├── main.test.ts           # Main process tests
    ├── preload.test.ts        # Preload script tests
    └── renderer/              # Renderer process tests
        ├── App.test.tsx       # Root component tests
        ├── components/        # Component tests
        └── hooks/             # Hook tests
```

## Key Design Principles

- **Separation of Concerns**: Main process, preload script, and renderer are clearly separated
- **Type Safety**: TypeScript throughout with strict mode enabled
- **Component Architecture**: Modular React components following Fluent UI patterns
- **Test Coverage**: Test files mirror source structure for easy maintenance
- **Secure IPC**: Preload script provides secure communication bridge

## Development Workflow

1. Source files go in `src/sources/`
2. Test files go in `src/tests/` (matching the source structure)
3. Use TypeScript for all files
4. Follow React functional component patterns
5. Implement Fluent UI design system
