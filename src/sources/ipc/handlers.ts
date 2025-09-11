/**
 * IPC handlers for communication between main and renderer processes
 * This module contains all the IPC channel handlers for the Support Pilot application
 */

import { ipcMain, dialog, shell, BrowserWindow, app } from "electron";
import * as path from "path";
import { FileInfo, LogAnalysis, EmailSummary, AttachFilesResponse, AnalyzeLogResponse, ProcessEmailResponse } from "../types/entities";
import { logger } from "../utils/logger";

/**
 * Sets up all IPC handlers for communication with renderer process
 * @param mainWindow - Reference to the main browser window
 */
export function setupIpcHandlers(mainWindow: BrowserWindow | null): void {
    // Basic app information handlers
    setupAppHandlers();
    
    // Dialog and window control handlers
    setupWindowHandlers(mainWindow);
    
    // Support Pilot specific handlers
    setupSupportPilotHandlers(mainWindow);
}

/**
 * Sets up basic app information IPC handlers
 */
function setupAppHandlers(): void {
    // Handle app version request
    ipcMain.handle("app:get-version", () => {
        return app.getVersion();
    });

    // Handle app name request
    ipcMain.handle("app:get-name", () => {
        return app.getName();
    });
}

/**
 * Sets up window control and dialog IPC handlers
 * @param mainWindow - Reference to the main browser window
 */
