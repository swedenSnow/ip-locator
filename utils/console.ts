/* eslint-disable no-restricted-syntax */

/**
 * Log levels in order of severity
 */
export enum LogLevel {
    DEBUG = 'DEBUG',
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
}

/**
 * Log level priority for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 1,
    [LogLevel.WARN]: 2,
    [LogLevel.ERROR]: 3,
};

/**
 * Configuration interface
 */
interface LogConfig {
    minLevel?: LogLevel;
    showTimestamp?: boolean;
    debugEnabled?: boolean;
}

/**
 * Metadata that can be attached to logs
 */
interface LogMetadata {
    [key: string]: unknown;
}

/**
 * Get minimum log level from environment
 */
function getMinLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    return envLevel && envLevel in LogLevel
        ? (envLevel as LogLevel)
        : LogLevel.INFO;
}

/**
 * Check if log level should be output
 */
function shouldLog(level: LogLevel, config?: LogConfig): boolean {
    const minLevel = config?.minLevel ?? getMinLogLevel();
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minLevel];
}

/**
 * Get appropriate console method for log level
 */
function getConsoleMethod(level: LogLevel): (...args: unknown[]) => void {
    switch (level) {
        case LogLevel.DEBUG:
            return console.debug;
        case LogLevel.INFO:
            return console.info;
        case LogLevel.WARN:
            return console.warn;
        case LogLevel.ERROR:
            return console.error;
        default:
            return console.log;
    }
}

/**
 * Serialize an Error object with all details
 */
function serializeError(error: Error): Record<string, unknown> {
    const serialized: Record<string, unknown> = {
        message: error.message,
        name: error.name,
    };

    if (error.stack && process.env.DEBUG_ENABLED === 'true') {
        serialized.stack = error.stack;
    }

    if ('code' in error) {
        serialized.code = error.code;
    }

    if ('cause' in error && error.cause) {
        serialized.cause =
            error.cause instanceof Error
                ? serializeError(error.cause)
                : error.cause;
    }

    return serialized;
}

/**
 * Client-side logging (browser)
 * Only logs when DEBUG_ENABLED=true or log level is ERROR/WARN
 */
export function clientLog(
    level: LogLevel,
    message: string,
    metadata?: LogMetadata
): void {
    const debugEnabled = process.env.DEBUG_ENABLED === 'true';
    const isImportant =
        level === LogLevel.ERROR || level === LogLevel.WARN;

    // If debug is not enabled, only log important messages
    if (!debugEnabled && !isImportant) {
        return;
    }

    // If debug is not enabled, check LOG_LEVEL for important messages
    // If debug is enabled, skip LOG_LEVEL filtering for client logs
    if (!debugEnabled && !shouldLog(level)) {
        return;
    }

    const consoleMethod = getConsoleMethod(level);
    const prefix = `[${level}]`;

    if (metadata) {
        consoleMethod(prefix, message, metadata);
    } else {
        consoleMethod(prefix, message);
    }
}

/**
 * Server-side logging with timestamp and tag
 */
export function serverLog(
    level: LogLevel,
    tag: string,
    data: unknown,
    metadata?: LogMetadata
): void {
    if (!shouldLog(level)) {
        return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level}] ${tag}:`;
    const consoleMethod = getConsoleMethod(level);

    // Handle Error objects
    if (data instanceof Error) {
        const errorData = serializeError(data);
        if (metadata) {
            consoleMethod(prefix, errorData, metadata);
        } else {
            consoleMethod(prefix, errorData);
        }
        return;
    }

    // Handle regular data
    if (metadata) {
        consoleMethod(prefix, data, metadata);
    } else {
        consoleMethod(prefix, data);
    }
}
