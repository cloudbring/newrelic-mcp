import { describe, expect, it } from 'vitest';
import { NewRelicRestClient } from '../../src/client/rest-client';

// Integration tests require real API keys. Each suite is skipped if
// its corresponding env var is not present.
// US: NEW_RELIC_API_KEY or NEW_RELIC_API_KEY_US
// EU: NEW_RELIC_API_KEY_EU (EU-region account key required)

const usKey = process.env.NEW_RELIC_API_KEY || process.env.NEW_RELIC_API_KEY_US;
const euKey = process.env.NEW_RELIC_API_KEY_EU;

const describeUS = usKey ? describe : describe.skip;
const describeEU = euKey ? describe : describe.skip;

describeUS('REST v2 integration (US region)', () => {
  it('GET /applications returns 200', async () => {
    const client = new NewRelicRestClient({ apiKey: usKey as string, region: 'US' });
    const res = await client.get<Record<string, unknown>>('/applications');
    expect(res.status).toBe(200);
    expect(typeof res.data).toBe('object');
  });
});

describeEU('REST v2 integration (EU region)', () => {
  it('GET /applications returns 200', async () => {
    const client = new NewRelicRestClient({ apiKey: euKey as string, region: 'EU' });
    const res = await client.get<Record<string, unknown>>('/applications');
    expect(res.status).toBe(200);
    expect(typeof res.data).toBe('object');
  });
});
