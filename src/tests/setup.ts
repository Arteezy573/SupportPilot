import "@testing-library/jest-dom";
import type { ElectronAPI } from "../sources/types/electron";

// Type definitions for enhanced test mocks
interface MockElectronAPI {
    ipcRenderer: {
        invoke: jest.MockedFunction<(channel: string, ...args: any[]) => Promise<any>>;
        send: jest.MockedFunction<(channel: string, ...args: any[]) => void>;
        on: jest.MockedFunction<(channel: string, listener: (...args: any[]) => void) => void>;
        removeListener: jest.MockedFunction<(channel: string, listener: (...args: any[]) => void) => void>;
        removeAllListeners: jest.MockedFunction<(channel: string) => void>;
    };
}

interface MockResizeObserver {
    observe: jest.MockedFunction<(target: Element) => void>;
    unobserve: jest.MockedFunction<(target: Element) => void>;
    disconnect: jest.MockedFunction<() => void>;
}

interface MockIntersectionObserver {
    observe: jest.MockedFunction<(target: Element) => void>;
    unobserve: jest.MockedFunction<(target: Element) => void>;
    disconnect: jest.MockedFunction<() => void>;
}

interface MockMediaQueryList {
    matches: boolean;
    media: string;
    onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => any) | null;
    addListener: jest.MockedFunction<(listener: (ev: MediaQueryListEvent) => void) => void>;
    removeListener: jest.MockedFunction<(listener: (ev: MediaQueryListEvent) => void) => void>;
    addEventListener: jest.MockedFunction<(type: string, listener: EventListener) => void>;
    removeEventListener: jest.MockedFunction<(type: string, listener: EventListener) => void>;
    dispatchEvent: jest.MockedFunction<(event: Event) => boolean>;
}

// Type definitions for file mocks
interface MockFileProperties {
    type?: string;
    lastModified?: number;
}

// Enhanced MockFile class with proper File interface implementation
class EnhancedMockFile {
    public readonly name: string;
    public readonly size: number;
    public readonly type: string;
    public readonly lastModified: number;
    public readonly webkitRelativePath: string = "";

    constructor(parts: (string | ArrayBuffer | ArrayBufferView | Blob)[], filename: string, properties?: MockFileProperties) {
        this.name = filename;
        this.size = parts.reduce((acc, part) => {
            if (typeof part === "string") {
                return acc + part.length;
            } else if (part instanceof ArrayBuffer) {
                return acc + part.byteLength;
            } else if (part instanceof Blob) {
                return acc + part.size;
            } else {
                return acc + part.byteLength;
            }
        }, 0);
        this.type = properties?.type || "text/plain";
        this.lastModified = properties?.lastModified || Date.now();
    }

    async arrayBuffer(): Promise<ArrayBuffer> {
        return new ArrayBuffer(this.size);
    }

    async text(): Promise<string> {
        return "mock file content";
    }

    stream(): ReadableStream<Uint8Array> {
        return new ReadableStream<Uint8Array>() as any;
    }

    slice(start?: number, end?: number, contentType?: string): Blob {
        return new EnhancedMockFile([], this.name, { type: contentType || this.type }) as any;
    }

    async bytes(): Promise<Uint8Array> {
        return new Uint8Array() as any;
    }
}

// Enhanced MockFileReader class with proper FileReader interface implementation
class EnhancedMockFileReader implements FileReader {
    public result: string | ArrayBuffer | null = null;
    public error: DOMException | null = null;
    public readyState: 0 | 1 | 2 = 0;

    // Event handlers
    public onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    public onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    public onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    public onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;

    // Constants
    public readonly EMPTY = 0 as const;
    public readonly LOADING = 1 as const;
    public readonly DONE = 2 as const;

