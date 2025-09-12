/**
 * Azure OpenAI Client Builder
 * Provides Azure OpenAI client using AzureOpenAI from "openai" package v4.x
 * Integrates with Azure credential provider for secure authentication
 */

import { AzureOpenAI } from "openai";
import type { AzureAIFoundryConfig, AzureAIFoundryServiceConfig, AzureConnectionTestResult, AzureServiceStatus } from "../types/azure";
import { AzureCredentialProvider, createAzureCredentialProvider } from "./azureCredentialProvider";
import { logger } from "../utils/logger";

/**
 * Default configuration values for Azure OpenAI client
 */
const DEFAULT_CONFIG: Partial<AzureAIFoundryConfig> = {
    apiVersion: "2024-10-21",
    timeout: 30000,
    maxRetries: 3,
};

/**
 * Azure OpenAI Client Builder class
 * Manages Azure OpenAI client initialization and connection
 */
export class AzureOpenAIClientBuilder {
    private client: AzureOpenAI | null = null;
    private credentialProvider: AzureCredentialProvider;
    private config: AzureAIFoundryConfig;
    private isInitialized = false;
    private lastError: string | null = null;
    private lastConnected: Date | null = null;

    /**
     * Initialize the Azure OpenAI Client Builder
     * @param serviceConfig - Complete Azure AI Foundry service configuration
     */
    constructor(serviceConfig: AzureAIFoundryServiceConfig) {
        // Merge with default configuration
        this.config = {
            ...DEFAULT_CONFIG,
            ...serviceConfig.foundry,
        };

        // Initialize credential provider
        this.credentialProvider = createAzureCredentialProvider(serviceConfig.credentials);

        logger.info("AzureOpenAIClientBuilder initialized", {
            endpoint: this.config.endpoint,
            apiVersion: this.config.apiVersion,
            deploymentName: this.config.deploymentName,
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
        });
    }

    /**
     * Initialize the Azure OpenAI client with bearer token provider
     * @returns Promise that resolves when client is initialized
     */
    public async initializeClient(): Promise<void> {
        try {
            logger.debug("Initializing Azure OpenAI client");

            // Get bearer token provider from credential provider
            const azureADTokenProvider = this.credentialProvider.getBearerTokenProvider();

            // Create Azure OpenAI client
            this.client = new AzureOpenAI({
                endpoint: this.config.endpoint,
                azureADTokenProvider,
                apiVersion: this.config.apiVersion,
                timeout: this.config.timeout,
                maxRetries: this.config.maxRetries,
            });

            this.isInitialized = true;
            this.lastError = null;
            this.lastConnected = new Date();

            logger.info("Azure OpenAI client initialized successfully", {
                endpoint: this.config.endpoint,
                deploymentName: this.config.deploymentName,
            });
        } catch (error) {
            this.isInitialized = false;
            this.lastError = error instanceof Error ? error.message : "Unknown error during client initialization";

            logger.error("Failed to initialize Azure OpenAI client", {
                error: this.lastError,
                endpoint: this.config.endpoint,
            });

            throw new Error(`Failed to initialize Azure OpenAI client: ${this.lastError}`);
        }
    }

    /**
     * Get the Azure OpenAI client instance
     * @returns Azure OpenAI client instance
     * @throws Error if client is not initialized
     */
    public getClient(): AzureOpenAI {
        if (!this.client || !this.isInitialized) {
            throw new Error("Azure OpenAI client is not initialized. Call initializeClient() first.");
        }

        return this.client;
    }

