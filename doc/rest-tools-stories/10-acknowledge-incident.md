# Story: acknowledge_incident (REST)

## Summary

Acknowledge an incident via REST, if the v2 API supports an update endpoint. If not, continue using the existing NerdGraph tool.

## Endpoint(s)

- Candidate: `PUT /alerts_incidents/{id}.json` or similar — verify availability in Swagger
- Base URLs: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`

## Auth

- Header: `Api-Key: <USER_API_KEY>`

## Parameters

- `incident_id` (number, required)
- `confirm` (boolean, required) — must be `true` to acknowledge
- `region` ("US" | "EU", default "US")

## Zod schema (tool input)

```ts
import { z } from "zod";

export const AcknowledgeIncidentParams = z.object({
  incident_id: z.number().int().positive(),
  confirm: z.literal(true),
  region: z.enum(["US", "EU"]).default("US"),
});
export type AcknowledgeIncidentParams = z.infer<typeof AcknowledgeIncidentParams>;
```

## Feasibility check

- If the REST v2 API does not provide an incident update/ack endpoint, mark this story as blocked and note that the NerdGraph tool remains the supported path.

## Acceptance criteria

- Requires `confirm === true`.
- Returns updated incident state (acknowledged) on success.
- Clear error if endpoint is unavailable in REST v2.

## Test plan

- Unit tests for confirm gating and URL building.

## References

- Swagger/OpenAPI: `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)
- API Explorer guide: [Getting started with New Relic's API Explorer](https://docs.newrelic.com/docs/features/getting-started-with-new-relics-api-explorer)
