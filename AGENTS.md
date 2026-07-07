# Repository Agent Guidelines

These instructions are for automated coding agents and maintainers working in this repository. They apply to code, content, configuration, and documentation changes for the Konseki MCP server.

## Project Context

This repository is the public MCP adapter for the Konseki public API. It is intended for AI trading users and AI trading tool builders who want AI agents to call Konseki's API through Model Context Protocol tools.

The MCP server must stay a direct wrapper around documented Konseki API endpoints. It should fetch and return API responses without interpreting, ranking, scoring, summarizing, or transforming the market JSON.

## Confidentiality Boundary

- Treat all repository content as publishable. Keep private infrastructure details, credentials, customer data, operational logs, and unpublished implementation assumptions out of committed files.
- The MCP server must call the public Konseki API with a user-provided `X-API-Key`.
- Do not require or document non-public service credentials for using this package.
- Keep examples safe and explicit that interpretation logic belongs to the user, builder, or downstream AI client, not to the official MCP wrapper.

## API Contract

The initial MCP tool surface should map directly to the public API:

- `get_konseki_metadata` wraps `GET /v1/metadata`.
- `list_konseki_symbols` wraps `GET /v1/symbols`.
- `get_konseki_analysis` wraps `GET /v1/analysis/{symbol}-{exchange}?lookback={lookback}`.

Preserve API response payloads as-is. If MCP-specific framing is required by the SDK, keep it minimal and make the raw API payload clearly available.

## Code Standards

- Use strict TypeScript.
- Keep the core wrapper small, typed, and dependency-light.
- Keep tool definitions, API client code, configuration loading, and examples separated.
- Validate MCP tool inputs before making API calls, but do not alter the returned Konseki API JSON.
- Avoid adding dependencies unless they clearly improve the MCP server implementation.
- Do not log raw API keys or include them in thrown errors, snapshots, examples, or test fixtures.
- Tests should use mocked Konseki API responses and fake API keys.

## Commands

Expected project commands:

- `npm install` installs dependencies.
- `npm run build` compiles TypeScript.
- `npm run typecheck` verifies TypeScript without emitting files.
- `npm test` runs the test suite once.
- `npm run lint` runs lint checks when linting is configured.

Run relevant verification before handing off changes that affect code, package configuration, or examples.

## Handoff Format

After every change, include:

- A concise summary of what changed.
- Verification notes, including anything that could not be run.
- A copy-ready git commit message.
