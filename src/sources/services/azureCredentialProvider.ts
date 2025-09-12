/**
 * Azure Credential Provider
 * Provides Azure authentication using DefaultAzureCredential and getBearerTokenProvider
 * Following the pattern from SimpleAzureOpenAITest.js
 */

import type { AzureCredentialConfig } from "../types/azure";
import { TokenCredential } from "@azure/identity";
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
    private credential?: TokenCredential;
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

        this.preRetrievedToken = process.env.AZURE_BEARER_TOKEN;

        logger.info("AzureCredentialProvider initialized", {
            tenantId: this.config.tenantId ? "[REDACTED]" : "not provided",
            clientId: this.config.clientId ? "[REDACTED]" : "not provided",
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes,
            usingPreRetrievedToken: !!this.preRetrievedToken,
        });
    }

    /**
     * Dynamically initialize DefaultAzureCredential only when needed
     */
    private async ensureCredential(): Promise<void> {
        if (this.credential || this.preRetrievedToken) {
            return; // Already have credential or using pre-retrieved token
        }

        try {
            const { DefaultAzureCredential } = await import("@azure/identity");
            
            const credentialOptions = {
                ...(this.config.tenantId && { tenantId: this.config.tenantId }),
                ...(this.config.clientId && { managedIdentityClientId: this.config.clientId }),
            };

            this.credential = new DefaultAzureCredential(credentialOptions);
            
            logger.debug("DefaultAzureCredential initialized dynamically");
        } catch (error) {
            logger.error("Failed to initialize DefaultAzureCredential", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
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

        return async () => {
            try {
                await this.ensureCredential();
                
                if (!this.credential) {
                    throw new Error("DefaultAzureCredential could not be initialized");
                }

                const { getBearerTokenProvider } = await import("@azure/identity");
                // Type assertion needed for compatibility with Azure SDK types
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const tokenProvider = getBearerTokenProvider(this.credential as any, tokenScope);
                const token = await tokenProvider();

                logger.info("Bearer token provider created and token retrieved successfully", { scope: tokenScope });

                return token;
            } catch (error) {
                logger.error("Failed to create bearer token provider or retrieve token", {
                    error: error instanceof Error ? error.message : "Unknown error",
                    scope: tokenScope,
                });
                throw new Error(`Failed to get bearer token: ${error instanceof Error ? error.message : "Unknown error"}`);
            }
        };
    }

    /**
     * Test the Azure credential by attempting to get a token
     * @param scope - Optional scope to test, defaults to cognitive services scope
     * @returns Promise that resolves to true if credential is valid
     */
    public async testCredential(scope?: string): Promise<boolean> {
        // Check if we have a pre-retrieved bearer token from environment
        if (this.preRetrievedToken) {
            logger.info("Testing pre-retrieved bearer token from environment");

            // For pre-retrieved tokens, we assume they are valid since they were just retrieved
            if (this.preRetrievedToken.length > 0) {
                logger.info("Pre-retrieved bearer token validation successful", {
                    tokenLength: this.preRetrievedToken.length,
                    tokenPrefix: this.preRetrievedToken.substring(0, 20) + "...",
                });
                return true;
            } else {
                logger.warn("Pre-retrieved bearer token is empty");
                return false;
            }
        }

        // Fall back to DefaultAzureCredential testing
        const tokenScope = scope || this.config.scopes![0];

        try {
            await this.ensureCredential();

            if (!this.credential) {
                logger.error("DefaultAzureCredential could not be initialized");
                return false;
            }

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
            usingPreRetrievedToken: !!this.preRetrievedToken,
        };
    }

    /**
     * Check if using a pre-retrieved bearer token from environment
     * @returns True if using pre-retrieved token, false if using DefaultAzureCredential
     */
    public isUsingPreRetrievedToken(): boolean {
        return !!this.preRetrievedToken;
    }

    /**
     * Update the credential configuration
     * @param newConfig - New configuration options
     */
    public async updateConfig(newConfig: Partial<AzureCredentialConfig>): Promise<void> {
        this.config = {
            ...this.config,
            ...newConfig,
        };

        // Re-check for pre-retrieved token
        this.preRetrievedToken = process.env.AZURE_BEARER_TOKEN;

        // Reset credential to force re-initialization with new config
        this.credential = undefined;

        logger.info("Azure credential configuration updated", {
            tenantId: this.config.tenantId ? "[REDACTED]" : "not provided",
            clientId: this.config.clientId ? "[REDACTED]" : "not provided",
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes,
            usingPreRetrievedToken: !!this.preRetrievedToken,
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
