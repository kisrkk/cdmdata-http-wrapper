# CDM Data MCP Agent Skill

Use this MCP server when an agent needs to read CDM Kit data or manage CDM Data API keys through the HTTP API.

## Endpoint

Default base URL:

```text
https://dbs5.cplservice.com
```

Override with:

```text
CDMDATA_BASE_URL
```

Alternative host:

```text
https://dbs5.cplservice.net
```

## Credentials

Public data tools require:

```text
CDMDATA_ACCESS_KEY
CDMDATA_SECRET_KEY
```

API key management tools require:

```text
CDMDATA_ADMIN_TOKEN
```

Use the same AK/SK middleware behavior as the latest server implementation:

- Data requests send `x-api-access-key` and `x-api-secret-key`.
- Management requests send `Authorization: Bearer <token>`.
- Revoked or inactive keys fail with `403 Invalid API key`.
- Restricted keys can only read devices in `allowed_devices`.

## Tools

### Public Data

- `cdmdata_getdata`
- `cdmdata_getdatahourly`
- `cdmdata_getdatadaily`

Required input:

```json
{
  "device_id": "0004236908"
}
```

Common optional inputs:

```json
{
  "limit": 100,
  "page": 1,
  "from": "2025-06-01",
  "to": "2025-06-30",
  "from_time": "2025-06-25T00:00:00.000+0700",
  "to_time": "2025-06-26T00:00:00.000+0700",
  "order": "datetime,desc",
  "column": "device_id,datetime,date,time,data",
  "transform": "1"
}
```

### API Key Management

- `cdmdata_apikey_create`
- `cdmdata_apikey_list`
- `cdmdata_apikey_get`
- `cdmdata_apikey_usage`
- `cdmdata_apikey_rename`
- `cdmdata_apikey_update`
- `cdmdata_apikey_revoke`
- `cdmdata_apikey_delete`

Create example:

```json
{
  "name": "customer billing integration",
  "allowed_devices": ["0004236908", "0002855176"]
}
```

Usage example:

```json
{
  "id": "6a4cf34ed8da8b6b8e0d1681",
  "from": "2026-07-01",
  "to": "2026-07-31",
  "limit": 100
}
```

## Operational Guidance

- Do not expose `secret_key` after creation. The server only returns it once.
- Prefer `revoke` over hard `delete` unless the webmaster explicitly wants to remove the key metadata.
- Use `allowed_devices` for customer-specific keys.
- Use `cdmdata_apikey_usage` before deletion when usage history needs to be reviewed.
- For public read tools, ask for the target `device_id` if it is not known.

## Local Run

```bash
CDMDATA_BASE_URL=https://dbs5.cplservice.com \
CDMDATA_ACCESS_KEY=AK... \
CDMDATA_SECRET_KEY=SK... \
CDMDATA_ADMIN_TOKEN=... \
node mcp/cdmdata-http-wrapper/server.js
```
