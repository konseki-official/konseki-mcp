import { gunzip } from "node:zlib";
import { promisify } from "node:util";
import { KONSEKI_API_ORIGIN, KONSEKI_REQUEST_TIMEOUT_MS, type KonsekiMcpConfig } from "./config.js";

export type ApiJsonObject = Record<string, unknown>;

const gunzipAsync = promisify(gunzip);

export type KonsekiApiResult =
  | {
      json: ApiJsonObject;
      ok: true;
      status: number;
    }
  | {
      json?: ApiJsonObject;
      message: string;
      ok: false;
      status?: number;
    };

type FetchLike = typeof fetch;

export type KonsekiApiClientOptions = {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
};

export class KonsekiApiClient {
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(config: KonsekiMcpConfig, options?: KonsekiApiClientOptions) {
    this.apiKey = config.apiKey;
    this.fetchImpl = options?.fetchImpl ?? fetch;
    this.timeoutMs = options?.timeoutMs ?? KONSEKI_REQUEST_TIMEOUT_MS;
  }

  async getMetadata(): Promise<KonsekiApiResult> {
    return this.request("/v1/metadata");
  }

  async listCountries(): Promise<KonsekiApiResult> {
    return this.request("/v1/countries");
  }

  async listSymbols(): Promise<KonsekiApiResult> {
    return this.request("/v1/symbols");
  }

  async getAnalysis(params: { exchange: string; lookback: string; symbol: string }): Promise<KonsekiApiResult> {
    const symbolExchange = `${encodeURIComponent(params.symbol)}-${encodeURIComponent(params.exchange)}`;
    const searchParams = new URLSearchParams({
      lookback: params.lookback,
    });

    return this.request(`/v1/analysis/${symbolExchange}?${searchParams.toString()}`);
  }

  private async request(pathAndQuery: string): Promise<KonsekiApiResult> {
    const url = new URL(pathAndQuery, KONSEKI_API_ORIGIN);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-API-Key": this.apiKey,
        },
        method: "GET",
        signal: controller.signal,
      });

      const parsed = await parseJsonObject(response);

      if (!parsed.ok) {
        return {
          message: parsed.message,
          ok: false,
          status: response.status,
        };
      }

      if (!response.ok) {
        return {
          json: parsed.json,
          message: `Konseki API returned HTTP ${response.status}.`,
          ok: false,
          status: response.status,
        };
      }

      return {
        json: parsed.json,
        ok: true,
        status: response.status,
      };
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "Konseki API request timed out."
          : "Unable to reach Konseki API.";

      return {
        message,
        ok: false,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

async function parseJsonObject(
  response: Response,
): Promise<{ json: ApiJsonObject; ok: true } | { message: string; ok: false }> {
  try {
    const json = JSON.parse(await responseBodyText(response)) as unknown;

    if (!isJsonObject(json)) {
      return {
        message: "Konseki API returned JSON that is not an object.",
        ok: false,
      };
    }

    return {
      json,
      ok: true,
    };
  } catch {
    return {
      message: "Konseki API returned a non-JSON response.",
      ok: false,
    };
  }
}

async function responseBodyText(response: Response): Promise<string> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const decompressed = isGzip(bytes) ? await gunzipAsync(bytes) : bytes;

  return new TextDecoder().decode(decompressed);
}

function isGzip(bytes: Uint8Array): boolean {
  return bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function isJsonObject(value: unknown): value is ApiJsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
