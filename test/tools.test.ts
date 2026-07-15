import { describe, expect, it, vi } from "vitest";
import type { KonsekiApiClient } from "../src/client.js";
import {
  apiResultToToolResult,
  createAnalysisToolHandler,
  createCountriesToolHandler,
  createMetadataToolHandler,
  createSymbolsToolHandler,
  jsonToolResult,
  normalizeAnalysisInput,
  normalizeCountryInput,
  safeErrorResult,
} from "../src/tools.js";

describe("normalizeAnalysisInput", () => {
  it("uppercases symbol and exchange and normalizes lookback", () => {
    expect(
      normalizeAnalysisInput({
        country: "us",
        exchange: "nasdaq",
        lookback: 15,
        symbol: "aapl",
      }),
    ).toEqual({
      country: "US",
      exchange: "NASDAQ",
      lookback: "15",
      symbol: "AAPL",
    });
  });

  it("rejects unsupported lookback values before fetch", () => {
    expect(() =>
      normalizeAnalysisInput({
        country: "US",
        exchange: "NASDAQ",
        lookback: 12,
        symbol: "AAPL",
      }),
    ).toThrow("Unsupported lookback value.");
  });
});

describe("normalizeCountryInput", () => {
  it("uppercases country codes", () => {
    expect(normalizeCountryInput({ country: "us" })).toEqual({ country: "US" });
  });
});

describe("tool result helpers", () => {
  it("preserves raw JSON in structuredContent and serialized text", () => {
    const payload = {
      meta: {
        schema_version: "1.0",
      },
    };

    expect(jsonToolResult(payload)).toEqual({
      content: [
        {
          text: JSON.stringify(payload, null, 2),
          type: "text",
        },
      ],
      structuredContent: payload,
    });
  });

  it("marks API error JSON as MCP tool errors", () => {
    const payload = {
      error: "unauthorized",
      message: "Missing or invalid API key.",
    };

    expect(
      apiResultToToolResult({
        json: payload,
        message: "Konseki API returned HTTP 401.",
        ok: false,
        status: 401,
      }),
    ).toEqual({
      content: [
        {
          text: JSON.stringify(payload, null, 2),
          type: "text",
        },
      ],
      isError: true,
      structuredContent: payload,
    });
  });

  it("returns safe error text without structured content for local failures", () => {
    expect(safeErrorResult("Unable to reach Konseki API.")).toEqual({
      content: [
        {
          text: "Unable to reach Konseki API.",
          type: "text",
        },
      ],
      isError: true,
    });
  });
});

describe("countries tool handler", () => {
  it("preserves the raw countries API payload", async () => {
    const payload = {
      countries: [
        {
          code: "CN",
          name: "China",
        },
      ],
    };
    const client = {
      listCountries: vi.fn(async () => ({
        json: payload,
        ok: true as const,
        status: 200,
      })),
    } as unknown as KonsekiApiClient;

    await expect(createCountriesToolHandler(client)()).resolves.toEqual(jsonToolResult(payload));
    expect(client.listCountries).toHaveBeenCalledOnce();
  });

  it("returns API error JSON as an MCP tool error", async () => {
    const payload = {
      error: "unauthorized",
      message: "Missing or invalid API key.",
    };
    const client = {
      listCountries: vi.fn(async () => ({
        json: payload,
        message: "Konseki API returned HTTP 401.",
        ok: false as const,
        status: 401,
      })),
    } as unknown as KonsekiApiClient;

    await expect(createCountriesToolHandler(client)()).resolves.toEqual({
      ...jsonToolResult(payload),
      isError: true,
    });
  });
});

describe("country-scoped tool handlers", () => {
  it("normalizes country before fetching metadata", async () => {
    const payload = { latest: "2026-07-14" };
    const client = {
      getMetadata: vi.fn(async () => ({ json: payload, ok: true as const, status: 200 })),
    } as unknown as KonsekiApiClient;

    await expect(createMetadataToolHandler(client)({ country: "us" })).resolves.toEqual(jsonToolResult(payload));
    expect(client.getMetadata).toHaveBeenCalledWith("US");
  });

  it("rejects malformed country before fetching symbols", async () => {
    const client = {
      listSymbols: vi.fn(),
    } as unknown as KonsekiApiClient;

    await expect(createSymbolsToolHandler(client)({ country: "USA" })).resolves.toEqual(
      safeErrorResult("Invalid country request."),
    );
    expect(client.listSymbols).not.toHaveBeenCalled();
  });
});

describe("analysis tool handler", () => {
  it("does not call the API client when country validation fails", async () => {
    const client = {
      getAnalysis: vi.fn(),
    } as unknown as KonsekiApiClient;
    const handler = createAnalysisToolHandler(client);
    const result = await handler({
      country: "USA",
      exchange: "NASDAQ",
      lookback: 15,
      symbol: "AAPL",
    });

    expect(result).toEqual(safeErrorResult("Invalid analysis request."));
    expect(client.getAnalysis).not.toHaveBeenCalled();
  });

  it("does not call the API client when lookback validation fails", async () => {
    const client = {
      getAnalysis: vi.fn(),
    } as unknown as KonsekiApiClient;
    const handler = createAnalysisToolHandler(client);
    const result = await handler({
      country: "US",
      exchange: "NASDAQ",
      lookback: 12,
      symbol: "AAPL",
    });

    expect(result).toMatchObject({
      isError: true,
    });
    expect(client.getAnalysis).not.toHaveBeenCalled();
  });

  it("does not call the API client when symbol validation fails", async () => {
    const client = {
      getAnalysis: vi.fn(),
    } as unknown as KonsekiApiClient;
    const handler = createAnalysisToolHandler(client);
    const result = await handler({
      country: "US",
      exchange: "NASDAQ",
      lookback: 15,
      symbol: "AAPL/USD",
    });

    expect(result).toEqual({
      content: [
        {
          text: "Invalid analysis request.",
          type: "text",
        },
      ],
      isError: true,
    });
    expect(client.getAnalysis).not.toHaveBeenCalled();
  });

  it("does not call the API client when exchange validation fails", async () => {
    const client = {
      getAnalysis: vi.fn(),
    } as unknown as KonsekiApiClient;
    const handler = createAnalysisToolHandler(client);
    const result = await handler({
      country: "US",
      exchange: "NAS-DAQ",
      lookback: 15,
      symbol: "AAPL",
    });

    expect(result).toMatchObject({
      isError: true,
    });
    expect(client.getAnalysis).not.toHaveBeenCalled();
  });
});