function setupWindowHandlers(mainWindow: BrowserWindow | null): void {
    // Handle file dialog requests
    ipcMain.handle("dialog:open-file", async () => {
        if (mainWindow) {
            const result = await dialog.showOpenDialog(mainWindow, {
                properties: ["openFile", "multiSelections"],
                filters: [
                    { name: "Log Files", extensions: ["log", "txt"] },
                    { name: "Email Files", extensions: ["msg", "eml"] },
                    { name: "All Files", extensions: ["*"] },
                ],
            });
            return result;
        }
        return { canceled: true, filePaths: [] };
    });

    // Handle window control requests
    ipcMain.handle("window:minimize", () => {
        if (mainWindow) {
            mainWindow.minimize();
        }
    });

    ipcMain.handle("window:maximize", () => {
        if (mainWindow) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.handle("window:close", () => {
        if (mainWindow) {
            mainWindow.close();
        }
    });

    // Handle external link opening
    ipcMain.handle("shell:open-external", async (_, url: string) => {
        await shell.openExternal(url);
    });
}

/**
 * Sets up Support Pilot specific IPC handlers
 * @param mainWindow - Reference to the main browser window
 */
function setupSupportPilotHandlers(mainWindow: BrowserWindow | null): void {
    // Handle new session creation
    ipcMain.handle("support-pilot:new-session", async () => {
        try {
            // Clear any existing session data (placeholder for future implementation)
            logger.info("Creating new Support Pilot session");
            
            // Send menu event to renderer to clear UI state
            if (mainWindow) {
                mainWindow.webContents.send("menu:new-session");
            }
            
            return { success: true };
        } catch (error) {
            logger.error("Failed to create new session:", error);
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    });

    // Handle file attachment processing
    ipcMain.handle("support-pilot:attach-files", async (_, filePaths: string[]): Promise<AttachFilesResponse> => {
        try {
            const fs = await import("fs/promises");
            const files: FileInfo[] = [];

            for (const filePath of filePaths) {
                try {
                    const stats = await fs.stat(filePath);
                    const fileName = path.basename(filePath);
                    const fileExt = path.extname(filePath).toLowerCase();
                    
                    // Determine file type
                    let fileType = "unknown";
                    if ([".txt", ".log"].includes(fileExt)) {
                        fileType = "text";
                    } else if ([".msg", ".eml"].includes(fileExt)) {
                        fileType = "email";
                    } else if ([".json", ".xml", ".csv"].includes(fileExt)) {
                        fileType = "data";
                    }

                    const fileInfo: FileInfo = {
                        path: filePath,
                        name: fileName,
                        size: stats.size,
                        type: fileType,
                    };

                    // Read content for text files (up to 1MB to prevent memory issues)
                    if (fileType === "text" && stats.size < 1024 * 1024) {
                        try {
                            const content = await fs.readFile(filePath, "utf-8");
                            fileInfo.content = content;
                        } catch (readError) {
                            logger.warn(`Could not read file content for ${filePath}:`, readError);
                        }
                    }

                    files.push(fileInfo);
                } catch (fileError) {
                    logger.error(`Error processing file ${filePath}:`, fileError);
                    // Continue with other files
                }
            }

            return {
                success: true,
                files,
            };
        } catch (error) {
            logger.error("Failed to attach files:", error);
            return {
                success: false,
                files: [],
                error: error instanceof Error ? error.message : "File attachment failed",
            };
        }
    });

    // Handle log analysis (placeholder implementation)
    ipcMain.handle("support-pilot:analyze-log", async (_, content: string): Promise<AnalyzeLogResponse> => {
        try {
            // Placeholder log analysis - this would integrate with AI service in production
            logger.info("Analyzing log content (length:", content.length, "characters)");
            
            // Simple pattern matching for demonstration
            const lines = content.split("\n");
            const errors: string[] = [];
            const warnings: string[] = [];
            const suggestions: string[] = [];
            const timeline: LogAnalysis["timeline"] = [];

            for (const line of lines.slice(0, 100)) { // Limit to first 100 lines for demo
                const trimmedLine = line.trim();
                if (!trimmedLine) continue;

                // Extract timestamp pattern (basic)
                const timestampMatch = trimmedLine.match(/(\d{4}-\d{2}-\d{2}[\sT]\d{2}:\d{2}:\d{2})/);
                const timestamp = timestampMatch ? timestampMatch[1] : "unknown";

                // Detect log levels and patterns
                if (trimmedLine.toLowerCase().includes("error")) {
                    errors.push(trimmedLine);
                    timeline.push({ timestamp, level: "error", message: trimmedLine });
                } else if (trimmedLine.toLowerCase().includes("warning") || trimmedLine.toLowerCase().includes("warn")) {
                    warnings.push(trimmedLine);
                    timeline.push({ timestamp, level: "warning", message: trimmedLine });
                } else if (trimmedLine.toLowerCase().includes("exception") || trimmedLine.toLowerCase().includes("failed")) {
                    errors.push(trimmedLine);
                    timeline.push({ timestamp, level: "error", message: trimmedLine });
                }
            }

            // Generate basic suggestions
            if (errors.length > 0) {
                suggestions.push(`Found ${errors.length} error(s) in the log. Review error messages for root cause analysis.`);
            }
            if (warnings.length > 0) {
                suggestions.push(`Found ${warnings.length} warning(s). Consider investigating potential issues.`);
            }
            if (errors.length === 0 && warnings.length === 0) {
                suggestions.push("No obvious errors or warnings detected. Log appears healthy.");
            }

            const analysis: LogAnalysis = {
                errors: errors.slice(0, 10), // Limit to first 10 for UI
                warnings: warnings.slice(0, 10),
                suggestions,
                timeline: timeline.slice(-20), // Last 20 timeline entries
            };

            return {
                success: true,
                analysis,
            };
        } catch (error) {
            logger.error("Failed to analyze log:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Log analysis failed",
            };
        }
    });

    // Handle email thread processing (placeholder implementation)
    ipcMain.handle("support-pilot:process-email", async (_, content: string): Promise<ProcessEmailResponse> => {
        try {
            // Placeholder email processing - this would integrate with AI service in production
            logger.info("Processing email content (length:", content.length, "characters)");
            
            // Simple pattern extraction for demonstration
            const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
            const participants = [...new Set(content.match(emailRegex) || [])];
            
            // Extract timestamps (basic patterns)
            const timestampPatterns = [
                /(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2})/g, // MM/DD/YYYY HH:MM
                /(\w{3}\s+\w{3}\s+\d{1,2}\s+\d{4}\s+\d{1,2}:\d{2})/g, // Mon Mar 15 2024 14:30
            ];
            
            const timeline: string[] = [];
            for (const pattern of timestampPatterns) {
                const matches = content.match(pattern);
                if (matches) {
                    timeline.push(...matches.slice(0, 5)); // Limit to 5 timestamps
                    break;
                }
            }

            // Extract potential issues (simple keyword matching)
            const issueKeywords = ["error", "issue", "problem", "fail", "down", "outage", "unable", "cannot", "broken"];
            const issues: string[] = [];
            const lines = content.split("\n");
            
            for (const line of lines) {
                const lowerLine = line.toLowerCase();
                for (const keyword of issueKeywords) {
                    if (lowerLine.includes(keyword) && line.trim().length > 10) {
                        issues.push(line.trim());
                        break;
                    }
                }
                if (issues.length >= 5) break; // Limit to 5 issues
            }

            // Assess customer impact (basic sentiment analysis)
            const highImpactKeywords = ["critical", "urgent", "down", "outage", "production", "customer", "revenue"];
            let customerImpact = "Low";
            const lowerContent = content.toLowerCase();
            
            const impactCount = highImpactKeywords.filter(keyword => lowerContent.includes(keyword)).length;
            if (impactCount >= 3) {
                customerImpact = "High";
            } else if (impactCount >= 1) {
                customerImpact = "Medium";
            }

            const summary: EmailSummary = {
                participants: participants.slice(0, 10), // Limit to 10 participants
                timeline: timeline.slice(0, 10),
                issues: issues.slice(0, 5),
                customerImpact,
            };

            return {
                success: true,
                summary,
            };
        } catch (error) {
            logger.error("Failed to process email:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Email processing failed",
            };
        }
    });
}

/**
 * Cleanup function to remove all IPC handlers
 * Should be called when the app is shutting down
 */
export function cleanupIpcHandlers(): void {
    // Remove all IPC handlers to prevent memory leaks
    const channels = [
        "app:get-version",
        "app:get-name",
        "dialog:open-file",
        "window:minimize",
        "window:maximize",
        "window:close",
        "shell:open-external",
        "support-pilot:new-session",
        "support-pilot:attach-files",
        "support-pilot:analyze-log",
        "support-pilot:process-email",
    ];

    channels.forEach(channel => {
        ipcMain.removeHandler(channel);
    });

    logger.info("IPC handlers cleaned up");
}
