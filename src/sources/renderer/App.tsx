/**
 * Root App component with main layout using Fluent UI Stack
 * Main container for the Support Pilot desktop application interface
 */

import React from "react";
import { makeStyles, tokens, shorthands } from "@fluentui/react-components";

// Import components (these will be implemented in subsequent tasks)
import { SupportPilotHeader } from "./components/SupportPilotHeader";
import { GreetingText } from "./components/GreetingText";
import { SuggestedActions } from "./components/SuggestedActions";
import { MessageInputArea } from "./components/MessageInputArea";
import { AgentMessageCard } from "./components/AgentMessageCard";
import { UserMessageCard } from "./components/UserMessageCard";

// Import hooks (these will be implemented in subsequent tasks)
// import { useChat } from "./hooks/useChat";

// Import types
import type { Message, AgentMessage, UserMessage, AgentAction, AgentThought } from "../types/chat";

// =============================================================================
// COMPONENT STYLES
// =============================================================================

const useAppStyles = makeStyles({
    root: {
        height: "100vh",
        width: "100%",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        ...shorthands.overflow("hidden"),
        display: "flex",
        flexDirection: "column",
    },
    header: {
        flexShrink: 0,
        ...shorthands.borderBottom(tokens.strokeWidthThin, "solid", tokens.colorNeutralStroke2),
        backgroundColor: tokens.colorNeutralBackground2,
    },
    mainContent: {
        flexGrow: 1,
        ...shorthands.overflow("hidden"),
        display: "flex",
        flexDirection: "column",
    },
    chatContainer: {
        flexGrow: 1,
        ...shorthands.overflow("auto"),
        ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalM),
    },
    welcomeSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        ...shorthands.gap(tokens.spacingVerticalL),
        ...shorthands.padding(tokens.spacingVerticalXXL),
        textAlign: "center",
    },
    messagesContainer: {
        display: "flex",
        flexDirection: "column",
        ...shorthands.gap(tokens.spacingVerticalM),
        flexGrow: 1,
    },
    inputArea: {
        flexShrink: 0,
    },
    // Temporary placeholder styles for development
    placeholder: {
        ...shorthands.padding(tokens.spacingVerticalM, tokens.spacingHorizontalM),
        backgroundColor: tokens.colorNeutralBackground3,
        ...shorthands.border(tokens.strokeWidthThin, "dashed", tokens.colorNeutralStroke1),
        borderRadius: tokens.borderRadiusMedium,
        color: tokens.colorNeutralForeground3,
        textAlign: "center",
        fontStyle: "italic",
    },
});

// =============================================================================
// COMPONENT INTERFACES
// =============================================================================

/**
 * Props for the App component
 */
export interface AppProps {
    /** Optional initial messages for testing */
    initialMessages?: Message[];
    /** Whether to show welcome screen */
    showWelcome?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * Root App component that provides the main layout structure for Support Pilot
 * Uses Fluent UI Stack for responsive layout and proper spacing
 */
export const App: React.FC<AppProps> = ({ initialMessages = [], showWelcome = true }) => {
    const styles = useAppStyles();

    // TODO: Replace with actual useChat hook in task 3.14
    const [messages, setMessages] = React.useState<Message[]>(initialMessages);
    const [currentMessage, setCurrentMessage] = React.useState<string>("");
    const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);
    const [isSending, setIsSending] = React.useState<boolean>(false);

    const hasMessages = messages.length > 0;
    const shouldShowWelcome = showWelcome && !hasMessages;

    // Event handlers for header actions
    const handleHistoryClick = React.useCallback(() => {
        // TODO: Implement chat history functionality in task 3.17
    }, []);

    const handleSettingsClick = React.useCallback(() => {
        // TODO: Implement settings functionality in task 3.18
    }, []);

    // Event handlers for suggested actions
    const handleSummarizeClick = React.useCallback(() => {
        // TODO: Implement issue summarization in task 3.16
        // For now, demonstrate the AgentMessageCard with mock data
        setMessages([mockUserMessage, mockAgentMessage1, mockAgentMessage2]);
    }, []);

    const handleCreateIcmClick = React.useCallback(() => {
        // TODO: Implement ICM creation in task 3.16
    }, []);

    // Event handlers for message input
    const handleMessageChange = React.useCallback((value: string) => {
        setCurrentMessage(value);
    }, []);

    const handleSendMessage = React.useCallback(() => {
        if (currentMessage.trim()) {
            setIsSending(true);
            // TODO: Implement message sending in task 3.14
            // For now, just reset the input
            setCurrentMessage("");
            setAttachedFiles([]);
            setIsSending(false);
        }
    }, [currentMessage]);

    const handleFilesAttached = React.useCallback((files: File[]) => {
        setAttachedFiles(prev => [...prev, ...files]);
    }, []);

    const handleFileRemove = React.useCallback((fileToRemove: File) => {
        setAttachedFiles(prev => prev.filter(file => file !== fileToRemove));
    }, []);

