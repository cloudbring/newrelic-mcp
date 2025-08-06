# Test Suite Logging and Telemetry Implementation

## Overview

This document describes the Winston logging and OpenTelemetry instrumentation implementation for the New Relic MCP server **test suite only**. This logging and telemetry is not included in the production MCP server code.

## Components Implemented

### 1. Winston Logger (`test/utils/logging/winston-logger.ts`)
- Structured logging with JSON format
- New Relic-compatible log format
- Environment-specific configurations (test, development, production)
- File and console transports
- Child logger support for component-specific logging
- Helper functions for structured logging (logRequest, logResponse, logError, logMetric)

### 2. OpenTelemetry Setup (`test/utils/instrumentation/otel-setup.ts`)
- WASM SIMD-accelerated tracing
- Resource detection with service metadata
- OTLP trace exporter configuration
- Winston instrumentation integration
- Helper functions for tool execution tracing
- Span attribute and event management
- Test tracer for unit testing

### 3. New Relic Integration (`test/utils/logging/newrelic-integration.ts`)
- Custom Winston transport for New Relic Logs API
- Automatic log forwarding to New Relic
- APM integration when agent is available
- Trace context correlation
- Batch processing with configurable intervals
- Regional endpoint support (US/EU)

### 4. Test Infrastructure

#### Vitest Fixtures (`test/fixtures/logging.fixture.ts`)
- Log capture fixture for testing
- Span capture fixture for telemetry testing
- Custom test runner with integrated logging
- Helper utilities for async testing

#### Vitest Hooks (`test/setup/vitest-hooks.ts`)
- Automatic test instrumentation
- Performance measurement per test
- Test execution logging
- OpenTelemetry span creation for tests
- Error tracking and reporting

#### Log Verification Utilities (`test/helpers/log-verification.ts`)
- Log entry verification helpers
- Span attribute verification
- Trace context validation
- Performance metrics validation
- New Relic attribute verification

### 5. Test Suite Integration

The logging and telemetry is integrated into the test suite for:
- Test execution monitoring
- Performance measurement of test runs
- Debugging test failures
- Tracking test coverage and execution patterns

**Note**: Production tools (NRQL, APM, etc.) do not include any logging or telemetry.

## Usage Examples

### Basic Logging in Tests
```typescript
import { logger, createChildLogger } from '../utils/logging/winston-logger';

// Create component-specific logger
const componentLogger = createChildLogger(logger, 'MyComponent');

// Log with structured data
componentLogger.info('Operation completed', {
  duration: 125,
  resultCount: 10,
  metadata: { key: 'value' }
});
```

### Test Execution with Tracing
```typescript
import { withToolSpan, addSpanAttributes } from '../utils/instrumentation/otel-setup';

// In test files, use the fixtures for tracing
test('should execute with tracing', async ({ withSpan }) => {
  await withSpan('test.operation', async () => {
    // Test code here
    const result = await someOperation();
    expect(result).toBeDefined();
  });
});
```

### Test with Logging Fixtures
```typescript
import { test } from '../fixtures/logging.fixture';

test('should log operations', async ({ logger, logCapture, withSpan }) => {
  await withSpan('test.operation', async () => {
    // Perform operation
    await someOperation();
  });

  // Verify logs
  expect(logCapture.hasLog('info', 'Operation completed')).toBe(true);
  
  // Verify performance metrics
  const logs = logCapture.findByMessage('completed');
  expect(logs[0].metadata?.duration).toBeDefined();
});
```

## Environment Variables

### Logging Configuration
- `LOG_LEVEL`: Set log level (debug, info, warn, error)
- `NODE_ENV`: Environment (test, development, production)
- `SUPPRESS_LOGS`: Suppress console logs when true

### OpenTelemetry Configuration
- `OTEL_ENABLED`: Enable OpenTelemetry instrumentation
- `OTEL_SERVICE_NAME`: Service name for traces
- `OTEL_EXPORTER_OTLP_ENDPOINT`: OTLP exporter endpoint
- `OTEL_EXPORTER_OTLP_HEADERS`: OTLP exporter headers (JSON)

### New Relic Configuration
- `NEW_RELIC_ENABLED`: Enable New Relic integration
- `NEW_RELIC_LICENSE_KEY`: New Relic license key
- `NEW_RELIC_API_KEY`: New Relic API key
- `NEW_RELIC_ACCOUNT_ID`: New Relic account ID
- `NEW_RELIC_REGION`: Region (US or EU)
- `NEW_RELIC_APP_NAME`: Application name
- `NEW_RELIC_ENTITY_GUID`: Entity GUID for correlation

## Testing

Run tests with logging enabled:
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests only
npm test test/integration/logging-telemetry.test.ts
```

## Performance Impact

The logging and telemetry implementation has minimal performance impact:
- Async log processing doesn't block main execution
- Batch processing reduces network overhead
- Conditional logging based on environment
- Efficient span creation with resource pooling
- Test environment optimizations

## Next Steps

1. **Production Configuration**
   - Configure OTLP endpoint for production
   - Set up New Relic APM agent
   - Configure log retention policies

2. **Monitoring Dashboard**
   - Create New Relic dashboards for metrics
   - Set up alerts for errors and performance
   - Configure distributed tracing views

3. **Additional Instrumentation**
   - Add custom metrics for business logic
   - Implement request/response logging middleware
   - Add database query instrumentation

4. **Performance Optimization**
   - Implement log sampling for high-volume operations
   - Configure span sampling rates
   - Optimize batch sizes for log forwarding

## Troubleshooting

### Logs Not Appearing in New Relic
1. Check `NEW_RELIC_ENABLED` is set to `true`
2. Verify `NEW_RELIC_LICENSE_KEY` is valid
3. Check network connectivity to New Relic endpoints
4. Review batch size and flush interval settings

### OpenTelemetry Spans Not Exported
1. Verify `OTEL_ENABLED` is set to `true`
2. Check `OTEL_EXPORTER_OTLP_ENDPOINT` is correct
3. Review authentication headers if required
4. Check for network/firewall issues

### High Memory Usage
1. Reduce log buffer size
2. Decrease batch processing interval
3. Implement log rotation for file transports
4. Configure appropriate log levels

## Conclusion

The logging and telemetry implementation provides comprehensive observability for the New Relic MCP server. With structured logging, distributed tracing, and New Relic integration, the system is well-equipped for production monitoring and debugging.