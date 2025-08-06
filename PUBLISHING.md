# Publishing Guide for New Relic MCP Server

This guide walks through publishing the New Relic MCP server to various platforms.

## 1. GitHub Repository Setup

### Create New Repository
1. Go to https://github.com/new
2. Create repository: `cloudbring/newrelic-mcp`
3. Make it public
4. **DON'T** initialize with README (we already have one)

### Update Local Repository
```bash
# Remove old remote
git remote remove gh

# Add new remote
git remote add origin git@github.com:cloudbring/newrelic-mcp.git

# Push all branches and tags
git push -u origin main
git push --tags
```

### Enable GitHub Actions
1. Go to Settings → Actions → General
2. Set "Workflow permissions" to "Read and write permissions"
3. Save

### Add NPM Token for Auto-Publishing
1. Get NPM token (see section 2)
2. Go to Settings → Secrets and variables → Actions
3. Add new secret: `NPM_TOKEN` with your npm token

## 2. NPM Package Publishing

### Initial Setup
1. Create NPM account at https://www.npmjs.com/signup
2. Login locally:
```bash
npm login
```

### Generate NPM Token
```bash
# Generate automation token for CI/CD
npm token create --read-only=false --cidr=0.0.0.0/0
```
Save this token for GitHub Actions (NPM_TOKEN secret)

### Prepare Package
```bash
# Ensure package is built
npm run build

# Test locally that it works
node dist/server.js

# Make bin executable
chmod +x dist/server.js
```

### Add Shebang to Server
Edit `src/server.ts` and add at the very top:
```typescript
#!/usr/bin/env node
```

Then rebuild:
```bash
npm run build
```

### Publish to NPM
```bash
# Dry run to see what will be published
npm publish --dry-run

# Publish for real
npm publish --access public
```

### Test Installation
```bash
# Test global installation
npm install -g newrelic-mcp
newrelic-mcp

# Test npx
npx newrelic-mcp
```

## 3. Smithery Setup

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

## 5. Version Management

### Semantic Versioning
Use semantic versioning (MAJOR.MINOR.PATCH):
- MAJOR: Breaking changes
- MINOR: New features (backwards compatible)
- PATCH: Bug fixes

### Release Process
```bash
# Update version
npm version patch  # or minor/major

# This creates a git tag
git push origin main --tags

# GitHub Actions will auto-publish to NPM
```

## 6. Marketing & Documentation

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

## 7. Monitoring

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