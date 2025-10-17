import pino from 'pino'

/**
 * Structured logger using Pino
 * Provides fast, low-overhead logging with automatic serialization
 */

const logLevel = (process.env['LOG_LEVEL'] || 'info') as pino.Level

/**
 * Logger instance
 * Use this for all logging throughout the application
 *
 * @example
 * import { logger } from '@/lib/logger'
 *
 * logger.info('Server started')
 * logger.error({ err: error }, 'Request failed')
 */
export const logger = pino({
  level: logLevel,
  // Disable pino-pretty transport to avoid worker thread issues
  // Use JSON logging in all environments for stability
  transport: undefined,
  // Base fields included in every log
  base: {
    env: process.env['NODE_ENV'] || 'development',
    app: process.env['APP_NAME'] || 'api-proxy-system',
  },
  // Timestamp format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Custom serializers
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
})

/**
 * Create a child logger with additional context
 *
 * @example
 * const requestLogger = createLogger({ requestId: '123' })
 * requestLogger.info('Processing request')
 */
export function createLogger(context: Record<string, unknown>) {
  return logger.child(context)
}

/**
 * Log levels:
 * - trace: Very detailed logs
 * - debug: Debug information
 * - info: Informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal errors (application crash)
 *
 * @example
 * logger.trace('Entering function')
 * logger.debug({ data }, 'Processing data')
 * logger.info('Operation completed')
 * logger.warn('Deprecated function used')
 * logger.error({ err }, 'Operation failed')
 * logger.fatal('Application crashed')
 */
