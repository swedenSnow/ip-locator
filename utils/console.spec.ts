import { LogLevel, clientLog, serverLog } from './console';

describe('Logger Utility', () => {
    let consoleDebugSpy: jest.SpyInstance;
    let consoleInfoSpy: jest.SpyInstance;
    let consoleWarnSpy: jest.SpyInstance;
    let consoleErrorSpy: jest.SpyInstance;
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
        // Save original environment
        originalEnv = { ...process.env };

        // Mock all console methods
        consoleDebugSpy = jest.spyOn(console, 'debug').mockImplementation();
        consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation();
        consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        // Restore everything
        jest.restoreAllMocks();
        process.env = originalEnv;
    });

    describe('clientLog', () => {
        describe('log level filtering', () => {
            it('should log ERROR without DEBUG_ENABLED', () => {
                delete process.env.DEBUG_ENABLED;
                clientLog(LogLevel.ERROR, 'Error occurred');
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            it('should log WARN without DEBUG_ENABLED', () => {
                delete process.env.DEBUG_ENABLED;
                clientLog(LogLevel.WARN, 'Warning message');
                expect(consoleWarnSpy).toHaveBeenCalled();
            });

            it('should not log INFO without DEBUG_ENABLED', () => {
                delete process.env.DEBUG_ENABLED;
                clientLog(LogLevel.INFO, 'Info message');
                expect(consoleInfoSpy).not.toHaveBeenCalled();
            });

            it('should not log DEBUG without DEBUG_ENABLED', () => {
                delete process.env.DEBUG_ENABLED;
                clientLog(LogLevel.DEBUG, 'Debug message');
                expect(consoleDebugSpy).not.toHaveBeenCalled();
            });

            it('should log all levels when DEBUG_ENABLED=true', () => {
                process.env.DEBUG_ENABLED = 'true';

                clientLog(LogLevel.DEBUG, 'Debug');
                clientLog(LogLevel.INFO, 'Info');
                clientLog(LogLevel.WARN, 'Warn');
                clientLog(LogLevel.ERROR, 'Error');

                expect(consoleDebugSpy).toHaveBeenCalled();
                expect(consoleInfoSpy).toHaveBeenCalled();
                expect(consoleWarnSpy).toHaveBeenCalled();
                expect(consoleErrorSpy).toHaveBeenCalled();
            });
        });

        describe('metadata handling', () => {
            beforeEach(() => {
                process.env.DEBUG_ENABLED = 'true';
            });

            it('should log message with metadata', () => {
                const metadata = { userId: 123, action: 'click' };
                clientLog(LogLevel.INFO, 'User action', metadata);

                expect(consoleInfoSpy).toHaveBeenCalledWith(
                    '[INFO]',
                    'User action',
                    metadata
                );
            });

            it('should log message without metadata', () => {
                clientLog(LogLevel.INFO, 'Simple message');

                expect(consoleInfoSpy).toHaveBeenCalledWith(
                    '[INFO]',
                    'Simple message'
                );
            });
        });

        describe('console method selection', () => {
            beforeEach(() => {
                process.env.DEBUG_ENABLED = 'true';
            });

            it('should use console.debug for DEBUG level', () => {
                clientLog(LogLevel.DEBUG, 'Debug message');
                expect(consoleDebugSpy).toHaveBeenCalled();
            });

            it('should use console.info for INFO level', () => {
                clientLog(LogLevel.INFO, 'Info message');
                expect(consoleInfoSpy).toHaveBeenCalled();
            });

            it('should use console.warn for WARN level', () => {
                clientLog(LogLevel.WARN, 'Warning message');
                expect(consoleWarnSpy).toHaveBeenCalled();
            });

            it('should use console.error for ERROR level', () => {
                clientLog(LogLevel.ERROR, 'Error message');
                expect(consoleErrorSpy).toHaveBeenCalled();
            });
        });
    });

    describe('serverLog', () => {
        beforeEach(() => {
            jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(
                '2024-01-15T10:30:00.000Z'
            );
        });

        describe('basic logging', () => {
            it('should log with timestamp and tag', () => {
                serverLog(LogLevel.INFO, 'api/test', 'Test message');

                expect(consoleInfoSpy).toHaveBeenCalledWith(
                    '[2024-01-15T10:30:00.000Z] [INFO] api/test:',
                    'Test message'
                );
            });

            it('should log with metadata', () => {
                const metadata = { requestId: 'abc123' };
                serverLog(LogLevel.INFO, 'api/test', 'Request processed', metadata);

                expect(consoleInfoSpy).toHaveBeenCalledWith(
                    '[2024-01-15T10:30:00.000Z] [INFO] api/test:',
                    'Request processed',
                    metadata
                );
            });
        });

        describe('error handling', () => {
            it('should serialize Error object', () => {
                const error = new Error('Test error');
                serverLog(LogLevel.ERROR, 'api/error', error);

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[2024-01-15T10:30:00.000Z] [ERROR] api/error:',
                    expect.objectContaining({
                        message: 'Test error',
                        name: 'Error',
                    })
                );
            });

            it('should include error stack when DEBUG_ENABLED=true', () => {
                process.env.DEBUG_ENABLED = 'true';
                const error = new Error('Test error');
                error.stack = 'Error: Test error\n    at test.ts:1:1';

                serverLog(LogLevel.ERROR, 'api/error', error);

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[2024-01-15T10:30:00.000Z] [ERROR] api/error:',
                    expect.objectContaining({
                        message: 'Test error',
                        stack: 'Error: Test error\n    at test.ts:1:1',
                    })
                );
            });

            it('should not include error stack when DEBUG_ENABLED=false', () => {
                process.env.DEBUG_ENABLED = 'false';
                const error = new Error('Test error');
                error.stack = 'Error: Test error\n    at test.ts:1:1';

                serverLog(LogLevel.ERROR, 'api/error', error);

                const callArg = consoleErrorSpy.mock.calls[0][1];
                expect(callArg).not.toHaveProperty('stack');
            });

            it('should include error code if present', () => {
                const error = new Error('Database error') as Error & {
                    code: string;
                };
                error.code = 'ECONNREFUSED';

                serverLog(LogLevel.ERROR, 'database', error);

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[2024-01-15T10:30:00.000Z] [ERROR] database:',
                    expect.objectContaining({
                        message: 'Database error',
                        code: 'ECONNREFUSED',
                    })
                );
            });

            it('should serialize error cause', () => {
                const cause = new Error('Root cause');
                const error = new Error('Main error', { cause });

                serverLog(LogLevel.ERROR, 'api/error', error);

                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    '[2024-01-15T10:30:00.000Z] [ERROR] api/error:',
                    expect.objectContaining({
                        message: 'Main error',
                        cause: expect.objectContaining({
                            message: 'Root cause',
                        }),
                    })
                );
            });
        });

        describe('console method selection', () => {
            it('should use console.debug for DEBUG', () => {
                process.env.LOG_LEVEL = 'DEBUG';
                serverLog(LogLevel.DEBUG, 'test', 'Debug message');
                expect(consoleDebugSpy).toHaveBeenCalled();
            });

            it('should use console.info for INFO', () => {
                serverLog(LogLevel.INFO, 'test', 'Info message');
                expect(consoleInfoSpy).toHaveBeenCalled();
            });

            it('should use console.warn for WARN', () => {
                serverLog(LogLevel.WARN, 'test', 'Warning message');
                expect(consoleWarnSpy).toHaveBeenCalled();
            });

            it('should use console.error for ERROR', () => {
                serverLog(LogLevel.ERROR, 'test', 'Error message');
                expect(consoleErrorSpy).toHaveBeenCalled();
            });
        });

        describe('log level filtering', () => {
            it('should respect LOG_LEVEL=ERROR (only log errors)', () => {
                process.env.LOG_LEVEL = 'ERROR';

                serverLog(LogLevel.DEBUG, 'test', 'Debug');
                serverLog(LogLevel.INFO, 'test', 'Info');
                serverLog(LogLevel.WARN, 'test', 'Warn');
                serverLog(LogLevel.ERROR, 'test', 'Error');

                expect(consoleDebugSpy).not.toHaveBeenCalled();
                expect(consoleInfoSpy).not.toHaveBeenCalled();
                expect(consoleWarnSpy).not.toHaveBeenCalled();
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            it('should respect LOG_LEVEL=WARN (log warn and error)', () => {
                process.env.LOG_LEVEL = 'WARN';

                serverLog(LogLevel.DEBUG, 'test', 'Debug');
                serverLog(LogLevel.INFO, 'test', 'Info');
                serverLog(LogLevel.WARN, 'test', 'Warn');
                serverLog(LogLevel.ERROR, 'test', 'Error');

                expect(consoleDebugSpy).not.toHaveBeenCalled();
                expect(consoleInfoSpy).not.toHaveBeenCalled();
                expect(consoleWarnSpy).toHaveBeenCalled();
                expect(consoleErrorSpy).toHaveBeenCalled();
            });

            it('should default to INFO level', () => {
                delete process.env.LOG_LEVEL;

                serverLog(LogLevel.DEBUG, 'test', 'Debug');
                serverLog(LogLevel.INFO, 'test', 'Info');

                expect(consoleDebugSpy).not.toHaveBeenCalled();
                expect(consoleInfoSpy).toHaveBeenCalled();
            });
        });
    });
});
