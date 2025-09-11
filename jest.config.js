/** @type {import('jest').Config} */
module.exports = {
    // Test environment
    testEnvironment: "jsdom",

    // Setup files
    setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],

    // TypeScript transformation
    preset: "ts-jest",

    // Module file extensions
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

    // Transform configuration
    transform: {
        "^.+\\.(ts|tsx)$": [
            "ts-jest",
            {
                tsconfig: "tsconfig.test.json",
            },
        ],
    },

    // Module name mapping for path aliases and static assets
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/sources/$1",
        "^@/components/(.*)$": "<rootDir>/src/sources/renderer/components/$1",
        "^@/hooks/(.*)$": "<rootDir>/src/sources/renderer/hooks/$1",
        "^@/types/(.*)$": "<rootDir>/src/sources/types/$1",
        "^@/styles/(.*)$": "<rootDir>/src/sources/renderer/styles/$1",
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|svg|ico)$": "<rootDir>/src/tests/__mocks__/fileMock.js",
    },

    // Test file patterns
    testMatch: ["<rootDir>/src/tests/**/*.test.(ts|tsx)", "<rootDir>/src/tests/**/*.spec.(ts|tsx)"],

    // Files to ignore
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

    // Module patterns to ignore
    modulePathIgnorePatterns: ["/dist/", "/build/"],

    // Coverage configuration
    collectCoverageFrom: [
        "src/sources/**/*.{ts,tsx}",
        "!src/sources/**/*.d.ts",
        "!src/sources/main.ts",
        "!src/sources/preload.ts",
        "!src/sources/renderer/index.tsx",
        "!src/sources/**/*.stories.{ts,tsx}",
    ],

    // Coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // Coverage reporters
    coverageReporters: ["text", "lcov", "html", "json-summary"],

    // Coverage directory
    coverageDirectory: "coverage",

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Verbose output
    verbose: true,

    // Transform ignore patterns
    transformIgnorePatterns: ["node_modules/(?!(@fluentui|@microsoft)/)"],
};
