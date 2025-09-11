/**
 * Enhanced test file to verify Jest configuration with proper TypeScript typing
 * This file demonstrates the testing setup and can be used as a template
 */

import type { ElectronAPI } from "../sources/types/electron";

// Type definitions for test environment globals
interface TestElectronAPI {
    ipcRenderer: {
        invoke: jest.MockedFunction<(channel: string, ...args: any[]) => Promise<any>>;
        send: jest.MockedFunction<(channel: string, ...args: any[]) => void>;
        on: jest.MockedFunction<(channel: string, listener: Function) => void>;
    };
}

interface TestWindow {
    electron?: TestElectronAPI;
}

describe("Jest Configuration Test with TypeScript", () => {
    test("should run basic test with type safety", () => {
        const result: number = 1 + 1;
        expect(result).toBe(2);
        expect(typeof result).toBe("number");
    });

    test("should have access to Jest DOM matchers with proper typing", () => {
        const element: HTMLDivElement = document.createElement("div");
        element.textContent = "Hello World";
        document.body.appendChild(element);

        expect(element).toBeInTheDocument();
        expect(element).toHaveTextContent("Hello World");

        // Type safety checks
        expect(element.tagName).toBe("DIV");
        expect(typeof element.textContent).toBe("string");
    });

    test("should have Electron mocks available with proper typing", () => {
        const testWindow = window as unknown as TestWindow;

        expect(testWindow.electron).toBeDefined();
        expect(testWindow.electron?.ipcRenderer).toBeDefined();
        expect(typeof testWindow.electron?.ipcRenderer.invoke).toBe("function");

        // Verify mock function types (Jest mocks are still Functions)
        if (testWindow.electron?.ipcRenderer) {
            const { invoke, send, on } = testWindow.electron.ipcRenderer;
            expect(typeof invoke).toBe("function");
            expect(typeof send).toBe("function");
            expect(typeof on).toBe("function");
        }
    });

    test("should have File and FileReader mocks with proper typing", () => {
        expect(File).toBeDefined();
        expect(FileReader).toBeDefined();

        const fileContent = "test content";
        const fileName = "test.txt";
        const fileType = "text/plain";

        const file: File = new File([fileContent], fileName, { type: fileType });

        // Type safety checks
        expect(file.name).toBe(fileName);
        expect(file.type).toBe(fileType);
        expect(typeof file.size).toBe("number");
        expect(file.size).toBeGreaterThan(0);

        // Verify File properties are properly typed
        expect(typeof file.lastModified).toBe("number");
        // Note: Our mock File may not extend Blob, so we skip this check
        // expect(file instanceof Blob).toBe(true);
    });

    test("should support async/await with proper typing", async () => {
        const asyncFunction = async (value: number): Promise<string> => {
            return new Promise(resolve => {
                setTimeout(() => resolve(`Result: ${value}`), 10);
            });
        };

        const result: string = await asyncFunction(42);
        expect(result).toBe("Result: 42");
        expect(typeof result).toBe("string");
    });

    test("should handle typed mock functions", () => {
        // Create a typed mock function
        const mockCallback = jest.fn<string, [number, string]>();
        mockCallback.mockReturnValue("mocked result");

        const result: string = mockCallback(123, "test");

        expect(mockCallback).toHaveBeenCalledWith(123, "test");
        expect(mockCallback).toHaveBeenCalledTimes(1);
        expect(result).toBe("mocked result");
        expect(typeof result).toBe("string");
    });

    test("should support generic type testing", () => {
        interface TestData<T> {
            value: T;
            metadata: {
                created: Date;
                type: string;
            };
        }

        const stringData: TestData<string> = {
            value: "test string",
            metadata: {
                created: new Date(),
                type: "string",
            },
        };

        const numberData: TestData<number> = {
            value: 42,
            metadata: {
                created: new Date(),
                type: "number",
            },
        };

        expect(typeof stringData.value).toBe("string");
        expect(typeof numberData.value).toBe("number");
        expect(stringData.metadata.created).toBeInstanceOf(Date);
        expect(numberData.metadata.created).toBeInstanceOf(Date);
    });

    test("should handle error typing correctly", () => {
        const throwError = (message: string): never => {
            throw new Error(message);
        };

        expect(() => throwError("Test error")).toThrow("Test error");
        expect(() => throwError("Test error")).toThrow(Error);

        // Test error type checking
        try {
            throwError("Custom error");
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
            if (error instanceof Error) {
                expect(typeof error.message).toBe("string");
                expect(error.message).toBe("Custom error");
            }
        }
    });
});

