/**
 * Azure Credential Provider
 * Provides Azure authentication using DefaultAzureCredential and getBearerTokenProvider
 * Following the pattern from SimpleAzureOpenAITest.js
 */

import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import type { AzureCredentialConfig } from "../types/azure";
import { logger } from "../utils/logger";

/**
 * Default scope for Azure Cognitive Services
 */
const DEFAULT_SCOPE = "https://cognitiveservices.azure.com/.default";

/**
 * Azure Credential Provider class
 * Manages Azure authentication and token provider creation
 */
export class AzureCredentialProvider {
    private credential?: DefaultAzureCredential;
    private config: AzureCredentialConfig;
    private preRetrievedToken?: string;

    /**
     * Initialize the Azure Credential Provider
     * @param config - Azure credential configuration options
     */
    constructor(config: AzureCredentialConfig = {}) {
        this.config = {
            scopes: [DEFAULT_SCOPE],
            ...config,
        };

        // Initialize DefaultAzureCredential with optional configuration
        const credentialOptions = {
            ...(this.config.tenantId && { tenantId: this.config.tenantId }),
            ...(this.config.clientId && { managedIdentityClientId: this.config.clientId }),
        };

        this.preRetrievedToken = process.env.AZURE_BEARER_TOKEN;
        this.credential = this.preRetrievedToken ? undefined : new DefaultAzureCredential(credentialOptions);

        logger.info("AzureCredentialProvider initialized", {
            tenantId: this.config.tenantId ? "[REDACTED]" : "not provided",
            clientId: this.config.clientId ? "[REDACTED]" : "not provided",
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes,
        });
    }

    /**
     * Create a bearer token provider for Azure OpenAI
     * @param scope - Optional scope override, defaults to cognitive services scope
     * @returns Bearer token provider function
     */
    public getBearerTokenProvider(scope?: string): () => Promise<string> {
        // Check if we have a pre-retrieved bearer token from environment
        if (this.preRetrievedToken) {
            logger.info("Using pre-retrieved bearer token from environment");

            // Return a simple function that provides the pre-retrieved token
            return () => {
                logger.debug("Returning pre-retrieved bearer token");
                return Promise.resolve(this.preRetrievedToken!);
            };
        }

        // Fall back to DefaultAzureCredential behavior
        const tokenScope = scope || this.config.scopes![0];

        logger.debug("Creating bearer token provider with DefaultAzureCredential", { scope: tokenScope });

        if (!this.credential) {
            throw new Error("DefaultAzureCredential is not initialized. Cannot create bearer token provider.");
        }

        try {
            const tokenProvider = getBearerTokenProvider(this.credential, tokenScope);

            logger.info("Bearer token provider created successfully", { scope: tokenScope });

            return tokenProvider;
        } catch (error) {
            logger.error("Failed to create bearer token provider", {
                error: error instanceof Error ? error.message : "Unknown error",
                scope: tokenScope,
            });
            throw new Error(`Failed to create bearer token provider: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    /**
     * Test the Azure credential by attempting to get a token
     * @param scope - Optional scope to test, defaults to cognitive services scope
     * @returns Promise that resolves to true if credential is valid
     */
    public async testCredential(scope?: string): Promise<boolean> {
        // Check if we have a pre-retrieved bearer token from environment
        const preRetrievedToken = this.preRetrievedToken;

        if (preRetrievedToken) {
            logger.info("Testing pre-retrieved bearer token from environment");

            // For pre-retrieved tokens, we assume they are valid since they were just retrieved
            // In a production scenario, you might want to validate the token format or expiry
            if (preRetrievedToken.length > 0) {
                logger.info("Pre-retrieved bearer token validation successful", {
                    tokenLength: preRetrievedToken.length,
                    tokenPrefix: preRetrievedToken.substring(0, 20) + "...",
                });
                return true;
            } else {
                logger.warn("Pre-retrieved bearer token is empty");
                return false;
            }
        }

        // Fall back to DefaultAzureCredential testing
        const tokenScope = scope || this.config.scopes![0];

        if (!this.credential) {
            logger.error("DefaultAzureCredential is not initialized. Cannot test credential.");
            return false;
        }

        try {
            logger.debug("Testing Azure credential with DefaultAzureCredential", { scope: tokenScope });

            const token = await this.credential.getToken(tokenScope);

            if (token && token.token) {
                logger.info("Azure credential test successful", {
                    scope: tokenScope,
                    expiresOn: token.expiresOnTimestamp,
                });
                return true;
            } else {
                logger.warn("Azure credential test failed - no token returned", { scope: tokenScope });
                return false;
            }
        } catch (error) {
            logger.error("Azure credential test failed", {
                error: error instanceof Error ? error.message : "Unknown error",
                scope: tokenScope,
            });
            return false;
        }
    }

    /**
     * Get the current credential configuration
     * @returns Current Azure credential configuration (sensitive data redacted)
     */
    public getConfig(): Partial<AzureCredentialConfig> & { usingPreRetrievedToken?: boolean } {
        return {
            tenantId: this.config.tenantId ? "[REDACTED]" : undefined,
            clientId: this.config.clientId ? "[REDACTED]" : undefined,
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes,
            usingPreRetrievedToken: !!process.env.AZURE_BEARER_TOKEN,
        };
    }

    /**
     * Check if using a pre-retrieved bearer token from environment
     * @returns True if using pre-retrieved token, false if using DefaultAzureCredential
     */
    public isUsingPreRetrievedToken(): boolean {
        return !!process.env.AZURE_BEARER_TOKEN;
    }

    /**
     * Update the credential configuration
     * @param newConfig - New configuration options
     */
    public updateConfig(newConfig: Partial<AzureCredentialConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig,
        };

        // Reinitialize credential with new configuration
        const credentialOptions = {
            ...(this.config.tenantId && { tenantId: this.config.tenantId }),
            ...(this.config.clientId && { managedIdentityClientId: this.config.clientId }),
        };

        this.credential = new DefaultAzureCredential(credentialOptions);

        logger.info("Azure credential configuration updated", {
            tenantId: this.config.tenantId ? "[REDACTED]" : "not provided",
            clientId: this.config.clientId ? "[REDACTED]" : "not provided",
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes,
        });
    }
}

/**
 * Default Azure Credential Provider instance
 * Can be used throughout the application for Azure authentication
 */
export const azureCredentialProvider = new AzureCredentialProvider();

/**
 * Factory function to create a new Azure Credential Provider instance
 * @param config - Azure credential configuration options
 * @returns New AzureCredentialProvider instance
 */
export function createAzureCredentialProvider(config: AzureCredentialConfig = {}): AzureCredentialProvider {
    return new AzureCredentialProvider(config);
}
