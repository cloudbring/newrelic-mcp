import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NewRelicClient } from '../../src/client/newrelic-client';

// Mocks for tool classes used inside server.executeTool
const nrqlExecute = vi.fn().mockResolvedValue({ rows: [] });
vi.mock('../../src/tools/nrql', () => ({
  NrqlTool: class {
    getToolDefinition() {
      return { name: 'run_nrql_query' };
    }
    execute = nrqlExecute;
  },
}));

const apmExecute = vi.fn().mockResolvedValue([{ id: 1 }]);
vi.mock('../../src/tools/apm', () => ({
  ApmTool: class {
    getListApplicationsTool() {
      return { name: 'list_apm_applications' };
    }
    execute = apmExecute;
  },
}));

const alertListPolicies = vi.fn().mockResolvedValue([]);
const alertListIncidents = vi.fn().mockResolvedValue([]);
const alertAck = vi.fn().mockResolvedValue({ acknowledged: true });
vi.mock('../../src/tools/alert', () => ({
  AlertTool: class {
    getPoliciesTool() {
      return { name: 'list_alert_policies' };
    }
    getIncidentsTool() {
      return { name: 'list_open_incidents' };
    }
    getAcknowledgeTool() {
      return { name: 'acknowledge_incident' };
    }
    listAlertPolicies = alertListPolicies;
    listOpenIncidents = alertListIncidents;
    acknowledgeIncident = alertAck;
  },
}));

const entitySearch = vi.fn().mockResolvedValue({ items: [] });
const entityDetails = vi.fn().mockResolvedValue({ guid: 'G' });
vi.mock('../../src/tools/entity', () => ({
  EntityTool: class {
    getSearchTool() {
      return { name: 'search_entities' };
    }
    getDetailsTool() {
      return { name: 'get_entity_details' };
    }
    searchEntities = entitySearch;
    getEntityDetails = entityDetails;
  },
}));

const synthList = vi.fn().mockResolvedValue([]);
const synthCreate = vi.fn().mockResolvedValue({ id: 'm1' });
vi.mock('../../src/tools/synthetics', () => ({
  SyntheticsTool: class {
    getListMonitorsTool() {
      return { name: 'list_synthetics_monitors' };
    }
    getCreateMonitorTool() {
      return { name: 'create_browser_monitor' };
    }
    listSyntheticsMonitors = synthList;
    createBrowserMonitor = synthCreate;
  },
}));

const nerdExecute = vi.fn().mockResolvedValue({ data: {} });
vi.mock('../../src/tools/nerdgraph', () => ({
  NerdGraphTool: class {
    getQueryTool() {
      return { name: 'run_nerdgraph_query' };
    }
    execute = nerdExecute;
  },
}));

const restCreate = vi.fn().mockResolvedValue({ id: 1 });
const restList = vi.fn().mockResolvedValue([{ id: 1 }]);
const restDelete = vi.fn().mockResolvedValue({ deleted: true });
vi.mock('../../src/tools/rest/deployments', () => ({
  RestDeploymentsTool: class {
    create = restCreate;
    list = restList;
    delete = restDelete;
    getCreateTool() {
      return { name: 'create_deployment' };
    }
    getListTool() {
      return { name: 'list_deployments_rest' };
    }
    getDeleteTool() {
      return { name: 'delete_deployment' };
    }
  },
}));

const restApmList = vi.fn().mockResolvedValue([]);
vi.mock('../../src/tools/rest/apm', () => ({
  RestApmTool: class {
    listApplications = restApmList;
    getListApplicationsTool() {
      return { name: 'list_apm_applications_rest' };
    }
  },
}));

const restMetricNames = vi.fn().mockResolvedValue([]);
const restMetricData = vi.fn().mockResolvedValue({});
const restAppHosts = vi.fn().mockResolvedValue([]);
vi.mock('../../src/tools/rest/metrics', () => ({
  RestMetricsTool: class {
    listMetricNames = restMetricNames;
    getMetricData = restMetricData;
    listApplicationHosts = restAppHosts;
    getListMetricNamesTool() {
      return { name: 'list_metric_names_for_host' };
    }
    getMetricDataTool() {
      return { name: 'get_metric_data_for_host' };
    }
    getListApplicationHostsTool() {
      return { name: 'list_application_hosts' };
    }
  },
}));

import { NewRelicMCPServer } from '../../src/server';

