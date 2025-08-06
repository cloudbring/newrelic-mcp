import { beforeAll, afterAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';

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