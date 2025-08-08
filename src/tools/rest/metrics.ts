import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicRestClient, type Region } from '../../client/rest-client';

type ListMetricNamesArgs = {
  application_id: number;
  host_id: number;
  name?: string;
  page?: number;
  auto_paginate?: boolean;
  region?: Region;
};

type GetMetricDataArgs = {
  application_id: number;
  host_id: number;
  names: string[];
  values?: string[];
  from?: string;
  to?: string;
  period?: number;
  summarize?: boolean;
  page?: number;
  auto_paginate?: boolean;
  region?: Region;
};

type ListHostsArgs = {
  application_id: number;
  filter_hostname?: string;
  filter_ids?: string; // comma-separated
  page?: number;
  auto_paginate?: boolean;
  region?: Region;
};

export class RestMetricsTool {
  private restFor(region?: Region): NewRelicRestClient {
    const apiKey = process.env.NEW_RELIC_API_KEY as string;
    return new NewRelicRestClient({ apiKey, region: region ?? 'US' });
  }

  getListMetricNamesTool(): Tool {
    return {
      name: 'list_metric_names_for_host',
      description: 'List metric names and values for a specific application host (REST v2).',
      inputSchema: {
        type: 'object',
        properties: {
          application_id: { type: 'number' },
          host_id: { type: 'number' },
          name: { type: 'string' },
          page: { type: 'number' },
          auto_paginate: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
        required: ['application_id', 'host_id'],
      },
    };
  }

  async listMetricNames(args: ListMetricNamesArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = `/applications/${args.application_id}/hosts/${args.host_id}/metrics`;
    const query: Record<string, unknown> = {};
    if (args.name) query.name = args.name;
    if (args.page) query.page = args.page;
    const results: unknown[] = [];
    let nextUrl: string | undefined;
    let page = args.page;
    do {
      const res = await client.get<unknown>(path, page ? { ...query, page } : query);
      results.push(res.data);
      const next = res.links?.next;
      if (args.auto_paginate && next) {
        const u = new URL(next);
        const p = u.searchParams.get('page');
        page = p ? Number(p) : undefined;
        nextUrl = next;
      } else {
        nextUrl = undefined;
      }
    } while (args.auto_paginate && nextUrl);
    return { items: args.auto_paginate ? results : results[0], page };
  }

  getMetricDataTool(): Tool {
    return {
      name: 'get_metric_data_for_host',
      description: 'Get metric timeslices for metrics on a host (REST v2).',
      inputSchema: {
        type: 'object',
        properties: {
          application_id: { type: 'number' },
          host_id: { type: 'number' },
          names: { type: 'array', items: { type: 'string' } },
          values: { type: 'array', items: { type: 'string' } },
          from: { type: 'string' },
          to: { type: 'string' },
          period: { type: 'number' },
          summarize: { type: 'boolean' },
          page: { type: 'number' },
          auto_paginate: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
        required: ['application_id', 'host_id', 'names'],
      },
    };
  }

  async getMetricData(args: GetMetricDataArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = `/applications/${args.application_id}/hosts/${args.host_id}/metrics/data`;
    const query: Record<string, unknown> = { names: args.names, values: args.values };
    if (args.from) query.from = args.from;
    if (args.to) query.to = args.to;
    if (args.period) query.period = args.period;
    if (args.summarize !== undefined) query.summarize = args.summarize;
    if (args.page) query.page = args.page;

    const results: unknown[] = [];
    let nextUrl: string | undefined;
    let page = args.page;
    do {
      const res = await client.get<unknown>(path, page ? { ...query, page } : query);
      results.push(res.data);
      const next = res.links?.next;
      if (args.auto_paginate && next) {
        const u = new URL(next);
        const p = u.searchParams.get('page');
        page = p ? Number(p) : undefined;
        nextUrl = next;
      } else {
        nextUrl = undefined;
      }
    } while (args.auto_paginate && nextUrl);
    return { items: args.auto_paginate ? results : results[0], page };
  }

  getListApplicationHostsTool(): Tool {
    return {
      name: 'list_application_hosts',
      description: 'List hosts for an APM application (REST v2).',
      inputSchema: {
        type: 'object',
        properties: {
          application_id: { type: 'number' },
          filter_hostname: { type: 'string' },
          filter_ids: { type: 'string' },
          page: { type: 'number' },
          auto_paginate: { type: 'boolean' },
          region: { type: 'string', enum: ['US', 'EU'] },
        },
        required: ['application_id'],
      },
    };
  }

  async listApplicationHosts(args: ListHostsArgs): Promise<unknown> {
    const client = this.restFor(args.region);
    const path = `/applications/${args.application_id}/hosts`;
    const query: Record<string, unknown> = {};
    if (args.filter_hostname) query['filter[hostname]'] = args.filter_hostname;
    if (args.filter_ids) query['filter[ids]'] = args.filter_ids;
    if (args.page) query.page = args.page;
    const res = await client.get<unknown>(path, query);
    return res;
  }
}
