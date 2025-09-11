import "@testing-library/jest-dom";

// Mock Electron APIs since they won't be available in Jest environment
Object.defineProperty(window, "electron", {
    value: {
        // Mock IPC renderer methods
        ipcRenderer: {
            invoke: jest.fn(),
            send: jest.fn(),
            on: jest.fn(),
            removeListener: jest.fn(),
            removeAllListeners: jest.fn(),
        },
    },
    writable: true,
});

// Mock ResizeObserver (used by some Fluent UI components)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
}));

// Mock matchMedia (used by responsive components)
Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Type definitions for test mocks
interface MockFileProperties {
    type?: string;
    lastModified?: number;
}

class MockFile {
    name: string;
    size: number;
    type: string;
    lastModified: number;

    constructor(parts: (string | ArrayBuffer | ArrayBufferView)[], filename: string, properties?: MockFileProperties) {
        this.name = filename;
        this.size = parts.reduce((acc, part) => acc + (typeof part === 'string' ? part.length : part.byteLength), 0);
        this.type = properties?.type || "text/plain";
        this.lastModified = properties?.lastModified || Date.now();
    }

    arrayBuffer(): Promise<ArrayBuffer> {
        return Promise.resolve(new ArrayBuffer(8));
    }

    text(): Promise<string> {
        return Promise.resolve("mock file content");
    }

    stream(): ReadableStream {
        return new ReadableStream();
    }
}

class MockFileReader {
    public result: string | ArrayBuffer | null = null;
    public error: DOMException | null = null;
    public readyState = 0;
    public onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    public onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    
    readAsText(_file: File): void {
        setTimeout(() => {
            this.result = 'mocked file content';
            this.readyState = 2;
            if (this.onload) {
                this.onload.call(this as any, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }
    
    readAsDataURL(_file: File): void {
        setTimeout(() => {
            this.result = 'data:text/plain;base64,bW9ja2VkIGZpbGUgY29udGVudA==';
            this.readyState = 2;
            if (this.onload) {
                this.onload.call(this as any, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }
    
    readAsArrayBuffer(_file: File): void {
        setTimeout(() => {
            this.result = new ArrayBuffer(0);
            this.readyState = 2;
            if (this.onload) {
                this.onload.call(this as any, {} as ProgressEvent<FileReader>);
            }
        }, 0);
    }
    
    abort(): void {
        this.readyState = 2;
    }
}

interface MockGlobal {
    File: typeof MockFile;
    FileReader: new() => MockFileReader;
}

// Mock File and FileReader for file upload testing
(global as unknown as MockGlobal).File = MockFile;

(global as unknown as MockGlobal).FileReader = MockFileReader;

// Suppress console errors for cleaner test output
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (typeof args[0] === "string" && args[0].includes("Warning: ReactDOM.render is deprecated")) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
