# Story: create_deployment (REST)

## Summary

Create a deployment record (marker) for an APM application using the New Relic REST v2 API. This helps correlate code changes with performance.

## Endpoint(s)

- POST `/applications/{application_id}/deployments.json`
- Base URLs: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`

## Auth

- Header: `Api-Key: <USER_API_KEY>` (User API Key)
- Note: Admin key not required to create, but is required to delete deployment records.

## Parameters

- `application_id` (number, required)
- `revision` (string, required) — e.g., git SHA
- `changelog` (string, optional)
- `description` (string, optional)
- `user` (string, optional)
- `region` ("US" | "EU", default "US")

## Zod schema (tool input)

```ts
import { z } from "zod";

export const CreateDeploymentParams = z.object({
  application_id: z.number().int().positive(),
  revision: z.string().min(1),
  changelog: z.string().optional(),
  description: z.string().optional(),
  user: z.string().optional(),
  region: z.enum(["US", "EU"]).default("US"),
});
export type CreateDeploymentParams = z.infer<typeof CreateDeploymentParams>;
```

## Response handling

- Expect 200 on success with JSON payload containing the deployment record.
- On 401: return a clear error (invalid API key).
- On 4xx/5xx: include status and response body snippet.

## Acceptance criteria

- Sends POST with headers `Content-Type: application/json` and `Api-Key`.
- Correctly selects base URL by `region`.
- Validates inputs via Zod schema.
- Returns parsed JSON response; includes request metadata (endpoint, region).
- Handles error conditions with helpful messages.

## Implementation notes

- Implement in a REST client helper with shared base URL + headers.
- Time recorded is set by New Relic (current UTC).

## Test plan

- Unit test: validates Zod schema rejects invalid inputs (missing revision, negative app id).
- Unit test: builds correct URL for US/EU.
- Unit test: handles 401, 400 with informative errors.
- Integration (optional, behind env guard): create a deployment to a test app id.

## References

- Swagger/OpenAPI (endpoint and schemas): `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)
- API Explorer guide: [Getting started with New Relic's API Explorer](https://docs.newrelic.com/docs/features/getting-started-with-new-relics-api-explorer)
- API key requirements: [REST API v2 requirements: API key](https://docs.newrelic.com/docs/apis/rest-api-v2/requirements/api-key)

## Out of scope

- Deleting deployments (covered by a separate story).
- Listing deployments (separate story).
