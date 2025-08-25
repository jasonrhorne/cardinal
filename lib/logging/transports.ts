/**
 * Cardinal Log Transports
 * Various transport implementations for different environments
 */

import type { LogTransport, LogEntry, LogLevel } from './logger'

// Console transport for development
export class ConsoleTransport implements LogTransport {
  name = 'console'
  enabled = true
  minLevel: LogLevel = 'debug'

  private readonly colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m', // Green
    warn: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    fatal: '\x1b[35m', // Magenta
  }

  private readonly reset = '\x1b[0m'

  constructor(config?: { minLevel?: LogLevel; colors?: boolean }) {
    this.minLevel = config?.minLevel || 'debug'
  }

  send(entry: LogEntry): void {
    const color = this.colors[entry.level]
    const timestamp = new Date(entry.timestamp).toISOString()

    // Format the main log line
    const mainLine = `${color}[${timestamp}] ${entry.level.toUpperCase()} [${entry.context}]${this.reset} ${entry.message}`

    console.log(mainLine)

    // Log additional data if present
    if (entry.data) {
      console.log('  Data:', this.formatData(entry.data))
    }

    // Log error details if present
    if (entry.error) {
      console.error(`  Error: ${entry.error.name}: ${entry.error.message}`)
      if (entry.error.stack) {
        console.error('  Stack:', entry.error.stack)
      }
    }

    // Log performance data if present
    if (entry.performance) {
      console.log('  Performance:', entry.performance)
    }
  }

  private formatData(data: Record<string, any>): string {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return '[Circular or non-serializable data]'
    }
  }
}

// File transport for server environments
export class FileTransport implements LogTransport {
  name = 'file'
  enabled = true
  minLevel: LogLevel = 'info'

  private filePath: string

  constructor(config: { filePath: string; minLevel?: LogLevel }) {
    this.filePath = config.filePath
    this.minLevel = config.minLevel || 'info'
  }

  async send(entry: LogEntry): Promise<void> {
    const fs = await import('fs/promises')
    const path = await import('path')

    try {
      // Ensure directory exists
      await fs.mkdir(path.dirname(this.filePath), { recursive: true })

      // Format entry as JSON line
      const line = JSON.stringify(entry) + '\n'

      // Append to file
      await fs.appendFile(this.filePath, line, 'utf8')
    } catch (error) {
      console.error('Failed to write log to file:', error)
    }
  }
}

// HTTP transport for remote logging services
export class HttpTransport implements LogTransport {
  name = 'http'
  enabled = true
  minLevel: LogLevel = 'warn'

  private endpoint: string
  private headers: Record<string, string>
  private batchSize: number
  private flushInterval: number
  private batch: LogEntry[] = []
  private timer: NodeJS.Timeout | null = null

  constructor(config: {
    endpoint: string
    headers?: Record<string, string>
    minLevel?: LogLevel
    batchSize?: number
    flushInterval?: number
  }) {
    this.endpoint = config.endpoint
    this.headers = config.headers || {}
    this.minLevel = config.minLevel || 'warn'
    this.batchSize = config.batchSize || 10
    this.flushInterval = config.flushInterval || 5000

    // Start flush timer
    this.startFlushTimer()
  }

  async send(entry: LogEntry): Promise<void> {
    this.batch.push(entry)

    if (this.batch.length >= this.batchSize) {
      await this.flush()
    }
  }

  private async flush(): Promise<void> {
    if (this.batch.length === 0) {
      return
    }

    const entries = [...this.batch]
    this.batch = []

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers,
        },
        body: JSON.stringify({ logs: entries }),
      })

      if (!response.ok) {
        console.error(
          `HTTP transport failed: ${response.status} ${response.statusText}`
        )
        // Re-add entries to batch for retry (simple strategy)
        this.batch.unshift(...entries)
      }
    } catch (error) {
      console.error('HTTP transport error:', error)
      // Re-add entries to batch for retry
      this.batch.unshift(...entries)
    }
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(console.error)
    }, this.flushInterval)
  }

  destroy(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
    this.flush().catch(console.error)
  }
}

