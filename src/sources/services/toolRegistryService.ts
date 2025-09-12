/**
 * Tool Registry Service
 * Manages tool registration and invocation for chat completions
 * Integrates with Azure OpenAI chat completion tool_calls
 */

import { logger } from "../utils/logger";
import type { ChatCompletionTool } from "../types/azure";

/**
 * Supported tool types for chat completions
 */
export type ToolType = "function" | "search" | "retrieval" | "code_interpreter" | "web_search";

/**
 * Tool metadata for registration and discovery
 */
export interface ToolMeta {
    /**
     * Unique tool identifier
     */
    id: string;

    /**
     * Human-readable tool name
     */
    name: string;

    /**
     * Tool type/category
     */
    type: ToolType;

    /**
     * Tool description for AI model
     */
    description: string;

    /**
     * Tool parameters specification
     */
    parameters: ToolParameter[];

    /**
     * Optional tool handler function
     */
    handler?: (args: Record<string, unknown>) => Promise<unknown> | unknown;
}

/**
 * Tool parameter specification
 */
export interface ToolParameter {
    /**
     * Parameter name
     */
    name: string;

    /**
     * Parameter type
     */
    type: "string" | "number" | "boolean" | "object" | "array";

    /**
     * Whether parameter is required
     */
    required?: boolean;

    /**
     * Parameter description
     */
    description?: string;

    /**
     * Enum values (for string types)
     */
    enum?: string[];

    /**
     * Default value
     */
    default?: unknown;
}

/**
 * Tool invocation request
 */
export interface ToolInvocation {
    /**
     * Tool identifier
     */
    toolId: string;

    /**
     * Tool arguments
     */
    args: Record<string, unknown>;

    /**
     * Optional invocation ID for tracking
     */
    invocationId?: string;
}

/**
 * Tool invocation result
 */
export interface ToolInvocationResult {
    /**
     * Whether invocation was successful
     */
    success: boolean;

    /**
     * Result data (if successful)
     */
    result?: unknown;

    /**
     * Error message (if failed)
     */
    error?: string;

    /**
     * Execution time in milliseconds
     */
    executionTime: number;

    /**
     * Tool metadata
     */
    toolMeta: ToolMeta;
}

/**
 * Tool Manager for chat completion tool_calls support
 */
export class ToolManager {
    private tools: Map<string, ToolMeta> = new Map();
    private invocationResults: Map<string, ToolInvocationResult> = new Map();

    /**
     * Register a new tool
     * @param meta - Tool metadata
     */
    registerTool(meta: ToolMeta): void {
        this.tools.set(meta.id, meta);
        logger.debug("Tool registered", {
            toolId: meta.id,
            toolName: meta.name,
            toolType: meta.type,
        });
    }

    /**
     * Get tool metadata by ID
     * @param id - Tool identifier
     * @returns Tool metadata or undefined if not found
     */
    getTool(id: string): ToolMeta | undefined {
        return this.tools.get(id);
    }

    /**
     * List all registered tools
     * @returns Array of tool metadata
     */
    listTools(): ToolMeta[] {
        return Array.from(this.tools.values());
    }

    /**
     * Get tools formatted for OpenAI chat completion
     * @returns Array of ChatCompletionTool objects
     */
    getChatCompletionTools(): ChatCompletionTool[] {
        return this.listTools().map(tool => ({
            type: "function",
            function: {
                name: tool.id,
                description: tool.description,
                parameters: {
                    type: "object",
                    properties: tool.parameters.reduce(
                        (props, param) => {
                            props[param.name] = {
                                type: param.type,
                                description: param.description,
                                ...(param.enum && { enum: param.enum }),
                                ...(param.default !== undefined && { default: param.default }),
                            };
                            return props;
                        },
                        {} as Record<string, unknown>
                    ),
                    required: tool.parameters.filter(p => p.required).map(p => p.name),
                },
            },
        }));
    }

