# Publishing Guide for New Relic MCP Server

This guide documents the secure and automated publishing process for the New Relic MCP server.

## 1) CI-based automated releases (recommended)

Releases are automated via GitHub Actions and npm provenance.

What happens on push to `main`:
- CI runs tests, lint, typecheck, and build on Node 20.
- If `package.json` version differs from the version on npm, CI publishes the package with provenance and creates a GitHub Release with notes extracted from `CHANGELOG.md`.

Prerequisites
- In GitHub repo: Settings → Actions → General → Workflow permissions: Read and write permissions
- Secret: `NPM_TOKEN` (npm automation token, not a personal token)
- Optional: Repository variables for integration tests (e.g. `USE_REAL_ENV`, `NEW_RELIC_API_KEY`, `NEW_RELIC_ACCOUNT_ID`)

Security and best practices
- `package.json` enforces `"engines": { "node": ">=20" }` and `publishConfig.provenance: true`.
- Publishing uses an npm automation token via `NODE_AUTH_TOKEN` in CI.
- Only publishes from `main` and only when the version changes.

How to cut a release
1. Update `CHANGELOG.md` (Keep a Changelog) by moving items from Unreleased to a new version section.
2. Bump the version using semantic versioning:
   ```bash
   # choose one of: patch | minor | major
   npm version patch
   git push origin main --tags
   ```
3. CI will:
   - Validate (tests/lint/typecheck/build)
   - Publish to npm (if version changed)
   - Create a GitHub Release with notes from the changelog

Notes
- A prepack step builds the package before publish.
- Binary is exposed via `bin.newrelic-mcp` → `dist/server.js`. Ensure the built file is executable and contains a shebang (`#!/usr/bin/env node`). If needed, add it to `src/server.ts`'s first line and rebuild.

## 2) Manual publish (fallback)

Use only when CI is unavailable. Prefer automated releases above.

```bash
npm ci
npm run build

# optional dry run
npm publish --dry-run

# publish (public package with provenance)
NPM_CONFIG_PROVENANCE=true npm publish --access public
```

## 3) Smithery Setup

### Prerequisites
- Published NPM package
- GitHub repository set up

### Submit to Smithery

1. Go to https://smithery.ai/submit-mcp
2. Fill in the form:
   - **Name**: New Relic MCP
   - **Package Name**: newrelic-mcp
   - **Description**: Model Context Protocol server for New Relic observability platform
   - **Repository**: https://github.com/cloudbring/newrelic-mcp
   - **NPM Package**: https://www.npmjs.com/package/newrelic-mcp
   - **Author**: @cloudbring
   - **Categories**: Select "Monitoring", "DevOps", "Observability"
   - **License**: MIT

3. Provide configuration example:
```json
{
  "mcpServers": {
    "newrelic": {
      "command": "npx",
      "args": ["-y", "newrelic-mcp"],
      "env": {
        "NEW_RELIC_API_KEY": "your-api-key",
        "NEW_RELIC_ACCOUNT_ID": "your-account-id"
      }
    }
  }
}
```

### Smithery CLI Installation
Users can install via Smithery:
```bash
npx @smithery/cli install newrelic-mcp --client claude
```

## 4. Other MCP Registries

### MCP Hub (Official Registry)
Submit at: https://github.com/modelcontextprotocol/mcp-hub
1. Fork the repository
2. Add your server to `servers.json`
3. Submit PR

Example entry:
```json
{
  "name": "newrelic-mcp",
  "description": "New Relic observability platform integration",
  "author": "cloudbring",
  "repository": "https://github.com/cloudbring/newrelic-mcp",
  "npm": "newrelic-mcp",
  "categories": ["monitoring", "observability", "devops"]
}
```

### Awesome MCP Servers
Submit PR to: https://github.com/punkpeye/awesome-mcp-servers

Add to appropriate section:
```markdown
- [New Relic MCP](https://github.com/cloudbring/newrelic-mcp) - Query metrics, manage alerts, and monitor applications in New Relic
```

### Claude Desktop App Store (Future)
When Anthropic launches an app store, ensure you're registered.

## 4. Version Management

### Semantic Versioning
Use semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Process
Use semantic versioning and keep `CHANGELOG.md` in sync with releases (Keep a Changelog).

```bash
# Update CHANGELOG.md (move Unreleased → new version section)

# Update version
npm version patch  # or minor/major

# Push and tag
git push origin main --tags

# GitHub Actions (CI) will build, test, publish (if version changed),
# and create a GitHub Release with notes from CHANGELOG.md
```

## 5. Marketing & Documentation

### Create Launch Post
1. Write blog post/tweet announcing the MCP server
2. Include:
   - What it does
   - Installation instructions
   - Example use cases
   - Link to GitHub

### Submit to Communities
- Anthropic Discord (if you have access)
- r/LocalLLaMA subreddit
- r/OpenAI subreddit
- Hacker News (Show HN post)
- New Relic community forums (with disclaimer about being unofficial)
- MCP GitHub Discussions: https://github.com/modelcontextprotocol/specification/discussions

### Documentation Sites
Consider creating:
- GitHub Pages site from `docs/` folder
- Video tutorial
- Example notebooks

## 6. Monitoring

### NPM Statistics
Check downloads at: https://www.npmjs.com/package/newrelic-mcp

### GitHub Insights
Monitor:
- Stars
- Issues
- Pull requests
- Fork count

### User Feedback
- Enable GitHub Discussions
- Monitor issues for bug reports
- Check Smithery reviews

## Checklist

Before publishing, ensure:

- [ ] All tests pass (`npm test`)
- [ ] Coverage is >90% (`npm run test:coverage`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation is complete
- [ ] `.env.example` has clear instructions
- [ ] README has installation for all platforms
- [ ] Package.json has all required fields
- [ ] GitHub Actions CI is set up
- [ ] Shebang added to server.ts
- [ ] Build works (`npm run build`)
- [ ] Local testing works (`npx . ` in project root)

## Troubleshooting

### NPM Publish Errors

**402 Payment Required**: 
- Package name might be taken or reserved
- Try different name or namespace (@cloudbring/newrelic-mcp)

**403 Forbidden**:
- Not logged in: `npm login`
- No publish access: check npm account

**E404 Not Found**:
- For scoped packages, use: `npm publish --access public`

### Smithery Issues
- Ensure NPM package is published first
- Verify GitHub repo is public
- Check smithery.json is valid

### GitHub Actions Failures
- Check NPM_TOKEN secret is set
- Ensure Node version compatibility
- Review workflow logs

## Support

For issues or questions:
- GitHub Issues: https://github.com/cloudbring/newrelic-mcp/issues
- Email: [your email]
- Twitter: @cloudbring