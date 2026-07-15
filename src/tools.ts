import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import type { ApiJsonObject, KonsekiApiClient, KonsekiApiResult } from "./client.js";

const supportedLookbacks = new Set(["5", "10", "15", "20", "25", "30", "40", "50"]);

export const countryInputSchema = {
  country: z.string().trim().regex(/^[A-Za-z]{2}$/, "country must be an ISO 3166-1 alpha-2 code"),
};

export const analysisInputSchema = {
  ...countryInputSchema,
  exchange: z.string().trim().min(1).regex(/^[A-Za-z]+$/, "exchange must contain only letters"),
  lookback: z.union([z.string(), z.number()]),
  symbol: z.string().trim().min(1).regex(/^[A-Za-z0-9.]+$/, "symbol must contain only letters, numbers, and dots"),
};

const analysisInputObjectSchema = z.object(analysisInputSchema);
const countryInputObjectSchema = z.object(countryInputSchema);

export type AnalysisInput = {
  country: string;
  exchange: string;
  lookback: number | string;
  symbol: string;
};

export type CountryInput = {
  country: string;
};

export function normalizeCountryInput(input: CountryInput): { country: string } {
  return {
    country: input.country.trim().toUpperCase(),
  };
}

export function normalizeAnalysisInput(input: AnalysisInput): {
  country: string;
  exchange: string;
  lookback: string;
  symbol: string;
} {
  const lookback = String(input.lookback).trim();

  if (!supportedLookbacks.has(lookback)) {
    throw new Error("Unsupported lookback value.");
  }

  return {
    country: input.country.trim().toUpperCase(),
    exchange: input.exchange.trim().toUpperCase(),
    lookback,
    symbol: input.symbol.trim().toUpperCase(),
  };
}

export function jsonToolResult(json: ApiJsonObject): CallToolResult {
  return {
    content: [
      {
        text: JSON.stringify(json, null, 2),
        type: "text",
      },
    ],
    structuredContent: json,
  };
}

export function apiResultToToolResult(result: KonsekiApiResult): CallToolResult {
  if (result.ok) {
    return jsonToolResult(result.json);
  }

  if (result.json) {
    return {
      ...jsonToolResult(result.json),
      isError: true,
    };
  }

  return safeErrorResult(result.message);
}

export function safeErrorResult(message: string): CallToolResult {
  return {
    content: [
      {
        text: message,
        type: "text",
      },
    ],
    isError: true,
  };
}

export function createMetadataToolHandler(client: KonsekiApiClient): (input: CountryInput) => Promise<CallToolResult> {
  return async (input) => {
    try {
      const normalizedInput = normalizeCountryInput(countryInputObjectSchema.parse(input));

      return apiResultToToolResult(await client.getMetadata(normalizedInput.country));
    } catch {
      return safeErrorResult("Invalid country request.");
    }
  };
}

export function createCountriesToolHandler(client: KonsekiApiClient): () => Promise<CallToolResult> {
  return async () => apiResultToToolResult(await client.listCountries());
}

export function createSymbolsToolHandler(client: KonsekiApiClient): (input: CountryInput) => Promise<CallToolResult> {
  return async (input) => {
    try {
      const normalizedInput = normalizeCountryInput(countryInputObjectSchema.parse(input));

      return apiResultToToolResult(await client.listSymbols(normalizedInput.country));
    } catch {
      return safeErrorResult("Invalid country request.");
    }
  };
}

export function createAnalysisToolHandler(client: KonsekiApiClient): (input: AnalysisInput) => Promise<CallToolResult> {
  return async (input) => {
    try {
      const normalizedInput = normalizeAnalysisInput(analysisInputObjectSchema.parse(input));

      return apiResultToToolResult(await client.getAnalysis(normalizedInput));
    } catch (error) {
      const message =
        error instanceof z.ZodError
          ? "Invalid analysis request."
          : error instanceof Error
            ? error.message
            : "Invalid analysis request.";

      return safeErrorResult(message);
    }
  };
}
