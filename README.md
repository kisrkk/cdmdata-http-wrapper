# CDM Data HTTP MCP Wrapper

Minimal stdio MCP server for the CDM Data HTTP API.

It has no npm dependencies and uses Node 20 built-in `fetch`.

## Environment

```text
CDMDATA_BASE_URL=https://dbs5.cplservice.com
CDMDATA_ACCESS_KEY=AK...
CDMDATA_SECRET_KEY=SK...
CDMDATA_ADMIN_TOKEN=...
```

Alternative host:

```text
CDMDATA_BASE_URL=https://dbs5.cplservice.net
```

`CDMDATA_ACCESS_KEY` and `CDMDATA_SECRET_KEY` are required for data tools.

`CDMDATA_ADMIN_TOKEN` is required for API key management tools.

## Run

```bash
node mcp/cdmdata-http-wrapper/server.js
```
