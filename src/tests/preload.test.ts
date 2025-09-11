/**
 * Simplified unit tests for preload script functionality
 * These tests focus on testing the core functionality without complex module loading
 */

import { contextBridge, ipcRenderer } from "electron";

// Mock Electron modules for preload testing
jest.mock("electron", () => ({
    contextBridge: {
        exposeInMainWorld: jest.fn(),
    },
    ipcRenderer: {
        invoke: jest.fn(),
        send: jest.fn(),
        on: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
    },
}));

// Global process mock setup
(global as any).process = {
    contextIsolated: true,
    env: { NODE_ENV: 'test' }
};

// Shared variables for all test suites
let globalMockExposeInMainWorld: jest.Mock;
let globalExposedAPI: any;

describe("Preload Script - Core Functionality", () => {
    beforeAll(() => {
        // Clear module cache to ensure fresh load
        const preloadPath = require.resolve("../sources/preload");
        delete require.cache[preloadPath];
        
        // Get the existing mock from the jest setup
        globalMockExposeInMainWorld = contextBridge.exposeInMainWorld as jest.Mock;
        
        require("../sources/preload");
        
        // Get the exposed API from the mock calls
        const mockCalls = globalMockExposeInMainWorld.mock.calls;
        if (mockCalls.length > 0) {
            globalExposedAPI = mockCalls[0][1];
        }
    });

    beforeEach(() => {
        // Clear only ipcRenderer mocks, keep contextBridge calls intact
        (ipcRenderer.invoke as jest.Mock).mockClear();
        (ipcRenderer.on as jest.Mock).mockClear();
        (ipcRenderer.removeAllListeners as jest.Mock).mockClear();
        // DON'T clear jest.clearAllMocks() or contextBridge mock
    });

    it("should expose electronAPI when contextIsolated is true", () => {
        // Instead of testing the mock call, test that we have the API object
        expect(globalExposedAPI).toBeDefined();
        expect(globalExposedAPI).toEqual(
            expect.objectContaining({
                app: expect.any(Object),
                dialog: expect.any(Object),
                window: expect.any(Object),
                shell: expect.any(Object),
                ipc: expect.any(Object),
                supportPilot: expect.any(Object),
            })
        );
    });

    it("should have correct app API structure", () => {
        expect(globalExposedAPI.app).toEqual({
            getVersion: expect.any(Function),
            getName: expect.any(Function),
        });
    });

    it("should have correct dialog API structure", () => {
        expect(globalExposedAPI.dialog).toEqual({
            openFile: expect.any(Function),
        });
    });

    it("should have correct window API structure", () => {
        expect(globalExposedAPI.window).toEqual({
            minimize: expect.any(Function),
            maximize: expect.any(Function),
            close: expect.any(Function),
            isMaximized: expect.any(Function),
            isMinimized: expect.any(Function),
            restore: expect.any(Function),
            getState: expect.any(Function),
        });
    });

    it("should have correct shell API structure", () => {
        expect(globalExposedAPI.shell).toEqual({
            openExternal: expect.any(Function),
        });
    });

    it("should have correct support pilot API structure", () => {
        expect(globalExposedAPI.supportPilot).toEqual({
            newSession: expect.any(Function),
            attachFiles: expect.any(Function),
            analyzeLog: expect.any(Function),
            processEmailThread: expect.any(Function),
        });
    });

    it("should have correct IPC listener structure", () => {
        expect(globalExposedAPI.ipc).toEqual({
            onMenuNewSession: expect.any(Function),
            onMenuFilesSelected: expect.any(Function),
            removeAllListeners: expect.any(Function),
        });
    });
});

