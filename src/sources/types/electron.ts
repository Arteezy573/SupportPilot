/**
 * TypeScript definitions for Electron API exposed to renderer process
 * This file provides type safety for the electronAPI exposed via contextBridge
 */

export interface ElectronAPI {
    // App information
    app: {
        getVersion: () => Promise<string>;
        getName: () => Promise<string>;
    };

    // File system operations
    dialog: {
        openFile: () => Promise<{
            canceled: boolean;
            filePaths: string[];
        }>;
    };

    // Window controls
    window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
    };

    // External shell operations
    shell: {
        openExternal: (url: string) => Promise<void>;
    };

    // IPC communication for menu events and file operations
    ipc: {
        // Listen for menu events from main process
        onMenuNewSession: (callback: () => void) => void;
        onMenuFilesSelected: (callback: (filePaths: string[]) => void) => void;

        // Remove listeners to prevent memory leaks
        removeAllListeners: (channel: string) => void;
    };

    // Support pilot specific APIs
    supportPilot: {
        // Chat session management
        newSession: () => Promise<void>;

        // File attachment handling
        attachFiles: (filePaths: string[]) => Promise<{
            success: boolean;
            files: Array<{
                path: string;
                name: string;
                size: number;
                type: string;
                content?: string; // For text files
            }>;
            error?: string;
        }>;

        // Issue analysis operations
        analyzeLog: (content: string) => Promise<{
            success: boolean;
            analysis?: {
                errors: string[];
                warnings: string[];
                suggestions: string[];
                timeline: Array<{
                    timestamp: string;
                    level: string;
                    message: string;
                }>;
            };
            error?: string;
        }>;

        // Email thread processing
        processEmailThread: (content: string) => Promise<{
            success: boolean;
            summary?: {
                participants: string[];
                timeline: string[];
                issues: string[];
                customerImpact: string;
            };
            error?: string;
        }>;
    };
}

// Development utilities interface (only available in dev mode)
export interface ElectronDevAPI {
    inspectAPI: () => ElectronAPI;
    testIPC: (channel: string, data?: unknown) => Promise<unknown>;
}

// Global type declarations for the renderer process
declare global {
    interface Window {
        electronAPI: ElectronAPI;
        electronDev?: ElectronDevAPI; // Only available in development
    }
}

export {};
