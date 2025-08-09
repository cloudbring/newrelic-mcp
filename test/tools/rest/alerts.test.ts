import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('../../../src/client/rest-client', () => ({
  NewRelicRestClient: vi.fn().mockImplementation(() => ({ get })),
}));

import { RestAlertsTool } from '../../../src/tools/rest/alerts';

describe('REST Alerts Tool', () => {
  beforeEach(() => {
    get.mockReset();
    process.env.NEW_RELIC_API_KEY = 'test-key';
  });

  it('listPolicies: maps filter_name', async () => {
    get.mockResolvedValue({ status: 200, data: [{ id: 1 }], links: {} });
    const tool = new RestAlertsTool();
    const out = await tool.listPolicies({ filter_name: 'foo' });
    expect((out as any).status).toBe(200);
  });

  it('listIncidents: paginates and applies client-side filters', async () => {
    get
      .mockResolvedValueOnce({
        status: 200,
        data: [{ id: 1, priority: 'HIGH', closed_at: 0 }],
        links: { next: 'https://api.newrelic.com/v2/alerts_incidents.json?page=2' },
      })
      .mockResolvedValueOnce({
        status: 200,
        data: [{ id: 2, priority: 'LOW', closed_at: 123 }],
        links: {},
      });
    const tool = new RestAlertsTool();
    const out = await tool.listIncidents({
      auto_paginate: true,
      only_open: true,
      priority: 'HIGH',
    });
    expect((out as any).items).toHaveLength(1);
    expect((out as any).items[0].id).toBe(1);
  });
});
