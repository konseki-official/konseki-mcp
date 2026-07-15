import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import type { KonsekiApiClient } from "../src/client.js";
import { createKonsekiMcpServer } from "../src/server.js";

describe("Konseki MCP server", () => {
  it("registers list_konseki_countries as a zero-input raw API tool", async () => {
    const countries = {
      countries: [
        {
          code: "US",
          name: "United States",
        },
      ],
    };
    const apiClient = {
      listCountries: vi.fn(async () => ({
        json: countries,
        ok: true as const,
        status: 200,
      })),
    } as unknown as KonsekiApiClient;
    const server = createKonsekiMcpServer(apiClient);
    const client = new Client({
      name: "konseki-mcp-test-client",
      version: "1.0.0",
    });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);

    try {
      const toolList = await client.listTools();
      const countriesTool = toolList.tools.find((tool) => tool.name === "list_konseki_countries");

      expect(countriesTool).toMatchObject({
        description: "Fetch raw covered countries JSON from the Konseki public API.",
        inputSchema: {
          type: "object",
        },
        title: "List Konseki Countries",
      });

      const result = await client.callTool({
        arguments: {},
        name: "list_konseki_countries",
      });

      expect(result.structuredContent).toEqual(countries);
      expect(apiClient.listCountries).toHaveBeenCalledOnce();
    } finally {
      await client.close();
      await server.close();
    }
  });
});