// Webhook transport for integrations (Slack, Discord, etc.)
export class WebhookTransport implements LogTransport {
  name = 'webhook'
  enabled = true
  minLevel: LogLevel = 'error'

  private webhookUrl: string
  private formatter: (entry: LogEntry) => any

  constructor(config: {
    webhookUrl: string
    minLevel?: LogLevel
    formatter?: (entry: LogEntry) => any
  }) {
    this.webhookUrl = config.webhookUrl
    this.minLevel = config.minLevel || 'error'
    this.formatter = config.formatter || this.defaultFormatter
  }

  async send(entry: LogEntry): Promise<void> {
    try {
      const payload = this.formatter(entry)

      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (error) {
      console.error('Webhook transport error:', error)
    }
  }

  private defaultFormatter(entry: LogEntry): any {
    return {
      text: `🚨 ${entry.level.toUpperCase()}: ${entry.message}`,
      attachments: [
        {
          color: this.getLevelColor(entry.level),
          fields: [
            { title: 'Context', value: entry.context, short: true },
            { title: 'Timestamp', value: entry.timestamp, short: true },
            {
              title: 'Request ID',
              value: entry.requestId || 'N/A',
              short: true,
            },
            { title: 'User ID', value: entry.userId || 'N/A', short: true },
          ],
        },
      ],
    }
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case 'debug':
        return '#36a2eb'
      case 'info':
        return '#4bc0c0'
      case 'warn':
        return '#ffce56'
      case 'error':
        return '#ff6384'
      case 'fatal':
        return '#ff4757'
      default:
        return '#95a5a6'
    }
  }
}

// Memory transport for testing and buffering
export class MemoryTransport implements LogTransport {
  name = 'memory'
  enabled = true
  minLevel: LogLevel = 'debug'

  private logs: LogEntry[] = []
  private maxSize: number

  constructor(config?: { maxSize?: number; minLevel?: LogLevel }) {
    this.maxSize = config?.maxSize || 1000
    this.minLevel = config?.minLevel || 'debug'
  }

  send(entry: LogEntry): void {
    this.logs.push(entry)

    // Keep only the most recent entries
    if (this.logs.length > this.maxSize) {
      this.logs.shift()
    }
  }

  getLogs(filter?: {
    level?: LogLevel
    context?: string
    since?: Date
  }): LogEntry[] {
    let filtered = [...this.logs]

    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level)
    }

    if (filter?.context) {
      filtered = filtered.filter(log => log.context === filter.context)
    }

    if (filter?.since) {
      filtered = filtered.filter(
        log => new Date(log.timestamp) >= filter.since!
      )
    }

    return filtered
  }

  clear(): void {
    this.logs = []
  }

  count(): number {
    return this.logs.length
  }
}

// Factory function to create transports based on environment
export function createDefaultTransports(): LogTransport[] {
  const transports: LogTransport[] = []

  // Always add console transport
  transports.push(
    new ConsoleTransport({
      minLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    })
  )

  // Add file transport in production
  if (process.env.NODE_ENV === 'production') {
    transports.push(
      new FileTransport({
        filePath: '/tmp/cardinal.log',
        minLevel: 'info',
      })
    )
  }

  // Add HTTP transport if configured
  if (process.env.LOG_HTTP_ENDPOINT) {
    transports.push(
      new HttpTransport({
        endpoint: process.env.LOG_HTTP_ENDPOINT,
        headers: process.env.LOG_HTTP_HEADERS
          ? JSON.parse(process.env.LOG_HTTP_HEADERS)
          : undefined,
        minLevel: 'warn',
      })
    )
  }

  // Add webhook transport if configured
  if (process.env.LOG_WEBHOOK_URL) {
    transports.push(
      new WebhookTransport({
        webhookUrl: process.env.LOG_WEBHOOK_URL,
        minLevel: 'error',
      })
    )
  }

  return transports
}

export {
  ConsoleTransport,
  FileTransport,
  HttpTransport,
  WebhookTransport,
  MemoryTransport,
}
