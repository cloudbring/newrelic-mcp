import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewRelicRestClient } from '../../../src/client/rest-client';

describe('NewRelicRestClient requests', () => {
  const apiKey = 'test-api-key';
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('get: returns data and parses Link header', async () => {
    const client = new NewRelicRestClient({ apiKey, region: 'US' });
    const mockJson = { hello: 'world' };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: (key: string) =>
          key.toLowerCase() === 'link'
            ? '<https://api.newrelic.com/v2/x?page=2>; rel="next"'
            : null,
      },
      json: async () => mockJson,
    });
    // @ts-expect-error: assign to global in tests
    global.fetch = mockFetch;

    const res = await client.get<any>('/applications', { page: 1 });
    expect(res.status).toBe(200);
    expect(res.data).toEqual(mockJson);
    expect(res.links?.next).toContain('page=2');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/applications.json?page=1'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ 'Api-Key': apiKey }),
      })
    );
  });

  it('post: sends body and returns json', async () => {
    const client = new NewRelicRestClient({ apiKey, region: 'EU' });
    const mockJson = { id: 123 };
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: 'Created',
      headers: { get: () => null },
      json: async () => mockJson,
    });
    // @ts-expect-error: assign to global in tests
    global.fetch = mockFetch;

    const payload = { deployment: { revision: 'abc' } };
    const res = await client.post<any>('/applications/1/deployments', payload);
    expect(res.status).toBe(201);
    expect(res.data).toEqual(mockJson);
    expect(res.url).toContain('https://api.eu.newrelic.com/v2/applications/1/deployments.json');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload),
      })
    );
  });

  it('delete: throws on non-2xx', async () => {
    const client = new NewRelicRestClient({ apiKey, region: 'US' });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: { get: () => null },
      json: async () => ({ message: 'not found' }),
    });
    // @ts-expect-error: assign to global in tests
    global.fetch = mockFetch;

    await expect(client.delete('/applications/1/deployments/2')).rejects.toThrow(
      'REST API error: 404 Not Found'
    );
  });
});
