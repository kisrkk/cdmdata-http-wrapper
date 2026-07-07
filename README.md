# CDM Data HTTP MCP Wrapper

Minimal stdio [MCP](https://modelcontextprotocol.io) server for the CDM Data HTTP API (`dbs5.cplservice.com`).

Zero npm dependencies — a single `server.js` using Node 20+ built-in `fetch`.

## Tools

| Tool | Description | Auth |
|------|-------------|------|
| `cdmdata_getdata` | Raw CDM kit data | AK/SK |
| `cdmdata_getdatahourly` | Hourly aggregated data | AK/SK |
| `cdmdata_getdatadaily` | Daily aggregated data | AK/SK |
| `cdmdata_apikey_create` / `list` / `get` / `usage` / `rename` / `update` / `revoke` / `delete` | API key management | Admin token |

## Requirements

- Node.js 20+
- CDM Data access key / secret key (data tools)
- Admin token (only for API key management tools)

## Install from GitHub

```bash
git clone https://github.com/kisrkk/cdmdata-http-wrapper.git
cd cdmdata-http-wrapper
```

### 1. Register the MCP server (Claude Code)

macOS / Linux:

```bash
claude mcp add -s user cdmdata \
  -e CDMDATA_BASE_URL=https://dbs5.cplservice.com \
  -e CDMDATA_ACCESS_KEY=AK... \
  -e CDMDATA_SECRET_KEY=SK... \
  -- node "$(pwd)/server.js"
```

Windows (PowerShell):

```powershell
claude mcp add -s user cdmdata `
  -e CDMDATA_BASE_URL=https://dbs5.cplservice.com `
  -e CDMDATA_ACCESS_KEY=AK... `
  -e CDMDATA_SECRET_KEY=SK... `
  -- node "$PWD\server.js"
```

Add `-e CDMDATA_ADMIN_TOKEN=...` if you need the API key management tools.

Verify:

```bash
claude mcp get cdmdata
```

`-s user` makes the server available in all your projects. Use `-s project` to scope it to one repo instead.

### 2. Install the Agent Skill (Claude Code)

The skill teaches Claude how to use the tools (parameters, response shape, pitfalls).

macOS / Linux:

```bash
mkdir -p ~/.claude/skills/cdmdata
cp skills/cdmdata/SKILL.md ~/.claude/skills/cdmdata/
```

Windows (PowerShell):

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.claude\skills\cdmdata" | Out-Null
Copy-Item skills\cdmdata\SKILL.md "$env:USERPROFILE\.claude\skills\cdmdata\"
```

Restart Claude Code, then ask e.g. *"อ่านข้อมูลล่าสุดของ device 0004236908"* — the `cdmdata` skill and tools load automatically.

### Other MCP clients

Any stdio MCP client works. Generic config:

```json
{
  "mcpServers": {
    "cdmdata": {
      "command": "node",
      "args": ["/path/to/cdmdata-http-wrapper/server.js"],
      "env": {
        "CDMDATA_BASE_URL": "https://dbs5.cplservice.com",
        "CDMDATA_ACCESS_KEY": "AK...",
        "CDMDATA_SECRET_KEY": "SK..."
      }
    }
  }
}
```

## Environment

| Variable | Required | Description |
|----------|----------|-------------|
| `CDMDATA_BASE_URL` | no | Default `https://dbs5.cplservice.com` (alt: `https://dbs5.cplservice.net`) |
| `CDMDATA_ACCESS_KEY` | data tools | `AK...` access key |
| `CDMDATA_SECRET_KEY` | data tools | `SK...` secret key |
| `CDMDATA_ADMIN_TOKEN` | admin tools | Bearer token for API key management |

## Usage examples

Read latest record:

```json
{ "device_id": "0004236908", "limit": 1, "order": "datetime,desc" }
```

Daily data for a month:

```json
{ "device_id": "0004236908", "from": "2026-07-01", "to": "2026-07-31", "limit": 100 }
```

Create a restricted API key (admin):

```json
{ "name": "customer billing integration", "allowed_devices": ["0004236908"] }
```

## Smoke test

```bash
CDMDATA_ACCESS_KEY=AK... CDMDATA_SECRET_KEY=SK... node server.js <<'EOF'
{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"cdmdata_getdata","arguments":{"device_id":"0004236908","limit":1}}}
EOF
```

## Security notes

- Never commit real keys. Keys live only in your MCP client config / env.
- `secret_key` is returned once at key creation — it cannot be retrieved again.
- Prefer `cdmdata_apikey_revoke` over `delete`; revoked keys fail with `403 Invalid API key`.
- Restrict customer keys with `allowed_devices`.
