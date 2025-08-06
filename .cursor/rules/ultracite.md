# Cursor AI Rules - Ultracite Configuration

## Code Style and Formatting

- Use Biome for all formatting and linting
- Follow the configuration in `biome.json`
- Use single quotes for JavaScript/TypeScript strings
- Use double quotes for JSX attributes
- Always use semicolons
- Use 2 spaces for indentation
- Maximum line width: 100 characters
- Use trailing commas in ES5 style

## TypeScript Best Practices

- Prefer `const` over `let` when variables won't be reassigned
- Use template literals for string concatenation
- Avoid using `any` type; use `unknown` or proper typing instead
- Always define return types for functions
- Use interfaces over type aliases when possible
- Prefer optional chaining (`?.`) over manual null checks

## Project-Specific Guidelines

### MCP Server Development

- Follow Model Context Protocol specifications
- Use proper error handling with descriptive error messages
- Implement proper input validation using Zod schemas
- Keep tools focused and single-purpose
- Document all tools with clear descriptions

### New Relic Integration

- Never expose API keys or sensitive credentials in code
- Use environment variables for all configuration
- Validate all NRQL queries before execution
- Handle API errors gracefully with proper error messages
- Use the NewRelicClient class for all API interactions

### Testing Practices

- Write tests using Vitest
- Use BDD features with Gherkin syntax
- Maintain test coverage above 90%
- Mock external API calls in unit tests
- Use real credentials only in integration tests with USE_REAL_ENV flag

## File Organization

- Keep source code in `src/`
- Keep tests in `test/`
- Keep documentation in `docs/`
- Keep scripts in `scripts/`
- Use clear, descriptive file names
- Group related functionality in subdirectories

## Security

- Never commit `.env` or `.env.test` files
- Never log sensitive information
- Validate all user inputs
- Sanitize data before API calls
- Use proper authentication for all external services

## Performance

- Avoid unnecessary loops and iterations
- Use async/await properly
- Implement proper caching where appropriate
- Keep bundle size minimal
- Use lazy loading when possible

## Documentation

- Document all public APIs
- Use JSDoc comments for functions
- Keep README.md up to date
- Document environment variables
- Provide clear examples in documentation

## Git Practices

- Write clear, concise commit messages
- Never commit sensitive data
- Keep commits focused and atomic
- Use conventional commit format when possible
- Review changes before committing
