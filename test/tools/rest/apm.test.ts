import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('../../../src/client/rest-client', () => ({
  NewRelicRestClient: vi.fn().mockImplementation(() => ({ get })),
}));

import { RestApmTool } from '../../../src/tools/rest/apm';

describe('REST APM Tool', () => {
  beforeEach(() => {
    get.mockReset();
    process.env.NEW_RELIC_API_KEY = 'test-key';
  });

  it('listApplications: maps filters and paginates', async () => {
    get
      .mockResolvedValueOnce({
        status: 200,
        data: [{ id: 1 }],
        links: { next: 'https://api.newrelic.com/v2/applications.json?page=2' },
      })
      .mockResolvedValueOnce({ status: 200, data: [{ id: 2 }], links: {} });
    const tool = new RestApmTool();
    const out = await tool.listApplications({
      filter_name: 'web',
      filter_ids: [1, 2],
      auto_paginate: true,
    });
    expect(get).toHaveBeenCalled();
    expect((out as any).items).toHaveLength(2);
  });

  it('listApplications: no auto_paginate, maps host/language and page', async () => {
    get.mockResolvedValueOnce({ status: 200, data: [{ id: 3 }], links: { next: 'ignored' } });
    const tool = new RestApmTool();
    const out = await tool.listApplications({
      filter_host: 'host1',
      filter_language: 'java',
      page: 5,
      auto_paginate: false,
    });
    expect((out as any).items).toBeDefined();
    // Verify query keys used
    const call = get.mock.calls[0];
    expect(call[0]).toContain('/applications');
    const query = call[1] as Record<string, unknown>;
    expect(query['filter[host]']).toBe('host1');
    expect(query['filter[language]']).toBe('java');
    expect(query.page).toBe(5);
  });

  it('listApplications: empty filter_ids is ignored', async () => {
    get.mockResolvedValueOnce({ status: 200, data: [], links: {} });
    const tool = new RestApmTool();
    await tool.listApplications({ filter_ids: [], auto_paginate: false });
    const query = get.mock.calls[0][1] as Record<string, unknown>;
    expect(query['filter[ids]']).toBeUndefined();
  });
});
