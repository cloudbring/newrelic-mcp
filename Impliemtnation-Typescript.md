# Tech Stack

- Programming Language: Typescript
- Server: Smithery
- Testing: `@amiceli/vitest-cucumber`, `https://www.evalite.dev/what-is-evalite

## Goals

1. Create an MCP server for New Relic

- Application Behavior defined in Gherkin files in the `test/features` directory
- Application Behavior is tested using `@amiceli/vitest-cucumber`
- MCP Server responses are tested using Evalite to validate expected behavior
  through evaluations given that LLM responses are non-deterministic.

2. Deploy the MCP server to Smithery

## Testing

### Evalite

- Evalite is based on Vitest

Evalite is a tool for testing and evaluating the performance of AI-powered content. It allows users to test and evaluate the performance of AI-powered content, and to track the performance of their content.

Documentation: https://www.evalite.dev/what-is-evalite

Quickstart: https://www.evalite.dev/quickstart

ENV Variables: https://www.evalite.dev/guides/environment-variables

### `@amiceli/vitest-cucumber`

- `@amiceli/vitest-cucumber` is a plugin for Vitest that allows you to use Cucumber with Vitest.

- `@amiceli/vitest-cucumber` is based on `@cucumber/cucumber` and is a
  plugin for vitest.

Documentation

- Presentation: https://vitest-cucumber.miceli.click/get-started/presentation
- Installation: https://vitest-cucumber.miceli.click/get-started/install/
- Setup (as a plugin for vitest): https://vitest-cucumber.miceli.click/plugin/setup/

## Smithery

### Overview

Smithery is a platform for creating and sharing AI-powered content. It allows users to create and share AI-powered content, and to track the performance of their content.

Documentation: https://smithery.ai/docs/getting_started/quickstart_build
