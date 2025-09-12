/**
 * Azure OpenAI Chat Completion Service
 * Handles chat completion requests with support for tool_calls and streaming
 * Integrates with Azure OpenAI client builder for secure authentication
 */

import { logger } from "../utils/logger";
import { AzureOpenAIClientBuilder } from "./azureOpenAIClientBuilder";
import type {
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionCreateParamsStreaming,
    ChatCompletionMessageParam,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption,
    ChatCompletionMessageToolCall,
    AzureChatCompletionResponse,
} from "../types/azure";
import { Stream } from "openai/streaming";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

/**
 * Chat completion service configuration
 */
export interface ChatCompletionServiceConfig {
    /**
     * Default maximum tokens for completions
     */
    defaultMaxTokens?: number;

    /**
     * Default temperature for completions
     */
    defaultTemperature?: number;

    /**
     * Default top-p for completions
     */
    defaultTopP?: number;

    /**
     * Default tool choice option
     */
    defaultToolChoice?: ChatCompletionToolChoiceOption;

    /**
     * Whether to enable parallel tool calls by default
     */
    defaultParallelToolCalls?: boolean;
}

/**
 * Chat completion request parameters (service-level interface with camelCase for ease of use)
 */
export interface ChatCompletionRequest {
    /**
     * List of messages for the conversation
     */
    messages: ChatCompletionMessageParam[];

    /**
     * Optional tools available to the model
     */
    tools?: ChatCompletionTool[];

    /**
     * Tool choice configuration
     */
    toolChoice?: ChatCompletionToolChoiceOption;

    /**
     * Maximum tokens to generate
     */
    maxTokens?: number;

    /**
     * Temperature for generation (0.0 to 2.0)
     */
    temperature?: number;

    /**
     * Top-p for nucleus sampling
     */
    topP?: number;

    /**
     * Whether to enable parallel tool calls
     */
    parallelToolCalls?: boolean;

    /**
     * Stop sequences
     */
    stop?: string[];

    /**
     * Presence penalty
     */
    presencePenalty?: number;

    /**
     * Frequency penalty
     */
    frequencyPenalty?: number;
}

/**
 * Chat completion response with Azure-specific metadata
 */
export interface ChatCompletionResponse {
    /**
     * Whether the request was successful
     */
    success: boolean;

    /**
     * The chat completion response (if successful)
     */
    completion?: AzureChatCompletionResponse;

    /**
     * Error message (if failed)
     */
    error?: string;

    /**
     * Response time in milliseconds
     */
    responseTime: number;

    /**
     * Whether the response contains tool calls
     */
    hasToolCalls: boolean;

    /**
     * Extracted tool calls (if any)
     */
    toolCalls?: ChatCompletionMessageToolCall[];

    /**
     * Extracted content (if any)
     */
    content?: string;
}

/**
 * Streaming chat completion response
 */
export interface StreamingChatCompletionResponse {
    /**
     * Whether the request was successful
     */
    success: boolean;

    /**
     * The streaming response (if successful)
     */
    stream?: Stream<ChatCompletionChunk>;

    /**
     * Error message (if failed)
     */
    error?: string;
}

/**
 * Default configuration for chat completion service
 */
const DEFAULT_CONFIG: Required<ChatCompletionServiceConfig> = {
    defaultMaxTokens: 4096,
    defaultTemperature: 0.7,
    defaultTopP: 1.0,
    defaultToolChoice: "auto",
    defaultParallelToolCalls: true,
};

/**
 * Azure OpenAI Chat Completion Service
 * Provides high-level interface for chat completions with tool support
 */
export class AzureChatCompletionService {
    private clientBuilder: AzureOpenAIClientBuilder;
    private config: Required<ChatCompletionServiceConfig>;

    /**
     * Initialize the chat completion service
     * @param clientBuilder - Azure OpenAI client builder instance
     * @param config - Optional service configuration
     */
    constructor(clientBuilder: AzureOpenAIClientBuilder, config?: ChatCompletionServiceConfig) {
        this.clientBuilder = clientBuilder;
        this.config = {
            ...DEFAULT_CONFIG,
            ...config,
        };

        logger.info("AzureChatCompletionService initialized", {
            config: this.config,
        });
    }

    /**
     * Create a chat completion with tool support
     * @param request - Chat completion request parameters
     * @returns Promise that resolves to chat completion response
     */
    public async createCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
        const startTime = Date.now();

