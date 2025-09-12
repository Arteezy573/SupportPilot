/** @type {import('jest').Config} */
module.exports = {
    // Test environment - Node.js for integration tests
    testEnvironment: "node",

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

    // Module name mapping for path aliases and Azure packages
    moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/src/sources/$1",
        "^@/components/(.*)$": "<rootDir>/src/sources/renderer/components/$1",
        "^@/hooks/(.*)$": "<rootDir>/src/sources/renderer/hooks/$1",
        "^@/types/(.*)$": "<rootDir>/src/sources/types/$1",
        "^@/styles/(.*)$": "<rootDir>/src/sources/renderer/styles/$1",
        "\\.(css|less|scss|sass)$": "identity-obj-proxy",
        "\\.(jpg|jpeg|png|gif|svg|ico)$": "<rootDir>/src/tests/__mocks__/fileMock.js",
        // Force Azure packages to use CommonJS versions
        "^@azure/identity$": "<rootDir>/node_modules/@azure/identity/dist/commonjs/index.js",
        "^@azure/logger$": "<rootDir>/node_modules/@azure/logger/dist/commonjs/index.js",
        "^@azure/core-auth$": "<rootDir>/node_modules/@azure/core-auth/dist/commonjs/index.js",
        "^@azure/core-client$": "<rootDir>/node_modules/@azure/core-client/dist/commonjs/index.js",
        "^@azure/core-rest-pipeline$": "<rootDir>/node_modules/@azure/core-rest-pipeline/dist/commonjs/index.js",
        "^@azure/core-tracing$": "<rootDir>/node_modules/@azure/core-tracing/dist/commonjs/index.js",
        "^@azure/core-util$": "<rootDir>/node_modules/@azure/core-util/dist/commonjs/index.js",
        "^@azure/abort-controller$": "<rootDir>/node_modules/@azure/abort-controller/dist/commonjs/index.js",
        "^@typespec/ts-http-runtime$": "<rootDir>/node_modules/@typespec/ts-http-runtime/dist/commonjs/index.js",
        // Mock React Testing Library for integration tests
        "@testing-library/react": "<rootDir>/src/tests/__mocks__/react-testing-library-mock.js",
        // Mock React for integration tests
        "^react$": "<rootDir>/src/tests/__mocks__/react-mock.js",
    },

    // Test file patterns - only integration tests
    testMatch: ["<rootDir>/src/tests/**/*.integration.test.(ts|tsx)"],

    // Files to ignore
    testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

    // Transform ignore patterns - Allow Azure SDK and related packages
    transformIgnorePatterns: [
        "node_modules/(?!(@azure|@typespec|uuid)/)"
    ],

    // Clear mocks between tests
    clearMocks: true,

    // Restore mocks after each test
    restoreMocks: true,

    // Longer timeout for integration tests
    testTimeout: 30000,

    // Verbose output
    verbose: true,

    // Global configuration for ts-jest
    globals: {
        'ts-jest': {
            useESM: true
        }
    },
};