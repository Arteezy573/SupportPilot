/**
 * TypeScript interfaces for Support Pilot chat system
 * Defines types for messages, sessions, actions, and issue context
 */

// =============================================================================
// CORE CHAT TYPES
// =============================================================================

/**
 * Represents the role of a message sender in the chat
 */
export type MessageRole = "user" | "agent" | "system";

/**
 * Represents the current status of a message or action
 */
export type MessageStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

/**
 * Represents different types of agent actions following ReAct pattern
 */
export type AgentActionType =
    | "analyze_log"
    | "process_email"
    | "search_ado"
    | "query_kusto"
    | "search_code"
    | "summarize_issue"
    | "create_icm_draft"
    | "validate_solution"
    | "extract_timeline";

/**
 * Represents severity levels for issues
 */
export type IssueSeverity = "critical" | "high" | "medium" | "low" | "unknown";

/**
 * Represents the source type of attached files
 */
export type FileSourceType = "log" | "email" | "document" | "screenshot" | "unknown";

// =============================================================================
// FILE ATTACHMENT TYPES
// =============================================================================

/**
 * Represents an attached file in the chat
 */
export interface AttachedFile {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
    sourceType: FileSourceType;
    uploadedAt: Date;
    content?: string; // For text-based files
    preview?: string; // Truncated content for preview
    analysis?: FileAnalysis;
}

/**
 * Analysis results for an attached file
 */
export interface FileAnalysis {
    errors: string[];
    warnings: string[];
    keyFindings: string[];
    timeline?: TimelineEvent[];
    metadata?: Record<string, unknown>;
}

// =============================================================================
// AGENT ACTION TYPES (ReAct Pattern)
// =============================================================================

/**
 * Represents an agent action within a message
 */
export interface AgentAction {
    id: string;
    type: AgentActionType;
    name: string;
    description: string;
    status: MessageStatus;
    startedAt: Date;
    completedAt?: Date;
    input?: unknown;
    result?: AgentActionResult;
    error?: string;
    citations?: Citation[];
}

/**
 * Result of an agent action
 */
export interface AgentActionResult {
    success: boolean;
    data?: unknown;
    summary?: string;
    confidence?: number; // 0-1 confidence score
    recommendations?: string[];
    nextActions?: AgentActionType[];
}

/**
 * Represents reasoning thoughts from the agent
 */
export interface AgentThought {
    id: string;
    content: string;
    timestamp: Date;
    reasoning: string;
    confidence: number;
}

/**
 * Citation for agent responses and actions
 */
export interface Citation {
    id: string;
    source: string;
    type: "file" | "ado" | "kusto" | "code" | "email" | "external";
    title: string;
    url?: string;
    relevance: number; // 0-1 relevance score
    excerpt?: string;
}

// =============================================================================
// MESSAGE TYPES
// =============================================================================

/**
 * Core message interface
 */
export interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    status: MessageStatus;
    attachedFiles?: AttachedFile[];
    parentMessageId?: string; // For threaded conversations
}

/**
 * User message with optional file attachments
 */
export interface UserMessage extends Message {
    role: "user";
    query: string; // The actual user query/command
    intent?: UserIntent;
}

/**
 * Agent message with reasoning and actions (ReAct pattern)
 */
export interface AgentMessage extends Message {
    role: "agent";
    thoughts?: AgentThought[];
    actions?: AgentAction[];
    citations?: Citation[];
    confidence?: number;
    followUpSuggestions?: string[];
}

/**
 * System message for notifications and status updates
 */
export interface SystemMessage extends Message {
    role: "system";
    messageType: "info" | "warning" | "error" | "success";
    actionable?: boolean;
}

/**
 * Union type for all message types
 */
export type ChatMessage = UserMessage | AgentMessage | SystemMessage;

// =============================================================================
// USER INTENT AND CONTEXT
// =============================================================================

/**
 * Detected user intent from their message
 */
