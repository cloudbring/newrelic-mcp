# Story: list_open_incidents (REST)

## Summary

List open alert incidents via REST v2.

## Endpoint(s)

- GET `/alerts_incidents.json` (verify path/params in Swagger)
- Base URLs: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`

## Auth

- Header: `Api-Key: <USER_API_KEY>`

## Parameters

- `only_open` (boolean, default true) — if supported; fallback to filtering client-side if not
- `priority` ("CRITICAL" | "HIGH" | "MEDIUM" | "LOW", optional) — if supported
- `page` (number, optional)
- `cursor` (string, optional)
- `auto_paginate` (boolean, default false, optional)
- `region` ("US" | "EU", default "US")

## Zod schema (tool input)

```ts
import { z } from "zod";

export const ListOpenIncidentsParams = z.object({
  only_open: z.boolean().default(true).optional(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]).optional(),
  page: z.number().int().positive().optional(),
  cursor: z.string().optional(),
  auto_paginate: z.boolean().default(false).optional(),
  region: z.enum(["US", "EU"]).default("US"),
});
export type ListOpenIncidentsParams = z.infer<typeof ListOpenIncidentsParams>;
```

## Pagination flow

```mermaid
graph TD
  A[Start] --> B[GET first incidents page]
  B --> C{Has next?}
  C -- Yes & auto_paginate --> B
  C -- No or !auto_paginate --> D[Return incidents]
```

## Acceptance criteria

- Returns incidents filtered to open ones (server- or client-side) with pagination metadata.

## Test plan

- Filtering behavior and pagination handling.

## References

- Swagger/OpenAPI: `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)
