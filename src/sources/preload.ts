import { contextBridge, ipcRenderer } from "electron";
import { ElectronAPI } from "@/types/electron";

/**
 * Preload script for secure IPC communication between main and renderer processes
 * This script runs in a secure context and exposes only specific APIs to the renderer
 */

// Secure API implementation
const electronAPI: ElectronAPI = {
    // App information APIs
    app: {
        getVersion: () => ipcRenderer.invoke("app:get-version"),
        getName: () => ipcRenderer.invoke("app:get-name"),
        getAzureBearerToken: () => ipcRenderer.invoke("app:get-azure-bearer-token"),
    },

    // Dialog APIs for file operations
    dialog: {
        openFile: () => ipcRenderer.invoke("dialog:open-file"),
    },

    // Window control APIs
    window: {
        minimize: () => ipcRenderer.invoke("window:minimize"),
        maximize: () => ipcRenderer.invoke("window:maximize"),
        close: () => ipcRenderer.invoke("window:close"),
        isMaximized: () => ipcRenderer.invoke("window:is-maximized"),
        isMinimized: () => ipcRenderer.invoke("window:is-minimized"),
        restore: () => ipcRenderer.invoke("window:restore"),
        getState: () => ipcRenderer.invoke("window:get-state"),
    },

    // Shell APIs for external operations
    shell: {
        openExternal: (url: string) => ipcRenderer.invoke("shell:open-external", url),
    },

    // IPC communication for real-time events
    ipc: {
        // Menu event listeners
        onMenuNewSession: (callback: () => void) => {
            ipcRenderer.on("menu:new-session", callback);
        },

        onMenuFilesSelected: (callback: (filePaths: string[]) => void) => {
            ipcRenderer.on("menu:files-selected", (_event, filePaths: string[]) => {
                callback(filePaths);
            });
        },

        // Cleanup listeners to prevent memory leaks
        removeAllListeners: (channel: string) => {
            ipcRenderer.removeAllListeners(channel);
        },
    },

    // Support pilot specific functionality
    supportPilot: {
        // Session management
        newSession: async () => {
            // Clear any local state and notify main process
            await ipcRenderer.invoke("support-pilot:new-session");
        },

        // File attachment processing
        attachFiles: async (filePaths: string[]) => {
            try {
                const result = await ipcRenderer.invoke("support-pilot:attach-files", filePaths);
                return result;
            } catch (error) {
                return {
                    success: false,
                    files: [],
                    error: error instanceof Error ? error.message : "Unknown error occurred",
                };
            }
        },

        // Log analysis functionality
        analyzeLog: async (content: string) => {
            try {
                const result = await ipcRenderer.invoke("support-pilot:analyze-log", content);
                return result;
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Log analysis failed",
                };
            }
        },

        // Email thread processing
        processEmailThread: async (content: string) => {
            try {
                const result = await ipcRenderer.invoke("support-pilot:process-email", content);
                return result;
            } catch (error) {
                return {
                    success: false,
                    error: error instanceof Error ? error.message : "Email processing failed",
                };
            }
        },
    },
};

// Validate that we're running in the correct context
if (process.contextIsolated) {
    try {
        // Expose the secure API to the renderer process
        contextBridge.exposeInMainWorld("electronAPI", electronAPI);

        console.log("Preload script loaded successfully with context isolation");
    } catch (error) {
        console.error("Failed to expose electronAPI:", error);
    }
} else {
    // Fallback for when context isolation is disabled (not recommended)
    console.warn("Context isolation is disabled. This is not recommended for security.");
    (window as unknown as Record<string, unknown>).electronAPI = electronAPI;
}

// Development utilities (only available in dev mode)
if (process.env.NODE_ENV === "development") {
    contextBridge.exposeInMainWorld("electronDev", {
        // Development helper to inspect available APIs
        inspectAPI: () => {
            console.log("Available Electron APIs:", Object.keys(electronAPI));
            return electronAPI;
        },

        // Development IPC testing
        testIPC: async (channel: string, data?: unknown) => {
            try {
                const result = await ipcRenderer.invoke(channel, data);
                console.log(`IPC Test - Channel: ${channel}, Result:`, result);
                return result;
            } catch (error) {
                console.error(`IPC Test Failed - Channel: ${channel}, Error:`, error);
                throw error;
            }
        },
    });
}

// Security: Disable Node.js globals in renderer context
delete (globalThis as Record<string, unknown>).require;
delete (globalThis as Record<string, unknown>).exports;
delete (globalThis as Record<string, unknown>).module;
delete (globalThis as Record<string, unknown>).process;
delete (globalThis as Record<string, unknown>).global;
delete (globalThis as Record<string, unknown>).Buffer;

// Prevent access to internal Electron modules
Object.freeze(contextBridge);
Object.freeze(ipcRenderer);

console.log("Support Pilot preload script initialized");
