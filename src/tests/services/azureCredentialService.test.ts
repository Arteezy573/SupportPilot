/**
 * Unit tests for Azure Credential Service
 * Tests authentication, token provider creation, and configuration management
 */

import { AzureCredentialService, createAzureCredentialService } from '../../sources/services/azureCredentialService';
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

describe('AzureCredentialService', () => {
    let mockCredential: jest.Mocked<DefaultAzureCredential>;
    let mockGetBearerTokenProvider: jest.MockedFunction<typeof getBearerTokenProvider>;
    let service: AzureCredentialService;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock credential
        mockCredential = {
            getToken: jest.fn()
        } as any;
        
        (DefaultAzureCredential as jest.MockedClass<typeof DefaultAzureCredential>).mockImplementation(() => mockCredential);
        
        mockGetBearerTokenProvider = getBearerTokenProvider as jest.MockedFunction<typeof getBearerTokenProvider>;
        
        service = new AzureCredentialService();
    });

    describe('constructor', () => {
        it('should initialize with default configuration', () => {
            expect(DefaultAzureCredential).toHaveBeenCalledWith({});
            expect(service.getConfig()).toEqual({
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

            const customService = new AzureCredentialService(config);

            expect(DefaultAzureCredential).toHaveBeenCalledWith({
                tenantId: 'test-tenant-id',
                managedIdentityClientId: 'test-client-id'
            });

            const serviceConfig = customService.getConfig();
            expect(serviceConfig.useManagedIdentity).toBe(true);
            expect(serviceConfig.scopes).toEqual(['custom-scope']);
            expect(serviceConfig.tenantId).toBe('[REDACTED]');
            expect(serviceConfig.clientId).toBe('[REDACTED]');
        });
    });

    describe('getBearerTokenProvider', () => {
        it('should create bearer token provider with default scope', () => {
            const mockTokenProvider = jest.fn();
            mockGetBearerTokenProvider.mockReturnValue(mockTokenProvider);

            const result = service.getBearerTokenProvider();

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

            const result = service.getBearerTokenProvider(customScope);

            expect(getBearerTokenProvider).toHaveBeenCalledWith(mockCredential, customScope);
            expect(result).toBe(mockTokenProvider);
        });

        it('should throw error when token provider creation fails', () => {
            const error = new Error('Token provider creation failed');
            mockGetBearerTokenProvider.mockImplementation(() => {
                throw error;
            });

            expect(() => service.getBearerTokenProvider()).toThrow(
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

            const result = await service.testCredential();

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

            const result = await service.testCredential(customScope);

            expect(mockCredential.getToken).toHaveBeenCalledWith(customScope);
            expect(result).toBe(true);
        });

        it('should return false when credential returns no token', async () => {
            mockCredential.getToken.mockResolvedValue(null as any);

            const result = await service.testCredential();

            expect(result).toBe(false);
        });

        it('should return false when credential returns empty token', async () => {
            mockCredential.getToken.mockResolvedValue({ token: '', expiresOnTimestamp: 0 });

            const result = await service.testCredential();

            expect(result).toBe(false);
        });

        it('should return false when credential test throws error', async () => {
            const error = new Error('Authentication failed');
            mockCredential.getToken.mockRejectedValue(error);

            const result = await service.testCredential();

            expect(result).toBe(false);
        });
    });

    describe('updateConfig', () => {
        it('should update configuration and reinitialize credential', () => {
            const newConfig: Partial<AzureCredentialConfig> = {
                tenantId: 'new-tenant-id',
                useManagedIdentity: true
            };

            service.updateConfig(newConfig);

            // Should have called DefaultAzureCredential constructor twice (initial + update)
            expect(DefaultAzureCredential).toHaveBeenCalledTimes(2);
            expect(DefaultAzureCredential).toHaveBeenLastCalledWith({
                tenantId: 'new-tenant-id'
            });

            const config = service.getConfig();
            expect(config.tenantId).toBe('[REDACTED]');
            expect(config.useManagedIdentity).toBe(true);
        });

        it('should merge new config with existing config', () => {
            const initialConfig: AzureCredentialConfig = {
                tenantId: 'initial-tenant',
                scopes: ['initial-scope']
            };

            const serviceWithConfig = new AzureCredentialService(initialConfig);
            
            const updateConfig: Partial<AzureCredentialConfig> = {
                clientId: 'new-client-id'
            };

            serviceWithConfig.updateConfig(updateConfig);

            const finalConfig = serviceWithConfig.getConfig();
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

            const serviceWithConfig = new AzureCredentialService(config);
            const returnedConfig = serviceWithConfig.getConfig();

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

            const serviceWithConfig = new AzureCredentialService(config);
            const returnedConfig = serviceWithConfig.getConfig();

            expect(returnedConfig).toEqual({
                tenantId: undefined,
                clientId: undefined,
                useManagedIdentity: true,
                scopes: ['test-scope']
            });
        });
    });
});

describe('createAzureCredentialService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create new service instance with default config', () => {
        const service = createAzureCredentialService();
        
        expect(service).toBeInstanceOf(AzureCredentialService);
        expect(DefaultAzureCredential).toHaveBeenCalledWith({});
    });

    it('should create new service instance with custom config', () => {
        const config: AzureCredentialConfig = {
            tenantId: 'test-tenant',
            useManagedIdentity: true
        };

        const service = createAzureCredentialService(config);
        
        expect(service).toBeInstanceOf(AzureCredentialService);
        expect(DefaultAzureCredential).toHaveBeenCalledWith({
            tenantId: 'test-tenant'
        });
    });
});