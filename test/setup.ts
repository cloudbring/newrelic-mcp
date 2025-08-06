import { beforeAll, afterAll, beforeEach } from 'vitest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

beforeAll(() => {
  console.log('Starting test suite for New Relic MCP Server');
});

beforeEach(() => {
  // Reset any mocks or state before each test
});

afterAll(() => {
  console.log('Test suite completed');
});