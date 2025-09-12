/**
 * Integration test for useChat helper functions with real Azure AI Foundry API
 * Tests the extracted core logic without React dependencies
 */

import path from "path";
import fs from "fs";
import os from "os";
import {
    AzureOpenAIClientBuilder,
    AzureChatCompletionService,
    ToolManager,
    createChatCompletionService,
    createToolManager,
    type ToolMeta,
} from "../../../sources/services";
import {
    processChatCompletionHelper,
    executeToolCallHelper,
    executeToolCallsHelper,
    completeChatFlowHelper,
    generateMessageId,
    type ChatCompletionHelperRequest,
} from "../../../sources/renderer/hooks/useChat";
import type { Message } from "../../../sources/types/chat";

// Azure configuration for integration tests
const AZURE_CONFIG = {
    endpoint: "https://guacheng-azureaifoundry.openai.azure.com/",
    apiVersion: "2024-10-21",
    deploymentName: "gpt-4o",
};

// Skip integration tests if running in CI or if credentials are not available
const shouldSkipIntegration = process.env.CI === "true" || process.env.SKIP_INTEGRATION === "true";

describe("useChat Helper Functions Integration Tests", () => {
    let chatService: AzureChatCompletionService;
    let toolManager: ToolManager;
    let testDirectory: string;

    beforeEach(() => {
        // Clear console to avoid noise in test output
        jest.spyOn(console, "log").mockImplementation(() => {});
        jest.spyOn(console, "error").mockImplementation(() => {});
        jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    beforeAll(async () => {
        if (shouldSkipIntegration) {
            console.log("⏭️ Skipping helper function integration tests (CI or SKIP_INTEGRATION=true)");
            return;
        }

        try {
            // Create test directory for file operations
            testDirectory = path.join(os.tmpdir(), "support-pilot-helper-test", `test-${Date.now()}`);
            await fs.promises.mkdir(testDirectory, { recursive: true });

            // Set up Azure OpenAI client builder
            const clientBuilder = new AzureOpenAIClientBuilder({
                foundry: {
                    endpoint: AZURE_CONFIG.endpoint,
                    apiVersion: AZURE_CONFIG.apiVersion,
                    deploymentName: AZURE_CONFIG.deploymentName,
                },
                credentials: {
                    scopes: ["https://cognitiveservices.azure.com/.default"],
                },
                model: {
                    modelName: AZURE_CONFIG.deploymentName,
                    maxTokens: 4096,
                    supportsFunctions: true,
                    supportsVision: false,
                    supportsStreaming: true,
                },
            });

            // Initialize the client
            await clientBuilder.initializeClient();

            // Test connection before proceeding
            const connectionTest = await clientBuilder.testConnection();
            if (!connectionTest.success) {
                throw new Error(`Azure OpenAI connection failed: ${connectionTest.error}`);
            }

            console.log("✅ Azure OpenAI connection established for helper function tests");

            // Create chat completion service
            chatService = createChatCompletionService(clientBuilder, {
                defaultMaxTokens: 500,
                defaultTemperature: 0.7,
            });

            // Create tool manager and register the directory creation tool
            toolManager = createToolManager();

            // Register the create_directory tool
            const createDirectoryTool: ToolMeta = {
                id: "create_directory",
                name: "Create Directory",
                type: "function",
                description: "Create a directory at the specified path. Only creates directories within the test directory for safety.",
                parameters: [
                    {
                        name: "dirPath",
                        type: "string",
                        required: true,
                        description: "The absolute path to the directory to create.",
                    },
                ],
                handler: async (args: Record<string, unknown>) => {
                    const { dirPath } = args;
                    if (typeof dirPath !== "string") {
                        throw new Error("dirPath must be a string");
                    }

                    // Validate the path is within our test directory for safety
                    const normalizedPath = path.normalize(dirPath);
                    if (!normalizedPath.startsWith(testDirectory)) {
                        throw new Error(`Directory creation is restricted to test directory. Requested: ${normalizedPath}, Allowed: ${testDirectory}`);
                    }

                    // Create the directory
                    await fs.promises.mkdir(normalizedPath, { recursive: true });

                    // Verify it was created
                    const stats = await fs.promises.stat(normalizedPath);
                    if (!stats.isDirectory()) {
                        throw new Error("Failed to create directory");
                    }

                    return {
                        success: true,
                        path: normalizedPath,
                        message: `Directory created successfully: ${normalizedPath}`,
                        timestamp: new Date().toISOString(),
                    };
                },
            };

            toolManager.registerTool(createDirectoryTool);

            console.log("✅ Helper function integration test setup complete");
        } catch (error) {
            console.error("❌ Helper function integration test setup failed:", error);
            throw error;
        }
    }, 30000); // 30 second timeout for setup

    afterAll(async () => {
        if (shouldSkipIntegration) {
            return;
        }

        // Clean up test directory
        if (testDirectory && fs.existsSync(testDirectory)) {
            try {
                await fs.promises.rm(testDirectory, { recursive: true, force: true });
                console.log("🧹 Helper test directory cleaned up");
            } catch (error) {
                console.warn("⚠️ Failed to clean up helper test directory:", error);
            }
        }
    });

    describe("processChatCompletionHelper", () => {
        beforeEach(() => {
            if (shouldSkipIntegration) {
                pending("Helper function integration tests skipped");
            }
        });

        test("should process simple chat completion successfully", async () => {
            // Arrange
            const userMessage: Message = {
                id: generateMessageId(),
                role: "user",
                content: "Hello! Please respond with a simple greeting.",
                timestamp: new Date(),
                status: "completed",
            };

            const request: ChatCompletionHelperRequest = {
                messages: [userMessage],
                chatService,
                toolManager,
                maxTokens: 500,
                temperature: 0.7,
                sessionId: "test-session-1",
            };

            // Act
            const result = await processChatCompletionHelper(request);

            // Assert
            expect(result.success).toBe(true);
            expect(result.agentMessage).toBeDefined();
            expect(result.agentMessage?.role).toBe("agent");
            expect(result.agentMessage?.content).toBeTruthy();
            expect(result.agentMessage?.status).toBe("completed");
            expect(result.responseTime).toBeGreaterThan(0);

            console.log("✅ Simple chat completion successful");
            console.log("Response:", result.agentMessage?.content);
            console.log("Response time:", result.responseTime, "ms");
        }, 15000);

        test("should trigger tool calls for directory creation", async () => {
            // Arrange
            const targetDir = path.join(testDirectory, "helper-test-folder");
            const userMessage: Message = {
                id: generateMessageId(),
                role: "user",
                content: `Please create a directory at this path: ${targetDir}. Use the create_directory tool to accomplish this task.`,
                timestamp: new Date(),
                status: "completed",
            };

            const request: ChatCompletionHelperRequest = {
                messages: [userMessage],
                chatService,
                toolManager,
                maxTokens: 500,
                temperature: 0.7,
                sessionId: "test-session-2",
            };

            // Act
            const result = await processChatCompletionHelper(request);

            // Assert
            expect(result.success).toBe(true);
            expect(result.agentMessage).toBeDefined();
            expect(result.toolCalls).toBeDefined();
            expect(result.toolCalls).toHaveLength(1);

            const toolCall = result.toolCalls?.[0];
            if (toolCall && "function" in toolCall) {
                expect(toolCall.function.name).toBe("create_directory");
            }

            // Check that steps were created
            expect(result.agentMessage?.steps).toBeDefined();
            expect(result.agentMessage?.steps).toHaveLength(1);

            const step = result.agentMessage?.steps?.[0];
            if (step && "type" in step) {
                expect(step.type).toBe("create_directory");
            }

            console.log("✅ Tool call triggered successfully");
            console.log("Tool calls:", result.toolCalls?.length);
            console.log("Agent steps:", result.agentMessage?.steps?.length);
        }, 20000);
    });

    describe("executeToolCallHelper", () => {
        beforeEach(() => {
            if (shouldSkipIntegration) {
                pending("Helper function integration tests skipped");
            }
        });

        test("should execute directory creation tool successfully", async () => {
            // Arrange
            const targetDir = path.join(testDirectory, "direct-tool-test");
            const toolCall = {
                id: "test_tool_call_1",
                type: "function" as const,
                function: {
                    name: "create_directory",
                    arguments: JSON.stringify({ dirPath: targetDir }),
                },
            };

            // Act
            const result = await executeToolCallHelper(toolCall, toolManager);

            // Assert
            expect(result.success).toBe(true);
            expect(result.result).toBeDefined();
            expect(result.error).toBeUndefined();

            // Verify the directory was actually created
            expect(fs.existsSync(targetDir)).toBe(true);
            const stats = await fs.promises.stat(targetDir);
            expect(stats.isDirectory()).toBe(true);

            console.log("✅ Direct tool execution successful");
            console.log("Tool result:", result.result);
        }, 10000);

        test("should handle tool execution errors gracefully", async () => {
            // Arrange - Try to create directory outside test directory
            const invalidPath = "C:\\Windows\\System32\\restricted-folder";
            const toolCall = {
                id: "test_tool_call_2",
                type: "function" as const,
                function: {
                    name: "create_directory",
                    arguments: JSON.stringify({ dirPath: invalidPath }),
                },
            };

            console.log("🔍 Testing error handling with path:", invalidPath);
            console.log("🔍 Test directory is:", testDirectory);

            // Act
            const result = await executeToolCallHelper(toolCall, toolManager);

            console.log("🔍 Tool execution result:", result);

            // Assert
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error).toContain("restricted");

            console.log("✅ Tool error handling working correctly");
            console.log("Error message:", result.error);
        }, 10000);
    });

    describe("executeToolCallsHelper", () => {
        beforeEach(() => {
            if (shouldSkipIntegration) {
                pending("Helper function integration tests skipped");
            }
        });

        test("should execute multiple tool calls successfully", async () => {
            // Arrange
            const dir1 = path.join(testDirectory, "multi-tool-test-1");
            const dir2 = path.join(testDirectory, "multi-tool-test-2");

            const toolCalls = [
                {
                    id: "multi_tool_call_1",
                    type: "function" as const,
                    function: {
                        name: "create_directory",
                        arguments: JSON.stringify({ dirPath: dir1 }),
                    },
                },
                {
                    id: "multi_tool_call_2",
                    type: "function" as const,
                    function: {
                        name: "create_directory",
                        arguments: JSON.stringify({ dirPath: dir2 }),
                    },
                },
            ];

            // Act
            const result = await executeToolCallsHelper(toolCalls, toolManager);

            // Assert
            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(2);
            expect(result.results[0].success).toBe(true);
            expect(result.results[1].success).toBe(true);

            // Verify both directories were created
            expect(fs.existsSync(dir1)).toBe(true);
            expect(fs.existsSync(dir2)).toBe(true);

            console.log("✅ Multiple tool execution successful");
            console.log(
                "Results:",
                result.results.map(r => ({ id: r.toolCallId, success: r.success }))
            );
        }, 15000);
    });

    describe("completeChatFlowHelper", () => {
        beforeEach(() => {
            if (shouldSkipIntegration) {
                pending("Helper function integration tests skipped");
            }
        });

        test("should complete full chat flow with tool execution", async () => {
            // Arrange
            const targetDir = path.join(testDirectory, "complete-flow-test");
            const userMessage: Message = {
                id: generateMessageId(),
                role: "user",
                content: `I need you to create a directory at: ${targetDir}. Please use the create_directory tool.`,
                timestamp: new Date(),
                status: "completed",
            };

            const request: ChatCompletionHelperRequest = {
                messages: [userMessage],
                chatService,
                toolManager,
                maxTokens: 500,
                temperature: 0.7,
                sessionId: "test-session-complete",
            };

            // Act
            const result = await completeChatFlowHelper(request);

            // Assert
            expect(result.success).toBe(true);
            expect(result.userMessage).toBeDefined();
            expect(result.agentMessage).toBeDefined();
            expect(result.toolResults).toBeDefined();
            expect(result.toolResults).toHaveLength(1);
            expect(result.toolResults?.[0].success).toBe(true);

            // Verify the directory was actually created
            expect(fs.existsSync(targetDir)).toBe(true);
            const stats = await fs.promises.stat(targetDir);
            expect(stats.isDirectory()).toBe(true);

            console.log("✅ Complete chat flow successful");
            console.log("Agent response:", result.agentMessage?.content);
            console.log(
                "Tool results:",
                result.toolResults?.map(r => ({ id: r.toolCallId, success: r.success }))
            );
            console.log("Total response time:", result.responseTime, "ms");
        }, 25000);

        test("should handle conversation without tool calls", async () => {
            // Arrange
            const userMessage: Message = {
                id: generateMessageId(),
                role: "user",
                content: "Hello! How are you today? Just respond with a greeting, no tools needed.",
                timestamp: new Date(),
                status: "completed",
            };

            const request: ChatCompletionHelperRequest = {
                messages: [userMessage],
                chatService,
                toolManager,
                maxTokens: 200,
                temperature: 0.7,
                sessionId: "test-session-no-tools",
            };

            // Act
            const result = await completeChatFlowHelper(request);

            // Assert
            expect(result.success).toBe(true);
            expect(result.userMessage).toBeDefined();
            expect(result.agentMessage).toBeDefined();
            expect(result.agentMessage?.content).toBeTruthy();
            expect(result.toolResults).toBeUndefined(); // No tools should be called

            console.log("✅ Chat flow without tools successful");
            console.log("Agent response:", result.agentMessage?.content);
        }, 15000);

        test("should handle multi-turn conversation", async () => {
            // Arrange - Previous conversation
            const message1: Message = {
                id: generateMessageId(),
                role: "user",
                content: "Hello, I need help with file organization.",
                timestamp: new Date(),
                status: "completed",
            };

            const message2: Message = {
                id: generateMessageId(),
                role: "agent",
                content: "Hello! I'd be happy to help you with file organization. What do you need assistance with?",
                timestamp: new Date(),
                status: "completed",
            };

            const message3: Message = {
                id: generateMessageId(),
                role: "user",
                content: `Please create a directory for my project files at: ${path.join(testDirectory, "project-files")}`,
                timestamp: new Date(),
                status: "completed",
            };

            const request: ChatCompletionHelperRequest = {
                messages: [message1, message2, message3],
                chatService,
                toolManager,
                maxTokens: 500,
                temperature: 0.7,
                sessionId: "test-session-multi-turn",
            };

            // Act
            const result = await completeChatFlowHelper(request);

            // Assert
            expect(result.success).toBe(true);
            expect(result.userMessage.content).toContain("project-files");
            expect(result.agentMessage).toBeDefined();

            // Should understand the context and create the directory
            const targetDir = path.join(testDirectory, "project-files");
            if (result.toolResults && result.toolResults.length > 0) {
                expect(fs.existsSync(targetDir)).toBe(true);
                console.log("✅ Multi-turn conversation with tool execution successful");
            } else {
                console.log("ℹ️ Multi-turn conversation completed (AI chose not to use tools)");
            }
        }, 20000);
    });

    describe("Service Integration Validation", () => {
        test("should validate services are properly configured", () => {
            if (shouldSkipIntegration) {
                pending("Helper function integration tests skipped");
                return;
            }

            expect(chatService).toBeDefined();
            expect(toolManager).toBeDefined();

            // Test tool manager has our registered tool
            const tools = toolManager.listTools();
            expect(tools).toHaveLength(1);
            expect(tools[0].id).toBe("create_directory");

            // Test chat completion tools format
            const chatTools = toolManager.getChatCompletionTools();
            expect(chatTools).toHaveLength(1);
            expect(chatTools[0].type).toBe("function");

            const tool = chatTools[0];
            if ("function" in tool) {
                expect(tool.function.name).toBe("create_directory");
            }

            console.log("✅ Services properly configured for helper function tests");
        });
    });
});