    return (
        <div className={styles.root}>
            {/* Header Section */}
            <div className={styles.header}>
                <SupportPilotHeader onHistoryClick={handleHistoryClick} onSettingsClick={handleSettingsClick} />
            </div>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
                <div className={styles.chatContainer}>
                    {shouldShowWelcome ? (
                        /* Welcome Section */
                        <div className={styles.welcomeSection}>
                            <GreetingText userName='Support Engineer' />
                            <SuggestedActions onSummarizeClick={handleSummarizeClick} onCreateIcmClick={handleCreateIcmClick} />
                        </div>
                    ) : (
                        /* Messages Container */
                        <div className={styles.messagesContainer}>
                            {messages.map((message, index) => {
                                if (message.role === "agent") {
                                    return (
                                        <AgentMessageCard
                                            key={`message-${index}`}
                                            message={message as AgentMessage}
                                            onRetry={() => {
                                                // TODO: Implement retry functionality in task 3.16
                                                // Placeholder for retry handling
                                            }}
                                            onExpand={(_messageId, _section) => {
                                                // TODO: Implement expand tracking in task 3.16
                                                // Placeholder for expand handling
                                            }}
                                        />
                                    );
                                } else if (message.role === "user") {
                                    return <UserMessageCard key={`message-${index}`} message={message as UserMessage} />;
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                <MessageInputArea
                    value={currentMessage}
                    onChange={handleMessageChange}
                    onSend={handleSendMessage}
                    onFilesAttached={handleFilesAttached}
                    onFileRemove={handleFileRemove}
                    attachedFiles={attachedFiles}
                    isSending={isSending}
                    disabled={false}
                    placeholder='Ask me about your support issue...'
                />
            </div>
        </div>
    );
};

// =============================================================================
// MOCK DATA FOR DEMONSTRATION
// =============================================================================

const mockUserMessage: UserMessage = {
    id: "user-msg-1",
    role: "user",
    content: "I'm seeing errors in our production application logs. Can you help me analyze what's going wrong?",
    query: "Analyze production application errors",
    timestamp: new Date(Date.now() - 60000), // 1 minute ago
    status: "completed",
    attachedFiles: [
        {
            id: "file-1",
            name: "application.log",
            path: "/logs/application.log",
            size: 204800,
            type: "text/plain",
            sourceType: "log",
            uploadedAt: new Date(Date.now() - 120000),
            preview:
                "2024-01-15 10:30:15 ERROR [DatabaseConnection] Connection timeout after 30 seconds\n2024-01-15 10:30:16 ERROR [UserService] Failed to authenticate user ID: 12345\n2024-01-15 10:30:17 WARN [MemoryManager] High memory usage detected: 85%",
        },
    ],
};

const mockAgentMessage1: AgentMessage = {
    id: "agent-msg-1",
    role: "agent",
    content: "I've analyzed your application logs and identified several critical issues. Let me walk you through my analysis process and findings.",
    timestamp: new Date(Date.now() - 30000), // 30 seconds ago
    status: "completed",
    confidence: 0.87,
    steps: [
        {
            id: "thought-1",
            content:
                "I need to analyze the uploaded log file to identify error patterns and their potential root causes. I'll look for timestamps, error types, and affected components.",
            timestamp: new Date(Date.now() - 35000),
        } as AgentThought,
        {
            id: "action-1",
            type: "analyze_log",
            status: "completed",
            startedAt: new Date(Date.now() - 34000),
            completedAt: new Date(Date.now() - 32000),
            parameters: {
                fileName: "application.log",
                analysisType: "error_pattern_detection",
            },
            result: {
                success: true,
                summary: "Found 3 critical database connection timeouts and 1 authentication failure within a 2-second window",
                confidence: 0.92,
                recommendations: [
                    "Investigate database connection pool exhaustion",
                    "Check network latency to database server",
                    "Review authentication service dependencies",
                ],
            },
        } as AgentAction,
        {
            id: "thought-2",
            content:
                "The error pattern suggests a cascading failure starting with database connectivity issues. The authentication failures likely occurred because the user service couldn't verify credentials due to the database timeout.",
            timestamp: new Date(Date.now() - 31000),
        } as AgentThought,
        {
            id: "action-2",
            type: "extract_timeline",
            status: "completed",
            startedAt: new Date(Date.now() - 30500),
            completedAt: new Date(Date.now() - 30000),
            result: {
                success: true,
                summary: "Extracted timeline showing error propagation over 2-second period",
                confidence: 0.95,
                data: {
                    events: [
                        { time: "10:30:15", event: "Database timeout", severity: "critical" },
                        { time: "10:30:16", event: "Authentication failure", severity: "high" },
                        { time: "10:30:17", event: "Memory warning", severity: "medium" },
                    ],
                },
            },
        } as AgentAction,
    ],
    attachedFiles: [mockUserMessage.attachedFiles![0]],
};

const mockAgentMessage2: AgentMessage = {
    id: "agent-msg-2",
    role: "agent",
    content: "Based on my analysis, I recommend immediate action on the database connection issues. Here's a prioritized action plan.",
    timestamp: new Date(),
    status: "completed",
    confidence: 0.91,
    steps: [
        {
            id: "thought-3",
            content: "Given the severity and cascading nature of these errors, I should provide actionable recommendations prioritized by impact and urgency.",
            timestamp: new Date(Date.now() - 5000),
        } as AgentThought,
        {
            id: "action-3",
            type: "create_icm_draft",
            status: "completed",
            startedAt: new Date(Date.now() - 4000),
            completedAt: new Date(Date.now() - 2000),
            result: {
                success: true,
                summary: "Created ICM draft with severity 2 classification",
                confidence: 0.88,
                recommendations: [
                    "Immediate: Increase database connection timeout from 30s to 60s",
                    "Short-term: Scale connection pool from 10 to 20 connections",
                    "Long-term: Implement circuit breaker pattern for database calls",
                ],
            },
        } as AgentAction,
    ],
};

export default App;
