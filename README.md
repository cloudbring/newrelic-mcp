# New Relic MCP Server

A Model Context Protocol (MCP) server that provides seamless integration with New Relic's observability platform. Query metrics, manage alerts, monitor applications, and interact with your entire observability stack through a simple, unified interface.

> **Disclaimer**: This is an unofficial community project and is not affiliated with, endorsed by, or supported by New Relic, Inc. All trademarks are the property of their respective owners.

## Features

- 📊 **NRQL Queries** - Execute powerful queries to analyze your data
- 🚀 **APM Integration** - Monitor application performance and health
- 🔔 **Alert Management** - View and acknowledge alerts and incidents  
- 🔍 **Entity Search** - Discover and inspect entities across your infrastructure
- 📈 **Synthetics Monitoring** - Manage synthetic monitors and checks
- 🔧 **NerdGraph API** - Direct access to New Relic's GraphQL API

## Installation

### Quick Install with Smithery

To install New Relic MCP for Claude Desktop automatically via [Smithery](https://smithery.ai/mcp/newrelic-mcp):

```bash
npx @smithery/cli install newrelic-mcp --client claude
```

### Manual Installation

<details>
<summary>Claude Desktop</summary>

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "newrelic": {
      "command": "npx",
      "args": [
        "-y",
        "newrelic-mcp"
      ],
      "env": {
        "NEW_RELIC_API_KEY": "your-api-key-here",
        "NEW_RELIC_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

</details>

<details>
<summary>Cline (VS Code)</summary>

Add to your Cline settings in VS Code:

```json
{
  "cline.mcpServers": [
    {
      "name": "newrelic",
      "command": "npx",
      "args": ["-y", "newrelic-mcp"],
      "env": {
        "NEW_RELIC_API_KEY": "your-api-key-here",
        "NEW_RELIC_ACCOUNT_ID": "your-account-id"
      }
    }
  ]
}
```

</details>

<details>
<summary>Zed Editor</summary>

Add to your Zed configuration file at `~/.config/zed/settings.json`:

```json
{
  "language_models": {
    "mcp": {
      "servers": {
        "newrelic": {
          "command": "npx",
          "args": ["-y", "newrelic-mcp"],
          "env": {
            "NEW_RELIC_API_KEY": "your-api-key-here",
            "NEW_RELIC_ACCOUNT_ID": "your-account-id"
          }
        }
      }
    }
  }
}
```

</details>

<details>
<summary>Windsurf Editor</summary>

Add to your Windsurf Cascade configuration:

```json
{
  "mcpServers": {
    "newrelic": {
      "command": "npx",
      "args": ["-y", "newrelic-mcp"],
      "env": {
        "NEW_RELIC_API_KEY": "your-api-key-here",
        "NEW_RELIC_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

</details>

<details>
<summary>Local Development</summary>

1. Clone the repository:

```bash
git clone https://github.com/cloudbring/newrelic-mcp.git
cd newrelic-mcp
```

2. Install dependencies and build:

```bash
npm install
npm run build
```

3. Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "newrelic": {
      "command": "node",
      "args": ["/path/to/newrelic-mcp/dist/server.js"],
      "env": {
        "NEW_RELIC_API_KEY": "your-api-key-here",
        "NEW_RELIC_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

</details>

## Configuration

### Required Environment Variables

- `NEW_RELIC_API_KEY` - Your New Relic User API Key (required)
- `NEW_RELIC_ACCOUNT_ID` - Your New Relic Account ID (optional, can be provided per tool call)

### Getting Your New Relic Credentials

1. **API Key**:
   - Log in to [New Relic](https://one.newrelic.com)
   - Navigate to **API Keys** in the left sidebar
   - Create a new User API Key with appropriate permissions

2. **Account ID**:
   - Find your Account ID in the URL when logged into New Relic
   - Or navigate to **Administration** → **Access management** → **Accounts**

For detailed setup instructions, see [docs/new-relic-setup.md](docs/new-relic-setup.md).

## Usage Examples

Once configured, you can interact with New Relic through your MCP client:

### Query Your Data

```text
"Show me the average response time for my web application over the last hour"
"What are the top 10 slowest database queries today?"
"Display error rate trends for the production environment"
```

### Monitor Applications

```text
"List all my APM applications and their current status"
"Show me the health of my Node.js services"
"Which applications have active alerts?"
```

### Manage Alerts

```text
"Show me all open incidents"
"What critical alerts fired in the last 24 hours?"
"Acknowledge incident #12345"
```

### Search Infrastructure

```text
"Find all Redis databases in production"
"Show me entities with high CPU usage"
"List all synthetic monitors and their success rates"
```

## Available Tools

| Tool | Description |
|------|-------------|
| `run_nrql_query` | Execute NRQL queries to analyze your data |
| `list_apm_applications` | List all APM applications in your account |
| `search_entities` | Search for entities by name, type, or tags |
| `get_entity_details` | Get detailed information about a specific entity |
| `run_nerdgraph_query` | Execute custom NerdGraph GraphQL queries |
| `list_alert_policies` | List all alert policies in your account |
| `list_open_incidents` | List all open incidents with priority filtering |
| `acknowledge_incident` | Acknowledge an open incident |
| `list_synthetics_monitors` | List all Synthetics monitors |
| `create_browser_monitor` | Create a new browser-based Synthetics monitor |
| `get_account_details` | Get New Relic account details |

## Troubleshooting

<details>
<summary>Connection Issues</summary>

If you're having trouble connecting:

1. Verify your API key is valid:

   ```bash
   curl -X POST https://api.newrelic.com/graphql \
     -H 'Content-Type: application/json' \
     -H 'API-Key: YOUR_API_KEY' \
     -d '{"query":"{ actor { user { email } } }"}'
   ```

2. Check that your Account ID is correct
3. Ensure your API key has the necessary permissions
4. Check the MCP client logs for detailed error messages

</details>

<details>
<summary>Permission Errors</summary>

If you receive permission errors:

1. Verify your API key has the required permissions:
   - For NRQL queries: `NRQL query` permission
   - For APM data: `APM` read permissions
   - For alerts: `Alerts` read/write permissions

2. Create a new API key with broader permissions if needed

</details>

## Development

### Project Structure

```text
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

### Setup Development Environment

1. Clone the repository:

```bash
git clone https://github.com/cloudbring/newrelic-mcp.git
cd newrelic-mcp
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file:

```bash
NEW_RELIC_API_KEY=your-api-key-here
NEW_RELIC_ACCOUNT_ID=your-account-id
```

4. Build the project:

```bash
npm run build
```

### Development Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Format code
npm run format

# Test server startup
npm run test:server
```

### Testing

The project uses Test-Driven Development (TDD) with:

- **Vitest** for unit testing
- **Gherkin** for BDD testing
- **Evalite** for LLM response validation

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run BDD tests only
npm run test:bdd

# Run integration tests with real API
USE_REAL_ENV=true npm test
```

### Debugging

Use the MCP Inspector to test and debug the server:

```bash
# Run with MCP Inspector
npm run inspect

# Run with development server
npm run inspect:dev

# Run with environment variables
npm run inspect:env
```

See [docs/mcp-inspector-setup.md](docs/mcp-inspector-setup.md) for detailed instructions.

### Architecture

The server follows a modular architecture with:

- **Client Layer**: Handles New Relic API communication
- **Tools Layer**: Implements MCP tool specifications
- **Server Layer**: Manages MCP protocol and tool routing

Each tool:

- Has a single, focused purpose
- Validates inputs using Zod schemas
- Returns structured, typed responses
- Includes comprehensive error handling

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests first (TDD approach)
4. Implement your feature
5. Ensure all tests pass (`npm test`)
6. Maintain >90% code coverage
7. Run linting (`npm run lint`)
8. Commit your changes (commits will be auto-formatted)
9. Push to your branch
10. Open a Pull Request

### Code Style

This project uses:

- **Biome** for linting and formatting
- **TypeScript** with strict mode
- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** always

## Documentation

- [New Relic Setup Guide](docs/new-relic-setup.md) - Detailed credential setup
- [MCP Inspector Setup](docs/mcp-inspector-setup.md) - Testing and debugging
- [Logging & Telemetry](docs/logging-telemetry.md) - Test monitoring
- [Implementation Details](docs/implementation.md) - Architecture deep dive

## Support

- 🐛 [Report bugs](https://github.com/cloudbring/newrelic-mcp/issues)
- 💡 [Request features](https://github.com/cloudbring/newrelic-mcp/issues)
- 💬 [Join discussions](https://github.com/cloudbring/newrelic-mcp/discussions)
- 📖 [Read the docs](https://github.com/cloudbring/newrelic-mcp/tree/main/docs)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is not affiliated with, endorsed by, or supported by New Relic, Inc. It is an independent open-source project that uses New Relic's public APIs.

## Acknowledgments

- Built on the [Model Context Protocol](https://modelcontextprotocol.io) specification
- Integrates with [New Relic's](https://newrelic.com) observability platform APIs
- Inspired by the broader MCP ecosystem

---

Made with ❤️ by [@cloudbring](https://github.com/cloudbring) using Cursor and Claude Code
