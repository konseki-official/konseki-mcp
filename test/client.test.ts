import { describe, expect, it, vi } from "vitest";
import { KonsekiApiClient } from "../src/client.js";

const apiKey = "ks_live_test_key";

function createClient(fetchImpl: typeof fetch): KonsekiApiClient {
  return new KonsekiApiClient(
    {
      apiKey,
    },
    {
      fetchImpl,
      timeoutMs: 100,
    },
  );
}

function requestHeaders(init: RequestInit | undefined): Record<string, string> {
  return init?.headers as Record<string, string>;
}

describe("KonsekiApiClient", () => {
  it("fetches metadata from the fixed API origin with the API key header", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ ok: true }));
    const client = createClient(fetchImpl);

    await expect(client.getMetadata()).resolves.toMatchObject({
      json: {
        ok: true,
      },
      ok: true,
      status: 200,
    });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe("https://api.konseki.io/v1/metadata");
    expect(requestHeaders(fetchImpl.mock.calls[0]?.[1])).toMatchObject({
      Accept: "application/json",
      "X-API-Key": apiKey,
    });
  });

  it("fetches symbols from the fixed API origin", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ symbols: [] }));
    const client = createClient(fetchImpl);

    await client.listSymbols();

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe("https://api.konseki.io/v1/symbols");
  });

  it("fetches analysis with normalized path and query values", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => Response.json({ analysis: {} }));
    const client = createClient(fetchImpl);

    await client.getAnalysis({
      exchange: "NASDAQ",
      lookback: "15",
      symbol: "AAPL",
    });

    expect(String(fetchImpl.mock.calls[0]?.[0])).toBe("https://api.konseki.io/v1/analysis/AAPL-NASDAQ?lookback=15");
  });

  it("preserves API error JSON and marks the result as failed", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      Response.json(
        {
          error: "unauthorized",
          message: "Missing or invalid API key.",
        },
        {
          status: 401,
        },
      ),
    );
    const client = createClient(fetchImpl);

    await expect(client.getMetadata()).resolves.toMatchObject({
      json: {
        error: "unauthorized",
        message: "Missing or invalid API key.",
      },
      ok: false,
      status: 401,
    });
  });

  it("returns a safe error for non-JSON responses", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => new Response("not json", { status: 502 }));
    const client = createClient(fetchImpl);

    await expect(client.getMetadata()).resolves.toMatchObject({
      message: "Konseki API returned a non-JSON response.",
      ok: false,
      status: 502,
    });
  });

  it("returns a safe error for network failures without leaking the API key", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new Error(`network failed for ${apiKey}`);
    });
    const client = createClient(fetchImpl);
    const result = await client.getMetadata();

    expect(result).toMatchObject({
      message: "Unable to reach Konseki API.",
      ok: false,
    });
    expect(JSON.stringify(result)).not.toContain(apiKey);
  });

  it("returns a safe timeout error", async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    });
    const client = createClient(fetchImpl);

    await expect(client.getMetadata()).resolves.toMatchObject({
      message: "Konseki API request timed out.",
      ok: false,
    });
  });
});
