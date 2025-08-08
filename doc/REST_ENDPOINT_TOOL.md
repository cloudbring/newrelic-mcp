# New Relic REST v2 API: Proposed MCP Tools (Read First)

This document summarizes key details from New Relic's REST v2 Swagger and proposes a focused set of high‑value MCP tools to add, without creating a one‑to‑one tool for every endpoint. No code changes are included here; this is a proposal for review.

References:

- Swagger/OpenAPI: `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)

## Key Notes from Swagger (internal details)

- **Servers/Regions**: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`, and a staging host. [source](https://api.newrelic.com/docs/swagger.yml)
- **Auth header**: Uses a User API key via the `Api-Key`/`API-Key` header. The docs note that the older `X-API-KEY` header works for deprecated Account API keys but is deprecated in docs. Prefer a User API Key. [source](https://api.newrelic.com/docs/swagger.yml)
- **Pagination**: Many endpoints are paginated and return RFC 5988 `Link` headers with `next`/`last`. Query param `page` is widely used; some endpoints also support a `cursor` param (replacing page). [source](https://api.newrelic.com/docs/swagger.yml)
- **Common resources in spec**: Applications, Deployments, Hosts, Metrics (names + data), Alerts (policies, incidents, violations, conditions), Labels, Key transactions, Mobile apps, etc. [source](https://api.newrelic.com/docs/swagger.yml)
- **Deployments**:

  - Create deployment: `POST /applications/{application_id}/deployments.json` requires `application_id` and `revision` (git SHA or similar). Optional `changelog`, `description`, `user`. [source](https://api.newrelic.com/docs/swagger.yml)
  - List deployments: `GET /applications/{application_id}/deployments.json` (paginated). [source](https://api.newrelic.com/docs/swagger.yml)
  - Delete deployment: `DELETE /applications/{application_id}/deployments/{id}.json` requires Admin User’s API Key. [source](https://api.newrelic.com/docs/swagger.yml)

- **Application hosts & metrics**:

  - Hosts list: `GET /applications/{application_id}/hosts.json` with filters (hostname, ids). [source](https://api.newrelic.com/docs/swagger.yml)
  - Metric names: `GET /applications/{application_id}/hosts/{host_id}/metrics.json` (filters by name; `cursor` supported). [source](https://api.newrelic.com/docs/swagger.yml)
  - Metric data: `GET /applications/{application_id}/hosts/{host_id}/metrics/data.json` (timeslices). [source](https://api.newrelic.com/docs/swagger.yml)

- **Alerts (per spec schemas)**: Policies, Incidents, Violations, NRQL/User-defined conditions, Synthetics conditions all appear in components. Endpoints follow `v2/alerts_*` patterns in the v2 REST API; many are paginated. [source](https://api.newrelic.com/docs/swagger.yml)

Notes for our project context:

- The current MCP tools rely primarily on NerdGraph (GraphQL) for APM, Alerts, Entities, and Synthetics. Introducing REST v2 tools should be purposeful: fill gaps, enable simpler flows (e.g., deployment markers), or support legacy APM metric timeseries where convenient.

## Design Principles for REST v2 Tools

- **Use‑case oriented**: Provide tools that encapsulate common workflows, not raw endpoint shims.
- **Small, high‑value set**: Start with deployment lifecycle, app discovery, selective metric reads, and select alerts operations.
- **Consistent inputs**: Support `region` (US/EU), pagination (`page`, `cursor`, `auto_paginate`), and minimal filtering options that map directly to the API (`filter[name]`, etc.).
- **Safety**: Mark destructive or privileged actions (e.g., delete deployment) as advanced and require explicit confirmation flags.
- **Interoperability**: Keep responses structured for easy use by calling clients; surface pagination metadata and response links.

## Proposed Tools (Tiered)

### Tier 1: Deployments and App Discovery

1. create_deployment (REST)

- **Purpose**: Record a deployment marker for an APM application.
- **Endpoint**: `POST /applications/{application_id}/deployments.json`
- **Inputs**: `application_id` (required), `revision` (required), optional `changelog`, `description`, `user`, `region`.
- **Notes**: Time recorded is current UTC by API. [source](https://api.newrelic.com/docs/swagger.yml)

1. list_deployments (REST)

- **Purpose**: View recent deployments for an app (for rollbacks, change correlation).
- **Endpoint**: `GET /applications/{application_id}/deployments.json`
- **Inputs**: `application_id`, pagination: `page` or `cursor`, `auto_paginate`, `region`.

1. delete_deployment (REST) — advanced

- **Purpose**: Remove an incorrect deployment record.
- **Endpoint**: `DELETE /applications/{application_id}/deployments/{id}.json`
- **Inputs**: `application_id`, `id`, `region`, `confirm: true`.
- **Notes**: Requires Admin User’s API Key; gate behind explicit confirm. [source](https://api.newrelic.com/docs/swagger.yml)

1. list_apm_applications (REST)

- **Purpose**: Discover APM applications via REST, with simple filters.
- **Endpoint**: `GET /applications.json`
- **Inputs**: filters: `filter[name]`, `filter[host]`, `filter[ids]`, `filter[language]`; pagination; `region`.
- **Why**: Simpler than crafting GraphQL for some quick lookups; mirrors New Relic UI filters. [source](https://api.newrelic.com/docs/swagger.yml)

### Tier 2: Metrics (Selective, Legacy APM Metrics)

1. list_metric_names_for_host (REST)

- **Purpose**: Enumerate available metric names/values for a specific app host.
- **Endpoint**: `GET /applications/{application_id}/hosts/{host_id}/metrics.json`
- **Inputs**: `application_id`, `host_id`, optional `name` filter, pagination (`page` or `cursor`), `region`.

1. get_metric_data_for_host (REST)

- **Purpose**: Retrieve timeslice metric data for selected metrics on a host.
- **Endpoint**: `GET /applications/{application_id}/hosts/{host_id}/metrics/data.json`
- **Inputs**: `application_id`, `host_id`, metric query params (per spec), time window params, pagination; `region`.
- **Why**: Quick access to APM agent timeseries when NRQL/NerdGraph is overkill or when parity with REST dashboards is desired. [source](https://api.newrelic.com/docs/swagger.yml)

1. list_application_hosts (REST)

- **Purpose**: Map hosts reporting to an APM app.
- **Endpoint**: `GET /applications/{application_id}/hosts.json`
- **Inputs**: `application_id`, filters: `filter[hostname]`, `filter[ids]`; pagination; `region`. [source](https://api.newrelic.com/docs/swagger.yml)

Note: If broader metric coverage is needed (e.g., app‑level metrics endpoints), we can extend with analogous app‑level metric names/data tools in a follow‑up.

### Tier 3: Alerts (Where REST adds convenience)

1. list_alert_policies (REST)

- **Purpose**: Simple enumeration of alert policies via REST.
- **Endpoint**: `GET /alerts_policies.json` (per v2 API catalog)
- **Inputs**: basic filters as supported; pagination; `region`.

1. list_open_incidents (REST)

- **Purpose**: View currently open incidents using the REST v2 model.
- **Endpoint**: `GET /alerts_incidents.json` (or equivalent v2 path), paginated.
- **Inputs**: filters (e.g., priority) if supported by the endpoint; pagination; `region`.

1. acknowledge_incident (REST) — if available in v2

- **Purpose**: Acknowledge an incident via REST.
- **Endpoint**: If the v2 spec provides an incident update endpoint (e.g., `PUT /alerts_incidents/{id}.json` or similar), support the minimal acknowledge flow.
- **Inputs**: `incident_id`; `region`; `confirm: true`.
- **Note**: If this endpoint does not exist in v2 Swagger, we will omit this tool and continue using the existing NerdGraph tool for acknowledgment.

## Not Proposed (Initial Phase)

- One‑to‑one wrappers for every alerts condition type (NRQL/User‑defined/External service). Too granular for MCP flows; better to use NerdGraph or manual configuration.
- Labels and Key transactions management: useful but lower priority; consider later based on demand.
- Mobile application‑specific endpoints for now.

## Consistency & Ergonomics

- Each tool will accept `region: "US" | "EU"` (default US) to select the base URL.
- Support `page`, `cursor`, and `auto_paginate` (boolean) for list endpoints.
- Common response envelope will include raw REST payload and pagination/link metadata.
- Headers: send `Api-Key` (User API Key) and `Content-Type: application/json` as appropriate.
- Errors: surface HTTP status and body; map 401 to a clear “Invalid API key” message.

## Implementation Plan (post‑approval)

1. Add a small REST v2 client in `src/client/` with base URL selection (US/EU), auth headers, and pagination helpers.
1. Implement Tier 1 tools; add tests and docs.
1. Implement Tier 2 tools; add tests and docs.
1. Optional Tier 3 tools depending on review feedback.

No code changes are in this document. Please review the scope and prioritization before we proceed to implementation.