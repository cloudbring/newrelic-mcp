import dotenv from 'dotenv';
import { afterAll, beforeAll, beforeEach } from 'vitest';

// Load .env.test which contains real New Relic credentials for test telemetry
// This allows us to monitor test execution in New Relic
dotenv.config({ path: '.env.test' });

beforeAll(() => {
  console.log('Starting test suite for New Relic MCP Server');
});

beforeEach(() => {
  // Reset any mocks or state before each test
});

afterAll(() => {
  console.log('Test suite completed');
});
