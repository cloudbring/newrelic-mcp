import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicRestClient, type Region } from '../../client/rest-client';

type CreateDeploymentArgs = {
  application_id: number;
  revision: string;
  changelog?: string;
  description?: string;
  user?: string;
  region?: Region;
};

type ListDeploymentsArgs = {
  application_id: number;
  page?: number;
  auto_paginate?: boolean;
  region?: Region;
};

type DeleteDeploymentArgs = {
  application_id: number;
  id: number;
  confirm: true;
  region?: Region;
};

export class RestDeploymentsTool {
  private restFor(region?: Region): NewRelicRestClient {
    const apiKey = process.env.NEW_RELIC_API_KEY as string;
    return new NewRelicRestClient({ apiKey, region: region ?? 'US' });
  }

  getCreateTool(): Tool {
    return {
      name: 'create_deployment',
      description: 'Create a deployment marker for an APM application (REST v2).',
      inputSchema: {
        type: 'object',
        properties: {
          application_id: { type: 'number' },
          revision: { type: 'string' },
          changelog: { type: 'string' },
          description: { type: 'string' },
          user: { type: 'string' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
        required: ['application_id', 'revision'],
      },
    };
  }

  async create(args: CreateDeploymentArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = `/applications/${args.application_id}/deployments`;
    const payload = {
      deployment: {
        revision: args.revision,
        changelog: args.changelog,
        description: args.description,
        user: args.user,
      },
    };
    const res = await client.post<unknown>(path, payload);
    return { ...res };
  }

  getListTool(): Tool {
    return {
      name: 'list_deployments_rest',
      description: 'List deployments for an APM application (REST v2).',
      inputSchema: {
        type: 'object',
        properties: {
          application_id: { type: 'number' },
          page: { type: 'number' },
          auto_paginate: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
        required: ['application_id'],
      },
    };
  }

  async list(args: ListDeploymentsArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = `/applications/${args.application_id}/deployments`;
    const results: unknown[] = [];
    let page = args.page;
    let nextUrl: string | undefined;

    do {
      const res = await client.get<unknown>(path, page ? { page } : undefined);
      results.push(res.data);
      const next = res.links?.next;
      if (args.auto_paginate && next) {
        // Extract page from next URL if present
        const u = new URL(next);
        const p = u.searchParams.get('page');
        page = p ? Number(p) : undefined;
        nextUrl = next;
      } else {
        nextUrl = undefined;
      }
    } while (args.auto_paginate && nextUrl);

    return {
      items: args.auto_paginate ? results : results[0],
      page: page,
    };
  }

  getDeleteTool(): Tool {
    return {
      name: 'delete_deployment',
      description: 'Delete a deployment record (REST v2). Requires admin role permissions.',
      inputSchema: {
        type: 'object',
        properties: {
          application_id: { type: 'number' },
          id: { type: 'number' },
          confirm: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
        required: ['application_id', 'id', 'confirm'],
      },
    };
  }

  async delete(args: DeleteDeploymentArgs): Promise<unknown> {
    if (args.confirm !== true) {
      throw new Error('delete_deployment: confirm must be true');
    }
    const client = this.restFor(args.region);
    const path = `/applications/${args.application_id}/deployments/${args.id}`;
    const res = await client.delete<unknown>(path);
    return { ...res };
  }
}
