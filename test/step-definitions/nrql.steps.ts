import { Given, Then, When } from '@amiceli/vitest-cucumber';
import { expect, vi } from 'vitest';
import { context, resetContext } from './shared.steps';

let nrqlQuery: string = '';
let queryAccountId: string = '';

Given('I have a valid NRQL query {string}', (query: string) => {
  nrqlQuery = query;
});

Given('I have a valid NRQL query', () => {
  nrqlQuery = 'SELECT count(*) FROM Transaction';
});

Given('I specify a target account ID', () => {
  queryAccountId = '789012';
});

Given('no account ID is configured globally', () => {
  delete process.env.NEW_RELIC_ACCOUNT_ID;
  context.accountId = undefined;
});

Given('no account ID is provided as parameter', () => {
  queryAccountId = '';
});

Given('I provide an invalid or empty NRQL query', () => {
  nrqlQuery = '';
});

Given('I provide a NRQL query with syntax errors', () => {
  nrqlQuery = 'SELEKT count(*) FROM Transaction'; // Intentional typo
});

Given('I have a complex NRQL query with aggregations and filters', () => {
  nrqlQuery =
    'SELECT average(duration) FROM Transaction WHERE appName = "MyApp" FACET host SINCE 1 hour ago';
});

Given('I have a NRQL query with TIMESERIES clause', () => {
  nrqlQuery = 'SELECT count(*) FROM Transaction TIMESERIES 5 minutes';
});

Given('I have a NRQL query that includes FACET', () => {
  nrqlQuery = 'SELECT count(*) FROM Transaction FACET appName';
});

Given('I have a NRQL query that references specific event types', () => {
  nrqlQuery = 'SELECT count(*) FROM Transaction, PageView WHERE duration > 1';
});

When('I call the {string} tool with the query', async (toolName: string) => {
  resetContext();
  context.toolName = toolName;

  if (!context.server) {
    const { NewRelicMCPServer } = await import('../../src/server');
    const { NewRelicClient } = await import('../../src/client/newrelic-client');

    context.mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      runNrqlQuery: vi.fn().mockResolvedValue({
        results: [{ count: 100 }],
        metadata: {
          eventTypes: ['Transaction'],
          timeWindow: { begin: 1234567890, end: 1234567900 },
        },
      }),
      executeNerdGraphQuery: vi.fn().mockResolvedValue({ data: {} }),
    } as any;

    context.server = new NewRelicMCPServer(context.mockClient);
  }

  try {
    context.lastResponse = await context.server.executeTool(toolName, {
      nrql: nrqlQuery,
      target_account_id: queryAccountId || context.accountId || '123456',
    });
    context.lastError = null;
  } catch (error: any) {
    context.lastError = error;
    context.lastResponse = null;
  }
});

When('I call the {string} tool with the query and account ID', async (toolName: string) => {
  await When(`I call the "${toolName}" tool with the query`);
});

When('I call the {string} tool with the complex query', async (toolName: string) => {
  await When(`I call the "${toolName}" tool with the query`);
});

When('I call the {string} tool', async (toolName: string) => {
  resetContext();
  context.toolName = toolName;

  try {
    const params: any = {};
    if (nrqlQuery) params.nrql = nrqlQuery;
    if (queryAccountId) params.target_account_id = queryAccountId;

    context.lastResponse = await context.server?.executeTool(toolName, params);
    context.lastError = null;
  } catch (error: any) {
    context.lastError = error;
    context.lastResponse = null;
  }
});

Then('the response should contain query results', () => {
  expect(context.lastResponse).toBeDefined();
  expect(context.lastResponse?.results).toBeDefined();
  expect(Array.isArray(context.lastResponse?.results)).toBe(true);
});

Then('the response should include metadata', () => {
  expect(context.lastResponse?.metadata).toBeDefined();
});

Then('the response should contain data from the specified account', () => {
  expect(context.mockClient?.runNrqlQuery).toHaveBeenCalledWith(
    expect.objectContaining({ accountId: queryAccountId })
  );
});

Then('the query should be executed against the correct account', () => {
  expect(context.mockClient?.runNrqlQuery).toHaveBeenCalledWith(
    expect.objectContaining({ accountId: expect.any(String) })
  );
});

Then('the response should contain aggregated results', () => {
  expect(context.lastResponse?.results).toBeDefined();
  expect(Array.isArray(context.lastResponse?.results)).toBe(true);
});

Then('the response should include facets if applicable', () => {
  if (nrqlQuery.includes('FACET')) {
    expect(context.lastResponse?.metadata?.facets).toBeDefined();
  }
});

Then('the response should include time window information', () => {
  expect(context.lastResponse?.metadata?.timeWindow).toBeDefined();
});

Then('the response should contain GraphQL errors', () => {
  expect(context.lastError).toBeDefined();
  expect(context.lastError?.message).toContain('error');
});

Then('the errors should indicate the NRQL syntax issue', () => {
  expect(context.lastError?.message.toLowerCase()).toMatch(/syntax|invalid|error/);
});

Then('the response should include time window metadata', () => {
  expect(context.lastResponse?.metadata?.timeWindow).toBeDefined();
  expect(context.lastResponse?.metadata?.timeWindow?.begin).toBeDefined();
  expect(context.lastResponse?.metadata?.timeWindow?.end).toBeDefined();
});

Then('the results should be properly time-bucketed', () => {
  if (nrqlQuery.includes('TIMESERIES')) {
    expect(context.lastResponse?.metadata?.timeSeries).toBe(true);
  }
});

Then('the metadata should include begin and end times', () => {
  expect(context.lastResponse?.metadata?.timeWindow?.begin).toBeDefined();
  expect(context.lastResponse?.metadata?.timeWindow?.end).toBeDefined();
});

Then('the response should include facets metadata', () => {
  expect(context.lastResponse?.metadata?.facets).toBeDefined();
});

Then('the results should be properly faceted', () => {
  expect(context.lastResponse?.results).toBeDefined();
  if (context.lastResponse?.results?.length > 0) {
    expect(context.lastResponse.results[0]).toHaveProperty('facet');
  }
});

Then('the metadata should indicate available facets', () => {
  expect(context.lastResponse?.metadata?.facets).toBeDefined();
  expect(Array.isArray(context.lastResponse?.metadata?.facets)).toBe(true);
});

Then('the response should include eventTypes metadata', () => {
  expect(context.lastResponse?.metadata?.eventTypes).toBeDefined();
});

Then('the metadata should list the event types used', () => {
  expect(context.lastResponse?.metadata?.eventTypes).toBeDefined();
  expect(Array.isArray(context.lastResponse?.metadata?.eventTypes)).toBe(true);
});
