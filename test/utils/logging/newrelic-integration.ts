import winston from 'winston';
import { logger as winstonLogger } from './winston-logger';

// New Relic log forwarding configuration
interface NewRelicLogConfig {
  apiKey: string;
  accountId: string;
  region?: 'US' | 'EU';
  batchSize?: number;
  flushInterval?: number;
}

// Custom Winston transport for New Relic Logs API
export class NewRelicTransport extends winston.transports.Stream {
  private config: NewRelicLogConfig;
  private logBuffer: any[] = [];
  private flushTimer?: NodeJS.Timeout;
  private endpoint: string;

  constructor(config: NewRelicLogConfig) {
    super({
      stream: {
        write: (message: string) => {
          this.handleLog(message);
        },
      } as any,
    });

    this.config = {
      batchSize: 100,
      flushInterval: 5000,
      region: 'US',
      ...config,
    };

    // Set endpoint based on region
    this.endpoint = this.config.region === 'EU'
      ? 'https://log-api.eu.newrelic.com/log/v1'
      : 'https://log-api.newrelic.com/log/v1';

    // Start flush timer
    this.startFlushTimer();
  }

  private handleLog(message: string): void {
    try {
      const logEntry = JSON.parse(message);
      
      // Format log for New Relic
      const newRelicLog = {
        timestamp: Date.now(),
        message: logEntry.message,
        level: logEntry.level,
        attributes: {
          ...logEntry.metadata,
          ...logEntry,
          'entity.guid': process.env.NEW_RELIC_ENTITY_GUID,
          'entity.name': process.env.NEW_RELIC_APP_NAME || 'newrelic-mcp',
          'entity.type': 'SERVICE',
          hostname: process.env.HOSTNAME || 'unknown',
        },
      };

      this.logBuffer.push(newRelicLog);

      // Flush if buffer is full
      if (this.logBuffer.length >= this.config.batchSize!) {
        this.flush();
      }
    } catch (error) {
      console.error('Failed to parse log for New Relic:', error);
    }
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.config.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': this.config.apiKey,
        },
        body: JSON.stringify([{
          common: {
            attributes: {
              'account.id': this.config.accountId,
              'service.name': process.env.NEW_RELIC_APP_NAME || 'newrelic-mcp',
            },
          },
          logs,
        }]),
      });

      if (!response.ok) {
        console.error(`Failed to send logs to New Relic: ${response.status} ${response.statusText}`);
        // Put logs back in buffer for retry
        this.logBuffer.unshift(...logs);
      }
    } catch (error) {
      console.error('Error sending logs to New Relic:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logs);
    }
  }

  close(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Integration with New Relic APM (if agent is installed)
export const integrateWithNewRelicAPM = () => {
  try {
    // Check if New Relic agent is available
    const newrelic = require('newrelic');
    
    if (newrelic) {
      // Create custom Winston format that adds New Relic trace context
      const newRelicAPMFormat = winston.format((info) => {
        // Get current transaction
        const transaction = newrelic.getTransaction();
        
        if (transaction) {
          // Add trace context to log
          const traceContext = transaction.traceContext;
          info['trace.id'] = traceContext.traceId;
          info['span.id'] = traceContext.spanId;
          info['entity.guid'] = newrelic.getLinkingMetadata?.()?.['entity.guid'];
        }
        
        return info;
      });

      // Add format to existing logger
      winstonLogger.format = winston.format.combine(
        newRelicAPMFormat(),
        winstonLogger.format
      );

      console.log('New Relic APM integration enabled for logging');
    }
  } catch (error) {
    // New Relic agent not installed, skip integration
    console.debug('New Relic agent not found, skipping APM integration');
  }
};

// Create logger with New Relic integration
export const createNewRelicLogger = (serviceName: string = 'newrelic-mcp') => {
  const apiKey = process.env.NEW_RELIC_LICENSE_KEY || process.env.NEW_RELIC_API_KEY;
  const accountId = process.env.NEW_RELIC_ACCOUNT_ID;

  if (!apiKey || !accountId) {
    console.warn('New Relic credentials not found, using default logger');
    return winstonLogger;
  }

  // Create logger with New Relic transport
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.metadata({
        fillExcept: ['message', 'level', 'timestamp', 'label']
      }),
      winston.format.json()
    ),
    defaultMeta: {
      service: serviceName,
      environment: process.env.NODE_ENV || 'development',
    },
    transports: [
      // Console transport for local debugging
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      // New Relic transport
      new NewRelicTransport({
        apiKey,
        accountId,
        region: (process.env.NEW_RELIC_REGION as 'US' | 'EU') || 'US',
      }),
    ],
  });

  // Integrate with APM if available
  integrateWithNewRelicAPM();

  return logger;
};

// Helper to correlate logs with distributed traces
export const correlateWithTrace = (traceId: string, spanId: string) => {
  return {
    'trace.id': traceId,
    'span.id': spanId,
    'dd.trace_id': traceId, // DataDog compatibility
    'dd.span_id': spanId,
  };
};

// Helper to add New Relic attributes to logs
export const addNewRelicAttributes = (attributes: Record<string, any>) => {
  const nr_attributes: Record<string, any> = {};
  
  Object.entries(attributes).forEach(([key, value]) => {
    // Prefix custom attributes with 'custom.'
    if (!key.startsWith('entity.') && !key.startsWith('trace.')) {
      nr_attributes[`custom.${key}`] = value;
    } else {
      nr_attributes[key] = value;
    }
  });
  
  return nr_attributes;
};

// Export enhanced logger with New Relic integration
export const enhancedLogger = process.env.NEW_RELIC_ENABLED === 'true'
  ? createNewRelicLogger()
  : winstonLogger;