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
});
