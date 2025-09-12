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

// Import hooks
import { useChat } from "./hooks/useChat";

// Import services
import {
    // AzureOpenAIClientBuilder,
    // AzureChatCompletionService,
    // ToolManager,
    createAzureOpenAIClientBuilder,
    createChatCompletionService,
    createToolManager
} from "../services";

// Import types
import type { Message, AgentMessage, UserMessage } from "../types/chat";

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

    // Initialize Azure services
    const clientBuilder = React.useMemo(() => {
        return createAzureOpenAIClientBuilder({
            foundry: {
                endpoint: 'https://guacheng-azureaifoundry.openai.azure.com/',
                apiVersion: '2024-10-21',
                deploymentName: 'gpt-4o'
            },
            credentials: {
                scopes: ['https://cognitiveservices.azure.com/.default']
            },
            model: {
                modelName: 'gpt-4o',
                maxTokens: 4096,
                supportsFunctions: true,
                supportsVision: true,
                supportsStreaming: true
            }
        });
    }, []);

    const chatService = React.useMemo(() => {
        return createChatCompletionService(clientBuilder, {
            defaultMaxTokens: 1000,
            defaultTemperature: 0.7
        });
    }, [clientBuilder]);

    const toolManager = React.useMemo(() => {
        return createToolManager();
    }, []);

    // Use the chat hook with services
    const {
        messages,
        currentMessage,
        attachedFiles,
        isSending,
        sendMessage,
        setCurrentMessage,
        attachFiles,
        removeFile,
        // clearChat,
        newSession
    } = useChat({
        chatService,
        toolManager,
        maxMessages: 50,
        autoPersist: true
    });

    // Initialize with provided messages if any
    React.useEffect(() => {
        if (initialMessages.length > 0 && messages.length === 0) {
            // For now, we'll use the newSession to clear state
            // TODO: Add proper message initialization support to useChat
            newSession();
        }
    }, [initialMessages, messages.length, newSession]);

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
        // For now, demonstrate the functionality with a simple message
        if (currentMessage.trim() === "") {
            setCurrentMessage("Please analyze the attached logs and summarize the main issues.");
        }
    }, [currentMessage, setCurrentMessage]);

    const handleCreateIcmClick = React.useCallback(() => {
        // TODO: Implement ICM creation in task 3.16
        if (currentMessage.trim() === "") {
            setCurrentMessage("Create an ICM ticket based on the analysis findings.");
        }
    }, [currentMessage, setCurrentMessage]);

    // Event handlers for message input
    const handleMessageChange = React.useCallback((value: string) => {
        setCurrentMessage(value);
    }, [setCurrentMessage]);

    const handleSendMessage = React.useCallback(async () => {
        if (currentMessage.trim()) {
            await sendMessage(currentMessage, attachedFiles);
        }
    }, [currentMessage, attachedFiles, sendMessage]);

    const handleFilesAttached = React.useCallback((files: File[]) => {
        attachFiles(files);
    }, [attachFiles]);

    const handleFileRemove = React.useCallback((fileToRemove: File) => {
        // Create a unique identifier for the file to remove
        const fileIndex = attachedFiles.findIndex(f => f === fileToRemove);
        if (fileIndex !== -1) {
            removeFile(`file_${fileIndex}`);
        }
    }, [attachedFiles, removeFile]);

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

export default App;
