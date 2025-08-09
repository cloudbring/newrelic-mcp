import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NerdGraphTool } from '../../src/tools/nerdgraph';

describe('NerdGraph Tool', () => {
  const client = { executeNerdGraphQuery: vi.fn() } as any;
  let tool: NerdGraphTool;

  beforeEach(() => {
    vi.resetAllMocks();
    tool = new NerdGraphTool(client);
  });

  it('getQueryTool: has correct name and schema', () => {
    const def = tool.getQueryTool();
    expect(def.name).toBe('run_nerdgraph_query');
    expect(def.inputSchema).toHaveProperty('properties.query');
    expect((def.inputSchema as any).required).toContain('query');
  });

  it('execute: calls client with query and variables', async () => {
    const mockResult = { data: { actor: { user: { id: 1 } } } };
    client.executeNerdGraphQuery = vi.fn().mockResolvedValue(mockResult);
    const res = await tool.execute({
      query: '{ actor { user { id } } }',
      variables: { limit: 10 },
    });
    expect(client.executeNerdGraphQuery).toHaveBeenCalledWith('{ actor { user { id } } }', {
      limit: 10,
    });
    expect(res).toBe(mockResult);
  });

  it('execute: throws for empty query', async () => {
    await expect(tool.execute({ query: '' })).rejects.toThrow();
  });
});