    readAsText(_file: Blob, _encoding?: string): void {
        setTimeout(() => {
            this.result = "mocked file content";
            this.readyState = this.DONE;
            if (this.onload) {
                this.onload.call(this, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    readAsDataURL(_file: Blob): void {
        setTimeout(() => {
            this.result = "data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==";
            this.readyState = this.DONE;
            if (this.onload) {
                this.onload.call(this, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    readAsArrayBuffer(_file: Blob): void {
        setTimeout(() => {
            this.result = new ArrayBuffer(0);
            this.readyState = this.DONE;
            if (this.onload) {
                this.onload.call(this, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    readAsBinaryString(_file: Blob): void {
        setTimeout(() => {
            this.result = "mock binary data";
            this.readyState = this.DONE;
            if (this.onload) {
                this.onload.call(this, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }

    abort(): void {
        this.readyState = this.DONE;
        if (this.onabort) {
            this.onabort.call(this, {} as ProgressEvent<FileReader>);
        }
    }

    // EventTarget methods
    addEventListener(_type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | AddEventListenerOptions): void {
        // Mock implementation
    }

    removeEventListener(_type: string, _listener: EventListenerOrEventListenerObject, _options?: boolean | EventListenerOptions): void {
        // Mock implementation
    }

    dispatchEvent(_event: Event): boolean {
        return true;
    }
}

// Mock Electron APIs since they won't be available in Jest environment
Object.defineProperty(window, "electron", {
    value: {
        // Mock IPC renderer methods with proper typing
        ipcRenderer: {
            invoke: jest.fn() as jest.MockedFunction<(channel: string, ...args: any[]) => Promise<any>>,
            send: jest.fn() as jest.MockedFunction<(channel: string, ...args: any[]) => void>,
            on: jest.fn() as jest.MockedFunction<(channel: string, listener: (...args: any[]) => void) => void>,
            removeListener: jest.fn() as jest.MockedFunction<(channel: string, listener: (...args: any[]) => void) => void>,
            removeAllListeners: jest.fn() as jest.MockedFunction<(channel: string) => void>,
        },
    } as MockElectronAPI,
    writable: true,
});

// Mock ResizeObserver (used by some Fluent UI components)
global.ResizeObserver = jest.fn().mockImplementation(
    (): MockResizeObserver => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    })
);

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(
    (): MockIntersectionObserver => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
    })
);

// Mock matchMedia (used by responsive components)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(
        (query: string): MockMediaQueryList => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })
    ),
});

// Mock File and FileReader for file upload testing
(global as any).File = EnhancedMockFile;
(global as any).FileReader = EnhancedMockFileReader;

// Enhanced console error suppression with better typing
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
    console.error = (...args: any[]): void => {
        const message = args[0];
        if (typeof message === "string") {
            // Suppress known warnings/errors during testing
            const suppressPatterns = [
                "Warning: ReactDOM.render is deprecated",
                "Warning: React.createFactory() is deprecated",
                "Warning: componentWillMount has been renamed",
                "Warning: componentWillReceiveProps has been renamed",
                "Warning: componentWillUpdate has been renamed",
            ];

            if (suppressPatterns.some(pattern => message.includes(pattern))) {
                return;
            }
        }
        originalConsoleError.call(console, ...args);
    };

    console.warn = (...args: any[]): void => {
        const message = args[0];
        if (typeof message === "string") {
            // Suppress known warnings during testing
            const suppressPatterns = ["Warning: findDOMNode is deprecated", "Warning: Legacy context API"];

            if (suppressPatterns.some(pattern => message.includes(pattern))) {
                return;
            }
        }
        originalConsoleWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
});

// Additional test utilities with proper typing
export const createMockFile = (content = "test content", filename = "test.txt", type = "text/plain"): File => {
    return new EnhancedMockFile([content], filename, { type }) as any;
};

export const createMockFileList = (files: File[]): FileList => {
    const fileList = {
        length: files.length,
        item: (index: number): File | null => files[index] || null,
        [Symbol.iterator]: function* () {
            for (const file of files) {
                yield file;
            }
        },
    };

    // Add indexed properties
    files.forEach((file, index) => {
        (fileList as any)[index] = file;
    });

    return fileList as FileList;
};

// Type-safe mock data generators
export const mockElectronAPI = (): Partial<ElectronAPI> => ({
    app: {
        getVersion: jest.fn().mockResolvedValue("1.0.0"),
        getName: jest.fn().mockResolvedValue("Support Pilot Test"),
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

// Type-safe test helpers for common testing scenarios
export const createTypedMockFunction = <T extends (...args: any[]) => any>(implementation?: T): jest.MockedFunction<T> => {
    return jest.fn(implementation) as unknown as jest.MockedFunction<T>;
};

export const createAsyncMockFunction = <T>(resolvedValue?: T): jest.MockedFunction<() => Promise<T>> => {
    return jest.fn().mockResolvedValue(resolvedValue) as jest.MockedFunction<() => Promise<T>>;
};

// Global type declarations for better test environment typing
declare global {
    // We extend the global Window interface for test environment
    interface Window {
        electron: MockElectronAPI;
    }
}
