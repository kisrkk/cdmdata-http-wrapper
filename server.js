#!/usr/bin/env node

const DEFAULT_BASE_URL = "https://dbs5.cplservice.com";

const config = {
  baseUrl: (process.env.CDMDATA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ""),
  accessKey: process.env.CDMDATA_ACCESS_KEY || "",
  secretKey: process.env.CDMDATA_SECRET_KEY || "",
  adminToken: process.env.CDMDATA_ADMIN_TOKEN || "",
};

const tools = [
  {
    name: "cdmdata_getdata",
    description: "Read raw CDM kit data from /cdmdata/v1/getdata using AK/SK.",
    inputSchema: dataReadSchema(),
  },
  {
    name: "cdmdata_getdatahourly",
    description: "Read hourly CDM kit data from /cdmdata/v1/getdatahourly using AK/SK.",
    inputSchema: dataReadSchema(),
  },
  {
    name: "cdmdata_getdatadaily",
    description: "Read daily CDM kit data from /cdmdata/v1/getdatadaily using AK/SK.",
    inputSchema: dataReadSchema(),
  },
  {
    name: "cdmdata_on_off_command",
    description: "Send an on/off command to a CDM kit meter via /cdmdata/v1/on-off-command using AK/SK.",
    inputSchema: objectSchema({
      device_id: { type: "string", description: "Required CDM kit device_id." },
      meter_id: { type: "string", description: "Required meter id, for example 01." },
      command: { type: "string", enum: ["on", "off"], description: "Command to send." },
    }, ["device_id", "meter_id", "command"]),
  },
  {
    name: "cdmdata_apikey_create",
    description: "Create a CDM Data API key. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      name: { type: "string", description: "Display name for the API key." },
      allowed_devices: {
        type: "array",
        items: { type: "string" },
        description: "Allowed device list. Empty or omitted denies all devices. Use [\"*\"] to allow all devices.",
      },
    }),
  },
  {
    name: "cdmdata_apikey_list",
    description: "List CDM Data API keys. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      page: { type: "integer", minimum: 1 },
      limit: { type: "integer", minimum: 1, maximum: 500 },
      is_active: { type: "boolean" },
    }),
  },
  {
    name: "cdmdata_apikey_get",
    description: "Get CDM Data API key metadata. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      id: { type: "string", description: "API key Mongo _id." },
    }, ["id"]),
  },
  {
    name: "cdmdata_apikey_usage",
    description: "Get usage summary and recent request history for an API key. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      id: { type: "string", description: "API key Mongo _id." },
      from: { type: "string", description: "Optional occurred_at lower bound." },
      to: { type: "string", description: "Optional occurred_at upper bound." },
      device_id: { type: "string" },
      function_name: { type: "string", enum: ["getdata", "getdatahourly", "getdatadaily", "on-off-command"] },
      collection_name: { type: "string" },
      limit: { type: "integer", minimum: 1, maximum: 500 },
    }, ["id"]),
  },
  {
    name: "cdmdata_apikey_rename",
    description: "Rename a CDM Data API key. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      id: { type: "string" },
      name: { type: "string" },
    }, ["id", "name"]),
  },
  {
    name: "cdmdata_apikey_update",
    description: "Update API key name, allowed_devices, or is_active. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      id: { type: "string" },
      name: { type: "string" },
      allowed_devices: {
        type: "array",
        items: { type: "string" },
        description: "Empty array denies all devices. Use [\"*\"] to allow all devices.",
      },
      is_active: { type: "boolean" },
    }, ["id"]),
  },
  {
    name: "cdmdata_apikey_revoke",
    description: "Revoke a CDM Data API key by setting is_active=false. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      id: { type: "string" },
    }, ["id"]),
  },
  {
    name: "cdmdata_apikey_delete",
    description: "Hard delete a CDM Data API key. Requires CDMDATA_ADMIN_TOKEN.",
    inputSchema: objectSchema({
      id: { type: "string" },
    }, ["id"]),
  },
];

function objectSchema(properties, required = []) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function dataReadSchema() {
  return objectSchema({
    device_id: { type: "string", description: "Required CDM kit device_id." },
    from_time: { type: "string", description: "Optional datetime lower bound." },
    to_time: { type: "string", description: "Optional datetime upper bound." },
    from: { type: "string", description: "Optional date lower bound." },
    to: { type: "string", description: "Optional date upper bound." },
    page: { type: ["integer", "string"], description: "Page number or legacy page,limit string." },
    limit: { type: "integer", minimum: 1, maximum: 1000 },
    order: { type: "string", description: "field,asc or field,desc." },
    column: { type: "string", description: "Comma separated projection fields." },
    transform: { type: "string", enum: ["1"] },
    format: { type: "string", enum: ["csv"] },
    download: { type: "string", enum: ["1"] },
    filter: {
      oneOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } },
      ],
    },
  }, ["device_id"]);
}

