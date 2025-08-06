# MCP Protocol Documentation for New Relic Server

## Overview

This document describes how the New Relic MCP server implements the Model Context Protocol (MCP) to provide AI applications with access to New Relic observability data and functionality.

## MCP Protocol Version

The server implements the latest MCP protocol specification as defined in the [MCP documentation](https://modelcontextprotocol.io/docs/specification).

## Core MCP Building Blocks Used

### 1. Tools (AI Actions)

Tools enable AI models to perform actions through server-implemented functions. Each tool defines a specific operation with typed inputs and outputs.

#### Tool Registration Pattern

```json
{
  "name": "tool_name",
  "description": "Tool description",
  "inputSchema": {
    "type": "object",
    "properties": {
      "parameter": {
        "type": "string",
        "description": "Parameter description"
      }
    },
    "required": ["parameter"]
  }
}
```

#### Available Tools

| Tool Name | Purpose | Input Schema | Output |
|-----------|---------|--------------|---------|
| `query_nerdgraph` | Execute arbitrary NerdGraph queries | GraphQL query string + variables | JSON response |
| `run_nrql_query` | Execute NRQL queries | NRQL string + account ID | JSON response |
| `search_entities` | Search for New Relic entities | Search criteria + filters | Entity list |
| `list_apm_applications` | List APM applications | Account ID (optional) | APM applications |
| `list_synthetics_monitors` | List synthetic monitors | Account ID (optional) | Monitor list |
| `create_simple_browser_monitor` | Create browser monitor | Monitor configuration | Monitor details |
| `list_alert_policies` | List alert policies | Account ID + name filter | Policy list |
| `list_open_incidents` | List open incidents | Account ID + priority filter | Incident list |
| `acknowledge_alert_incident` | Acknowledge incident | Incident ID + message | Acknowledgment result |

#### Tool Execution Flow

1. **Discovery**: Client calls `tools/list` to discover available tools
2. **Validation**: Server validates input schema against provided parameters
3. **Execution**: Server executes the tool function with validated inputs
4. **Response**: Server returns structured JSON response with results or errors
5. **User Approval**: All tool executions require explicit user approval

### 2. Resources (Context Data)

Resources provide structured access to information that the host application can retrieve and provide to AI models as context.

#### Resource URI Patterns

- `newrelic://account_details` - Account information
- `newrelic://entity/{guid}` - Entity details by GUID

#### Resource Registration Pattern

```json
{
  "uri": "newrelic://entity/{guid}",
  "name": "entity-details",
  "description": "Get detailed information about a New Relic entity",
  "mimeType": "application/json"
}
```

#### Resource Discovery

- **Direct Resources**: Fixed URIs like `newrelic://account_details`
- **Resource Templates**: Parameterized URIs like `newrelic://entity/{guid}`

#### Resource Content Format

All resources return JSON data with the following structure:

```json
{
  "data": {
    // Resource-specific data
  },
  "metadata": {
    "uri": "resource_uri",
    "mimeType": "application/json",
    "lastModified": "timestamp"
  }
}
```

### 3. Prompts (Interaction Templates)

Prompts provide reusable templates for common workflows and parameterized interactions.

#### Available Prompts

| Prompt Name | Purpose | Arguments | Output |
|-------------|---------|-----------|---------|
| `generate_entity_search_query` | Generate NerdGraph search conditions | Entity criteria | Query string |

#### Prompt Registration Pattern

```json
{
  "name": "prompt_name",
  "title": "Human-readable title",
  "description": "Prompt description",
  "arguments": [
    {
      "name": "argument_name",
      "type": "string",
      "required": true,
      "description": "Argument description"
    }
  ]
}
```

## MCP Protocol Operations

### Tools Operations

#### `tools/list`

- **Purpose**: Discover available tools
- **Request**: No parameters required
- **Response**: Array of tool definitions with schemas
- **Example**:

```json
{
  "tools": [
    {
      "name": "query_nerdgraph",
      "description": "Execute arbitrary NerdGraph queries",
      "inputSchema": {
        "type": "object",
        "properties": {
          "nerdgraph_query": {
            "type": "string",
            "description": "The GraphQL query string"
          },
          "variables": {
            "type": "object",
            "description": "Optional variables for the query"
          }
        },
        "required": ["nerdgraph_query"]
      }
    }
  ]
}
```

#### `tools/call`

- **Purpose**: Execute a specific tool
- **Request**: Tool name and parameters
- **Response**: Tool execution result
- **Example**:

```json
{
  "name": "search_entities",
  "arguments": {
    "name": "my-app",
    "domain": "APM",
    "limit": 10
  }
}
```

### Resources Operations

#### `resources/list`

- **Purpose**: List available direct resources
- **Request**: No parameters required
- **Response**: Array of resource descriptors
- **Example**:

```json
{
  "resources": [
    {
      "uri": "newrelic://account_details",
      "name": "account-details",
      "description": "Account information",
      "mimeType": "application/json"
    }
  ]
}
```

#### `resources/templates/list`

- **Purpose**: Discover resource templates
- **Request**: No parameters required
- **Response**: Array of resource template definitions
- **Example**:

```json
{
  "resourceTemplates": [
    {
      "uriTemplate": "newrelic://entity/{guid}",
      "name": "entity-details",
      "title": "Entity Details",
      "description": "Get detailed information about a New Relic entity",
      "mimeType": "application/json"
    }
  ]
}
```

#### `resources/read`

- **Purpose**: Retrieve resource contents
- **Request**: Resource URI
- **Response**: Resource data with metadata
- **Example**:

```json
{
  "uri": "newrelic://entity/abc123",
  "contents": [
    {
      "uri": "newrelic://entity/abc123",
      "mimeType": "application/json",
      "text": "{\"data\": {...}}"
    }
  ]
}
```

### Prompts Operations

#### `prompts/list`

- **Purpose**: Discover available prompts
- **Request**: No parameters required
- **Response**: Array of prompt descriptors
- **Example**:

```json
{
  "prompts": [
    {
      "name": "generate_entity_search_query",
      "title": "Generate Entity Search Query",
      "description": "Generate NerdGraph search conditions",
      "arguments": [
        {
          "name": "entity_name",
          "type": "string",
          "required": true,
          "description": "Entity name to search for"
        }
      ]
    }
  ]
}
```

#### `prompts/get`

- **Purpose**: Retrieve prompt details
- **Request**: Prompt name
- **Response**: Full prompt definition with arguments
- **Example**:

```json
{
  "name": "generate_entity_search_query",
  "title": "Generate Entity Search Query",
  "description": "Generate NerdGraph search conditions for entity searches",
  "arguments": [
    {
      "name": "entity_name",
      "type": "string",
      "required": true,
      "description": "Entity name to search for"
    },
    {
      "name": "entity_domain",
      "type": "string",
      "required": false,
      "description": "Entity domain to filter by"
    }
  ]
}
```

## Error Handling

### Tool Execution Errors

```json
{
  "error": {
    "code": "tool_execution_error",
    "message": "Error description",
    "details": {
      "tool": "tool_name",
      "arguments": {...}
    }
  }
}
```

### Resource Access Errors

```json
{
  "error": {
    "code": "resource_not_found",
    "message": "Resource not found",
    "details": {
      "uri": "resource_uri"
    }
  }
}
```

### Validation Errors

```json
{
  "error": {
    "code": "validation_error",
    "message": "Invalid input",
    "details": {
      "field": "field_name",
      "expected": "expected_type",
      "received": "actual_value"
    }
  }
}
```

## Authentication and Security

### API Key Management

- New Relic User API Key required for all operations
- Key stored in environment variables
- No hardcoded secrets in source code
- Key validation on server startup

### Account Access Control

- Account ID configuration for multi-tenant support
- Cross-account access based on API key permissions
- Account-specific error handling
- Permission validation for all operations

### User Approval Model

- All tool executions require explicit user approval
- Clear approval dialogs with action descriptions
- Activity logging for all tool executions
- Permission settings for pre-approved operations

## Performance Considerations

### Response Times

- Tool execution: < 5 seconds for most operations
- Resource retrieval: < 2 seconds for entity details
- Large data sets: Pagination support with cursors
- Timeout handling: 45-second limit for API calls

### Caching Strategy

- Resource caching for frequently accessed data
- Tool result caching for expensive operations
- Cache invalidation on data updates
- Memory-efficient caching for large datasets

### Pagination Support

- Cursor-based pagination for large result sets
- Configurable page sizes
- Consistent pagination across all list operations
- Next/previous page navigation

## Integration Patterns

### Multi-Server Integration

The New Relic MCP server can work alongside other MCP servers:

1. **File System Server**: Access configuration files and logs
2. **Email Server**: Send alert notifications
3. **Calendar Server**: Schedule monitoring tasks
4. **Database Server**: Store monitoring data

### Workflow Examples

#### Incident Response Workflow

1. **Detect**: Use `list_open_incidents` to find critical incidents
2. **Investigate**: Use `get_entity_details` to examine affected entities
3. **Acknowledge**: Use `acknowledge_alert_incident` to acknowledge
4. **Notify**: Use email server to send notifications
5. **Document**: Use file system server to log actions

#### Monitoring Setup Workflow

1. **Discover**: Use `search_entities` to find applications
2. **Create**: Use `create_simple_browser_monitor` to set up monitoring
3. **Configure**: Use `list_alert_policies` to set up alerts
4. **Validate**: Use `list_synthetics_monitors` to verify setup

## Best Practices

### Tool Design

- Single responsibility principle for each tool
- Comprehensive input validation
- Detailed error messages
- Consistent response formats

### Resource Design

- URI-based identification
- Proper MIME type declarations
- Metadata inclusion
- Versioning support

### Prompt Design

- Clear argument descriptions
- Parameter completion support
- Reusable templates
- Domain-specific workflows

### Error Handling Best Practices

- Graceful degradation
- Meaningful error messages
- Proper error propagation
- User-friendly error descriptions

## Testing and Validation

### Tool Testing

- Input validation testing
- Error condition testing
- Performance testing
- Integration testing

### Resource Testing

- URI resolution testing
- Content format validation
- Metadata verification
- Access control testing

### Prompt Testing

- Argument validation
- Parameter completion
- Template rendering
- Workflow testing

## Future Enhancements

### Planned Features

- Real-time resource subscriptions
- Batch tool operations
- Advanced filtering capabilities
- Custom workflow templates

### Protocol Extensions

- Custom MCP extensions for New Relic-specific features
- Enhanced error handling
- Improved performance optimizations
- Better integration patterns

## References

- [MCP Protocol Specification](https://modelcontextprotocol.io/docs/specification)
- [MCP Server Concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [MCP Client Concepts](https://modelcontextprotocol.io/docs/learn/client-concepts)
- [New Relic NerdGraph API](https://docs.newrelic.com/docs/apis/nerdgraph/)
- [New Relic NRQL](https://docs.newrelic.com/docs/query-your-data/nrql-new-relic-query-language/)
