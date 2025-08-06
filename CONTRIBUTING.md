# Contributing to New Relic MCP

First off, thank you for considering contributing to New Relic MCP! It's people like you that make this tool better for everyone.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct:
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Show empathy towards other community members

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples**
- **Describe the behavior you observed and expected**
- **Include logs and error messages**
- **Note your environment** (OS, Node version, MCP client)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the proposed enhancement**
- **Explain why this enhancement would be useful**
- **List any alternative solutions you've considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Write tests first** - We follow TDD practices
3. **Ensure your code passes all tests** - Run `npm test`
4. **Maintain code coverage** - We aim for >90% coverage
5. **Follow the code style** - Run `npm run lint` and `npm run format`
6. **Update documentation** - Keep README and docs in sync
7. **Write clear commit messages** - Follow conventional commits when possible

## Development Process

### Setup Your Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/newrelic-mcp.git
cd newrelic-mcp

# Install dependencies
npm install

# Create your feature branch
git checkout -b feature/your-feature-name

# Set up your .env file for testing
cp .env.example .env
# Add your New Relic credentials
```

### Test-Driven Development (TDD)

We follow TDD practices. Always write tests before implementing features:

1. **Write a failing test** that defines the desired behavior
2. **Write minimal code** to make the test pass
3. **Refactor** while keeping tests green
4. **Repeat** for each piece of functionality

Example workflow:
```bash
# 1. Write your test
npm test -- --watch

# 2. Implement the feature
# 3. Ensure tests pass
npm test

# 4. Check coverage
npm run test:coverage
```

### Code Style Guidelines

This project uses **Biome** for linting and formatting:

- **TypeScript** with strict mode enabled
- **2 spaces** for indentation
- **Single quotes** for strings
- **Semicolons** always required
- **100 character** line width maximum

```bash
# Check code style
npm run lint

# Auto-fix formatting issues
npm run format

# Type checking
npm run typecheck
```

### Testing Guidelines

#### Unit Tests
- Test individual functions and methods
- Mock external dependencies
- Aim for comprehensive edge case coverage

#### Integration Tests
- Test tool integration with New Relic API
- Use `USE_REAL_ENV=true` for real API tests
- Ensure proper error handling

#### BDD Tests
- Write Gherkin features for user scenarios
- Located in `test/features/`
- Run with `npm run test:bdd`

### Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for all public APIs
- Update tool descriptions in the server
- Include examples for new features

## Project Structure

```
src/
├── server.ts           # Main MCP server - handles protocol
├── client/
│   └── newrelic-client.ts  # API client - handles New Relic communication
└── tools/
    ├── nrql.ts         # NRQL query implementation
    ├── apm.ts          # APM tools
    ├── entity.ts       # Entity management
    ├── alert.ts        # Alert and incident tools
    ├── synthetics.ts   # Synthetics monitoring
    └── nerdgraph.ts    # GraphQL API access

test/
├── features/           # BDD test features
├── utils/             # Test utilities
└── **/*.test.ts       # Unit tests (co-located with source)
```

## Adding New Tools

To add a new tool:

1. **Define the tool specification** in the appropriate file under `src/tools/`
2. **Implement the tool logic** with proper input validation
3. **Write comprehensive tests** including unit and integration tests
4. **Update the server** to register the new tool
5. **Document the tool** in README.md and add examples
6. **Test with MCP Inspector** to ensure proper integration

Example tool structure:
```typescript
export class MyNewTool {
  constructor(private client: NewRelicClient) {}

  get tool(): Tool {
    return {
      name: 'my_new_tool',
      description: 'Clear description of what this tool does',
      inputSchema: {
        type: 'object',
        properties: {
          // Define inputs with Zod schemas
        },
        required: ['requiredField']
      }
    };
  }

  async execute(input: any): Promise<MyToolResult> {
    // Validate input
    // Call New Relic API
    // Process response
    // Return structured result
  }
}
```

## Commit Message Guidelines

We prefer conventional commits but don't enforce it strictly:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Examples:
```
feat: Add support for Log Management queries
fix: Handle empty NRQL query results correctly
docs: Update installation instructions for Zed
test: Add integration tests for alert acknowledgment
```

## Review Process

1. **Automated checks** run on all PRs (tests, linting, coverage)
2. **Code review** by maintainers focusing on:
   - Code quality and style
   - Test coverage and quality
   - Documentation completeness
   - Breaking changes
3. **Testing** in real environments when applicable
4. **Merge** when all checks pass and approved

## Release Process

1. Maintainers handle releases following semantic versioning
2. Changelog is updated with notable changes
3. NPM package is published
4. Smithery deployment is updated
5. GitHub release is created with notes

## Getting Help

- **Discord**: Join our community chat (link in README)
- **Issues**: Ask questions in GitHub issues
- **Discussions**: Start a discussion for broader topics

## Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes for significant contributions
- README acknowledgments for major features

Thank you for contributing! 🎉