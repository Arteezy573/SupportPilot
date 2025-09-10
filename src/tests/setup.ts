import '@testing-library/jest-dom';

// Mock Electron APIs since they won't be available in Jest environment
Object.defineProperty(window, 'electron', {
  value: {
    // Mock IPC renderer methods
    ipcRenderer: {
      invoke: jest.fn(),
      send: jest.fn(),
      on: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn()
    }
  },
  writable: true
});

// Mock ResizeObserver (used by some Fluent UI components)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock matchMedia (used by responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // Deprecated
    removeListener: jest.fn(), // Deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
});

// Mock File and FileReader for file upload testing
(global as any).File = class MockFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;

  constructor(parts: any[], filename: string, properties?: any) {
    this.name = filename;
    this.size = parts.reduce((acc, part) => acc + part.length, 0);
    this.type = properties?.type || 'text/plain';
    this.lastModified = Date.now();
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(8));
  }

  text() {
    return Promise.resolve('mock file content');
  }

  stream() {
    return new ReadableStream();
  }
};

(global as any).FileReader = class MockFileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  onload: any = null;
  onerror: any = null;
  onabort: any = null;
  onloadend: any = null;

  readAsText(file: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'mock file content';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }

  readAsDataURL(file: any) {
    setTimeout(() => {
      this.readyState = 2;
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ=';
      if (this.onload) this.onload({ target: this });
      if (this.onloadend) this.onloadend({ target: this });
    }, 0);
  }

  abort() {
    this.readyState = 2;
    if (this.onabort) this.onabort({ target: this });
    if (this.onloadend) this.onloadend({ target: this });
  }
};

// Suppress console errors for cleaner test output
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
