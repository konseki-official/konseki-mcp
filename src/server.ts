import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { KonsekiApiClient } from "./client.js";
import {
  analysisInputSchema,
  createAnalysisToolHandler,
  createMetadataToolHandler,
  createSymbolsToolHandler,
} from "./tools.js";

export function createKonsekiMcpServer(client: KonsekiApiClient): McpServer {
  const server = new McpServer({
    name: "konseki-mcp",
    version: "1.0.1",
  });

  server.registerTool(
    "get_konseki_metadata",
    {
      description: "Fetch raw metadata JSON from the Konseki public API.",
      title: "Get Konseki Metadata",
    },
    createMetadataToolHandler(client),
  );

  server.registerTool(
    "list_konseki_symbols",
    {
      description: "Fetch raw supported symbols JSON from the Konseki public API.",
      title: "List Konseki Symbols",
    },
    createSymbolsToolHandler(client),
  );

  server.registerTool(
    "get_konseki_analysis",
    {
      description: "Fetch raw analysis JSON for a symbol, exchange, and lookback from the Konseki public API.",
      inputSchema: analysisInputSchema,
      title: "Get Konseki Analysis",
    },
    createAnalysisToolHandler(client),
  );

  return server;
}
