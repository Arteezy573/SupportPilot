/**
 * Mock for React for integration tests
 * This allows us to test hook logic without actual React rendering
 */

/* global jest */

// Global state to track all state values across hook calls
const globalState = {
    stateIndex: 0,
    stateValues: [],
    stateSetters: [],
};

const useState = jest.fn(initialValue => {
    const currentIndex = globalState.stateIndex++;

    // Initialize state if not already set
    if (globalState.stateValues[currentIndex] === undefined) {
        globalState.stateValues[currentIndex] = initialValue;
    }

    // Create setter that updates the global state
    const setState = jest.fn(newValue => {
        if (typeof newValue === "function") {
            globalState.stateValues[currentIndex] = newValue(globalState.stateValues[currentIndex]);
        } else {
            globalState.stateValues[currentIndex] = newValue;
        }
        // Trigger any registered callbacks
        if (globalState.stateSetters[currentIndex]) {
            globalState.stateSetters[currentIndex].forEach(callback => callback());
        }
    });

    globalState.stateSetters[currentIndex] = globalState.stateSetters[currentIndex] || [];

    return [globalState.stateValues[currentIndex], setState];
});

const useCallback = jest.fn((callback, _deps) => callback);

const useEffect = jest.fn((effect, _deps) => {
    // For integration tests, execute effects synchronously
    if (typeof effect === "function") {
        const cleanup = effect();
        // Store cleanup function if returned
        if (typeof cleanup === "function") {
            // Could store cleanup functions if needed
        }
    }
});

const useRef = jest.fn(initialValue => ({
    current: initialValue,
}));

// Reset function for between tests
const resetMocks = () => {
    globalState.stateIndex = 0;
    globalState.stateValues.length = 0;
    globalState.stateSetters.length = 0;
    useState.mockClear();
    useCallback.mockClear();
    useEffect.mockClear();
    useRef.mockClear();
};

// Helper to get current state values (for debugging)
const getCurrentState = () => ({
    stateValues: [...globalState.stateValues],
    stateIndex: globalState.stateIndex,
});

// CommonJS exports
module.exports = {
    useState,
    useCallback,
    useEffect,
    useRef,
    // Export utilities for test control
    __resetMocks: resetMocks,
    __getCurrentState: getCurrentState,
    // Default export for default imports
    default: {
        useState,
        useCallback,
        useEffect,
        useRef,
    },
};
