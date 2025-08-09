import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock REST client used by REST tools
const post = vi.fn();
const get = vi.fn();
const del = vi.fn();
vi.mock('../../../src/client/rest-client', () => ({
  NewRelicRestClient: vi.fn().mockImplementation(() => ({ post, get, delete: del })),
}));

import { RestDeploymentsTool } from '../../../src/tools/rest/deployments';

describe('REST Deployments Tool', () => {
  beforeEach(() => {
    post.mockReset();
    get.mockReset();
    del.mockReset();
    process.env.NEW_RELIC_API_KEY = 'test-key';
  });

  it('create: posts payload with revision and optional fields', async () => {
    post.mockResolvedValue({ status: 200, data: { deployment: {} }, url: 'u' });
    const tool = new RestDeploymentsTool();
    const res = await tool.create({
      application_id: 123,
      revision: 'abc123',
      changelog: 'notes',
      description: 'desc',
      user: 'me',
    });
    expect(post).toHaveBeenCalledWith('/applications/123/deployments', {
      deployment: { revision: 'abc123', changelog: 'notes', description: 'desc', user: 'me' },
    });
    expect((res as any).status).toBe(200);
  });

  it('list: sends page and follows Link next when auto_paginate', async () => {
    get
      .mockResolvedValueOnce({
        status: 200,
        data: [{ id: 1 }],
        links: { next: 'https://api.newrelic.com/v2/applications/1/deployments.json?page=2' },
      })
      .mockResolvedValueOnce({ status: 200, data: [{ id: 2 }], links: {} });
    const tool = new RestDeploymentsTool();
    const out = await tool.list({ application_id: 1, auto_paginate: true });
    expect(get).toHaveBeenCalledWith('/applications/1/deployments', undefined);
    expect((out as any).items).toHaveLength(2);
  });

  it('delete: requires confirm and calls delete', async () => {
    del.mockResolvedValue({ status: 200, data: { ok: true }, url: 'u' });
    const tool = new RestDeploymentsTool();
    const out = await tool.delete({ application_id: 1, id: 2, confirm: true });
    expect(del).toHaveBeenCalledWith('/applications/1/deployments/2');
    expect((out as any).status).toBe(200);
  });
});
