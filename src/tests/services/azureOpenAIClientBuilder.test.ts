/**
 * Unit tests for Azure OpenAI Client Builder
 * Tests client initialization, connection testing, and configuration management
 */

import { AzureOpenAIClientBuilder, createAzureOpenAIClientBuilder } from "../../sources/services/azureOpenAIClientBuilder";
import { AzureCredentialProvider, createAzureCredentialProvider } from "../../sources/services/azureCredentialProvider";
import { AzureOpenAI } from "openai";
import type { AzureAIFoundryServiceConfig } from "../../sources/types/azure";

// Mock Azure OpenAI
jest.mock("openai", () => ({
    AzureOpenAI: jest.fn(),
}));

// Mock Azure Credential Provider
jest.mock("../../sources/services/azureCredentialProvider", () => ({
    AzureCredentialProvider: jest.fn(),
    createAzureCredentialProvider: jest.fn(),
}));

// Mock logger
jest.mock("../../sources/utils/logger", () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe("AzureOpenAIClientBuilder", () => {
    let mockAzureOpenAI: jest.Mocked<AzureOpenAI>;
    let mockCredentialProvider: jest.Mocked<AzureCredentialProvider>;
    let mockCreateCredentialProvider: jest.MockedFunction<typeof createAzureCredentialProvider>;
    let mockChatCompletionsCreate: jest.Mock;
    let builder: AzureOpenAIClientBuilder;
    let testConfig: AzureAIFoundryServiceConfig;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock credential provider
        mockCredentialProvider = {
            getBearerTokenProvider: jest.fn(),
            testCredential: jest.fn(),
            updateConfig: jest.fn(),
            getConfig: jest.fn(),
        } as any;

        mockCreateCredentialProvider = jest.mocked(createAzureCredentialProvider);
        mockCreateCredentialProvider.mockReturnValue(mockCredentialProvider);

        // Setup mock chat completions
        mockChatCompletionsCreate = jest.fn();

        // Setup mock Azure OpenAI client
        mockAzureOpenAI = {
            chat: {
                completions: {
                    create: mockChatCompletionsCreate,
                },
            },
        } as any;

        (AzureOpenAI as jest.MockedClass<typeof AzureOpenAI>).mockImplementation(() => mockAzureOpenAI);

        // Test configuration
        testConfig = {
            foundry: {
                endpoint: "https://test.openai.azure.com/",
                apiVersion: "2024-10-21",
                deploymentName: "gpt-4o",
            },
            credentials: {
                scopes: ["https://cognitiveservices.azure.com/.default"],
            },
            model: {
                modelName: "gpt-4o",
                maxTokens: 4096,
                supportsFunctions: true,
                supportsVision: false,
                supportsStreaming: true,
            },
        };

        builder = new AzureOpenAIClientBuilder(testConfig);
    });

    describe("constructor", () => {
        it("should initialize with proper configuration", () => {
            expect(mockCreateCredentialProvider).toHaveBeenCalledWith(testConfig.credentials);

            const config = builder.getConfig();
            expect(config.endpoint).toBe("https://test.openai.azure.com/");
            expect(config.apiVersion).toBe("2024-10-21");
            expect(config.deploymentName).toBe("gpt-4o");
            expect(config.timeout).toBe(30000); // Default value
            expect(config.maxRetries).toBe(3); // Default value
        });

        it("should merge with default configuration", () => {
            const minimalConfig: AzureAIFoundryServiceConfig = {
                foundry: {
                    endpoint: "https://minimal.openai.azure.com/",
                    apiVersion: "2024-02-15-preview",
                    deploymentName: "gpt-35-turbo",
                },
                credentials: {},
                model: {
                    modelName: "gpt-35-turbo",
                    maxTokens: 2048,
                    supportsFunctions: false,
                    supportsVision: false,
                    supportsStreaming: true,
                },
            };

            const minimalBuilder = new AzureOpenAIClientBuilder(minimalConfig);
            const config = minimalBuilder.getConfig();

            expect(config.timeout).toBe(30000); // Default
            expect(config.maxRetries).toBe(3); // Default
            expect(config.endpoint).toBe("https://minimal.openai.azure.com/");
        });
    });

    describe("initializeClient", () => {
        it("should initialize Azure OpenAI client successfully", async () => {
            const mockTokenProvider = jest.fn();
            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(mockTokenProvider);

            await builder.initializeClient();

            expect(mockCredentialProvider.getBearerTokenProvider).toHaveBeenCalled();
            expect(AzureOpenAI).toHaveBeenCalledWith({
                endpoint: "https://test.openai.azure.com/",
                azureADTokenProvider: mockTokenProvider,
                apiVersion: "2024-10-21",
                timeout: 30000,
                maxRetries: 3,
            });

            const status = builder.getStatus();
            expect(status.isInitialized).toBe(true);
            expect(status.error).toBeUndefined();
        });

        it("should handle initialization errors", async () => {
            const error = new Error("Token provider failed");
            mockCredentialProvider.getBearerTokenProvider.mockImplementation(() => {
                throw error;
            });

            await expect(builder.initializeClient()).rejects.toThrow("Failed to initialize Azure OpenAI client: Token provider failed");

            const status = builder.getStatus();
            expect(status.isInitialized).toBe(false);
            expect(status.error).toBe("Token provider failed");
        });
    });

    describe("getClient", () => {
        it("should return client when initialized", async () => {
            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(jest.fn());
            await builder.initializeClient();

            const client = builder.getClient();
            expect(client).toBe(mockAzureOpenAI);
        });

        it("should throw error when not initialized", () => {
            expect(() => builder.getClient()).toThrow("Azure OpenAI client is not initialized. Call initializeClient() first.");
        });
    });

    describe("testConnection", () => {
        beforeEach(async () => {
            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(jest.fn());
            mockCredentialProvider.testCredential.mockResolvedValue(true);
        });

        it("should test connection successfully", async () => {
            const mockResponse = {
                id: "test-response-id",
                choices: [{ message: { content: "Test response" } }],
            };
            mockChatCompletionsCreate.mockResolvedValue(mockResponse);

            const startTime = Date.now();
            const result = await builder.testConnection();
            const endTime = Date.now();

            expect(mockCredentialProvider.testCredential).toHaveBeenCalled();
            expect(mockChatCompletionsCreate).toHaveBeenCalledWith({
                messages: [{ role: "user", content: "Test connection" }],
                model: "gpt-4o",
                max_tokens: 10,
                tools: [],
            });

            expect(result.success).toBe(true);
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
            expect(result.responseTime).toBeLessThanOrEqual(endTime - startTime + 10); // Allow some margin
            expect(result.modelInfo).toEqual({
                modelName: "gpt-4o",
                maxTokens: 4096,
                supportsFunctions: true,
                supportsVision: false,
                supportsStreaming: true,
            });
        });

        it("should fail when credential test fails", async () => {
            mockCredentialProvider.testCredential.mockResolvedValue(false);

            const result = await builder.testConnection();

            expect(result.success).toBe(false);
            expect(result.error).toBe("Azure credential validation failed");
            expect(mockChatCompletionsCreate).not.toHaveBeenCalled();
        });

        it("should handle connection errors", async () => {
            const error = new Error("Network timeout");
            mockChatCompletionsCreate.mockRejectedValue(error);

            const startTime = Date.now();
            const result = await builder.testConnection();
            const endTime = Date.now();

            expect(result.success).toBe(false);
            expect(result.error).toBe("Network timeout");
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
            expect(result.responseTime).toBeLessThanOrEqual(endTime - startTime + 10); // Allow some margin
        });

        it("should initialize client if not already initialized", async () => {
            // Builder starts uninitialized
            expect(builder.getStatus().isInitialized).toBe(false);

            const mockResponse = {
                id: "test-response-id",
                choices: [{ message: { content: "Test response" } }],
            };
            mockChatCompletionsCreate.mockResolvedValue(mockResponse);

            const result = await builder.testConnection();

            expect(result.success).toBe(true);
            expect(builder.getStatus().isInitialized).toBe(true);
        });
    });

    describe("getStatus", () => {
        it("should return correct status when not initialized", () => {
            const status = builder.getStatus();

            expect(status).toEqual({
                isInitialized: false,
                isConnected: false,
                lastConnected: undefined,
                currentConfig: expect.objectContaining({
                    endpoint: "https://test.openai.azure.com/",
                    deploymentName: "gpt-4o",
                }),
                error: undefined,
            });
        });

        it("should return correct status when initialized and connected", async () => {
            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(jest.fn());
            mockCredentialProvider.testCredential.mockResolvedValue(true);

            const mockResponse = {
                id: "test-response-id",
                choices: [{ message: { content: "Test response" } }],
            };
            mockChatCompletionsCreate.mockResolvedValue(mockResponse);

            await builder.testConnection();
            const status = builder.getStatus();

            expect(status.isInitialized).toBe(true);
            expect(status.isConnected).toBe(true);
            expect(status.lastConnected).toBeInstanceOf(Date);
            expect(status.error).toBeUndefined();
        });
    });

    describe("updateConfig", () => {
        it("should update configuration and reinitialize client", async () => {
            // First initialize the client
            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(jest.fn());
            await builder.initializeClient();

            // Clear the constructor call count after initial setup
            jest.clearAllMocks();
            (AzureOpenAI as jest.MockedClass<typeof AzureOpenAI>).mockImplementation(() => mockAzureOpenAI);

            const newConfig: AzureAIFoundryServiceConfig = {
                foundry: {
                    endpoint: "https://updated.openai.azure.com/",
                    apiVersion: "2024-08-01-preview",
                    deploymentName: "gpt-4o-updated",
                },
                credentials: {
                    tenantId: "new-tenant-id",
                },
                model: {
                    modelName: "gpt-4o-updated",
                    maxTokens: 8192,
                    supportsFunctions: true,
                    supportsVision: true,
                    supportsStreaming: true,
                },
            };

            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(jest.fn());

            await builder.updateConfig(newConfig);

            expect(mockCredentialProvider.updateConfig).toHaveBeenCalledWith(newConfig.credentials);
            expect(AzureOpenAI).toHaveBeenCalledTimes(1); // Called once during updateConfig

            const config = builder.getConfig();
            expect(config.endpoint).toBe("https://updated.openai.azure.com/");
            expect(config.deploymentName).toBe("gpt-4o-updated");
        });
    });

    describe("dispose", () => {
        it("should clean up resources", async () => {
            mockCredentialProvider.getBearerTokenProvider.mockReturnValue(jest.fn());
            await builder.initializeClient();

            builder.dispose();

            const status = builder.getStatus();
            expect(status.isInitialized).toBe(false);
            expect(status.isConnected).toBe(false);
            expect(status.lastConnected).toBeUndefined();
        });
    });
});

