import { describe, expect, it } from 'vitest';
import { NewRelicMCPServer } from '../../src/server';

// Only run when explicitly enabled and credentials are present
const shouldRun =
  process.env.USE_REAL_ENV === 'true' &&
  typeof process.env.NEW_RELIC_API_KEY === 'string' &&
  process.env.NEW_RELIC_API_KEY.length > 0;

const runIf = shouldRun ? describe : describe.skip;

runIf('NerdGraph integration (real API)', () => {
  it('executes a simple NerdGraph query successfully', async () => {
    const server = new NewRelicMCPServer();

    const result = (await server.executeTool('run_nerdgraph_query', {
      query: '{ actor { user { id email } } }',
    })) as any;

    expect(result).toBeDefined();
    expect(result.data?.actor?.user?.id).toBeDefined();
    expect(result.data?.actor?.user?.email).toBeDefined();
  });

  it('queries account by ID with variables', async () => {
    const accountId = process.env.NEW_RELIC_ACCOUNT_ID;
    if (!accountId) {
      // If not provided, skip this specific test while allowing the suite to run the first test
      return;
    }

    const server = new NewRelicMCPServer();

    const query = `
      query($id: Int!) {
        actor {
          account(id: $id) {
            id
            name
          }
        }
      }
    `;

    const variables = { id: Number(accountId) };

    const result = (await server.executeTool('run_nerdgraph_query', {
      query,
      variables,
    })) as any;

    expect(result).toBeDefined();
    expect(result.data?.actor?.account?.id?.toString()).toBe(accountId);
    expect(result.data?.actor?.account?.name).toBeDefined();
  });
});
