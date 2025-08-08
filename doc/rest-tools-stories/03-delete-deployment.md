# Story: delete_deployment (REST)

## Summary

Delete a deployment record for an APM application. This is a privileged action.

## Endpoint(s)

- DELETE `/applications/{application_id}/deployments/{id}.json`
- Base URLs: US `https://api.newrelic.com/v2/`, EU `https://api.eu.newrelic.com/v2/`

## Auth

- Header: `Api-Key: <USER_API_KEY>` (User API key with admin role permissions required)

## Parameters

- `application_id` (number, required)
- `id` (number, required) — deployment record id
- `confirm` (boolean, required) — must be `true` to perform delete
- `region` ("US" | "EU", default "US")

## Zod schema (tool input)

```ts
import { z } from "zod";

export const DeleteDeploymentParams = z.object({
  application_id: z.number().int().positive(),
  id: z.number().int().positive(),
  confirm: z.literal(true),
  region: z.enum(["US", "EU"]).default("US"),
});
export type DeleteDeploymentParams = z.infer<typeof DeleteDeploymentParams>;
```

## Acceptance criteria

- Refuses to call API unless `confirm === true`.
- Sends DELETE with `Api-Key` header; selects base URL by `region`.
- Returns success payload on 200; surfaces 401/403/404 clearly; maps other 4xx/5xx with status and snippet.

## Test plan

- Unit tests: confirm must be true; invalid ids rejected; URL building; error mapping (401/403/404).

## References

- Swagger/OpenAPI: `https://api.newrelic.com/docs/swagger.yml` [source](https://api.newrelic.com/docs/swagger.yml)
- API key requirements: [REST API v2 requirements: API key](https://docs.newrelic.com/docs/apis/rest-api-v2/requirements/api-key)

## Out of scope

- Creating/listing deployments (separate stories).
