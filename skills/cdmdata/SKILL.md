---
name: cdmdata
description: Read CDM Kit energy meter data (raw/hourly/daily) and manage CDM Data API keys via the cdmdata MCP server. Use when the user asks about CDM kit data, energy meter readings, device data from dbs5.cplservice.com, or CDM API key management.
---

# CDM Data

Use the `cdmdata` MCP server tools (`mcp__cdmdata__*`). Base URL: `https://dbs5.cplservice.com` (alt: `https://dbs5.cplservice.net`, override with `CDMDATA_BASE_URL`).

## Reading data

Tools: `cdmdata_getdata` (raw), `cdmdata_getdatahourly`, `cdmdata_getdatadaily`.

- `device_id` is required. If unknown, ask the user. Keys may be restricted to specific devices via `allowed_devices`.
- Always pass `limit` (max 1000) and `order: "datetime,desc"` for latest-first; default page size can be large.
- Date filters: `from`/`to` (dates, e.g. `2026-07-01`) or `from_time`/`to_time` (datetimes, e.g. `2026-07-07T00:00:00.000+0700`).
- `column`: comma-separated projection, e.g. `device_id,datetime,date,time,data`.
- `transform: "1"` flattens records; `format: "csv"` returns CSV.
- Response shape: `body.records.<collection>.columns` (array of column names) + `.records` (array of row arrays). The `data` column holds per-meter readings keyed by meter number (`"01"`–`"07"`), each with `energy`, `meterStatus`, `energy_used_status`.

## API key management

Tools: `cdmdata_apikey_create/list/get/usage/rename/update/revoke/delete`. These need `CDMDATA_ADMIN_TOKEN` set in the MCP server env; without it they fail with a clear error.

- `secret_key` is returned only once at creation — show it to the user immediately, never store it in files.
- Prefer `revoke` over `delete`; check `cdmdata_apikey_usage` before deleting.
- Restrict customer keys with `allowed_devices`.

## Errors

- `403 Invalid API key`: key revoked/inactive, or device_id not in `allowed_devices`.
- Missing env error: credentials not set in the MCP server registration.
