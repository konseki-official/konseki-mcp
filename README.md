# Konseki MCP

Official Model Context Protocol server for Konseki.

Konseki MCP is a direct wrapper around the Konseki public API. It lets AI agents and AI trading tools call Konseki endpoints through MCP tools while preserving the raw API response JSON for the user or downstream application to interpret.

## Status

This repository is being initialized. The intended first release is a local `stdio` MCP server that calls the Konseki public API with a user-provided API key.

## Design Principles

- Direct API wrapper: the MCP server fetches Konseki API responses and returns them without interpretation.
- User-owned interpretation: users, builders, and downstream AI clients decide how to analyze or summarize the returned JSON.
- Public API only: the server uses `X-API-Key` against documented Konseki endpoints.
- No internal credentials: non-public service or operational credentials are never required for this package.

## Initial Tool Surface

```text
get_konseki_metadata()
  -> GET /v1/metadata

list_konseki_symbols()
  -> GET /v1/symbols

get_konseki_analysis(symbol, exchange, lookback)
  -> GET /v1/analysis/{symbol}-{exchange}?lookback={lookback}
```

## Configuration

The local MCP server should read configuration from environment variables:

```sh
KONSEKI_API_KEY=ks_live_your_api_key
```

Use `.env.example` as a safe template. Do not commit real API keys.

## Intended Architecture

```text
AI client
  |
  v
Konseki MCP server
  |
  v
Konseki public API
  |
  v
Raw historical market context JSON
```

The MCP server should not bypass Konseki public API behavior. It should behave like any other public API client.

## Development

Install dependencies:

```sh
npm install
```

Run verification:

```sh
npm run typecheck
npm test
```

Build the package:

```sh
npm run build
```

## Security

- Never commit real API keys.
- Never log raw API keys.
- Never include user credentials in test snapshots or examples.
- Use fake keys in documentation and tests.
