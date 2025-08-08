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

[Unreleased]: https://github.com/cloudbring/newrelic-mcp/compare/v1.1.2...HEAD
[1.1.2]: https://github.com/cloudbring/newrelic-mcp/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/cloudbring/newrelic-mcp/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/cloudbring/newrelic-mcp/releases/tag/v1.1.0
