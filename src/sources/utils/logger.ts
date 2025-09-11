/**
 * Simple logging utility for the main process
 * Provides structured logging with different levels
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

class Logger {
    private currentLevel: LogLevel = LogLevel.INFO;

    setLevel(level: LogLevel): void {
        this.currentLevel = level;
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= LogLevel.DEBUG) {
            console.debug(`[DEBUG] ${message}`, ...args);
        }
    }

    info(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= LogLevel.INFO) {
            console.info(`[INFO] ${message}`, ...args);
        }
    }

    warn(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= LogLevel.WARN) {
            console.warn(`[WARN] ${message}`, ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        if (this.currentLevel <= LogLevel.ERROR) {
            console.error(`[ERROR] ${message}`, ...args);
        }
    }
}

// Export singleton logger instance
export const logger = new Logger();

// Set debug level in development
if (process.env.NODE_ENV === "development") {
    logger.setLevel(LogLevel.DEBUG);
}
