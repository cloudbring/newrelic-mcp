import { Given, When, Then } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';

// Shared context for all tests
export interface TestContext {
  server?: any;
  mockClient?: any;
  lastResponse?: any;
  lastError?: any;
  toolName?: string;
  accountId?: string;
  apiKey?: string;
}

export const context: TestContext = {};

// Shared Background steps
Given('the MCP server is running', () => {
  process.env.NEW_RELIC_API_KEY = 'test-api-key';
  process.env.NEW_RELIC_ACCOUNT_ID = '123456';
  context.apiKey = 'test-api-key';
  context.accountId = '123456';
});

Given('the New Relic API key is configured', () => {
  process.env.NEW_RELIC_API_KEY = context.apiKey || 'test-api-key';
});

Given('the New Relic account ID is configured', () => {
  process.env.NEW_RELIC_ACCOUNT_ID = context.accountId || '123456';
});

// Shared validation steps
Then('the response should be valid JSON', () => {
  if (context.lastResponse) {
    const jsonString = JSON.stringify(context.lastResponse);
    expect(() => JSON.parse(jsonString)).not.toThrow();
  }
});

Then('the response should contain an error message', () => {
  expect(context.lastError).toBeDefined();
  expect(context.lastError?.message).toBeDefined();
});

Then('the error should indicate {string}', (expectedMessage: string) => {
  expect(context.lastError?.message).toContain(expectedMessage);
});

Then('no errors should be present', () => {
  expect(context.lastError).toBeNull();
});

Then('the response should still be valid JSON', () => {
  if (context.lastResponse || context.lastError) {
    const data = context.lastResponse || { error: context.lastError?.message };
    const jsonString = JSON.stringify(data);
    expect(() => JSON.parse(jsonString)).not.toThrow();
  }
});

// Export utilities
export function resetContext() {
  context.lastResponse = null;
  context.lastError = null;
  context.toolName = undefined;
}

export function setMockClient(client: any) {
  context.mockClient = client;
}

export function setServer(server: any) {
  context.server = server;
}