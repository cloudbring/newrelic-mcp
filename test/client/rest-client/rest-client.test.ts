import { describe, expect, it } from 'vitest';
import { __test__, NewRelicRestClient } from '../../../src/client/rest-client';

describe('rest-client helpers', () => {
  it('baseUrlForRegion', () => {
    expect(__test__.baseUrlForRegion('US')).toContain('api.newrelic.com');
    expect(__test__.baseUrlForRegion('EU')).toContain('api.eu.newrelic.com');
  });

  it('serializeQuery arrays', () => {
    const qs = __test__.serializeQuery({ names: ['A', 'B'], single: 'x' });
    expect(qs).toContain('names%5B%5D=A');
    expect(qs).toContain('names%5B%5D=B');
    expect(qs).toContain('single=x');
  });

  it('parseLinkHeader', () => {
    const header =
      '<https://api.newrelic.com/v2/apps.json?page=2>; rel="next", <https://api.newrelic.com/v2/apps.json?page=10>; rel="last"';
    const links = __test__.parseLinkHeader(header);
    expect(links.next).toBeDefined();
    expect(links.last).toBeDefined();
  });
});

describe('NewRelicRestClient url building', () => {
  it('appends .json and query correctly', () => {
    const client = new NewRelicRestClient({ apiKey: 'k', region: 'US' });
    // @ts-expect-error private method access not allowed; build via public get
    const url = client['buildUrl']('/applications', { page: 2 });
    expect(url).toContain('/applications.json');
    expect(url).toContain('page=2');
  });
});
