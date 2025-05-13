type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerOptions {
  level?: LogLevel
  prefix?: string
  enabled?: boolean
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
  error?: Error
}

class Logger {
  private readonly level: LogLevel
  private readonly prefix: string
  private readonly enabled: boolean
  private static instance: Logger

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? 'info'
    this.prefix = options.prefix ?? ''
    this.enabled = options.enabled ?? process.env.NODE_ENV !== 'production'
  }

  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options)
    }
    return Logger.instance
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.level)
  }

  private formatMessage(entry: LogEntry): string {
    const prefix = this.prefix ? `[${this.prefix}] ` : ''
    return `${prefix}${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}`
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    error?: Error,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      error,
    }
  }

  private log(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return

    const formattedMessage = this.formatMessage(entry)

    // Only log to console in development or if explicitly enabled
    if (process.env.NODE_ENV !== 'production' || this.enabled) {
      switch (entry.level) {
        case 'debug':
          console.debug(formattedMessage, entry.data || '')
          break
        case 'info':
          console.info(formattedMessage, entry.data || '')
          break
        case 'warn':
          console.warn(formattedMessage, entry.data || '')
          break
        case 'error':
          console.error(formattedMessage, entry.error || entry.data || '')
          break
      }
    }

    // Always persist errors for monitoring, regardless of environment
    if (entry.level === 'error' || entry.level === 'warn') {
      this.persistLog(entry)
    } 
    // For non-error logs, only persist in development or if explicitly required
    else if (process.env.NODE_ENV !== 'production' || this.enabled) {
      this.persistLog(entry)
    }
  }

  private persistLog(entry: LogEntry): void {
    // Store in localStorage for client-side debugging
    if (typeof window !== 'undefined') {
      // Only store logs in non-production environments to avoid filling localStorage
      if (process.env.NODE_ENV !== 'production') {
        const logs = JSON.parse(localStorage.getItem('app_logs') ?? '[]')
        logs.push(entry)
        // Keep only last 100 logs
        localStorage.setItem('app_logs', JSON.stringify(logs.slice(-100)))
      }
      
      // In production, you might want to send critical errors to a service like Sentry
      if (process.env.NODE_ENV === 'production' && entry.level === 'error') {
        // If you add Sentry or another error tracking service, you would call it here
        // Example: Sentry.captureException(entry.error)
      }
    }
    
    // For server-side logging in production, consider services like:
    // - Application Insights
    // - Datadog
    // - LogRocket
    // - New Relic
    // - Sentry
  }

  debug(message: string, data?: unknown): void {
    this.log(this.createLogEntry('debug', message, data))
  }

  info(message: string, data?: unknown): void {
    this.log(this.createLogEntry('info', message, data))
  }

  warn(message: string, data?: unknown): void {
    this.log(this.createLogEntry('warn', message, data))
  }

  error(message: string, error?: unknown): void {
    this.log(this.createLogEntry('error', message, undefined, error as Error))
  }

  // Utility method to get logs (useful for debugging)
  getLogs(): LogEntry[] {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('app_logs') ?? '[]')
  }

  // Method to clear logs
  clearLogs(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('app_logs')
  }
}

// Export a singleton instance
export const logger = Logger.getInstance({
  // In production, only log warnings and errors by default
  level: process.env.NODE_ENV === 'production' ? 'warn' : ((process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info'),
  prefix: 'App',
  // Always enable logging, but the internal logic will control console output
  enabled: true,
})

// Export the class for custom instances
export { Logger }
export type { LogLevel, LoggerOptions, LogEntry }
