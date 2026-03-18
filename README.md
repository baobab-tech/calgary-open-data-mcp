# Calgary Open Data MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that gives AI assistants access to the [Calgary Open Data](https://data.calgary.ca) portal. Search datasets, inspect schemas, and query any dataset using SoQL — all through a unified MCP interface.

> **Disclaimer:** This project is **unofficial** and is not affiliated with, endorsed by, or connected to the City of Calgary. It queries publicly available data through the [Socrata Open Data API](https://dev.socrata.com/).

## Quick Start

### Use the hosted server (no setup required)

Connect any MCP-compatible client to the hosted endpoint:

```
https://calgary-open-data.baobabtech.app/mcp
```

### Run locally with npx

```bash
npx calgary-open-data-mcp
```

This starts a local stdio MCP server — no cloning or configuration needed.

## Tools

The server exposes three tools:

### `search_datasets`

Search the Calgary Open Data catalog by keyword, category, or tag.

| Parameter    | Type   | Required | Description                          |
|-------------|--------|----------|--------------------------------------|
| `query`     | string | no       | Keyword search term                  |
| `categories`| string | no       | Filter by category name              |
| `tags`      | string | no       | Filter by tag                        |
| `limit`     | number | no       | Results per page (1-100, default 10) |
| `offset`    | number | no       | Pagination offset                    |

### `get_dataset_metadata`

Get the full schema and metadata for a specific dataset.

| Parameter   | Type   | Required | Description                                |
|------------|--------|----------|--------------------------------------------|
| `datasetId`| string | yes      | Socrata four-by-four ID (e.g. `35ra-9556`) |

Returns column names, field names, data types, descriptions, tags, license, and last updated timestamp.

### `query_dataset`

Query any dataset using [SoQL (Socrata Query Language)](https://dev.socrata.com/docs/queries/).

| Parameter   | Type   | Required | Description                                                |
|------------|--------|----------|------------------------------------------------------------|
| `datasetId`| string | yes      | Socrata four-by-four ID                                    |
| `select`   | string | no       | Columns to return (`$select`). E.g. `name, address, count(*)` |
| `where`    | string | no       | Filter condition (`$where`). E.g. `year > 2020`            |
| `order`    | string | no       | Sort order (`$order`). E.g. `date DESC`                    |
| `group`    | string | no       | Group by columns (`$group`). E.g. `ward`                   |
| `having`   | string | no       | Post-aggregation filter (`$having`). E.g. `count(*) > 10`  |
| `q`        | string | no       | Full-text search across all text columns                   |
| `limit`    | number | no       | Max rows to return (1-50000, default 100)                  |
| `offset`   | number | no       | Pagination offset                                          |

## Client Configuration

All examples below use the hosted endpoint. Replace the URL with `http://localhost:3000/mcp` for local development.

### Claude Desktop

**Settings > Connectors > Add custom connector**, enter:

```
https://calgary-open-data.baobabtech.app/mcp
```

### Claude Code

```bash
claude mcp add --transport http calgary-open-data https://calgary-open-data.baobabtech.app/mcp
```

### Cursor

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "calgary-open-data": {
      "url": "https://calgary-open-data.baobabtech.app/mcp"
    }
  }
}
```

### ChatGPT

**Settings > Apps & Connectors > Advanced settings**, enable **Developer mode**, click **Create**, enter:

```
https://calgary-open-data.baobabtech.app/mcp
```

### npx (stdio) for any MCP client

```json
{
  "mcpServers": {
    "calgary-open-data": {
      "command": "npx",
      "args": ["-y", "calgary-open-data-mcp"]
    }
  }
}
```

## Self-Hosting

### Vercel

The root of this repo is a Next.js app ready to deploy on Vercel.

```bash
git clone https://github.com/baobab-tech/calgary-open-data-mcp.git
cd calgary-open-data-mcp
pnpm install
```

Deploy via the [Vercel CLI](https://vercel.com/docs/cli) or connect the repo in the Vercel dashboard.

**Optional:** Set a `SOCRATA_APP_TOKEN` environment variable in your Vercel project settings for higher Socrata API rate limits. Register for a free app token at [data.calgary.ca](https://data.calgary.ca).

### Cloudflare Workers

A self-contained Cloudflare Worker lives in the `cloudflare/` directory.

```bash
cd cloudflare
pnpm install
pnpm run login       # authenticate with Cloudflare (first time only)
pnpm run dev         # local development
pnpm run cf:deploy   # deploy to Cloudflare
```

**Optional:** Set a `SOCRATA_APP_TOKEN` secret:

```bash
npx wrangler secret put SOCRATA_APP_TOKEN
```

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/)

### Setup

```bash
git clone https://github.com/baobab-tech/calgary-open-data-mcp.git
cd calgary-open-data-mcp
pnpm install
```

### Running locally

**Vercel (Next.js) dev server:**

```bash
pnpm dev
```

MCP endpoint available at `http://localhost:3000/mcp`.

**Cloudflare Worker dev server:**

```bash
cd cloudflare
pnpm install
pnpm run dev
```

**CLI (stdio):**

```bash
pnpm build:cli
node dist/cli.js
```

### Type checking

```bash
# Root project (Vercel + CLI)
pnpm tsc --noEmit

# Cloudflare Worker
cd cloudflare && pnpm tsc --noEmit
```

### Building the CLI for npm

```bash
pnpm build:cli
```

This produces `dist/cli.js` — the file referenced by the `bin` field in `package.json`.

## Project Structure

```
src/
  lib/
    socrata.ts              Socrata API client (Discovery, Metadata, SODA)
    tools.ts                Shared MCP tool definitions
  cli.ts                    npx entry point (stdio transport)
  app/
    [transport]/route.ts    Vercel HTTP endpoint (Streamable HTTP)
    page.tsx                Landing page
    layout.tsx
cloudflare/
  src/index.ts              Cloudflare Worker (self-contained)
  wrangler.toml
  package.json
```

The Vercel deployment and the npx CLI share tool definitions via `src/lib/tools.ts`. The Cloudflare Worker is self-contained since CF Workers use a different module runtime.

## How It Works

This server wraps three layers of the [Socrata Open Data API](https://dev.socrata.com/) that powers `data.calgary.ca`:

1. **Discovery API** — catalog search across all datasets on the portal
2. **Metadata API** — detailed schema and column information per dataset
3. **SODA API** — the data query layer, using SoQL (a SQL-like query language)

Every dataset on the portal has a unique **four-by-four ID** (e.g. `35ra-9556`). Use `search_datasets` to find IDs, `get_dataset_metadata` to understand the schema, then `query_dataset` to pull the data.

### Transport

All remote endpoints use [Streamable HTTP](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports) — the current MCP transport standard. The npx CLI uses stdio transport for local use.

## Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Make your changes
4. Run type checking (`pnpm tsc --noEmit`)
5. Commit your changes (`git commit -m 'Add my feature'`)
6. Push to the branch (`git push origin feature/my-feature`)
7. Open a Pull Request

### Ideas for contributions

- Additional tools (e.g. dataset export, geospatial queries)
- Support for other Socrata-powered open data portals
- Caching layer for frequently accessed metadata
- Better error messages and input validation
- Tests

Please open an issue first if you're planning a large change so we can discuss the approach.

## License

MIT

## Acknowledgements

- [City of Calgary Open Data](https://data.calgary.ca) for making public data accessible
- [Socrata / Tyler Data & Insights](https://dev.socrata.com/) for the API platform
- [Model Context Protocol](https://modelcontextprotocol.io/) for the open standard