describe("Preload Script - API Testing", () => {
    beforeEach(() => {
        // Only clear ipcRenderer mocks, not contextBridge
        (ipcRenderer.invoke as jest.Mock).mockClear();
        (ipcRenderer.on as jest.Mock).mockClear();
    });

    beforeEach(() => {
        // Only clear ipcRenderer mocks, not contextBridge
        (ipcRenderer.invoke as jest.Mock).mockClear();
        (ipcRenderer.on as jest.Mock).mockClear();
    });

    it("should call ipcRenderer.invoke for app methods", async () => {
        const mockVersion = "1.0.0";
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockVersion);

        const result = await globalExposedAPI.app.getVersion();

        expect(ipcRenderer.invoke).toHaveBeenCalledWith("app:get-version");
        expect(result).toBe(mockVersion);
    });

    it("should call ipcRenderer.invoke for dialog methods", async () => {
        const mockFilePaths = ["/path/to/file.txt"];
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockFilePaths);

        const result = await globalExposedAPI.dialog.openFile();

        expect(ipcRenderer.invoke).toHaveBeenCalledWith("dialog:open-file");
        expect(result).toEqual(mockFilePaths);
    });

    it("should call ipcRenderer.invoke for window methods", async () => {
        await globalExposedAPI.window.minimize();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith("window:minimize");

        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(true);
        const result = await globalExposedAPI.window.isMaximized();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith("window:is-maximized");
        expect(result).toBe(true);
    });

    it("should call ipcRenderer.invoke for shell methods", async () => {
        const url = "https://example.com";
        await globalExposedAPI.shell.openExternal(url);
        expect(ipcRenderer.invoke).toHaveBeenCalledWith("shell:open-external", url);
    });

    it("should call ipcRenderer.invoke for support pilot methods", async () => {
        const filePaths = ["/file1.txt", "/file2.log"];
        const mockResponse = { success: true, files: filePaths };
        (ipcRenderer.invoke as jest.Mock).mockResolvedValue(mockResponse);

        const result = await globalExposedAPI.supportPilot.attachFiles(filePaths);

        expect(ipcRenderer.invoke).toHaveBeenCalledWith("support-pilot:attach-files", filePaths);
        expect(result).toEqual(mockResponse);
    });

    it("should call ipcRenderer.invoke for support pilot newSession", async () => {
        await globalExposedAPI.supportPilot.newSession();
        expect(ipcRenderer.invoke).toHaveBeenCalledWith("support-pilot:new-session");
    });

    it("should handle IPC event listeners", () => {
        const callback = jest.fn();

        globalExposedAPI.ipc.onMenuNewSession(callback);
        expect(ipcRenderer.on).toHaveBeenCalledWith("menu:new-session", callback);

        globalExposedAPI.ipc.onMenuFilesSelected(callback);
        expect(ipcRenderer.on).toHaveBeenCalledWith(
            "menu:files-selected",
            expect.any(Function)
        );

        // Test removeAllListeners
        globalExposedAPI.ipc.removeAllListeners("menu:new-session");
        expect(ipcRenderer.removeAllListeners).toHaveBeenCalledWith("menu:new-session");
    });

    it("should handle errors gracefully", async () => {
        const mockError = new Error("IPC communication failed");
        (ipcRenderer.invoke as jest.Mock).mockRejectedValue(mockError);

        await expect(globalExposedAPI.app.getVersion()).rejects.toThrow("IPC communication failed");
    });
});

describe("Preload Script - Security", () => {
    it("should only expose safe APIs", () => {
        // Verify only expected APIs are exposed
        const exposedKeys = Object.keys(globalExposedAPI);
        const expectedKeys = ["app", "dialog", "window", "shell", "ipc", "supportPilot"];
        
        expect(exposedKeys.sort()).toEqual(expectedKeys.sort());
    });

    it("should not expose dangerous Node.js APIs", () => {
        // Verify dangerous APIs are not exposed
        expect(globalExposedAPI.require).toBeUndefined();
        expect(globalExposedAPI.process).toBeUndefined();
        expect(globalExposedAPI.Buffer).toBeUndefined();
        expect(globalExposedAPI.__dirname).toBeUndefined();
        expect(globalExposedAPI.__filename).toBeUndefined();
    });

    it("should use contextBridge for secure communication", () => {
        // Test that the API was properly exposed rather than testing mock calls
        expect(globalExposedAPI).toBeDefined();
        expect(typeof globalExposedAPI.app.getVersion).toBe('function');
        expect(typeof globalExposedAPI.dialog.openFile).toBe('function');
        expect(typeof globalExposedAPI.window.minimize).toBe('function');
    });
});
