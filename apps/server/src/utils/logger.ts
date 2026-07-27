// ============================================
// Logger Utility
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m', // Cyan
  info: '\x1b[32m',  // Green
  warn: '\x1b[33m',  // Yellow
  error: '\x1b[31m', // Red
};

const RESET = '\x1b[0m';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, context: string, message: string, data?: unknown): void {
  const color = LOG_COLORS[level];
  const timestamp = formatTimestamp();
  const prefix = `${color}[${level.toUpperCase()}]${RESET} ${timestamp} [${context}]`;

  if (data !== undefined) {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, data);
  } else {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (context: string, message: string, data?: unknown) =>
    log('debug', context, message, data),
  info: (context: string, message: string, data?: unknown) =>
    log('info', context, message, data),
  warn: (context: string, message: string, data?: unknown) =>
    log('warn', context, message, data),
  error: (context: string, message: string, data?: unknown) =>
    log('error', context, message, data),
};