    /**
     * Invoke a tool with the given arguments
     * @param invocation - Tool invocation request
     * @returns Promise that resolves to invocation result
     */
    async invoke(invocation: ToolInvocation): Promise<ToolInvocationResult> {
        const startTime = Date.now();
        const tool = this.getTool(invocation.toolId);

        if (!tool) {
            const result: ToolInvocationResult = {
                success: false,
                error: `Tool not found: ${invocation.toolId}`,
                executionTime: Date.now() - startTime,
                toolMeta: {} as ToolMeta,
            };

            if (invocation.invocationId) {
                this.invocationResults.set(invocation.invocationId, result);
            }

            return result;
        }

        try {
            logger.debug("Invoking tool", {
                toolId: invocation.toolId,
                toolName: tool.name,
                invocationId: invocation.invocationId,
            });

            // Validate required parameters
            const missingParams = tool.parameters.filter(p => p.required && !(p.name in invocation.args)).map(p => p.name);

            if (missingParams.length > 0) {
                throw new Error(`Missing required parameters: ${missingParams.join(", ")}`);
            }

            // Execute tool handler if available
            let result: unknown;
            if (tool.handler) {
                result = await tool.handler(invocation.args);
            } else {
                // Fallback: return a stub result
                result = {
                    toolId: invocation.toolId,
                    args: invocation.args,
                    message: "Tool executed successfully (stub implementation)",
                };
            }

            const executionTime = Date.now() - startTime;
            const invocationResult: ToolInvocationResult = {
                success: true,
                result,
                executionTime,
                toolMeta: tool,
            };

            if (invocation.invocationId) {
                this.invocationResults.set(invocation.invocationId, invocationResult);
            }

            logger.debug("Tool invocation successful", {
                toolId: invocation.toolId,
                executionTime,
                invocationId: invocation.invocationId,
            });

            return invocationResult;
        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error during tool invocation";

            const result: ToolInvocationResult = {
                success: false,
                error: errorMessage,
                executionTime,
                toolMeta: tool,
            };

            if (invocation.invocationId) {
                this.invocationResults.set(invocation.invocationId, result);
            }

            logger.error("Tool invocation failed", {
                toolId: invocation.toolId,
                error: errorMessage,
                executionTime,
                invocationId: invocation.invocationId,
            });

            return result;
        }
    }

    /**
     * Get tool invocation result by ID
     * @param invocationId - Invocation identifier
     * @returns Tool invocation result or undefined if not found
     */
    getResult(invocationId: string): ToolInvocationResult | undefined {
        return this.invocationResults.get(invocationId);
    }

    /**
     * Clear invocation results (for memory management)
     * @param maxAge - Maximum age in milliseconds (default: 1 hour)
     */
    clearOldResults(maxAge: number = 60 * 60 * 1000): void {
        const _cutoff = Date.now() - maxAge;
        // Note: This is a simple implementation. In practice, you'd want to track timestamps
        // For now, just clear all results
        this.invocationResults.clear();
        logger.debug("Cleared old tool invocation results");
    }

    /**
     * Unregister a tool
     * @param toolId - Tool identifier
     * @returns Whether tool was found and removed
     */
    unregisterTool(toolId: string): boolean {
        const removed = this.tools.delete(toolId);
        if (removed) {
            logger.debug("Tool unregistered", { toolId });
        }
        return removed;
    }

    /**
     * Get tool count
     * @returns Number of registered tools
     */
    getToolCount(): number {
        return this.tools.size;
    }
}

/**
 * Factory function to create a tool manager
 * @returns New ToolManager instance
 */
export function createToolManager(): ToolManager {
    return new ToolManager();
}

// Example usage:
/*
const manager = createToolManager();

// Register a search tool
manager.registerTool({
    id: "search_code",
    name: "Search Codebase",
    type: "search",
    description: "Search for code symbols in the workspace.",
    parameters: [
        { 
            name: "query", 
            type: "string", 
            required: true, 
            description: "Search query" 
        },
        { 
            name: "includeTests", 
            type: "boolean", 
            required: false, 
            description: "Whether to include test files",
            default: false 
        }
    ],
    handler: async (args) => {
        // Implementation would go here
        return { matches: [], query: args.query };
    }
});

// Get tools for chat completion
const chatTools = manager.getChatCompletionTools();

// Invoke a tool
const result = await manager.invoke({
    toolId: "search_code",
    args: { query: "getUser" },
    invocationId: "inv_123"
});
*/
