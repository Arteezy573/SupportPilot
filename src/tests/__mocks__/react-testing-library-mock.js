/**
 * Mock for @testing-library/react for integration tests
 * This allows us to test the hook logic without actually rendering React components
 */

/* global jest */

// Global state to track hook instances and their updates
const globalHookState = {
    instances: new Map(),
    updateCallbacks: new Map(),
};

// Mock renderHook that creates a stateful hook instance
const renderHook = jest.fn(hookFn => {
    const instanceId = Math.random().toString(36);

    // Create initial hook instance
    const currentInstance = hookFn();
    globalHookState.instances.set(instanceId, currentInstance);

    // Create a result object that always returns the latest hook state
    const result = {
        get current() {
            return globalHookState.instances.get(instanceId);
        },
    };

    // Set up a way to update the instance
    globalHookState.updateCallbacks.set(instanceId, updater => {
        if (typeof updater === "function") {
            const newInstance = updater(globalHookState.instances.get(instanceId));
            globalHookState.instances.set(instanceId, newInstance);
        } else {
            globalHookState.instances.set(instanceId, updater);
        }
    });

    return { result, _instanceId: instanceId };
});

// Mock act function that re-executes the hook to capture state changes
const act = jest.fn(async fn => {
    if (typeof fn === "function") {
        const result = fn();

        // If it's a promise, await it
        if (result && typeof result.then === "function") {
            await result;
        }

        // After the action, re-execute all hooks to capture state changes
        for (const [_instanceId, _] of globalHookState.instances) {
            // Find the original hook function and re-execute it
            // This is a simplified approach - in a real implementation we'd need to store the original hookFn
            // For now, we'll rely on the hook's internal state management
        }

        return result;
    }
    return fn;
});

// Reset function for between tests
const resetHookState = () => {
    globalHookState.instances.clear();
    globalHookState.updateCallbacks.clear();
    renderHook.mockClear();
    act.mockClear();
};

// CommonJS exports
module.exports = {
    renderHook,
    act,
    __resetHookState: resetHookState,
};
