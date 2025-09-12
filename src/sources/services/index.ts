/**
 * Services module index
 * Exports all service classes and utilities for clean imports
 */

// Azure services
export { 
    AzureCredentialProvider, 
    azureCredentialProvider, 
    createAzureCredentialProvider 
} from './azureCredentialProvider';

export {
    AzureOpenAIClientBuilder,
    createAzureOpenAIClientBuilder,
    getDefaultAzureOpenAIClientBuilder
} from './azureOpenAIClientBuilder';

// Export types for convenience
export type { 
    AzureCredentialConfig,
    AzureAIFoundryConfig,
    AzureAIFoundryServiceConfig,
    AzureConnectionTestResult,
    AzureServiceStatus
} from '../types/azure';