    /**
     * Test the Azure OpenAI connection
     * @returns Promise that resolves to connection test result
     */
    public async testConnection(): Promise<AzureConnectionTestResult> {
        const startTime = Date.now();

        try {
            logger.debug("Testing Azure OpenAI connection");

            // First test credential
            const credentialValid = await this.credentialProvider.testCredential();
            if (!credentialValid) {
                return {
                    success: false,
                    error: "Azure credential validation failed",
                    responseTime: Date.now() - startTime,
                };
            }

            // Initialize client if not already done
            if (!this.isInitialized) {
                await this.initializeClient();
            }

            // Test connection with a simple chat completion
            const response = await this.client!.chat.completions.create({
                messages: [{ role: "user", content: "Test connection" }],
                model: this.config.deploymentName,
                max_tokens: 10,
                tools: [], // Ensure tools parameter is included for v4.x compatibility
            });

            const responseTime = Date.now() - startTime;
            this.lastConnected = new Date();
            this.lastError = null;

            logger.info("Azure OpenAI connection test successful", {
                responseTime,
                deploymentName: this.config.deploymentName,
                responseId: response.id,
            });

            return {
                success: true,
                responseTime,
                modelInfo: {
                    modelName: this.config.deploymentName,
                    maxTokens: 4096, // Default, could be configurable
                    supportsFunctions: true,
                    supportsVision: false, // Could be determined by model type
                    supportsStreaming: true,
                },
            };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.lastError = error instanceof Error ? error.message : "Unknown connection error";

            logger.error("Azure OpenAI connection test failed", {
                error: this.lastError,
                responseTime,
                endpoint: this.config.endpoint,
                deploymentName: this.config.deploymentName,
            });

            return {
                success: false,
                error: this.lastError,
                responseTime,
            };
        }
    }

    /**
     * Get the current service status
     * @returns Current Azure OpenAI service status
     */
    public getStatus(): AzureServiceStatus {
        return {
            isInitialized: this.isInitialized,
            isConnected: this.client !== null && this.lastError === null,
            lastConnected: this.lastConnected || undefined,
            currentConfig: this.config,
            error: this.lastError || undefined,
        };
    }

    /**
     * Update the service configuration
     * @param newServiceConfig - New Azure AI Foundry service configuration
     */
    public async updateConfig(newServiceConfig: AzureAIFoundryServiceConfig): Promise<void> {
        logger.info("Updating Azure OpenAI client configuration");

        // Update configuration
        this.config = {
            ...DEFAULT_CONFIG,
            ...newServiceConfig.foundry,
        };

        // Update credential provider
        this.credentialProvider.updateConfig(newServiceConfig.credentials);

        // Reset client state
        this.client = null;
        this.isInitialized = false;
        this.lastError = null;

        // Reinitialize client
        await this.initializeClient();

        logger.info("Azure OpenAI client configuration updated successfully");
    }

    /**
     * Get the current configuration (with sensitive data redacted)
     * @returns Current configuration with sensitive data redacted
     */
    public getConfig(): Partial<AzureAIFoundryConfig> {
        return {
            endpoint: this.config.endpoint,
            apiVersion: this.config.apiVersion,
            deploymentName: this.config.deploymentName,
            region: this.config.region,
            timeout: this.config.timeout,
            maxRetries: this.config.maxRetries,
        };
    }

    /**
     * Dispose of the service and clean up resources
     */
    public dispose(): void {
        logger.info("Disposing Azure OpenAI client builder");

        this.client = null;
        this.isInitialized = false;
        this.lastError = null;
        this.lastConnected = null;
    }
}

/**
 * Factory function to create a new Azure OpenAI Client Builder instance
 * @param serviceConfig - Azure AI Foundry service configuration
 * @returns New AzureOpenAIClientBuilder instance
 */
export function createAzureOpenAIClientBuilder(serviceConfig: AzureAIFoundryServiceConfig): AzureOpenAIClientBuilder {
    return new AzureOpenAIClientBuilder(serviceConfig);
}

/**
 * Default Azure OpenAI Client Builder instance
 * Can be configured and used throughout the application
 */
let defaultAzureOpenAIClientBuilder: AzureOpenAIClientBuilder | null = null;

/**
 * Get or create the default Azure OpenAI client builder instance
 * @param serviceConfig - Configuration for the default service (required on first call)
 * @returns Default Azure OpenAI client builder instance
 */
export function getDefaultAzureOpenAIClientBuilder(serviceConfig?: AzureAIFoundryServiceConfig): AzureOpenAIClientBuilder {
    if (!defaultAzureOpenAIClientBuilder) {
        if (!serviceConfig) {
            throw new Error("Service configuration is required for first-time initialization of default Azure OpenAI client builder");
        }
        defaultAzureOpenAIClientBuilder = new AzureOpenAIClientBuilder(serviceConfig);
    }

    return defaultAzureOpenAIClientBuilder;
}
