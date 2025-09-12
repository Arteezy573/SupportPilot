/**
 * Unit tests for Azure Credential Provider
 * Tests authentication, token provider creation, and configuration management
 */

import { AzureCredentialProvider, createAzureCredentialProvider } from '../../sources/services/azureCredentialProvider';
import { DefaultAzureCredential, getBearerTokenProvider } from '@azure/identity';
import type { AzureCredentialConfig } from '../../sources/types/azure';

// Mock Azure Identity modules
jest.mock('@azure/identity', () => ({
    DefaultAzureCredential: jest.fn(),
    getBearerTokenProvider: jest.fn()
}));

// Mock logger
jest.mock('../../sources/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    }
}));

describe('AzureCredentialProvider', () => {
    let mockCredential: jest.Mocked<DefaultAzureCredential>;
    let mockGetBearerTokenProvider: jest.MockedFunction<typeof getBearerTokenProvider>;
    let provider: AzureCredentialProvider;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock credential
        mockCredential = {
            getToken: jest.fn()
        } as any;
        
        (DefaultAzureCredential as jest.MockedClass<typeof DefaultAzureCredential>).mockImplementation(() => mockCredential);
        
        mockGetBearerTokenProvider = getBearerTokenProvider as jest.MockedFunction<typeof getBearerTokenProvider>;
        
        provider = new AzureCredentialProvider();
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(DefaultAzureCredential).toHaveBeenCalledWith({});
            expect(provider.getConfig()).toEqual({
                useManagedIdentity: undefined,
                scopes: ['https://cognitiveservices.azure.com/.default']
            });
        });

        it('should initialize with custom configuration', () => {
            const config: AzureCredentialConfig = {
                tenantId: 'test-tenant-id',
                clientId: 'test-client-id',
                useManagedIdentity: true,
                scopes: ['custom-scope']
            };

            const customProvider = new AzureCredentialProvider(config);

            expect(DefaultAzureCredential).toHaveBeenCalledWith({
                tenantId: 'test-tenant-id',
                managedIdentityClientId: 'test-client-id'
            });

            const providerConfig = customProvider.getConfig();
            expect(providerConfig.useManagedIdentity).toBe(true);
            expect(providerConfig.scopes).toEqual(['custom-scope']);
            expect(providerConfig.tenantId).toBe('[REDACTED]');
            expect(providerConfig.clientId).toBe('[REDACTED]');
        });
    });

    describe('getBearerTokenProvider', () => {
        it('should create bearer token provider with default scope', () => {
            const mockTokenProvider = jest.fn();
            mockGetBearerTokenProvider.mockReturnValue(mockTokenProvider);

            const result = provider.getBearerTokenProvider();

            expect(getBearerTokenProvider).toHaveBeenCalledWith(
                mockCredential,
                'https://cognitiveservices.azure.com/.default'
            );
            expect(result).toBe(mockTokenProvider);
        });

        it('should create bearer token provider with custom scope', () => {
            const customScope = 'https://custom.scope/.default';
            const mockTokenProvider = jest.fn();
            mockGetBearerTokenProvider.mockReturnValue(mockTokenProvider);

            const result = provider.getBearerTokenProvider(customScope);

            expect(getBearerTokenProvider).toHaveBeenCalledWith(mockCredential, customScope);
            expect(result).toBe(mockTokenProvider);
        });

        it('should throw error when token provider creation fails', () => {
            const error = new Error('Token provider creation failed');
            mockGetBearerTokenProvider.mockImplementation(() => {
                throw error;
            });

            expect(() => provider.getBearerTokenProvider()).toThrow(
                'Failed to create bearer token provider: Token provider creation failed'
            );
        });
    });

    describe('testCredential', () => {
        it('should return true when credential test succeeds', async () => {
            const mockToken = {
                token: 'test-token',
                expiresOnTimestamp: Date.now() + 3600000
            };
            mockCredential.getToken.mockResolvedValue(mockToken);

            const result = await provider.testCredential();

            expect(mockCredential.getToken).toHaveBeenCalledWith('https://cognitiveservices.azure.com/.default');
            expect(result).toBe(true);
        });

        it('should return true when credential test succeeds with custom scope', async () => {
            const customScope = 'https://custom.scope/.default';
            const mockToken = {
                token: 'test-token',
                expiresOnTimestamp: Date.now() + 3600000
            };
            mockCredential.getToken.mockResolvedValue(mockToken);

            const result = await provider.testCredential(customScope);

            expect(mockCredential.getToken).toHaveBeenCalledWith(customScope);
            expect(result).toBe(true);
        });

        it('should return false when credential returns no token', async () => {
            mockCredential.getToken.mockResolvedValue(null as any);

            const result = await provider.testCredential();

            expect(result).toBe(false);
        });

        it('should return false when credential returns empty token', async () => {
            mockCredential.getToken.mockResolvedValue({ token: '', expiresOnTimestamp: 0 });

            const result = await provider.testCredential();

            expect(result).toBe(false);
        });

        it('should return false when credential test throws error', async () => {
            const error = new Error('Authentication failed');
            mockCredential.getToken.mockRejectedValue(error);

            const result = await provider.testCredential();

            expect(result).toBe(false);
        });
    });

    describe('updateConfig', () => {
        it('should update configuration and reinitialize credential', () => {
            const newConfig: Partial<AzureCredentialConfig> = {
                tenantId: 'new-tenant-id',
                useManagedIdentity: true
            };

            provider.updateConfig(newConfig);

            // Should have called DefaultAzureCredential constructor twice (initial + update)
            expect(DefaultAzureCredential).toHaveBeenCalledTimes(2);
            expect(DefaultAzureCredential).toHaveBeenLastCalledWith({
                tenantId: 'new-tenant-id'
            });

            const config = provider.getConfig();
            expect(config.tenantId).toBe('[REDACTED]');
            expect(config.useManagedIdentity).toBe(true);
        });

        it('should merge new config with existing config', () => {
            const initialConfig: AzureCredentialConfig = {
                tenantId: 'initial-tenant',
                scopes: ['initial-scope']
            };

            const providerWithConfig = new AzureCredentialProvider(initialConfig);
            
            const updateConfig: Partial<AzureCredentialConfig> = {
                clientId: 'new-client-id'
            };

            providerWithConfig.updateConfig(updateConfig);

            const finalConfig = providerWithConfig.getConfig();
            expect(finalConfig.tenantId).toBe('[REDACTED]');
            expect(finalConfig.clientId).toBe('[REDACTED]');
            expect(finalConfig.scopes).toEqual(['initial-scope']);
        });
    });

    describe('getConfig', () => {
        it('should return configuration with sensitive data redacted', () => {
            const config: AzureCredentialConfig = {
                tenantId: 'sensitive-tenant-id',
                clientId: 'sensitive-client-id',
                useManagedIdentity: false,
                scopes: ['test-scope']
            };

            const providerWithConfig = new AzureCredentialProvider(config);
            const returnedConfig = providerWithConfig.getConfig();

            expect(returnedConfig).toEqual({
                tenantId: '[REDACTED]',
                clientId: '[REDACTED]',
                useManagedIdentity: false,
                scopes: ['test-scope']
            });
        });

        it('should return undefined for unset sensitive fields', () => {
            const config: AzureCredentialConfig = {
                useManagedIdentity: true,
                scopes: ['test-scope']
            };

            const providerWithConfig = new AzureCredentialProvider(config);
            const returnedConfig = providerWithConfig.getConfig();

            expect(returnedConfig).toEqual({
                tenantId: undefined,
                clientId: undefined,
                useManagedIdentity: true,
                scopes: ['test-scope']
            });
        });
    });
});

describe('createAzureCredentialProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create new provider instance with default config', () => {
        const provider = createAzureCredentialProvider();
        
        expect(provider).toBeInstanceOf(AzureCredentialProvider);
        expect(DefaultAzureCredential).toHaveBeenCalledWith({});
    });

    it('should create new provider instance with custom config', () => {
        const config: AzureCredentialConfig = {
            tenantId: 'test-tenant',
            useManagedIdentity: true
        };

        const provider = createAzureCredentialProvider(config);
        
        expect(provider).toBeInstanceOf(AzureCredentialProvider);
        expect(DefaultAzureCredential).toHaveBeenCalledWith({
            tenantId: 'test-tenant'
        });
    });
});