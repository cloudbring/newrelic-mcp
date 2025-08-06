# Test Files Summary

This document provides an overview of all the Gherkin feature files and documentation created for the New Relic MCP server test specifications.

## Directory Structure

```bash
test/
├── README.md                           # Main test documentation
├── MCP_PROTOCOL_DOCUMENTATION.md      # MCP protocol implementation details
├── TEST_FILES_SUMMARY.md              # This file
└── features/
    ├── common/
    │   ├── nerdgraph_queries.feature  # Generic NerdGraph query execution
    │   ├── nrql_queries.feature       # NRQL query execution
    │   └── account_details.feature    # Account details resource
    ├── entities/
    │   ├── entity_search.feature      # Entity search functionality
    │   ├── entity_details.feature     # Entity details resource
    │   └── entity_search_prompts.feature # Entity search query generation
    ├── apm/
    │   └── apm_applications.feature   # APM applications management
    ├── synthetics/
    │   ├── synthetics_monitors.feature # Synthetic monitors listing
    │   └── create_browser_monitor.feature # Browser monitor creation
    └── alerts/
        ├── alert_policies.feature     # Alert policies management
        ├── open_incidents.feature     # Open incidents listing
        └── acknowledge_incidents.feature # Incident acknowledgment
```

## Feature Files Overview

### Common Features (`features/common/`)

#### `nerdgraph_queries.feature`

- **Purpose**: Test generic NerdGraph query execution
- **Key Scenarios**:
  - Execute simple account queries
  - Execute queries with variables
  - Handle invalid queries
  - Handle API timeouts and errors
  - Tool schema validation
  - Tool discovery

#### `nrql_queries.feature`

- **Purpose**: Test NRQL query execution
- **Key Scenarios**:
  - Execute simple NRQL queries
  - Execute complex queries with aggregations
  - Handle missing account ID
  - Handle time-series and facet queries
  - Cross-account query support
  - Tool schema validation

#### `account_details.feature`

- **Purpose**: Test account details resource
- **Key Scenarios**:
  - Retrieve account details successfully
  - Handle missing account ID configuration
  - Resource discovery and content format
  - Cross-account support
  - Sensitive data exclusion

### Entity Management (`features/entities/`)

#### `entity_search.feature`

- **Purpose**: Test entity search functionality
- **Key Scenarios**:
  - Search by name, type, domain, and tags
  - Search with multiple criteria
  - Cross-account entity search
  - Handle special characters and empty results
  - Tool schema validation
  - Entity relationship information

#### `entity_details.feature`

- **Purpose**: Test entity details resource
- **Key Scenarios**:
  - Retrieve details for different entity types (APM, INFRA, SYNTH, etc.)
  - Handle invalid GUIDs and non-existent entities
  - Resource discovery and content format
  - Entity relationships and alert information
  - Cross-account entity access
  - Resource parameter completion

#### `entity_search_prompts.feature`

- **Purpose**: Test entity search query generation
- **Key Scenarios**:
  - Generate queries with different criteria
  - Handle special characters in entity names
  - Prompt discovery and parameter completion
  - Query condition format consistency
  - Cross-account query generation

### APM Features (`features/apm/`)

#### `apm_applications.feature`

- **Purpose**: Test APM applications management
- **Key Scenarios**:
  - List APM applications successfully
  - Handle missing account ID
  - APM application details (language, reporting status, alert severity)
  - Cross-account APM applications
  - Integration with entity search
  - Tool schema validation

### Synthetics Features (`features/synthetics/`)

#### `synthetics_monitors.feature`

- **Purpose**: Test synthetic monitors listing
- **Key Scenarios**:
  - List synthetic monitors successfully
  - Handle missing account ID
  - Monitor details (type, period, status, locations)
  - Cross-account synthetic monitors
  - Integration with entity search and details
  - Tool schema validation

#### `create_browser_monitor.feature`

- **Purpose**: Test browser monitor creation
- **Key Scenarios**:
  - Create monitors with required and optional parameters
  - Handle invalid inputs (URL, locations, period, status)
  - Validate period and location options
  - Monitor creation with tags
  - Integration with monitor listing
  - Tool schema validation

### Alerts Features (`features/alerts/`)

#### `alert_policies.feature`

- **Purpose**: Test alert policies management
- **Key Scenarios**:
  - List alert policies successfully
  - Filter policies by name
  - Handle missing account ID
  - Alert policy details (incident preferences)
  - Cross-account alert policies
  - Integration with incidents
  - Tool schema validation

