# New Relic MCP Server

A Model Context Protocol (MCP) server for integrating with New Relic's observability platform.

## Features

### APM (Application Performance Monitoring)
- List APM applications
- View application metrics and details
- Monitor application health and performance

### NRQL Queries
- Execute NRQL queries for custom data analysis
- Support for time series and faceted queries
- Full metadata support

### NerdGraph API
- Execute custom GraphQL queries
- Access the full power of New Relic's API

### Entity Management
- Search for entities across your infrastructure
- Get detailed entity information
- Filter by entity types and tags

### Alerts & Incidents
- List alert policies
- View open incidents
- Acknowledge incidents
- Filter by priority

### Synthetics Monitoring
- List synthetic monitors
- Create browser monitors
- Configure monitoring locations and frequency

## Installation

```bash
npm install
npm run build
```

## Configuration

Set the following environment variables:

```bash
NEW_RELIC_API_KEY=your-api-key-here
NEW_RELIC_ACCOUNT_ID=your-account-id  # Optional, can be provided per tool call
```

## Usage

### Start the MCP Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

## Testing

The project uses Test-Driven Development (TDD) with:
- **Vitest** for unit testing
- **@amiceli/vitest-cucumber** for BDD testing with Gherkin features
- **Evalite** for LLM response validation

Run tests:

```bash
npm test                 # Run all tests
npm run test:coverage    # Run with coverage
npm run test:bdd        # Run BDD tests only
```

## Available Tools

### 1. run_nrql_query
Execute NRQL queries against New Relic data.

### 2. list_apm_applications
List all APM applications in your account.

### 3. search_entities
Search for entities by name, type, or tags.

### 4. get_entity_details
Get detailed information about a specific entity.

### 5. run_nerdgraph_query
Execute custom NerdGraph GraphQL queries.

### 6. list_alert_policies
List all alert policies in your account.

### 7. list_open_incidents
List all open incidents with optional priority filtering.

### 8. acknowledge_incident
Acknowledge an open incident.

### 9. list_synthetics_monitors
List all Synthetics monitors.

### 10. create_browser_monitor
Create a new browser-based Synthetics monitor.

### 11. get_account_details
Get New Relic account details.

## Architecture

The server follows a modular architecture:

```
src/
├── server.ts           # Main MCP server implementation
├── client/
│   └── newrelic-client.ts  # New Relic API client
└── tools/
    ├── nrql.ts         # NRQL query tool
    ├── apm.ts          # APM applications tool
    ├── entity.ts       # Entity management tools
    ├── alert.ts        # Alert and incident tools
    ├── synthetics.ts   # Synthetics monitoring tools
    └── nerdgraph.ts    # NerdGraph query tool
```

## Deployment to Smithery

This server is designed to be deployed on Smithery. See `smithery.json` for deployment configuration.

## License

ISC