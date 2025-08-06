# New Relic MCP Server - Test Specifications

## Overview

This directory contains comprehensive test specifications for a Model Context Protocol (MCP) server that provides integration with the New Relic observability platform. The server exposes New Relic's NerdGraph API capabilities through standardized MCP interfaces, enabling AI applications to interact with monitoring data, create synthetic monitors, manage alerts, and perform complex entity searches.

## Core Functionality

The MCP server provides three main categories of functionality:

### 1. **Data Access & Querying**

- Execute arbitrary NerdGraph GraphQL queries
- Run NRQL (New Relic Query Language) queries
- Retrieve account details and metadata
- Search and retrieve entity information across multiple domains

### 2. **Monitoring & Observability**

- List and manage APM applications
- Create and manage synthetic monitors
- Access infrastructure host data
- Retrieve dashboard and widget information

### 3. **Alert Management**

- List alert policies with filtering
- View open incidents by priority
- Acknowledge alert incidents
- Manage incident lifecycle

## MCP Protocol Features Used

### **Tools** (AI Actions)

- `tools/list` - Discover available tools
- `tools/call` - Execute specific tools with typed inputs/outputs
- Schema validation using JSON Schema
- User approval required for all tool executions

### **Resources** (Context Data)

- `resources/list` - List available direct resources
- `resources/templates/list` - Discover resource templates
- `resources/read` - Retrieve resource contents
- URI-based identification (e.g., `newrelic://entity/{guid}`)
- MIME type declarations for content handling

### **Prompts** (Interaction Templates)

- `prompts/list` - Discover available prompts
- `prompts/get` - Retrieve prompt details
- Parameterized templates for common workflows
- Argument completion support

## Feature Organization

The test specifications are organized into domain-specific feature files:

### **Common Features** (`features/common/`)

- Generic NerdGraph query execution
- NRQL query execution
- Account details retrieval
- Basic configuration and authentication

### **Entity Management** (`features/entities/`)

- Entity search with multiple criteria
- Entity details retrieval by GUID
- Cross-domain entity support (APM, INFRA, BROWSER, etc.)
- Entity relationship discovery

### **APM Features** (`features/apm/`)

- Application Performance Monitoring data access
- APM application listing and details
- Application instance information

### **Synthetics Features** (`features/synthetics/`)

- Synthetic monitor listing
- Simple browser monitor creation
- Monitor configuration and management

### **Alerts Features** (`features/alerts/`)

- Alert policy management
- Incident listing and filtering
- Incident acknowledgment
- Alert lifecycle management

## Implementation Requirements

### **Authentication**

- New Relic User API Key required
- Account ID configuration (optional but recommended)
- Environment variable-based configuration
- Secure credential management

### **API Integration**

- New Relic NerdGraph API (GraphQL)
- HTTP client with timeout handling
- Error handling and response formatting
- Cross-account support

### **Data Validation**

- Input parameter validation
- Type checking for all parameters
- Enum value validation
- Account ID validation and conversion

### **Error Handling**

- HTTP error handling
- JSON parsing error handling
- GraphQL error propagation
- Graceful degradation with meaningful error messages

## Test Structure

Each feature file follows the Gherkin format with:

- **Feature**: High-level description of functionality
- **Background**: Common setup and authentication
- **Scenario**: Specific test cases with Given/When/Then steps
- **Scenario Outline**: Parameterized test cases
- **Examples**: Test data for parameterized scenarios

## MCP Protocol Documentation

For detailed information about the MCP protocol, refer to:

- [MCP Introduction](https://modelcontextprotocol.io/docs/getting-started/intro)
- [Server Concepts](https://modelcontextprotocol.io/docs/learn/server-concepts)
- [MCP Specification](https://modelcontextprotocol.io/docs/specification)

## Implementation Notes

- All feature files are implementation-agnostic
- Focus on behavior and requirements rather than specific technology
- Detailed input/output specifications for all tools and resources
- Comprehensive error handling scenarios
- Cross-account and multi-tenant support considerations
- Security and authentication requirements clearly specified
