## Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

- See: https://keepachangelog.com/en/1.1.0/
- See: https://semver.org/spec/v2.0.0.html

## [Unreleased]

### Added

- Planned: Additional New Relic tools and docs improvements

### Changed

- Planned: Refinements based on community feedback

### Fixed

- Planned: Minor bug fixes and DX improvements

## [2.1.1] - 2026-07-11

### Added

- `mcpName` (`io.github.cloudbring/newrelic-mcp`) in package.json and `server.json`
  for publication to the official MCP Registry (registry.modelcontextprotocol.io)

### Changed

- README installation section rewritten for 2026: npx-first, MCP Registry listing,
  current Smithery CLI syntax (the 2025 `@smithery/cli install` flow and hosted
  stdio deployments no longer exist)

## [2.1.0] - 2026-07-11

### Added

- Regional support for NerdGraph API endpoints (US and EU) (#23, thanks @vksjangra)
- `NEW_RELIC_REGION` environment variable to configure data center region (closes #20)
- Region-aware URL selection for all NerdGraph operations

### Changed

- NerdGraph client now dynamically selects endpoint based on `NEW_RELIC_REGION` env var
- Default region is US if not specified
- Updated `smithery.json` to document `NEW_RELIC_REGION` environment variable
- Updated README with examples for both US and EU regions
- Added test utilities: added region helpers into shared `test/utils/region-helpers.ts`
- Release hardening: Node >=20 engines requirement, npm provenance, `prepack` build
- Corrected README installation command (#21, thanks @gesposito)

### Fixed

- Fixed NerdGraph API calls to work correctly for EU region accounts
- All NerdGraph tools now respect regional configuration
- Fixed region test asserting env-derived URL against a hardcoded EU client

## [2.0.0] - 2025-08-09

### Added

- New REST v2 client (`src/client/rest-client.ts`) with region-aware base URL, auth headers, query serialization, and RFC 5988 Link parsing.
- REST tools:
  - Deployments: create, list (auto-paginate), delete with confirm.
  - APM applications: list with filters and auto-pagination.
  - Metrics: list metric names for host; get metric data for host; list application hosts (auto-paginate).
  - Alerts (REST): list policies; list incidents with client-side filtering for open/priority.
- Unit tests for all REST tools and helpers; integration tests for REST client against US/EU endpoints (conditionally skipped without creds).
- Documentation: consolidated under `docs/` with a pinned Swagger guidance and per-tool stories.

### Changed

- Server wiring to register new REST tools alongside existing NerdGraph tools.

### Breaking changes

- No breaking changes. Existing tool names and behaviors remain intact; this release adds new REST tools alongside the current NerdGraph tools.

### Notes

- Acknowledge incident via REST is not supported; continue using NerdGraph (`aiIssuesAckIssue`).

## [1.1.1] - 2025-08-08

### Changed

- CI now runs on Node 20 only; publishing gated on version change and allowed from `main` or `master`.
- Added npm provenance, `engines.node >= 20`, and `prepack` build to ensure secure/consistent releases.
- Refined Biome config: warn on `noExplicitAny` globally; disabled for tests via overrides.
- Split large server edge-case tests into focused files (<100 lines) for faster runs and clarity.
- Improved server constructor to allow injected client without requiring `NEW_RELIC_API_KEY` (testability).

### Fixed

- Stabilized Vitest ESM/CJS behavior in CI by using Node 20 and non-interactive test script.
- Minor test flake fixes and formatting.

## [1.1.2] - 2025-08-08

### Fixed

- CI npm provenance: grant GitHub OIDC `id-token: write` permission for publishing with provenance.

## [1.1.0] - 2025-08-08

### Added

- Implemented `run_nerdgraph_query` tool with optional `variables` for NerdGraph GraphQL calls.
- Integration tests for NerdGraph using real credentials gated by `USE_REAL_ENV`.
- GitHub Actions pipeline to publish to npm and create GitHub Releases, attaching the npm tarball.
- Zod validation for NerdGraph tool inputs.
- `test:watch` script; default `npm test` runs in non-watch mode.

### Changed

- Fixed tool dispatch naming and improved error handling/typing in `src/server.ts`.
- CI now accepts secrets for integration tests and supports Node 18/20.

### Security

- Ignored `.cursor/` directory and removed committed files to avoid secret scanning violations.

[Unreleased]: https://github.com/cloudbring/newrelic-mcp/compare/v2.0.1...HEAD
[2.0.1]: https://github.com/cloudbring/newrelic-mcp/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/cloudbring/newrelic-mcp/compare/v1.1.2...v2.0.0
[1.1.2]: https://github.com/cloudbring/newrelic-mcp/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/cloudbring/newrelic-mcp/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/cloudbring/newrelic-mcp/releases/tag/v1.1.0
