/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { z } from 'zod';

export const RestClientOptions = z.object({
  apiKey: z.string().min(1),
  region: z.enum(['US', 'EU']).default('US'),
});
export type RestClientOptions = z.infer<typeof RestClientOptions>;

export type Region = 'US' | 'EU';

function baseUrlForRegion(region: Region): string {
  return region === 'EU' ? 'https://api.eu.newrelic.com/v2' : 'https://api.newrelic.com/v2';
}

function serializeQuery(params: Record<string, unknown> | undefined): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      // arrays as repeated params: names[]=a&names[]=b
      value.forEach((v) => query.append(`${key}[]`, String(v)));
    } else {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

function parseLinkHeader(linkHeader: string | null): Record<string, string> {
  if (!linkHeader) return {};
  const parts = linkHeader.split(',');
  const links: Record<string, string> = {};
  for (const part of parts) {
    const section = part.split(';');
    if (section.length < 2) continue;
    const url = section[0].trim().replace(/^<|>$/g, '');
    const relMatch = section[1].match(/rel="(.*)"/);
    const rel = relMatch?.[1];
    if (rel) {
      links[rel] = url;
    }
  }
  return links;
}

export interface RestResponse<T> {
  status: number;
  data: T;
  links?: Record<string, string>;
  url: string;
}

export class NewRelicRestClient {
  private readonly apiKey: string;
  private readonly region: Region;

  constructor(options: RestClientOptions) {
    const parsed = RestClientOptions.parse(options);
    this.apiKey = parsed.apiKey;
    this.region = parsed.region;
  }

  private buildUrl(path: string, query?: Record<string, unknown>): string {
    const base = baseUrlForRegion(this.region);
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const hasJson = normalizedPath.endsWith('.json');
    const qs = serializeQuery(query);
    return `${base}${hasJson ? normalizedPath : `${normalizedPath}.json`}${qs}`;
  }

  async get<T>(path: string, query?: Record<string, unknown>): Promise<RestResponse<T>> {
    const url = this.buildUrl(path, query);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
    });
    const links = parseLinkHeader(response.headers.get('link'));
    const data = (await response.json()) as T;
    if (!response.ok) {
      throw new Error(`REST API error: ${response.status} ${response.statusText}`);
    }
    return { status: response.status, data, links, url };
  }

  async post<T>(path: string, body: unknown): Promise<RestResponse<T>> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
      body: JSON.stringify(body),
    });
    const links = parseLinkHeader(response.headers.get('link'));
    const data = (await response.json()) as T;
    if (!response.ok) {
      throw new Error(`REST API error: ${response.status} ${response.statusText}`);
    }
    return { status: response.status, data, links, url };
  }

  async delete<T>(path: string): Promise<RestResponse<T>> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': this.apiKey,
      },
    });
    const links = parseLinkHeader(response.headers.get('link'));
    const data = (await response.json()) as T;
    if (!response.ok) {
      throw new Error(`REST API error: ${response.status} ${response.statusText}`);
    }
    return { status: response.status, data, links, url };
  }
}

export const __test__ = { serializeQuery, parseLinkHeader, baseUrlForRegion };
