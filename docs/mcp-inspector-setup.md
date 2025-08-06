# MCP Inspector Setup Guide

This guide helps you test and debug the New Relic MCP server using the MCP Inspector.

## Prerequisites

- Node.js installed
- New Relic API credentials in `.env` file
- Server built with `npm run build`

## Quick Start

### 1. Build the Server

```bash
npm run build
```

### 2. Launch Inspector

We've added convenient npm scripts for running the Inspector:

```bash
# Inspect the built production server
npm run inspect

# Inspect the development server (with TypeScript)
npm run inspect:dev
```

### 3. Manual Inspector Commands

You can also run the Inspector manually:

```bash
# For built JavaScript server
npx @modelcontextprotocol/inspector node dist/server.js

# For TypeScript development server
npx @modelcontextprotocol/inspector tsx src/server.ts

# With custom environment variables
npx @modelcontextprotocol/inspector env NEW_RELIC_API_KEY=your-key node dist/server.js
```

## Using the Inspector

### Server Connection Pane

1. The Inspector automatically starts your server
2. Check the connection status in the top panel
3. Monitor server logs in the Notifications pane

### Testing Tools

Navigate to the **Tools** tab to test available tools:

#### 1. NRQL Query Tool (`run_nrql_query`)
- **Required Parameters:**
  - `nrql`: Your NRQL query (e.g., `SELECT count(*) FROM Transaction SINCE 1 hour ago`)
  - `target_account_id`: Your New Relic account ID

#### 2. APM Applications Tool (`list_apm_applications`)
- **Required Parameters:**
  - `target_account_id`: Your New Relic account ID

#### 3. Entity Search Tool (`search_entities`)
- **Required Parameters:**
  - `query`: Search query (e.g., `type = 'APPLICATION'`)
  - `target_account_id`: Your New Relic account ID

#### 4. Entity Details Tool (`get_entity_details`)
- **Required Parameters:**
  - `entity_guid`: The GUID of the entity
  - `target_account_id`: Your New Relic account ID

#### 5. NerdGraph Query Tool (`run_nerdgraph_query`)
- **Required Parameters:**
  - `query`: GraphQL query
  - `variables`: (Optional) Query variables
  - `target_account_id`: Your New Relic account ID

#### 6. Alert Policies Tool (`list_alert_policies`)
- **Required Parameters:**
  - `target_account_id`: Your New Relic account ID

#### 7. Open Incidents Tool (`list_open_incidents`)
- **Required Parameters:**
  - `target_account_id`: Your New Relic account ID
  - `priority`: (Optional) Filter by priority

#### 8. Acknowledge Incident Tool (`acknowledge_incident`)
- **Required Parameters:**
  - `incident_id`: The incident ID to acknowledge
  - `target_account_id`: Your New Relic account ID

#### 9. Synthetics Monitors Tool (`list_synthetics_monitors`)
- **Required Parameters:**
  - `target_account_id`: Your New Relic account ID

#### 10. Create Browser Monitor Tool (`create_browser_monitor`)
- **Required Parameters:**
  - `name`: Monitor name
  - `uri`: URL to monitor
  - `locations`: Array of location codes
  - `frequency`: Check frequency in minutes
  - `target_account_id`: Your New Relic account ID

### Testing Prompts

The server doesn't currently have prompts configured, but you can add them to `src/server.ts`.

### Testing Resources

The server doesn't currently expose resources, but you can add them if needed.

## Environment Configuration

### Development vs Production

The server uses different `.env` files:

- **`.env`** - Production configuration with real New Relic credentials
- **`.env.test`** - Test configuration with mock credentials for unit tests

### Required Environment Variables

```bash
# .env file
NEW_RELIC_API_KEY=NRAK-XXXXXXXXXXXXXXXXXXXXXXXXXX
NEW_RELIC_ACCOUNT_ID=your-account-id
```

## Troubleshooting

### Connection Issues

1. **Server fails to start**
   - Check that `.env` file exists with valid credentials
   - Ensure the server is built: `npm run build`
   - Check for port conflicts

2. **Authentication errors**
   - Verify your New Relic API key is valid
   - Ensure it's a User API key, not an Ingest key
   - Check the account ID is correct

3. **Tool execution fails**
   - Verify all required parameters are provided
   - Check the account ID matches your New Relic account
   - Look for error messages in the Notifications pane

### Debug Mode

To see more detailed logs:

```bash
# Set debug environment variable
DEBUG=* npx @modelcontextprotocol/inspector node dist/server.js
```

## Testing Workflow

1. **Start the Inspector**
   ```bash
   npm run inspect:dev
   ```

2. **Test Basic Connectivity**
   - Verify server starts without errors
   - Check capability negotiation completes

3. **Test Each Tool**
   - Start with simple queries (e.g., list APM applications)
   - Progress to complex queries (NRQL, NerdGraph)
   - Test error handling with invalid inputs

4. **Monitor Performance**
   - Watch response times in the Inspector
   - Check for memory leaks during extended use
   - Verify concurrent operations work correctly

## Example Tool Inputs

### NRQL Query Example
```json
{
  "nrql": "SELECT count(*) FROM Transaction WHERE appName = 'My App' SINCE 1 hour ago",
  "target_account_id": "YOUR_ACCOUNT_ID"
}
```

### NerdGraph Query Example
```json
{
  "query": "{ actor { user { name email } } }",
  "target_account_id": "YOUR_ACCOUNT_ID"
}
```

### Entity Search Example
```json
{
  "query": "type = 'APPLICATION' AND reporting = 'true'",
  "target_account_id": "YOUR_ACCOUNT_ID"
}
```

## Next Steps

1. Test all tools with your real New Relic data
2. Verify error handling for edge cases
3. Test concurrent tool executions
4. Monitor server resource usage
5. Add custom prompts or resources as needed

## Additional Resources

- [MCP Inspector Documentation](https://modelcontextprotocol.io/docs/tools/inspector)
- [New Relic API Documentation](https://docs.newrelic.com/docs/apis)
- [NRQL Reference](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language)