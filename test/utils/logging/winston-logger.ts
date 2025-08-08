import path from 'node:path';
import winston from 'winston';

// Custom format for New Relic compatibility
const newRelicFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.metadata({
    fillExcept: ['message', 'level', 'timestamp', 'label'],
  }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logger configuration
const createLogger = (serviceName: string = 'newrelic-mcp') => {
  const isTest = process.env.NODE_ENV === 'test';
  const isDevelopment = process.env.NODE_ENV !== 'production';

  const transports: winston.transport[] = [];

  // Console transport for development and test
  if (isDevelopment || isTest) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: isTest ? 'error' : 'debug',
        silent: process.env.SUPPRESS_LOGS === 'true',
      })
    );
  }

  // File transport for production logs
  if (!isTest) {
    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'error.log'),
        level: 'error',
        format: newRelicFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    transports.push(
      new winston.transports.File({
        filename: path.join(process.cwd(), 'logs', 'combined.log'),
        format: newRelicFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || (isTest ? 'error' : 'info'),
    format: newRelicFormat,
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
      accountId: process.env.NEW_RELIC_ACCOUNT_ID,
    },
    transports,
    exitOnError: false,
  });
};

// Create child logger for specific components
export const createChildLogger = (parent: winston.Logger, component: string) => {
  return parent.child({ component });
};

// Export singleton logger instance
export const logger = createLogger();

// Export factory for custom loggers
export { createLogger };

// Helper functions for structured logging
export const logRequest = (
  logger: winston.Logger,
  method: string,
  path: string,
  metadata?: Record<string, unknown>
) => {
  logger.info('Request received', {
    method,
    path,
    ...metadata,
  });
};

export const logResponse = (
  logger: winston.Logger,
  statusCode: number,
  duration: number,
  metadata?: Record<string, unknown>
) => {
  logger.info('Response sent', {
    statusCode,
    duration,
    ...metadata,
  });
};

export const logError = (
  logger: winston.Logger,
  error: Error,
  context?: Record<string, unknown>
) => {
  logger.error('Error occurred', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
};

export const logMetric = (
  logger: winston.Logger,
  metricName: string,
  value: number,
  unit: string,
  metadata?: Record<string, unknown>
) => {
  logger.info('Metric recorded', {
    metric: {
      name: metricName,
      value,
      unit,
    },
    ...metadata,
  });
};

// Test utilities
export const createTestLogger = () => {
  return winston.createLogger({
    level: 'error',
    format: winston.format.simple(),
    transports: [new winston.transports.Console({ silent: true })],
  });
};