describe('NewRelicMCPServer.executeTool coverage', () => {
  let server: NewRelicMCPServer;
  let mockClient: NewRelicClient;

  beforeEach(() => {
    mockClient = {
      validateCredentials: vi.fn().mockResolvedValue(true),
      getAccountDetails: vi.fn().mockResolvedValue({ id: 'acc' }),
      runNrqlQuery: vi.fn(),
      listApmApplications: vi.fn(),
      executeNerdGraphQuery: vi.fn(),
    } as any;
    server = new NewRelicMCPServer(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('covers success paths for various tools', async () => {
    const accountId = '1234';
    await server.executeTool('run_nrql_query', { nrql: 'SELECT 1', target_account_id: accountId });
    await server.executeTool('list_apm_applications', { target_account_id: accountId });
    await server.executeTool('create_deployment', { application_id: 1, revision: 'r' });
    await server.executeTool('list_deployments_rest', { application_id: 1 });
    await server.executeTool('delete_deployment', { application_id: 1, id: 2, confirm: true });
    await server.executeTool('list_apm_applications_rest', {});
    await server.executeTool('list_metric_names_for_host', { application_id: 1, host_id: 1 });
    await server.executeTool('get_metric_data_for_host', {
      application_id: 1,
      host_id: 1,
      names: ['a'],
    });
    await server.executeTool('list_application_hosts', { application_id: 1 });
    await server.executeTool('get_account_details', { target_account_id: accountId });
    await server.executeTool('list_alert_policies', { target_account_id: accountId });
    await server.executeTool('list_open_incidents', { target_account_id: accountId });
    await server.executeTool('search_entities', {
      query: 'name LIKE "%"',
      target_account_id: accountId,
    });
    await server.executeTool('get_entity_details', { entity_guid: 'GUID' });
    await server.executeTool('list_synthetics_monitors', { target_account_id: accountId });
    await server.executeTool('create_browser_monitor', {
      name: 'm',
      url: 'https://x',
      frequency: 5,
      locations: ['US_EAST_1'],
      target_account_id: accountId,
    });
    await server.executeTool('run_nerdgraph_query', { query: '{ actor { user { id } } }' });

    expect(nrqlExecute).toHaveBeenCalled();
    expect(apmExecute).toHaveBeenCalled();
    expect(restCreate).toHaveBeenCalled();
    expect(restList).toHaveBeenCalled();
    expect(restDelete).toHaveBeenCalled();
    expect(restApmList).toHaveBeenCalled();
    expect(restMetricNames).toHaveBeenCalled();
    expect(restMetricData).toHaveBeenCalled();
    expect(restAppHosts).toHaveBeenCalled();
    expect(alertListPolicies).toHaveBeenCalled();
    expect(alertListIncidents).toHaveBeenCalled();
    expect(entitySearch).toHaveBeenCalled();
    expect(entityDetails).toHaveBeenCalled();
    expect(synthList).toHaveBeenCalled();
    expect(synthCreate).toHaveBeenCalled();
    expect(nerdExecute).toHaveBeenCalled();
  });

  it('validates acknowledge_incident inputs', async () => {
    await expect(server.executeTool('acknowledge_incident', {} as any)).rejects.toThrow(
      'incident_id'
    );
    await expect(
      server.executeTool('acknowledge_incident', { incident_id: '1', comment: 1 as any })
    ).rejects.toThrow('comment');
    await server.executeTool('acknowledge_incident', { incident_id: '1' });
    expect(alertAck).toHaveBeenCalled();
  });

  it('validates search_entities inputs', async () => {
    await expect(server.executeTool('search_entities', { query: '' } as any)).rejects.toThrow(
      'query'
    );
    await expect(
      server.executeTool('search_entities', {
        query: 'x',
        entity_types: 'APM' as any,
        target_account_id: '1',
      })
    ).rejects.toThrow('entity_types');
  });

  it('validates get_entity_details inputs', async () => {
    await expect(
      server.executeTool('get_entity_details', { entity_guid: '' } as any)
    ).rejects.toThrow('entity_guid');
  });

  it('validates create_browser_monitor inputs', async () => {
    await expect(
      server.executeTool('create_browser_monitor', {
        name: '',
        url: 'x',
        frequency: 1,
        locations: ['a'],
        target_account_id: '1',
      } as any)
    ).rejects.toThrow('name');
    await expect(
      server.executeTool('create_browser_monitor', {
        name: 'n',
        url: '',
        frequency: 1,
        locations: ['a'],
        target_account_id: '1',
      } as any)
    ).rejects.toThrow('url');
    await expect(
      server.executeTool('create_browser_monitor', {
        name: 'n',
        url: 'x',
        frequency: 0,
        locations: ['a'],
        target_account_id: '1',
      } as any)
    ).rejects.toThrow('frequency');
    await expect(
      server.executeTool('create_browser_monitor', {
        name: 'n',
        url: 'x',
        frequency: 1,
        locations: [1] as any,
        target_account_id: '1',
      })
    ).rejects.toThrow('locations');
  });

  it('default path: tool not found', async () => {
    await expect(server.executeTool('nonexistent_tool', {})).rejects.toThrow('not found');
  });
});
