# Story: list_application_hosts (REST)

## Summary

List hosts associated with a specific application, with optional filters.

## Endpoint(s)

- GET `/applications/{application_id}/hosts.json`
- Base URLs: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`

## Auth

- Header: `Api-Key: <USER_API_KEY>`

## Parameters

- `application_id` (number, required)
- `filter_hostname` (string, optional) — maps to `filter[hostname]`
- `filter_ids` (string, optional) — comma‑separated IDs, sent as `filter[ids]=1,2,3`
- `page` (number, optional)
- `cursor` (string, optional)
- `auto_paginate` (boolean, default false, optional)
- `region` ("US" | "EU", default "US")

## Zod schema (tool input)

```ts
import { z } from "zod";

export const ListApplicationHostsParams = z.object({
  application_id: z.number().int().positive(),
  filter_hostname: z.string().optional(),
  filter_ids: z.string().optional(),
  page: z.number().int().positive().optional(),
  cursor: z.string().optional(),
  auto_paginate: z.boolean().default(false),
  region: z.enum(["US", "EU"]).default("US"),
});
export type ListApplicationHostsParams = z.infer<typeof ListApplicationHostsParams>;
```

## Acceptance criteria

- Maps filters to the correct `filter[...]` query parameters.
- Returns list of hosts and pagination metadata.

## Test plan

- URL/query construction tests; pagination tests; error handling.

## References

- Swagger/OpenAPI: `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)