        try {
            logger.debug("Creating chat completion", {
                messageCount: request.messages.length,
                hasTools: !!request.tools?.length,
                toolChoice: request.toolChoice || this.config.defaultToolChoice,
            });

            // Get the Azure OpenAI client
            const client = this.clientBuilder.getClient();

            // Prepare the completion parameters (map camelCase to snake_case for openai API)
            const completionParams: ChatCompletionCreateParamsNonStreaming = {
                model: this.clientBuilder.getConfig().deploymentName!,
                messages: request.messages,
                max_tokens: request.maxTokens || this.config.defaultMaxTokens,
                temperature: request.temperature ?? this.config.defaultTemperature,
                top_p: request.topP ?? this.config.defaultTopP,
                stop: request.stop,
                presence_penalty: request.presencePenalty,
                frequency_penalty: request.frequencyPenalty,
                stream: false, // Handle streaming separately
                tools: request.tools,
                tool_choice: request.tools?.length ? request.toolChoice || this.config.defaultToolChoice : undefined,
                parallel_tool_calls: request.tools?.length ? (request.parallelToolCalls ?? this.config.defaultParallelToolCalls) : undefined,
            };

            // Create the completion
            const completion = await client.chat.completions.create(completionParams);

            const responseTime = Date.now() - startTime;

            // Extract response data
            const message = completion.choices[0]?.message;
            const hasToolCalls = !!message?.tool_calls?.length;
            const toolCalls = message?.tool_calls;
            const content = message?.content || undefined;

            // Create Azure-specific response
            const azureResponse: AzureChatCompletionResponse = {
                ...completion,
                timestamp: new Date(),
                requestId: completion.id,
            };

            logger.info("Chat completion successful", {
                responseTime,
                hasToolCalls,
                toolCallCount: toolCalls?.length || 0,
                finishReason: completion.choices[0]?.finish_reason,
                usage: completion.usage,
            });

            return {
                success: true,
                completion: azureResponse,
                responseTime,
                hasToolCalls,
                toolCalls,
                content,
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error during chat completion";

            logger.error("Chat completion failed", {
                error: errorMessage,
                responseTime,
                messageCount: request.messages.length,
            });

            return {
                success: false,
                error: errorMessage,
                responseTime,
                hasToolCalls: false,
            };
        }
    }

    /**
     * Create a streaming chat completion
     * @param request - Chat completion request parameters
     * @returns Promise that resolves to streaming response
     */
    public async createStreamingCompletion(request: ChatCompletionRequest): Promise<StreamingChatCompletionResponse> {
        try {
            logger.debug("Creating streaming chat completion", {
                messageCount: request.messages.length,
                hasTools: !!request.tools?.length,
            });

            // Get the Azure OpenAI client
            const client = this.clientBuilder.getClient();

            // Prepare the streaming completion parameters (map camelCase to snake_case for openai API)
            const completionParams: ChatCompletionCreateParamsStreaming = {
                model: this.clientBuilder.getConfig().deploymentName!,
                messages: request.messages,
                max_tokens: request.maxTokens || this.config.defaultMaxTokens,
                temperature: request.temperature ?? this.config.defaultTemperature,
                top_p: request.topP ?? this.config.defaultTopP,
                stop: request.stop,
                presence_penalty: request.presencePenalty,
                frequency_penalty: request.frequencyPenalty,
                stream: true,
                tools: request.tools,
                tool_choice: request.tools?.length ? request.toolChoice || this.config.defaultToolChoice : undefined,
                parallel_tool_calls: request.tools?.length ? (request.parallelToolCalls ?? this.config.defaultParallelToolCalls) : undefined,
            };

            // Create the streaming completion
            const stream = await client.chat.completions.create(completionParams);

            logger.info("Streaming chat completion started successfully");

            return {
                success: true,
                stream,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error during streaming chat completion";

            logger.error("Streaming chat completion failed", {
                error: errorMessage,
                messageCount: request.messages.length,
            });

            return {
                success: false,
                error: errorMessage,
            };
        }
    }

    /**
     * Process tool calls and create tool messages
     * @param toolCalls - Array of tool calls from the assistant
     * @param toolResults - Map of tool call ID to result
     * @returns Array of tool messages to add to conversation
     */
    public createToolMessages(toolCalls: ChatCompletionMessageToolCall[], toolResults: Map<string, string>): ChatCompletionMessageParam[] {
        const toolMessages: ChatCompletionMessageParam[] = [];

        for (const toolCall of toolCalls) {
            const result = toolResults.get(toolCall.id);
            if (result) {
                toolMessages.push({
                    role: "tool",
                    tool_call_id: toolCall.id,
                    content: result,
                });
            }
        }

        logger.debug("Created tool messages", {
            toolCallCount: toolCalls.length,
            toolMessageCount: toolMessages.length,
        });

        return toolMessages;
    }

    /**
     * Update the service configuration
     * @param config - New configuration options
     */
    public updateConfig(config: Partial<ChatCompletionServiceConfig>): void {
        this.config = {
            ...this.config,
            ...config,
        };

        logger.info("Chat completion service configuration updated", {
            config: this.config,
        });
    }

    /**
     * Get the current service configuration
     * @returns Current service configuration
     */
    public getConfig(): ChatCompletionServiceConfig {
        return { ...this.config };
    }

    /**
     * Test the chat completion service with a simple request
     * @returns Promise that resolves to test result
     */
    public async testService(): Promise<{ success: boolean; error?: string; responseTime: number }> {
        const startTime = Date.now();

        try {
            const testRequest: ChatCompletionRequest = {
                messages: [{ role: "user", content: "Hello, this is a test message." }],
                maxTokens: 50,
            };

            const response = await this.createCompletion(testRequest);
            const responseTime = Date.now() - startTime;

            if (response.success) {
                logger.info("Chat completion service test successful", {
                    responseTime: response.responseTime,
                });

                return {
                    success: true,
                    responseTime,
                };
            } else {
                return {
                    success: false,
                    error: response.error,
                    responseTime,
                };
            }
        } catch (error) {
            const responseTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error during service test";

            return {
                success: false,
                error: errorMessage,
                responseTime,
            };
        }
    }
}

/**
 * Factory function to create a chat completion service
 * @param clientBuilder - Azure OpenAI client builder instance
 * @param config - Optional service configuration
 * @returns New AzureChatCompletionService instance
 */
export function createChatCompletionService(clientBuilder: AzureOpenAIClientBuilder, config?: ChatCompletionServiceConfig): AzureChatCompletionService {
    return new AzureChatCompletionService(clientBuilder, config);
}
