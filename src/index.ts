#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import all tools
import { searchAdoWorkItem, searchAdoWorkItemTool } from "./tools/searchAdoWorkItem.js";
import { searchICM, searchICMTool } from "./tools/searchICM.js";
import { searchErrorMessage, searchErrorMessageTool } from "./tools/searchErrorMessage.js";
import { summarizeCustomerEmail, summarizeCustomerEmailTool } from "./tools/summarizeCustomerEmail.js";

class SupportPilotMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: "support-pilot-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // Register list tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          searchAdoWorkItemTool,
          searchICMTool,
          searchErrorMessageTool,
          summarizeCustomerEmailTool,
        ],
      };
    });

    // Register call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "searchAdoWorkItem": {
            const results = await searchAdoWorkItem(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: `Found ${results.length} Azure DevOps work items:\n\n${results
                    .map(
                      (item) =>
                        `**${item.id}: ${item.title}**\n` +
                        `Type: ${item.workItemType} | State: ${item.state}\n` +
                        `Assigned: ${item.assignedTo || 'Unassigned'}\n` +
                        `Created: ${new Date(item.createdDate).toLocaleDateString()}\n` +
                        `URL: ${item.url}\n` +
                        `Tags: ${item.tags?.join(', ') || 'None'}\n` +
                        (item.description ? `Description: ${item.description.substring(0, 200)}...\n` : '') +
                        `---`
                    )
                    .join('\n\n')}`,
                },
              ],
            };
          }

          case "searchICM": {
            const results = await searchICM(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: `Found ${results.length} similar ICM incidents:\n\n${results
                    .map(
                      (incident) =>
                        `**${incident.id}: ${incident.title}**\n` +
                        `Severity: ${incident.severity} | Status: ${incident.status}\n` +
                        `Assigned Team: ${incident.assignedTeam || 'Unassigned'}\n` +
                        `Created: ${new Date(incident.createdDate).toLocaleDateString()}\n` +
                        (incident.resolvedDate ? `Resolved: ${new Date(incident.resolvedDate).toLocaleDateString()}\n` : '') +
                        (incident.similarityScore ? `Similarity Score: ${incident.similarityScore}\n` : '') +
                        (incident.description ? `Description: ${incident.description.substring(0, 200)}...\n` : '') +
                        (incident.resolution ? `Resolution: ${incident.resolution.substring(0, 200)}...\n` : '') +
                        `---`
                    )
                    .join('\n\n')}`,
                },
              ],
            };
          }

          case "searchErrorMessage": {
            const results = await searchErrorMessage(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: `Found ${results.length} error occurrences:\n\n${results
                    .map(
                      (error) =>
                        `**${error.id}: ${error.message}**\n` +
                        `Component: ${error.component} | Repository: ${error.repository}\n` +
                        `Frequency: ${error.frequency} occurrences\n` +
                        `First Seen: ${new Date(error.firstSeen).toLocaleDateString()}\n` +
                        `Last Seen: ${new Date(error.lastSeen).toLocaleDateString()}\n` +
                        (error.relatedPullRequests?.length ? `Related PRs: ${error.relatedPullRequests.join(', ')}\n` : '') +
                        (error.stackTrace ? `Stack Trace: ${error.stackTrace.substring(0, 300)}...\n` : '') +
                        `---`
                    )
                    .join('\n\n')}`,
                },
              ],
            };
          }

          case "summarizeCustomerEmail": {
            const result = await summarizeCustomerEmail(args as any);
            return {
              content: [
                {
                  type: "text",
                  text: `## Customer Email Summary\n\n` +
                    `**Summary:** ${result.summary}\n\n` +
                    `**Urgency:** ${result.urgency.toUpperCase()}\n\n` +
                    `**Category:** ${result.category}\n\n` +
                    `**Key Points:**\n${result.keyPoints.map(point => `• ${point}`).join('\n')}\n\n` +
                    `**Suggested Actions:**\n${result.suggestedActions.map(action => `• ${action}`).join('\n')}\n\n` +
                    `**Extracted Context:**\n` +
                    (result.extractedContext.errorMessages?.length ? `• Error Messages: ${result.extractedContext.errorMessages.join(', ')}\n` : '') +
                    (result.extractedContext.reproductionSteps?.length ? `• Reproduction Steps: ${result.extractedContext.reproductionSteps.length} steps provided\n` : '') +
                    (result.extractedContext.affectedSystems?.length ? `• Affected Systems: ${result.extractedContext.affectedSystems.join(', ')}\n` : '') +
                    (result.extractedContext.customerInfo?.name ? `• Customer: ${result.extractedContext.customerInfo.name}` : '') +
                    (result.extractedContext.customerInfo?.organization ? ` from ${result.extractedContext.customerInfo.organization}` : '') +
                    (result.extractedContext.customerInfo?.contact ? ` (${result.extractedContext.customerInfo.contact})` : ''),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        return {
          content: [
            {
              type: "text",
              text: `Error executing tool '${name}': ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("SupportPilot MCP Server running on stdio");
  }
}

// Main execution
const server = new SupportPilotMCPServer();
server.run().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});