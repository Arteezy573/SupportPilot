// ===============================
// 1. Chat Message Components
// ===============================

export type MessageRole = "user" | "agent" | "system";

export interface ChatMessageProps {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  status: "pending" | "processing" | "completed" | "failed";
  attachedFiles?: FileAttachmentProps[];
  steps?: (AgentThoughtProps | AgentActionProps)[];
  citations?: CitationProps[];
}

// ===============================
// 2. Agent Reasoning (Thought) Component
// ===============================

export interface AgentThoughtProps {
  id: string;
  content: string;
  timestamp: Date;
}

// ===============================
// 3. Agent Action Component
// ===============================

export interface AgentActionProps {
  id: string;
  type: string; // e.g. "search_code", "query_kusto"
  status: "pending" | "processing" | "completed" | "failed";
  startedAt: Date;
  completedAt?: Date;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parameters?: any;
  result?: AgentActionResultProps;
  error?: string;
}

// ===============================
// 4. Agent Action Result Component
// ===============================

export interface AgentActionResultProps {
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  summary?: string;
  confidence?: number;
  recommendations?: string[];
  nextActions?: string[];
}

// ===============================
// 5. File Attachment Component
// ===============================

export interface FileAttachmentProps {
  id: string;
  name: string;
  type: string;
  preview?: string;
  size: number;
  uploadedAt: Date;
}

// ===============================
// 6. Citation Component
// ===============================

export interface CitationProps {
  id: string;
  source: string;
  type: string; // e.g. "file", "code", "external"
  title: string;
  url?: string;
  relevance: number;
  excerpt?: string;
}

// ===============================
// 7. Chat State Component
// ===============================

export interface ChatStateProps {
  sessionId: string;
  stage: "user_prompted" | "agent_reasoning" | "agent_action" | "agent_observation" | "agent_conclusion";
  isLoading: boolean;
  error?: string;
}

// ===============================
// 8. Timeline Event Component (optional for log/email context)
// ===============================

export interface TimelineEventProps {
  id: string;
  timestamp: Date;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  source: string;
}

// ===============================
// 9. Issue Context Component (optional for support/diagnostics)
// ===============================

export interface IssueContextProps {
  id: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  timeline: TimelineEventProps[];
  symptoms?: string[];
  solutions?: string[];
}

