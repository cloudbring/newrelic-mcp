import type { Mock } from 'vitest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthProvider } from '../../../src/client/auth';
import { NewRelicClient } from '../../../src/client/newrelic-client';
import { NewRelicRestClient } from '../../../src/client/rest-client';

const originalFetch = global.fetch;
beforeAll(() => {
  // @ts-expect-error override in tests
  global.fetch = vi.fn();
});
afterAll(() => {
  global.fetch = originalFetch;
});

const makeAuth = (mode: AuthProvider['mode'] = 'system-identity') => {
  const auth = {
    mode,
    getHeaders: vi.fn(async () => ({ Authorization: 'Bearer t' })),
    invalidate: vi.fn(),
  };
  return auth;
};

describe('NewRelicClient with an AuthProvider', () => {
  beforeEach(() => (global.fetch as Mock).mockReset());

  it('sends the provider headers', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });
    await new NewRelicClient(makeAuth()).executeNerdGraphQuery('{ actor { id } }');
    const init = (global.fetch as Mock).mock.calls[0][1];
    expect(init.headers.Authorization).toBe('Bearer t');
    expect(init.headers['API-Key']).toBeUndefined();
  });

  it('invalidates and retries once on 401 in system identity mode', async () => {
    const auth = makeAuth();
    (global.fetch as Mock)
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: {} }) });
    await new NewRelicClient(auth).executeNerdGraphQuery('{ x }');
    expect(auth.invalidate).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('gives up after one retry', async () => {
    (global.fetch as Mock).mockResolvedValue({ ok: false, status: 401 });
    await expect(new NewRelicClient(makeAuth()).executeNerdGraphQuery('{ x }')).rejects.toThrow(
      'system identity token rejected'
    );
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('does not retry on 401 with an API key', async () => {
    (global.fetch as Mock).mockResolvedValue({ ok: false, status: 401 });
    await expect(new NewRelicClient('k').executeNerdGraphQuery('{ x }')).rejects.toThrow(
      'Invalid API key'
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('validates with actor.accounts in system identity mode', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { actor: { accounts: [{ id: 1 }] } } }),
    });
    const client = new NewRelicClient(makeAuth());
    expect(await client.validateCredentials()).toBe(true);
    expect((global.fetch as Mock).mock.calls[0][1].body).toContain('accounts');

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: 'nope' }] }),
    });
    expect(await client.validateCredentials()).toBe(false);
  });

  it('reports missing credentials in none mode', async () => {
    await expect(
      new NewRelicClient(makeAuth('none')).executeNerdGraphQuery('{ x }')
    ).rejects.toThrow('NEW_RELIC_API_KEY environment variable is not set');
  });
});

describe('NewRelicRestClient with an AuthProvider', () => {
  it('uses provider headers instead of Api-Key', async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({}),
    });
    const auth = makeAuth('api-key');
    auth.getHeaders.mockResolvedValue({ 'API-Key': 'from-provider' } as never);
    await new NewRelicRestClient({ auth }).get('/applications');
    const init = (global.fetch as Mock).mock.calls.at(-1)?.[1];
    expect(init.headers['API-Key']).toBe('from-provider');
    expect(init.headers['Api-Key']).toBeUndefined();
  });
});