describe("createAzureOpenAIClientBuilder", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should create new builder instance", () => {
        const config: AzureAIFoundryServiceConfig = {
            foundry: {
                endpoint: "https://factory.openai.azure.com/",
                apiVersion: "2024-10-21",
                deploymentName: "gpt-4o",
            },
            credentials: {},
            model: {
                modelName: "gpt-4o",
                maxTokens: 4096,
                supportsFunctions: true,
                supportsVision: false,
                supportsStreaming: true,
            },
        };

        const builder = createAzureOpenAIClientBuilder(config);

        expect(builder).toBeInstanceOf(AzureOpenAIClientBuilder);
        expect(builder.getConfig().endpoint).toBe("https://factory.openai.azure.com/");
    });
});

describe("getDefaultAzureOpenAIClientBuilder", () => {
    // Import the module to access internal state
    let azureOpenAIModule: any;

    beforeEach(async () => {
        jest.clearAllMocks();
        // Reset the default builder by re-importing the module
        jest.resetModules();
        azureOpenAIModule = await import("../../sources/services/azureOpenAIClientBuilder");
        // Reset the internal defaultAzureOpenAIClientBuilder variable
        (azureOpenAIModule as any).defaultAzureOpenAIClientBuilder = null;
    });

    it("should create default builder on first call with config", () => {
        const config: AzureAIFoundryServiceConfig = {
            foundry: {
                endpoint: "https://default.openai.azure.com/",
                apiVersion: "2024-10-21",
                deploymentName: "gpt-4o",
            },
            credentials: {},
            model: {
                modelName: "gpt-4o",
                maxTokens: 4096,
                supportsFunctions: true,
                supportsVision: false,
                supportsStreaming: true,
            },
        };

        const builder = azureOpenAIModule.getDefaultAzureOpenAIClientBuilder(config);

        expect(builder).toBeInstanceOf(azureOpenAIModule.AzureOpenAIClientBuilder);
        expect(builder.getConfig().endpoint).toBe("https://default.openai.azure.com/");
    });

    it("should return same instance on subsequent calls", () => {
        const config: AzureAIFoundryServiceConfig = {
            foundry: {
                endpoint: "https://default.openai.azure.com/",
                apiVersion: "2024-10-21",
                deploymentName: "gpt-4o",
            },
            credentials: {},
            model: {
                modelName: "gpt-4o",
                maxTokens: 4096,
                supportsFunctions: true,
                supportsVision: false,
                supportsStreaming: true,
            },
        };

        const builder1 = azureOpenAIModule.getDefaultAzureOpenAIClientBuilder(config);
        const builder2 = azureOpenAIModule.getDefaultAzureOpenAIClientBuilder();

        expect(builder1).toBe(builder2);
    });

    it("should throw error when called without config and no default exists", () => {
        expect(() => azureOpenAIModule.getDefaultAzureOpenAIClientBuilder()).toThrow(
            "Service configuration is required for first-time initialization of default Azure OpenAI client builder"
        );
    });
});
