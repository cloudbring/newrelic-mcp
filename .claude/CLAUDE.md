# Claude Code AI Rules - New Relic MCP Server

## Project Context

This is a Model Context Protocol (MCP) server for integrating with New Relic's observability platform. The project uses TypeScript, Vitest for testing, and follows Test-Driven Development (TDD) practices.

## Code Standards

### Formatting and Linting
- **Use Biome** for all code formatting and linting (configured in `biome.json`)
- Run `npm run lint` before committing code
- Run `npm run format` to auto-fix formatting issues
- Ensure no linting errors before marking tasks complete

### TypeScript Guidelines
- Always use TypeScript strict mode
- Define explicit return types for all functions
- Avoid `any` type - use `unknown` or proper types
- Use Zod for runtime validation of inputs
- Prefer interfaces for object shapes
- Use const assertions where appropriate

### Code Style
- Single quotes for strings in TypeScript/JavaScript
- Double quotes for JSX attributes
- Always use semicolons
- 2 spaces for indentation
- Maximum line width: 100 characters
- Use trailing commas in multiline arrays/objects

## Testing Requirements

### Test Coverage
- Maintain minimum 90% code coverage
- Write tests BEFORE implementing features (TDD)
- Use Vitest for all testing
- Use BDD with Gherkin features in `test/features/`

### Test Organization
- Unit tests: `test/**/*.test.ts`
- BDD tests: `test/features/**/*.spec.ts`
- Integration tests: Run with `USE_REAL_ENV=true`
- Mock external APIs in unit tests
- Use fixtures for test data

## New Relic Specific

### API Integration
- Always use the `NewRelicClient` class
- Never hardcode API keys or account IDs
- Validate all NRQL queries before execution
- Handle API errors with descriptive messages
- Implement proper retry logic for network failures

### Security
- Use environment variables for credentials
- Never log sensitive information
- Validate and sanitize all inputs
- Use `.env` for local development
- Use `.env.test` for test credentials (gitignored)

## MCP Development

### Tool Implementation
- Each tool should have a single, clear purpose
- Validate inputs using Zod schemas
- Return structured, typed responses
- Include comprehensive error handling
- Document all parameters and return values

### Server Guidelines
- Follow MCP protocol specifications exactly
- Implement proper JSON-RPC handling
- Use structured logging for debugging
- Handle connection lifecycle properly
- Implement graceful shutdown

## Project Structure

```
src/
├── server.ts           # Main MCP server
├── client/            # New Relic API client
└── tools/             # MCP tool implementations
test/
├── features/          # BDD feature files
├── utils/             # Test utilities
└── **/*.test.ts       # Unit tests
docs/                  # Documentation
scripts/               # Utility scripts
```

## Development Workflow

### Before Writing Code
1. Check existing code patterns in similar files
2. Review relevant test files
3. Understand the feature requirements
4. Plan the implementation approach

### While Writing Code
1. Follow existing code patterns
2. Write tests first (TDD)
3. Implement minimal code to pass tests
4. Refactor for clarity and performance
5. Update documentation if needed

### After Writing Code
1. Run `npm run lint` to check for issues
2. Run `npm run format` to fix formatting
3. Run `npm test` to ensure tests pass
4. Run `npm run typecheck` for type safety
5. Verify coverage with `npm run test:coverage`

## Git Practices

### Commit Guidelines
- Never commit sensitive data
- Check `.gitignore` before committing
- Write clear, descriptive commit messages
- Keep commits focused and atomic
- Run linting before committing

### Sensitive Directories (Never Commit)
- `.env` and `.env.test` files
- `.claude-flow/` directory
- `.hive-mind/` directory
- `.swarm/` directory
- Any directory with conversation logs

## Common Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build TypeScript

# Testing
npm test                # Run all tests
npm run test:coverage   # Check coverage
npm run test:bdd       # Run BDD tests only

# Linting & Formatting
npm run lint            # Check for issues
npm run format          # Auto-fix formatting
npm run typecheck       # Check TypeScript types

# Debugging
npm run inspect         # Use MCP Inspector
npm run test:server     # Test server startup
```

## Error Handling

- Always throw descriptive errors
- Use custom error classes when appropriate
- Include context in error messages
- Log errors appropriately
- Handle async errors properly

## Performance Considerations

- Minimize API calls to New Relic
- Implement caching where appropriate
- Use pagination for large result sets
- Optimize NRQL queries
- Monitor memory usage in long-running operations

## Documentation

- Update README.md for new features
- Document all environment variables
- Include usage examples
- Keep API documentation current
- Document any breaking changes