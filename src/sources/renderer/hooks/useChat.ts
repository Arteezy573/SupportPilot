/**
 * useChat React Hook
 * Manages chat state, message handling, and integrates with Azure Chat Completion Service
 * Provides a unified interface for chat functionality with tool_calls support
 */

import React from 'react';
import { logger } from '../../utils/logger';
import { 
    AzureChatCompletionService, 
    ToolManager,
    type ChatCompletionRequest,
    type ChatCompletionResponse 
} from '../../services';
import type { 
    Message, 
    ChatStateProps, 
    FileAttachmentProps 
} from '../../types/chat';
import type { ChatCompletionMessageParam, ChatCompletionMessageToolCall } from '../../types/azure';

// =============================================================================
// HOOK CONFIGURATION TYPES
// =============================================================================

/**
 * Configuration for the useChat hook
 */
export interface UseChatConfig {
    /**
     * Chat completion service instance
     */
    chatService?: AzureChatCompletionService;

    /**
     * Tool manager instance for tool_calls
     */
    toolManager?: ToolManager;

    /**
     * Maximum number of messages to keep in memory
     */
    maxMessages?: number;

    /**
     * Whether to auto-persist chat history
     */
    autoPersist?: boolean;

    /**
     * Initial session ID
     */
    initialSessionId?: string;
}

// =============================================================================
// HOOK RETURN TYPE
// =============================================================================

/**
 * Return type for the useChat hook
 */
export interface UseChatReturn {
    // State
    messages: Message[];
    currentMessage: string;
    attachedFiles: File[];
    isSending: boolean;
    chatState: ChatStateProps;
    
    // Actions
    sendMessage: (message: string, files?: File[]) => Promise<void>;
    setCurrentMessage: (message: string) => void;
    attachFiles: (files: File[]) => void;
    removeFile: (fileId: string) => void;
    clearChat: () => void;
    
    // Session management
    newSession: () => void;
    loadSession: (sessionId: string) => Promise<void>;
    