#### `open_incidents.feature`

- **Purpose**: Test open incidents listing
- **Key Scenarios**:
  - List open incidents successfully
  - Filter incidents by priority
  - Handle missing account ID
  - Incident details (entity info, timestamps, descriptions)
  - Cross-account open incidents
  - Integration with alert policies
  - Tool schema validation

#### `acknowledge_incidents.feature`

- **Purpose**: Test incident acknowledgment
- **Key Scenarios**:
  - Acknowledge incidents successfully
  - Acknowledge with messages
  - Handle invalid incident IDs
  - Handle already acknowledged/closed incidents
  - Cross-account incident acknowledgment
  - Integration with open incidents listing
  - Tool schema validation

## Documentation Files

### `README.md`

- **Purpose**: Main test documentation
- **Content**:
  - Overview of functionality
  - Core functionality categories
  - MCP protocol features used
  - Feature organization
  - Implementation requirements
  - Test structure
  - MCP protocol documentation links

### `MCP_PROTOCOL_DOCUMENTATION.md`

- **Purpose**: Detailed MCP protocol implementation documentation
- **Content**:
  - MCP protocol version and building blocks
  - Tool, resource, and prompt implementations
  - Protocol operations with examples
  - Error handling patterns
  - Authentication and security
  - Performance considerations
  - Integration patterns
  - Best practices

### `TEST_FILES_SUMMARY.md`

- **Purpose**: This file - overview of all test files
- **Content**:
  - Directory structure
  - Feature files overview
  - Key scenarios for each feature
  - Documentation files summary

## Test Coverage

### MCP Protocol Coverage

- ✅ **Tools**: All 9 tools covered with comprehensive scenarios
- ✅ **Resources**: 2 resource types covered (account details, entity details)
- ✅ **Prompts**: 1 prompt type covered (entity search query generation)
- ✅ **Error Handling**: Comprehensive error scenarios for all features
- ✅ **Schema Validation**: Input validation for all tools and resources
- ✅ **Discovery**: Tool, resource, and prompt discovery scenarios

### New Relic API Coverage

- ✅ **NerdGraph API**: Generic query execution and specific operations
- ✅ **NRQL API**: Query execution with various data types
- ✅ **Entity API**: Search and detailed information retrieval
- ✅ **APM API**: Application listing and details
- ✅ **Synthetics API**: Monitor listing and creation
- ✅ **Alerts API**: Policy listing, incident management, and acknowledgment

### Cross-Cutting Concerns

- ✅ **Authentication**: API key and account ID handling
- ✅ **Error Handling**: Network, API, and validation errors
- ✅ **Performance**: Timeout handling and pagination
- ✅ **Security**: Input validation and data sanitization
- ✅ **Integration**: Cross-feature consistency and workflows

## Implementation Notes

### Language Agnostic

All feature files are designed to be implementation-agnostic:

- Focus on behavior and requirements rather than specific technology
- Detailed input/output specifications for all tools and resources
- Comprehensive error handling scenarios
- Cross-account and multi-tenant support considerations

### MCP Protocol Compliance

All features follow MCP protocol standards:

- Proper tool registration with JSON Schema validation
- Resource URI patterns and MIME type declarations
- Prompt argument definitions and parameter completion
- User approval model for all tool executions

### Test Data Requirements

The test scenarios require:

- Valid New Relic API key
- Valid New Relic account ID
- Access to various entity types (APM, INFRA, SYNTH, etc.)
- Alert policies and incidents for testing
- Synthetic monitors for testing

### Performance Expectations

- Tool execution: < 5 seconds for most operations
- Resource retrieval: < 2 seconds for entity details
- Large data sets: Pagination support with cursors
- Timeout handling: 45-second limit for API calls

## Usage Instructions

1. **Setup**: Configure New Relic API key and account ID
2. **Discovery**: Use MCP client to discover available tools, resources, and prompts
3. **Testing**: Execute scenarios in each feature file
4. **Validation**: Verify responses match expected formats and behaviors
5. **Integration**: Test cross-feature workflows and consistency

## Maintenance

- Update feature files when new tools, resources, or prompts are added
- Maintain consistency between feature files and actual implementation
- Update documentation when MCP protocol changes
- Add new scenarios for edge cases and error conditions
- Validate feature files against actual New Relic API behavior
