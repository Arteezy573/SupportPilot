/**
 * Services module index
 * Exports all service classes and utilities for clean imports
 */

// Azure services
export { 
    AzureCredentialService, 
    azureCredentialService, 
    createAzureCredentialService 
} from './azureCredentialService';

export {
    AzureOpenAIClientService,
    createAzureOpenAIClientService,
    getDefaultAzureOpenAIService
} from './azureOpenAIClientService';

// Export types for convenience
export type { 
    AzureCredentialConfig,
    AzureAIFoundryConfig,
    AzureAIFoundryServiceConfig,
    AzureConnectionTestResult,
    AzureServiceStatus
} from '../types/azure';