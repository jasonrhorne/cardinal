/**
 * Cardinal Structured Logging System
 * Comprehensive logging infrastructure with multiple transports
 */

import { z } from 'zod'

import type {
  BaseError,
  ErrorSeverity,
  ErrorCategory,
  ErrorContext,
} from '../errors/types'

// Log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

// Log contexts
export type LogContext =
  | 'app'
  | 'api'
  | 'function'
  | 'database'
  | 'auth'
  | 'ai_service'
  | 'external_api'
  | 'user_action'
  | 'client'

// Base log entry structure
export interface LogEntry {
  id: string
  timestamp: string
  level: LogLevel
  context: LogContext
  message: string
  data?: Record<string, any>
  userId?: string
  requestId?: string
  sessionId?: string
  error?: {
    name: string
    message: string
    stack?: string
    category?: ErrorCategory
    severity?: ErrorSeverity
  }
  performance?: {
    duration?: number
    memory?: number
    cpu?: number
  }
  metadata: {
    environment: string
    service: string
    version: string
    nodeVersion: string
    platform: string
  }
}

// Logger configuration
export interface LoggerConfig {
  level: LogLevel
  transports: LogTransport[]
  formatters: LogFormatter[]
  filters: LogFilter[]
  sensitiveKeys: string[]
  performance: {
    enabled: boolean
    includeMemory: boolean
    includeCpu: boolean
  }
}

// Log transport interface
export interface LogTransport {
  name: string
  enabled: boolean
  minLevel: LogLevel
  send: (entry: LogEntry) => Promise<void> | void
}

// Log formatter interface
export interface LogFormatter {
  name: string
  format: (entry: LogEntry) => LogEntry
}

// Log filter interface
export interface LogFilter {
  name: string
  filter: (entry: LogEntry) => boolean
}

// Performance tracker
class PerformanceTracker {
  private timers = new Map<string, { start: number; memory: number }>()

  start(id: string): void {
    this.timers.set(id, {
      start: performance.now(),
      memory: process.memoryUsage().heapUsed,
    })
  }

  end(id: string): { duration: number; memoryDelta: number } | null {
    const timer = this.timers.get(id)
    if (!timer) {
      return null
    }

    const duration = performance.now() - timer.start
    const memoryDelta = process.memoryUsage().heapUsed - timer.memory

    this.timers.delete(id)

    return { duration, memoryDelta }
  }
}

// Main logger class
export class Logger {
  private config: LoggerConfig
  private performance = new PerformanceTracker()

