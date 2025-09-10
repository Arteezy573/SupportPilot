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