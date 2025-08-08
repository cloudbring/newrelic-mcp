import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('../../../src/client/rest-client', () => ({
  NewRelicRestClient: vi.fn().mockImplementation(() => ({ get })),
}));

import { RestMetricsTool } from '../../../src/tools/rest/metrics';

describe('REST Metrics Tool', () => {
  beforeEach(() => {
    get.mockReset();
    process.env.NEW_RELIC_API_KEY = 'test-key';
  });

  it('listMetricNames: supports name filter and pagination', async () => {
    get
      .mockResolvedValueOnce({
        status: 200,
        data: [{ metric: 'CPU' }],
        links: { next: 'https://api.newrelic.com/v2/x?page=2' },
      })
      .mockResolvedValueOnce({ status: 200, data: [{ metric: 'Memory' }], links: {} });
    const tool = new RestMetricsTool();
    const out = await tool.listMetricNames({
      application_id: 1,
      host_id: 2,
      name: 'CPU',
      auto_paginate: true,
    });
    expect((out as any).items).toHaveLength(2);
  });

  it('getMetricData: serializes arrays and paginates', async () => {
    get
      .mockResolvedValueOnce({
        status: 200,
        data: [{ timeslices: [] }],
        links: { next: 'https://api.newrelic.com/v2/x?page=2' },
      })
      .mockResolvedValueOnce({ status: 200, data: [{ timeslices: [] }], links: {} });
    const tool = new RestMetricsTool();
    const out = await tool.getMetricData({
      application_id: 1,
      host_id: 2,
      names: ['CPU'],
      values: ['value'],
      auto_paginate: true,
    });
    expect(get).toHaveBeenCalled();
    expect((out as any).items).toHaveLength(2);
  });

  it('listApplicationHosts: maps filter params', async () => {
    get.mockResolvedValue({ status: 200, data: [{ host: 'h' }], links: {} });
    const tool = new RestMetricsTool();
    const out = await tool.listApplicationHosts({
      application_id: 1,
      filter_hostname: 'web',
      filter_ids: '1,2',
    });
    expect((out as any).status).toBe(200);
  });
});