    // Tool calls
    executeToolCall: (toolCall: ChatCompletionMessageToolCall) => Promise<unknown>;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert File objects to FileAttachmentProps
 */
function convertFilesToAttachments(files: File[]): FileAttachmentProps[] {
    return files.map(file => ({
        id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date()
    }));
}

/**
 * Convert messages to OpenAI chat completion format
 */
function convertMessagesToChatFormat(messages: Message[]): ChatCompletionMessageParam[] {
    return messages.map(message => ({
        role: message.role === 'agent' ? 'assistant' : message.role,
        content: message.content,
        // Add tool_calls if this is an agent message with steps that contain actions
        ...(message.role === 'agent' && message.steps?.some(step => 'type' in step) && {
            tool_calls: message.steps
                .filter((step): step is import('../../types/chat').AgentActionProps => 'type' in step)
                .map(action => ({
                    id: action.id,
                    type: 'function' as const,
                    function: {
                        name: action.type,
                        arguments: JSON.stringify(action.parameters || {})
                    }
                }))
        })
    }));
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * useChat hook for managing chat state and interactions
 */
export function useChat(config: UseChatConfig = {}): UseChatReturn {
    const {
        chatService,
        toolManager,
        maxMessages: _maxMessages = 100, // Prefix with underscore to indicate intentionally unused
        autoPersist = true,
        initialSessionId
    } = config;

    // =============================================================================
    // STATE
    // =============================================================================

    const [messages, setMessages] = React.useState<Message[]>([]);
    const [currentMessage, setCurrentMessage] = React.useState<string>('');
    const [attachedFiles, setAttachedFiles] = React.useState<File[]>([]);
    const [isSending, setIsSending] = React.useState<boolean>(false);
    const [sessionId, setSessionId] = React.useState<string>(
        initialSessionId || generateSessionId()
    );

    // Chat state
    const [chatState, setChatState] = React.useState<ChatStateProps>({
        sessionId,
        stage: 'user_prompted',
        isLoading: false
    });

    // =============================================================================
    // EFFECTS
    // =============================================================================

    // Auto-persist messages when they change
    React.useEffect(() => {
        if (autoPersist && messages.length > 0) {
            // TODO: Implement persistence to localStorage or IndexedDB
            logger.debug('Chat messages updated', { 
                sessionId, 
                messageCount: messages.length 
            });
        }
    }, [messages, sessionId, autoPersist]);

    // =============================================================================
    // ACTIONS
    // =============================================================================

    /**
     * Execute a tool call
     */
    const executeToolCall = React.useCallback(async (toolCall: ChatCompletionMessageToolCall): Promise<unknown> => {
        if (!toolManager) {
            throw new Error('Tool manager not configured');
        }

        // Handle both function tool calls and other types
        const toolName = 'function' in toolCall && toolCall.function 
            ? toolCall.function.name 
            : toolCall.type;
        const toolArgs = 'function' in toolCall && toolCall.function
            ? JSON.parse(toolCall.function.arguments || '{}')
            : {};

        return await toolManager.invoke({
            toolId: toolName,
            args: toolArgs
        });
    }, [toolManager]);

    /**
     * Send a message and get AI response
     */
    const sendMessage = React.useCallback(async (message: string, files?: File[]) => {
        if (!message.trim() || isSending) {
            return;
        }

        const messageFiles = files || attachedFiles;
        
        setIsSending(true);
        setChatState(prev => ({ ...prev, isLoading: true, stage: 'agent_reasoning' }));

        try {
            // Create user message
            const userMessage: Message = {
                id: generateMessageId(),
                role: 'user',
                content: message.trim(),
                timestamp: new Date(),
                status: 'completed',
                attachedFiles: messageFiles.length > 0 ? convertFilesToAttachments(messageFiles) : undefined
            };

            // Add user message to state
            setMessages(prev => [...prev, userMessage]);
            setCurrentMessage('');
            setAttachedFiles([]);

            // Prepare chat completion request if service is available
            if (chatService) {
                const chatMessages = convertMessagesToChatFormat([...messages, userMessage]);
                
                // Get available tools from tool manager
                const tools = toolManager?.getChatCompletionTools() || [];

                const request: ChatCompletionRequest = {
                    messages: chatMessages,
                    tools: tools.length > 0 ? tools : undefined,
                    maxTokens: 1000,
                    temperature: 0.7
                };

                logger.debug('Sending chat completion request', {
                    messageCount: chatMessages.length,
                    hasTools: tools.length > 0,
                    sessionId
                });

                // Send to chat completion service
                const response: ChatCompletionResponse = await chatService.createCompletion(request);

                if (response.success && response.completion) {
                    const completion = response.completion;
                    const choice = completion.choices[0];

                    if (choice) {
                        // Create agent message
                        const agentMessage: Message = {
                            id: generateMessageId(),
                            role: 'agent',
                            content: choice.message.content || '',
                            timestamp: new Date(),
                            status: 'completed',
                            // Convert tool calls to agent actions if present
                            steps: choice.message.tool_calls?.map(toolCall => {
                                // Handle both function tool calls and other types
                                const toolName = 'function' in toolCall && toolCall.function 
                                    ? toolCall.function.name 
                                    : toolCall.type;
                                const toolArgs = 'function' in toolCall && toolCall.function
                                    ? JSON.parse(toolCall.function.arguments || '{}')
                                    : {};
                                
                                return {
                                    id: toolCall.id,
                                    type: toolName,
                                    status: 'pending' as const,
                                    startedAt: new Date(),
                                    parameters: toolArgs
                                };
                            })
                        };

                        setMessages(prev => [...prev, agentMessage]);

                        // Execute tool calls if present
                        if (choice.message.tool_calls && toolManager) {
                            setChatState(prev => ({ ...prev, stage: 'agent_action' }));
                            
                            for (const toolCall of choice.message.tool_calls) {
                                try {
                                    const _result = await executeToolCall(toolCall); // Prefix with underscore
                                    const toolName = 'function' in toolCall && toolCall.function 
                                        ? toolCall.function.name 
                                        : toolCall.type;
                                    logger.debug('Tool call executed', {
                                        toolId: toolName,
                                        success: true
                                    });
                                    // Tool results would typically trigger follow-up completion
                                } catch (error) {
                                    const toolName = 'function' in toolCall && toolCall.function 
                                        ? toolCall.function.name 
                                        : toolCall.type;
                                    logger.error('Tool call failed', {
                                        toolId: toolName,
                                        error: error instanceof Error ? error.message : 'Unknown error'
                                    });
                                }
                            }
                        }
                    }
                } else {
                    throw new Error(response.error || 'Chat completion failed');
                }
            } else {
                // Fallback: Create a simple acknowledgment message
                const agentMessage: Message = {
                    id: generateMessageId(),
                    role: 'agent',
                    content: 'I received your message. Chat service is not configured yet.',
                    timestamp: new Date(),
                    status: 'completed'
                };

                setMessages(prev => [...prev, agentMessage]);
            }

        } catch (error) {
            logger.error('Failed to send message', {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId
            });

            // Add error message
            const errorMessage: Message = {
                id: generateMessageId(),
                role: 'agent',
                content: 'Sorry, I encountered an error processing your message. Please try again.',
                timestamp: new Date(),
                status: 'failed'
            };

            setMessages(prev => [...prev, errorMessage]);

            setChatState(prev => ({ 
                ...prev, 
                error: error instanceof Error ? error.message : 'Unknown error' 
            }));
        } finally {
            setIsSending(false);
            setChatState(prev => ({ 
                ...prev, 
                isLoading: false, 
                stage: 'user_prompted' 
            }));
        }
    }, [attachedFiles, isSending, messages, sessionId, chatService, toolManager, executeToolCall]);

    /**
     * Attach files for the next message
     */
    const attachFiles = React.useCallback((files: File[]) => {
        setAttachedFiles(prev => [...prev, ...files]);
    }, []);

    /**
     * Remove an attached file
     */
    const removeFile = React.useCallback((fileId: string) => {
        setAttachedFiles(prev => prev.filter((_, index) => `file_${index}` !== fileId));
    }, []);

    /**
     * Clear the current chat
     */
    const clearChat = React.useCallback(() => {
        setMessages([]);
        setCurrentMessage('');
        setAttachedFiles([]);
        setIsSending(false);
        setChatState({
            sessionId,
            stage: 'user_prompted',
            isLoading: false
        });
    }, [sessionId]);

    /**
     * Start a new chat session
     */
    const newSession = React.useCallback(() => {
        const newId = generateSessionId();
        setSessionId(newId);
        setMessages([]);
        setCurrentMessage('');
        setAttachedFiles([]);
        setIsSending(false);
        setChatState({
            sessionId: newId,
            stage: 'user_prompted',
            isLoading: false
        });

        logger.info('Started new chat session', { sessionId: newId });
    }, []);

    /**
     * Load a previous chat session
     */
    const loadSession = React.useCallback(async (newSessionId: string) => {
        // TODO: Implement session loading from persistence layer
        setSessionId(newSessionId);
        setChatState(prev => ({ ...prev, sessionId: newSessionId }));
        
        logger.info('Loaded chat session', { sessionId: newSessionId });
    }, []);

    // =============================================================================
    // RETURN
    // =============================================================================

    return {
        // State
        messages,
        currentMessage,
        attachedFiles,
        isSending,
        chatState,
        
        // Actions
        sendMessage,
        setCurrentMessage,
        attachFiles,
        removeFile,
        clearChat,
        
        // Session management
        newSession,
        loadSession,
        
        // Tool calls
        executeToolCall
    };
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a useChat hook with pre-configured services
 */
export function createUseChat(
    chatService?: AzureChatCompletionService,
    toolManager?: ToolManager
) {
    return (config: Omit<UseChatConfig, 'chatService' | 'toolManager'> = {}) => {
        return useChat({
            ...config,
            chatService,
            toolManager
        });
    };
}