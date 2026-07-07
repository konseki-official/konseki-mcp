# Konseki MCP

Official Model Context Protocol server for Konseki.

Konseki MCP is a direct wrapper around the Konseki public API. It lets AI agents and AI trading tools call Konseki endpoints through MCP tools while preserving the raw API response JSON for the user or downstream application to interpret.

## Requirements

- Node.js 20 or newer.
- A Konseki API key.

## Design Principles

- Direct API wrapper: the MCP server fetches Konseki API responses and returns them without interpretation.
- User-owned interpretation: users, builders, and downstream AI clients decide how to analyze or summarize the returned JSON.
- Public API only: the server uses `X-API-Key` against documented Konseki endpoints.
- No internal credentials: non-public service or operational credentials are never required for this package.

## Configuration

The server reads configuration from environment variables:

```sh
KONSEKI_API_KEY=ks_live_your_api_key
```

Do not commit real API keys.

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

## Response Compression

The server requests gzip-compressed API responses and decompresses them locally before returning JSON to the MCP client. This is handled automatically; users do not need to configure compression.

## Installation

Use the package through an MCP client with `npx`:

```json
{
  "mcpServers": {
    "konseki": {
      "command": "npx",
      "args": ["-y", "@konseki/mcp"],
      "env": {
        "KONSEKI_API_KEY": "ks_live_your_api_key"
      }
    }
  }
}
```

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

## Development

Install dependencies:

```sh
npm install
```

Run verification:

```sh
npm run typecheck
npm test
npm run build
```

## Security

- Never commit real API keys.
- Never log raw API keys.
- Never include user credentials in test snapshots or examples.
- Use fake keys in documentation and tests.
