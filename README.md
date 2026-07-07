# Konseki MCP

Official Model Context Protocol server for Konseki.

Konseki MCP is a direct wrapper around the Konseki public API. It lets AI agents and AI trading tools call Konseki endpoints through MCP tools while preserving the raw API response JSON for the user or downstream application to interpret.

## Status

This package provides a local `stdio` MCP server that calls the Konseki public API with a user-provided API key.

## Design Principles

- Direct API wrapper: the MCP server fetches Konseki API responses and returns them without interpretation.
- User-owned interpretation: users, builders, and downstream AI clients decide how to analyze or summarize the returned JSON.
- Public API only: the server uses `X-API-Key` against documented Konseki endpoints.
- No internal credentials: non-public service or operational credentials are never required for this package.

## Tool Surface

```text
get_konseki_metadata()
  -> GET /v1/metadata

list_konseki_symbols()
  -> GET /v1/symbols

get_konseki_analysis(symbol, exchange, lookback)
  -> GET /v1/analysis/{symbol}-{exchange}?lookback={lookback}
```

## Configuration

The local MCP server reads configuration from environment variables:

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

## Response Compression

The server requests gzip-compressed API responses and decompresses them locally before returning JSON to the MCP client. This is handled automatically; users do not need to configure compression.

## Installation

Install dependencies for local development:

```sh
npm install
```

Build the server:

```sh
npm run build
```

## MCP Client Configuration

For local development from this checkout, configure your MCP client to run the built server:

```json
{
  "mcpServers": {
    "konseki": {
      "command": "node",
      "args": ["/absolute/path/to/konseki-mcp/dist/index.js"],
      "env": {
        "KONSEKI_API_KEY": "ks_live_your_api_key"
      }
    }
  }
}
```

After publishing to npm, clients can run the package command instead:

```json
{
  "mcpServers": {
    "konseki": {
      "command": "npx",
      "args": ["@konseki/mcp"],
      "env": {
        "KONSEKI_API_KEY": "ks_live_your_api_key"
      }
    }
  }
}
```

## Tools

### `get_konseki_metadata`

Fetches raw JSON from `GET /v1/metadata`.

Input: none.

### `list_konseki_symbols`

Fetches raw JSON from `GET /v1/symbols`.

Input: none.

### `get_konseki_analysis`

Fetches raw JSON from `GET /v1/analysis/{symbol}-{exchange}?lookback={lookback}`.

Input:

```json
{
  "symbol": "AAPL",
  "exchange": "NASDAQ",
  "lookback": 15
}
```

Supported `lookback` values: `5`, `10`, `15`, `20`, `25`, `30`, `40`, `50`.

## Development

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
