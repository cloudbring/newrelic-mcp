# Story: list_alert_policies (REST)

## Summary

List alert policies via REST v2.

## Endpoint(s)

- GET `/alerts_policies.json` (verify path in Swagger)
- Base URLs: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`

## Auth

- Header: `Api-Key: <USER_API_KEY>`

## Parameters

- `filter_name` (string, optional) — if supported
- `page` (number, optional)
- `cursor` (string, optional)
- `auto_paginate` (boolean, default false, optional)
- `region` ("US" | "EU", default "US")

## Zod schema (tool input)

```ts
import { z } from "zod";

export const ListAlertPoliciesParams = z.object({
  filter_name: z.string().optional(),
  page: z.number().int().positive().optional(),
  cursor: z.string().optional(),
  auto_paginate: z.boolean().default(false),
  region: z.enum(["US", "EU"]).default("US"),
});
export type ListAlertPoliciesParams = z.infer<typeof ListAlertPoliciesParams>;
```

## Acceptance criteria

- Returns array of policies with pagination metadata.

## Test plan

- URL building, pagination, and error handling tests.

## References

- Swagger/OpenAPI: `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)
- API Explorer guide: [Getting started with New Relic's API Explorer](https://docs.newrelic.com/docs/features/getting-started-with-new-relics-api-explorer)