function assertAkSk() {
  if (!config.accessKey || !config.secretKey) {
    throw new Error("CDMDATA_ACCESS_KEY and CDMDATA_SECRET_KEY are required for data tools.");
  }
}

function assertAdminToken() {
  if (!config.adminToken) {
    throw new Error("CDMDATA_ADMIN_TOKEN is required for API key management tools.");
  }
}

function buildUrl(path, params = {}) {
  const url = new URL(`${config.baseUrl}${path}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => url.searchParams.append(key, String(item)));
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function request(method, path, options = {}) {
  const { query, body, headers } = options;
  const response = await fetch(buildUrl(path, query), {
    method,
    headers: {
      ...(body ? { "content-type": "application/json" } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = text;

  try {
    payload = JSON.parse(text);
  } catch (_) {}

  if (!response.ok) {
    const message = typeof payload === "object" ? JSON.stringify(payload) : String(payload);
    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  return payload;
}

function dataHeaders() {
  assertAkSk();
  return {
    "x-api-access-key": config.accessKey,
    "x-api-secret-key": config.secretKey,
  };
}

function adminHeaders() {
  assertAdminToken();
  return {
    authorization: `Bearer ${config.adminToken}`,
  };
}

async function callTool(name, args) {
  switch (name) {
    case "cdmdata_getdata":
      return request("GET", "/cdmdata/v1/getdata", { query: args, headers: dataHeaders() });
    case "cdmdata_getdatahourly":
      return request("GET", "/cdmdata/v1/getdatahourly", { query: args, headers: dataHeaders() });
    case "cdmdata_getdatadaily":
      return request("GET", "/cdmdata/v1/getdatadaily", { query: args, headers: dataHeaders() });
    case "cdmdata_on_off_command":
      return request("POST", "/cdmdata/v1/on-off-command", { body: args, headers: dataHeaders() });
    case "cdmdata_apikey_create":
      return request("POST", "/cdmdata/v1/api-keys", { body: args, headers: adminHeaders() });
    case "cdmdata_apikey_list":
      return request("GET", "/cdmdata/v1/api-keys", { query: args, headers: adminHeaders() });
    case "cdmdata_apikey_get":
      return request("GET", `/cdmdata/v1/api-keys/${encodeURIComponent(args.id)}`, { headers: adminHeaders() });
    case "cdmdata_apikey_usage": {
      const { id, ...query } = args;
      return request("GET", `/cdmdata/v1/api-keys/${encodeURIComponent(id)}/usage`, { query, headers: adminHeaders() });
    }
    case "cdmdata_apikey_rename":
      return request("PATCH", `/cdmdata/v1/api-keys/${encodeURIComponent(args.id)}/rename`, {
        body: { name: args.name },
        headers: adminHeaders(),
      });
    case "cdmdata_apikey_update": {
      const { id, ...body } = args;
      return request("PUT", `/cdmdata/v1/api-keys/${encodeURIComponent(id)}`, { body, headers: adminHeaders() });
    }
    case "cdmdata_apikey_revoke":
      return request("POST", `/cdmdata/v1/api-keys/${encodeURIComponent(args.id)}/revoke`, {
        body: {},
        headers: adminHeaders(),
      });
    case "cdmdata_apikey_delete":
      return request("DELETE", `/cdmdata/v1/api-keys/${encodeURIComponent(args.id)}`, { headers: adminHeaders() });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function send(id, result, error) {
  const message = {
    jsonrpc: "2.0",
    id,
  };

  if (error) {
    message.error = {
      code: -32000,
      message: error.message || String(error),
    };
  } else {
    message.result = result;
  }

  process.stdout.write(`${JSON.stringify(message)}\n`);
}

async function handle(message) {
  if (message.method === "initialize") {
    return {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "cdmdata-http-wrapper",
        version: "1.0.0",
      },
    };
  }

  if (message.method === "tools/list") {
    return { tools };
  }

  if (message.method === "tools/call") {
    const result = await callTool(message.params.name, message.params.arguments || {});
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  if (message.method === "notifications/initialized") {
    return undefined;
  }

  throw new Error(`Unsupported method: ${message.method}`);
}

let buffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;

  while (buffer.includes("\n")) {
    const newlineIndex = buffer.indexOf("\n");
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);

    if (!line) {
      continue;
    }

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      send(null, null, error);
      continue;
    }

    Promise.resolve()
      .then(() => handle(message))
      .then((result) => {
        if (message.id !== undefined && result !== undefined) {
          send(message.id, result);
        }
      })
      .catch((error) => {
        if (message.id !== undefined) {
          send(message.id, null, error);
        }
      });
  }
});
