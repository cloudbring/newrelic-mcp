import { Given, Then, When } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import type { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicMCPServer } from '../../../src/server';

let server: NewRelicMCPServer;
let mockClient: NewRelicClient;
let lastResponse: any;
let lastError: any;

Given('the MCP server is running', () => {
  mockClient = {
    validateCredentials: vi.fn().mockResolvedValue(true),
    getAccountDetails: vi.fn().mockResolvedValue({ accountId: '123456', name: 'Test Account' }),
    runNrqlQuery: vi.fn(),
    listApmApplications: vi.fn(),
    executeNerdGraphQuery: vi.fn(),
  } as any;

  process.env.NEW_RELIC_API_KEY = 'test-api-key';
  process.env.NEW_RELIC_ACCOUNT_ID = '123456';

  server = new NewRelicMCPServer(mockClient);
});

Given('the New Relic API key is configured', () => {
  process.env.NEW_RELIC_API_KEY = 'test-api-key';
});

Given('the New Relic account ID is configured', () => {
  process.env.NEW_RELIC_ACCOUNT_ID = '123456';
});

Given('no account ID is configured globally', () => {
  delete process.env.NEW_RELIC_ACCOUNT_ID;
});

Given('no account ID is provided as parameter', () => {
  // This is handled in the When step
});

When('I call the {string} tool', async (toolName: string) => {
  try {
    lastResponse = await server.executeTool(toolName, {});
    lastError = null;
  } catch (error) {
    lastError = error;
    lastResponse = null;
  }
});

When('I call the {string} tool with the query', async (toolName: string) => {
  try {
    lastResponse = await server.executeTool(toolName, {
      nrql: 'SELECT count(*) FROM Transaction TIMESERIES',
      target_account_id: '123456',
    });
    lastError = null;
  } catch (error) {
    lastError = error;
    lastResponse = null;
  }
});

When('I call the {string} tool with a target account ID', async (toolName: string) => {
  try {
    lastResponse = await server.executeTool(toolName, {
      target_account_id: '789012',
    });
    lastError = null;
  } catch (error) {
    lastError = error;
    lastResponse = null;
  }
});

Then('the response should contain an error message', () => {
  expect(lastError).toBeDefined();
  expect(lastError.message).toBeDefined();
});

Then('the error should indicate {string}', (expectedMessage: string) => {
  expect(lastError.message).toContain(expectedMessage);
});

Then('the response should contain query results', () => {
  expect(lastResponse).toBeDefined();
  expect(lastResponse.results).toBeDefined();
});

Then('the response should include metadata', () => {
  expect(lastResponse.metadata).toBeDefined();
});

Then('the response should be valid JSON', () => {
  const jsonString = JSON.stringify(lastResponse);
  expect(() => JSON.parse(jsonString)).not.toThrow();
});

Then('no errors should be present', () => {
  expect(lastError).toBeNull();
});

Then('the response should contain a list of APM applications', () => {
  expect(lastResponse).toBeDefined();
  expect(Array.isArray(lastResponse)).toBe(true);
});

Then('each application should have a GUID', () => {
  lastResponse.forEach((app: any) => {
    expect(app.guid).toBeDefined();
  });
});

Then('each application should have a name', () => {
  lastResponse.forEach((app: any) => {
    expect(app.name).toBeDefined();
  });
});

Then('each application should have a language', () => {
  lastResponse.forEach((app: any) => {
    expect(app.language).toBeDefined();
  });
});

export { server, mockClient, lastResponse, lastError };
