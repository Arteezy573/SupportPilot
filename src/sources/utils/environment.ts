import { app } from "electron";

/**
 * Environment detection utilities for Electron application
 */

/**
 * Determines if the application is running in development mode
 * @returns {boolean} True if in development mode, false otherwise
 */
export function isDev(): boolean {
    // Prioritize NODE_ENV over packaging status for source builds
    if (process.env.NODE_ENV === "development") {
        return true;
    }
    if (process.env.NODE_ENV === "production") {
        return false;
    }
    // Fallback to packaging status if NODE_ENV is not set
    return !app.isPackaged;
}

/**
 * Determines if the application is running in production mode
 * @returns {boolean} True if in production mode, false otherwise
 */
export function isProd(): boolean {
    return !isDev();
}

/**
 * Gets the current environment name
 * @returns {string} Environment name ('development' or 'production')
 */
export function getEnvironment(): string {
    return isDev() ? "development" : "production";
}

/**
 * Determines if the application is packaged (built for distribution)
 * @returns {boolean} True if packaged, false otherwise
 */
export function isPackaged(): boolean {
    return app.isPackaged;
}