  private readonly levelPriorities: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    fatal: 4,
  }

  constructor(config: LoggerConfig) {
    this.config = config
  }

  // Core logging method
  async log(
    level: LogLevel,
    context: LogContext,
    message: string,
    data?: Record<string, any>,
    error?: Error | BaseError
  ): Promise<void> {
    // Check if level meets minimum threshold
    if (this.levelPriorities[level] < this.levelPriorities[this.config.level]) {
      return
    }

    const entry: LogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data: this.sanitizeData(data),
      error: error ? this.formatError(error) : undefined,
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'cardinal',
        version: process.env.npm_package_version || '0.1.0',
        nodeVersion: process.version,
        platform: process.platform,
      },
    }

    // Add user context if available
    if (data?.userId) {
      entry.userId = data.userId
    }
    if (data?.requestId) {
      entry.requestId = data.requestId
    }
    if (data?.sessionId) {
      entry.sessionId = data.sessionId
    }

    // Apply formatters
    let formattedEntry = entry
    for (const formatter of this.config.formatters) {
      formattedEntry = formatter.format(formattedEntry)
    }

    // Apply filters
    for (const filter of this.config.filters) {
      if (!filter.filter(formattedEntry)) {
        return // Entry filtered out
      }
    }

    // Send to transports
    await Promise.allSettled(
      this.config.transports
        .filter(
          transport =>
            transport.enabled &&
            this.levelPriorities[level] >=
              this.levelPriorities[transport.minLevel]
        )
        .map(transport => transport.send(formattedEntry))
    )
  }

  // Convenience methods
  debug(
    context: LogContext,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    return this.log('debug', context, message, data)
  }

  info(
    context: LogContext,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    return this.log('info', context, message, data)
  }

  warn(
    context: LogContext,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    return this.log('warn', context, message, data, error)
  }

  error(
    context: LogContext,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    return this.log('error', context, message, data, error)
  }

  fatal(
    context: LogContext,
    message: string,
    data?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    return this.log('fatal', context, message, data, error)
  }

  // Performance tracking
  startTimer(id: string): void {
    if (this.config.performance.enabled) {
      this.performance.start(id)
    }
  }

  async endTimer(
    id: string,
    context: LogContext,
    message: string,
    data?: Record<string, any>
  ): Promise<void> {
    if (!this.config.performance.enabled) {
      return
    }

    const perf = this.performance.end(id)
    if (!perf) {
      return
    }

    await this.info(context, message, {
      ...data,
      performance: {
        duration: perf.duration,
        memoryDelta: perf.memoryDelta,
      },
    })
  }

  // User action logging
  async logUserAction(
    action: string,
    userId: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.info('user_action', `User action: ${action}`, {
      userId,
      action,
      ...data,
    })
  }

  // API request/response logging
  async logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    requestId?: string,
    userId?: string,
    error?: Error
  ): Promise<void> {
    const level: LogLevel =
      statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    await this.log(
      level,
      'api',
      `${method} ${path} ${statusCode}`,
      {
        method,
        path,
        statusCode,
        duration,
        requestId,
        userId,
      },
      error
    )
  }

  // Database operation logging
  async logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    success: boolean,
    error?: Error,
    userId?: string
  ): Promise<void> {
    const level: LogLevel = success ? 'info' : 'error'

    await this.log(
      level,
      'database',
      `Database ${operation} on ${table}`,
      {
        operation,
        table,
        duration,
        success,
        userId,
      },
      error
    )
  }

  // AI service operation logging
  async logAiOperation(
    provider: string,
    model: string,
    operation: string,
    tokenCount?: number,
    duration?: number,
    success?: boolean,
    error?: Error
  ): Promise<void> {
    const level: LogLevel = success === false ? 'error' : 'info'

    await this.log(
      level,
      'ai_service',
      `AI ${operation} using ${provider}/${model}`,
      {
        provider,
        model,
        operation,
        tokenCount,
        duration,
        success,
      },
      error
    )
  }

  // Private helper methods
  private sanitizeData(
    data?: Record<string, any>
  ): Record<string, any> | undefined {
    if (!data) {
      return undefined
    }

    const sanitized = { ...data }

    for (const key of this.config.sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '[REDACTED]'
      }
    }

    // Remove undefined values and circular references
    return JSON.parse(JSON.stringify(sanitized))
  }

  private formatError(error: Error | BaseError): LogEntry['error'] {
    const formatted: LogEntry['error'] = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }

    // Add Cardinal-specific error details
    if ('category' in error) {
      formatted.category = error.category
    }

    if ('severity' in error) {
      formatted.severity = error.severity
    }

    return formatted
  }
}

// Default logger configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transports: [],
  formatters: [],
  filters: [],
  sensitiveKeys: [
    'password',
    'token',
    'apiKey',
    'secret',
    'key',
    'authorization',
    'cookie',
    'session',
    'jwt',
    'refreshToken',
    'accessToken',
  ],
  performance: {
    enabled: process.env.NODE_ENV !== 'production',
    includeMemory: true,
    includeCpu: false,
  },
}

// Singleton logger instance
let loggerInstance: Logger | null = null

export function createLogger(config?: Partial<LoggerConfig>): Logger {
  const finalConfig = {
    ...defaultConfig,
    ...config,
    transports: [...defaultConfig.transports, ...(config?.transports || [])],
    formatters: [...defaultConfig.formatters, ...(config?.formatters || [])],
    filters: [...defaultConfig.filters, ...(config?.filters || [])],
  }

  return new Logger(finalConfig)
}

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger()
  }
  return loggerInstance
}

// Export default instance
export const logger = getLogger()
