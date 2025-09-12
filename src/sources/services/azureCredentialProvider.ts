/**
 * Azure Credential Provider
 * Provides Azure authentication using DefaultAzureCredential and getBearerTokenProvider
 * Following the pattern from SimpleAzureOpenAITest.js
 */

import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import type { AzureCredentialConfig } from '../types/azure';
import { logger } from '../utils/logger';

/**
 * Default scope for Azure Cognitive Services
 */
const DEFAULT_SCOPE = 'https://cognitiveservices.azure.com/.default';

/**
 * Azure Credential Provider class
 * Manages Azure authentication and token provider creation
 */
export class AzureCredentialProvider {
    private credential: DefaultAzureCredential;
    private config: AzureCredentialConfig;

    /**
     * Initialize the Azure Credential Provider
     * @param config - Azure credential configuration options
     */
    constructor(config: AzureCredentialConfig = {}) {
        this.config = {
            scopes: [DEFAULT_SCOPE],
            ...config
        };

        // Initialize DefaultAzureCredential with optional configuration
        const credentialOptions = {
            ...(this.config.tenantId && { tenantId: this.config.tenantId }),
            ...(this.config.clientId && { managedIdentityClientId: this.config.clientId }),
        };

        this.credential = new DefaultAzureCredential(credentialOptions);
        
        logger.info('AzureCredentialProvider initialized', {
            tenantId: this.config.tenantId ? '[REDACTED]' : 'not provided',
            clientId: this.config.clientId ? '[REDACTED]' : 'not provided',
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes
        });
    }

    /**
     * Create a bearer token provider for Azure OpenAI
     * @param scope - Optional scope override, defaults to cognitive services scope
     * @returns Bearer token provider function
     */
    public getBearerTokenProvider(scope?: string) {
        const tokenScope = scope || this.config.scopes![0];
        
        logger.debug('Creating bearer token provider', { scope: tokenScope });
        
        try {
            const tokenProvider = getBearerTokenProvider(this.credential, tokenScope);
            
            logger.info('Bearer token provider created successfully', { scope: tokenScope });
            
            return tokenProvider;
        } catch (error) {
            logger.error('Failed to create bearer token provider', { 
                error: error instanceof Error ? error.message : 'Unknown error',
                scope: tokenScope 
            });
            throw new Error(`Failed to create bearer token provider: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Test the Azure credential by attempting to get a token
     * @param scope - Optional scope to test, defaults to cognitive services scope
     * @returns Promise that resolves to true if credential is valid
     */
    public async testCredential(scope?: string): Promise<boolean> {
        const tokenScope = scope || this.config.scopes![0];
        
        try {
            logger.debug('Testing Azure credential', { scope: tokenScope });
            
            const token = await this.credential.getToken(tokenScope);
            
            if (token && token.token) {
                logger.info('Azure credential test successful', { 
                    scope: tokenScope,
                    expiresOn: token.expiresOnTimestamp 
                });
                return true;
            } else {
                logger.warn('Azure credential test failed - no token returned', { scope: tokenScope });
                return false;
            }
        } catch (error) {
            logger.error('Azure credential test failed', { 
                error: error instanceof Error ? error.message : 'Unknown error',
                scope: tokenScope 
            });
            return false;
        }
    }

    /**
     * Get the current credential configuration
     * @returns Current Azure credential configuration (sensitive data redacted)
     */
    public getConfig(): Partial<AzureCredentialConfig> {
        return {
            tenantId: this.config.tenantId ? '[REDACTED]' : undefined,
            clientId: this.config.clientId ? '[REDACTED]' : undefined,
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes
        };
    }

    /**
     * Update the credential configuration
     * @param newConfig - New configuration options
     */
    public updateConfig(newConfig: Partial<AzureCredentialConfig>): void {
        this.config = {
            ...this.config,
            ...newConfig
        };

        // Reinitialize credential with new configuration
        const credentialOptions = {
            ...(this.config.tenantId && { tenantId: this.config.tenantId }),
            ...(this.config.clientId && { managedIdentityClientId: this.config.clientId }),
        };

        this.credential = new DefaultAzureCredential(credentialOptions);
        
        logger.info('Azure credential configuration updated', {
            tenantId: this.config.tenantId ? '[REDACTED]' : 'not provided',
            clientId: this.config.clientId ? '[REDACTED]' : 'not provided',
            useManagedIdentity: this.config.useManagedIdentity,
            scopes: this.config.scopes
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