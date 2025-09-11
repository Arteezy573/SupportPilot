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
// import { AgentMessageCard } from "./components/AgentMessageCard";

// Import hooks (these will be implemented in subsequent tasks)
// import { useChat } from "./hooks/useChat";

// Import types
import type { Message } from "../types/chat";

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
export const App: React.FC<AppProps> = ({
    initialMessages = [],
    showWelcome = true,
}) => {
    const styles = useAppStyles();

    // TODO: Replace with actual useChat hook in task 3.14
    const [messages] = React.useState<Message[]>(initialMessages);
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
                <SupportPilotHeader
                    onHistoryClick={handleHistoryClick}
                    onSettingsClick={handleSettingsClick}
                />
            </div>

            {/* Main Content Area */}
            <div className={styles.mainContent}>
                <div className={styles.chatContainer}>
                    {shouldShowWelcome ? (
                        /* Welcome Section */
                        <div className={styles.welcomeSection}>
                            <GreetingText userName="Support Engineer" />
                            <SuggestedActions
                                onSummarizeClick={handleSummarizeClick}
                                onCreateIcmClick={handleCreateIcmClick}
                            />
                        </div>
                    ) : (
                        /* Messages Container */
                        <div className={styles.messagesContainer}>
                            {messages.map((message, index) => (
                                <div key={`message-${index}`} className={styles.placeholder}>
                                    AgentMessageCard Component (Task 3.9) - Message {index + 1}
                                </div>
                            ))}
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
                    placeholder="Ask me about your support issue..."
                />
            </div>
        </div>
    );
};

export default App;