describe("Jest Configuration - ElectronAPI Typing", () => {
    // Mock ElectronAPI for testing
    const createMockElectronAPI = (): ElectronAPI => ({
        app: {
            getVersion: jest.fn().mockResolvedValue("1.0.0"),
            getName: jest.fn().mockResolvedValue("Support Pilot"),
        },
        dialog: {
            openFile: jest.fn().mockResolvedValue({
                canceled: false,
                filePaths: ["/test/file.txt"],
            }),
        },
        window: {
            minimize: jest.fn().mockResolvedValue(undefined),
            maximize: jest.fn().mockResolvedValue(undefined),
            close: jest.fn().mockResolvedValue(undefined),
            isMaximized: jest.fn().mockResolvedValue(false),
            isMinimized: jest.fn().mockResolvedValue(false),
            restore: jest.fn().mockResolvedValue(undefined),
            getState: jest.fn().mockResolvedValue({
                isMaximized: false,
                isMinimized: false,
                isVisible: true,
                bounds: { x: 0, y: 0, width: 800, height: 600 },
            }),
        },
        shell: {
            openExternal: jest.fn().mockResolvedValue(undefined),
        },
        ipc: {
            onMenuNewSession: jest.fn(),
            onMenuFilesSelected: jest.fn(),
            removeAllListeners: jest.fn(),
        },
        supportPilot: {
            newSession: jest.fn().mockResolvedValue(undefined),
            attachFiles: jest.fn().mockResolvedValue({
                success: true,
                files: [],
            }),
            analyzeLog: jest.fn().mockResolvedValue({
                success: true,
                analysis: {
                    errors: [],
                    warnings: [],
                    suggestions: [],
                    timeline: [],
                },
            }),
            processEmailThread: jest.fn().mockResolvedValue({
                success: true,
                summary: {
                    participants: [],
                    timeline: [],
                    issues: [],
                    customerImpact: "",
                },
            }),
        },
    });

    test("should create properly typed ElectronAPI mock", async () => {
        const mockAPI: ElectronAPI = createMockElectronAPI();

        // Test app methods
        const version: string = await mockAPI.app.getVersion();
        const name: string = await mockAPI.app.getName();
        expect(typeof version).toBe("string");
        expect(typeof name).toBe("string");

        // Test dialog methods
        const fileResult = await mockAPI.dialog.openFile();
        expect(typeof fileResult.canceled).toBe("boolean");
        expect(Array.isArray(fileResult.filePaths)).toBe(true);

        // Test window methods
        await mockAPI.window.minimize();
        const isMaximized: boolean = await mockAPI.window.isMaximized();
        expect(typeof isMaximized).toBe("boolean");

        const windowState = await mockAPI.window.getState();
        expect(typeof windowState.isMaximized).toBe("boolean");
        expect(typeof windowState.bounds.width).toBe("number");

        // Test shell methods
        await mockAPI.shell.openExternal("https://example.com");

        // Test support pilot methods
        await mockAPI.supportPilot.newSession();

        const attachResult = await mockAPI.supportPilot.attachFiles([]);
        expect(typeof attachResult.success).toBe("boolean");
        expect(Array.isArray(attachResult.files)).toBe(true);

        const analyzeResult = await mockAPI.supportPilot.analyzeLog("");
        expect(typeof analyzeResult.success).toBe("boolean");
        if (analyzeResult.analysis) {
            expect(Array.isArray(analyzeResult.analysis.errors)).toBe(true);
        }

        const emailResult = await mockAPI.supportPilot.processEmailThread("");
        expect(typeof emailResult.success).toBe("boolean");
        if (emailResult.summary) {
            expect(Array.isArray(emailResult.summary.participants)).toBe(true);
        }

        // Test IPC methods
        mockAPI.ipc.onMenuNewSession(() => {});
        mockAPI.ipc.onMenuFilesSelected(() => {});
        mockAPI.ipc.removeAllListeners("test-channel");
    });

    test("should handle typed promises correctly", async () => {
        const mockAPI: ElectronAPI = createMockElectronAPI();

        // Test that all async methods return properly typed Promises
        const versionPromise: Promise<string> = mockAPI.app.getVersion();
        const dialogPromise = mockAPI.dialog.openFile();
        const windowPromise: Promise<void> = mockAPI.window.minimize();

        expect(versionPromise).toBeInstanceOf(Promise);
        expect(dialogPromise).toBeInstanceOf(Promise);
        expect(windowPromise).toBeInstanceOf(Promise);

        const [version, dialogResult] = await Promise.all([versionPromise, dialogPromise, windowPromise]);

        expect(typeof version).toBe("string");
        expect(typeof dialogResult.canceled).toBe("boolean");
    });
});
