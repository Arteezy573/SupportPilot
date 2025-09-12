/**
 * TypeScript interfaces for Azure AI Foundry integration
 * Defines configuration types and service interfaces for Azure OpenAI
 * Uses openai package types where possible to avoid duplication
 */

// Re-export commonly used openai types for convenience
export type {
    ChatCompletion,
    ChatCompletionCreateParams,
    ChatCompletionCreateParamsNonStreaming,
    ChatCompletionCreateParamsStreaming,
    ChatCompletionMessage,
    ChatCompletionMessageParam,
    ChatCompletionTool,
    ChatCompletionToolChoiceOption,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

export type { CompletionUsage } from "openai/resources";

import { ChatCompletion, CompletionUsage } from "openai/resources";

// =============================================================================
// AZURE AI FOUNDRY CONFIGURATION
// =============================================================================

/**
 * Configuration interface for Azure AI Foundry endpoint
 */
export interface AzureAIFoundryConfig {
    /**
     * The endpoint URL for the Azure AI Foundry resource
     * Format: https://your-resource-name.openai.azure.com/
     */
    endpoint: string;

    /**
     * The API version to use for Azure OpenAI requests
     * Example: "2024-02-15-preview", "2023-12-01-preview"
     */
    apiVersion: string;

    /**
     * The deployment name for the specific model deployment
     * This is the name you gave to your model deployment in Azure AI Studio
     */
    deploymentName: string;

    /**
     * Optional region identifier for the Azure resource
     */
    region?: string;

    /**
     * Optional timeout for requests in milliseconds
     * Default: 30000 (30 seconds)
     */
    timeout?: number;

    /**
     * Optional maximum number of retries for failed requests
     * Default: 3
     */
    maxRetries?: number;
}

/**
 * Azure AI Foundry model capabilities and limits
 */
export interface AzureModelInfo {
    /**
     * Model name (e.g., "gpt-4", "gpt-35-turbo")
     */
    modelName: string;

    /**
     * Maximum context length in tokens
     */
    maxTokens: number;

    /**
     * Supports function calling
     */
    supportsFunctions: boolean;

    /**
     * Supports vision/image input
     */
    supportsVision: boolean;

    /**
     * Supports streaming responses
     */
    supportsStreaming: boolean;
}

/**
 * Azure credential configuration options
 */
export interface AzureCredentialConfig {
    /**
     * Tenant ID for Azure authentication
     */
    tenantId?: string;

    /**
     * Client ID for service principal authentication
     */
    clientId?: string;

    /**
     * Whether to use managed identity for authentication
     */
    useManagedIdentity?: boolean;

    /**
     * Scopes for token acquisition
     * Default: ["https://cognitiveservices.azure.com/.default"]
     */
    scopes?: string[];
}

/**
 * Complete Azure AI Foundry service configuration
 */
export interface AzureAIFoundryServiceConfig {
    /**
     * Azure AI Foundry endpoint configuration
     */
    foundry: AzureAIFoundryConfig;

    /**
     * Azure credential configuration
     */
    credentials: AzureCredentialConfig;

    /**
     * Model information
     */
    model: AzureModelInfo;
}

// =============================================================================
// AZURE AI FOUNDRY SERVICE TYPES
// =============================================================================

/**
 * Response from Azure AI Foundry connection test
 */
export interface AzureConnectionTestResult {
    /**
     * Whether the connection test was successful
     */
    success: boolean;

    /**
     * Error message if connection failed
     */
    error?: string;

    /**
     * Response time in milliseconds
     */
    responseTime?: number;

    /**
     * Model information if connection successful
     */
    modelInfo?: AzureModelInfo;
}

/**
 * Azure AI Foundry service status
 */
export interface AzureServiceStatus {
    /**
     * Whether the service is initialized and ready
     */
    isInitialized: boolean;

    /**
     * Whether the service is currently connected
     */
    isConnected: boolean;

    /**
     * Last successful connection timestamp
     */
    lastConnected?: Date;

    /**
     * Current configuration being used
     */
    currentConfig?: AzureAIFoundryConfig;

    /**
     * Any active error state
     */
    error?: string;
}

/**
 * Token usage information from Azure OpenAI
 * Re-uses openai package CompletionUsage type
 */
export type AzureTokenUsage = CompletionUsage;

/**
 * Azure AI Foundry chat completion response
 * Extends openai ChatCompletion with Azure-specific metadata
 */
export interface AzureChatCompletionResponse extends ChatCompletion {
    /**
     * Response timestamp (Azure-specific addition)
     */
    timestamp: Date;

    /**
     * Request ID for tracking (Azure-specific addition)
     */
    requestId?: string;
}
