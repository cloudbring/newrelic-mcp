# Rule: Maintain CHANGELOG.md using Keep a Changelog

Applies to this repo. Follow https://keepachangelog.com/en/1.1.0/ and Semantic Versioning.

## When to update
- On every PR that changes behavior, docs, CI, or dependencies, add an entry under `## [Unreleased]`.
- On release PRs, move `Unreleased` entries to a new version section and date it (YYYY-MM-DD).

## Required sections per version
- `### Added` – new features, new tools, new docs
- `### Changed` – behavior changes, refactors, CI/release changes
- `### Deprecated` – features to be removed
- `### Removed` – features removed
- `### Fixed` – bug fixes
- `### Security` – vulnerabilities, mitigations

## Unreleased template (keep at top)
```
## [Unreleased]

### Added

### Changed

### Deprecated

### Removed

### Fixed

### Security
```

## Release process (assistant should guide)
1) Confirm `CHANGELOG.md` has an `Unreleased` section populated since last release.
2) Create a new version section: `## [x.y.z] - YYYY-MM-DD` and move entries from `Unreleased`.
3) Add link references at bottom:
```
[Unreleased]: https://github.com/cloudbring/newrelic-mcp/compare/vx.y.z...HEAD
[x.y.z]: https://github.com/cloudbring/newrelic-mcp/releases/tag/vx.y.z
```
4) Bump `package.json` and other version files, commit via PR.
5) Merge PR; CI publishes to npm and creates GitHub Release. Use the version section as release notes body if requested.

## Mapping commit types → sections
- feat: Added
- fix: Fixed
- perf/refactor/chore/release/ci: Changed
- docs: Changed (or Added if new docs/guide)
- security: Security
- deprecate: Deprecated; remove: Removed

## Assistant enforcement
- If a PR or edit changes user-facing behavior or tooling, propose a changelog entry under `Unreleased` with the correct section and terse bullet.
- On release tasks, perform the mechanical steps above and validate link refs.
- Keep lines concise; avoid commit logs. Changelog is for humans.