export interface UserIntent {
    primary: string;
    confidence: number;
    entities?: Record<string, unknown>;
    suggestedActions?: AgentActionType[];
}

/**
 * Timeline event extracted from logs or emails
 */
export interface TimelineEvent {
    id: string;
    timestamp: Date;
    description: string;
    source: string;
    severity: IssueSeverity;
    category: string;
    details?: Record<string, unknown>;
}

/**
 * Context about the current issue being analyzed
 */
export interface IssueContext {
    id: string;
    title: string;
    description: string;
    severity: IssueSeverity;
    impact: string;
    affectedSystems: string[];
    timeline: TimelineEvent[];
    symptoms: string[];
    potentialCauses: string[];
    suggestedSolutions: string[];
    relatedWorkItems?: string[];
    customerInformation?: CustomerInfo;
    technicalDetails?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Customer information extracted from emails or tickets
 */
export interface CustomerInfo {
    name?: string;
    email?: string;
    organization?: string;
    impactDescription: string;
    urgency: IssueSeverity;
    contactPreference?: string;
}

// =============================================================================
// SUPPORT SESSION TYPES
// =============================================================================

/**
 * Represents a complete support session
 */
export interface SupportSession {
    id: string;
    title: string;
    description?: string;
    messages: ChatMessage[];
    attachedFiles: AttachedFile[];
    issueContext?: IssueContext;
    sessionState: SessionState;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    metadata?: SessionMetadata;
}

/**
 * Current state of a support session
 */
export interface SessionState {
    isActive: boolean;
    currentStage: SessionStage;
    progress: number; // 0-1 completion percentage
    blockers?: string[];
    nextSteps?: string[];
}

/**
 * Stages of a support session workflow
 */
export type SessionStage = "initialization" | "information_gathering" | "analysis" | "solution_development" | "validation" | "documentation" | "completed";

/**
 * Metadata for session tracking and analytics
 */
export interface SessionMetadata {
    version: string;
    userAgent?: string;
    sessionDuration?: number;
    actionCounts?: Record<AgentActionType, number>;
    fileTypes?: FileSourceType[];
    tags?: string[];
}

// =============================================================================
// CHAT STATE MANAGEMENT
// =============================================================================

/**
 * Overall state of the chat interface
 */
export interface ChatState {
    currentSession: SupportSession | null;
    sessions: SupportSession[];
    isLoading: boolean;
    isTyping: boolean;
    error: string | null;
    connectionStatus: ConnectionStatus;
    settings: ChatSettings;
}

/**
 * Connection status for external services
 */
export interface ConnectionStatus {
    ado: boolean;
    kusto: boolean;
    sourceCode: boolean;
    aiService: boolean;
    lastChecked: Date;
}

/**
 * User preferences and chat settings
 */
export interface ChatSettings {
    theme: "light" | "dark" | "auto";
    autoSave: boolean;
    maxFileSize: number; // in bytes
    enableNotifications: boolean;
    confidenceThreshold: number; // 0-1
    preferredActionOrder: AgentActionType[];
    retainSessionDays: number;
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    timestamp: Date;
    requestId?: string;
}

/**
 * Response for file upload operations
 */
export interface FileUploadResponse extends ApiResponse<AttachedFile[]> {
    rejectedFiles?: Array<{
        name: string;
        reason: string;
    }>;
}

/**
 * Response for session operations
 */
export interface SessionResponse extends ApiResponse<SupportSession> {
    sessionId: string;
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Export format options for session data
 */
export type ExportFormat = "json" | "markdown" | "html" | "pdf" | "docx";

/**
 * Export configuration
 */
export interface ExportConfig {
    format: ExportFormat;
    includeAttachments: boolean;
    includeTimestamps: boolean;
    includeMetadata: boolean;
    sections: ExportSection[];
}

/**
 * Sections to include in export
 */
export type ExportSection = "summary" | "timeline" | "messages" | "attachments" | "analysis" | "recommendations" | "citations";
