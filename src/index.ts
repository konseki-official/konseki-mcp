#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { pathToFileURL } from "node:url";
import { KonsekiApiClient } from "./client.js";
import { loadConfigFromEnv } from "./config.js";
import { createKonsekiMcpServer } from "./server.js";

export { KonsekiApiClient } from "./client.js";
export { KONSEKI_API_ORIGIN, KONSEKI_REQUEST_TIMEOUT_MS, loadConfigFromEnv, type KonsekiMcpConfig } from "./config.js";
export { createKonsekiMcpServer } from "./server.js";
export { normalizeAnalysisInput } from "./tools.js";

async function main(): Promise<void> {
  const config = loadConfigFromEnv();
  const client = new KonsekiApiClient(config);
  const server = createKonsekiMcpServer(client);

  await server.connect(new StdioServerTransport());
}

if (isCliEntryPoint()) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unable to start Konseki MCP server.";
    console.error(message);
    process.exit(1);
  });
}

function isCliEntryPoint(): boolean {
  const entrypoint = process.argv[1];

  return entrypoint ? import.meta.url === pathToFileURL(entrypoint).href : false;
}
