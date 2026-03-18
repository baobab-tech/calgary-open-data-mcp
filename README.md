# Calgary Open Data MCP Server

An [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) server that gives AI assistants access to the [Calgary Open Data](https://data.calgary.ca) portal. Search datasets, inspect schemas, and query any dataset using SoQL — all through a unified MCP interface.

> **Unofficial** — this project is not affiliated with, endorsed by, or connected to the City of Calgary. It queries publicly available data through the [Socrata Open Data API](https://dev.socrata.com/).

## Quick Start

### Use the hosted server (no setup required)

The fastest way to get started. Connect any MCP-compatible client to the hosted endpoint:

```
https://yyc-odata-mcp.baobabtech.app/mcp
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

| Parameter    | Type   | Description                     |
|-------------|--------|---------------------------------|
| `query`     | string | Keyword search term             |
| `categories`| string | Filter by category name         |
| `tags`      | string | Filter by tag                   |
| `limit`     | number | Results per page (1-100, default 10) |
| `offset`    | number | Pagination offset               |

### `get_dataset_metadata`

Get the full schema and metadata for a specific dataset.

| Parameter   | Type   | Description                                  |
|------------|--------|----------------------------------------------|
| `datasetId`| string | Socrata four-by-four ID (e.g. `35ra-9556`)   |

Returns column names, field names, data types, descriptions, tags, license, and last updated timestamp.

### `query_dataset`

Query any dataset using [SoQL (Socrata Query Language)](https://dev.socrata.com/docs/queries/).

| Parameter   | Type   | Description                                         |
|------------|--------|-----------------------------------------------------|
| `datasetId`| string | Socrata four-by-four ID                              |
| `select`   | string | Columns to return (`$select`). E.g. `name, address, count(*)` |
| `where`    | string | Filter condition (`$where`). E.g. `year > 2020`     |
| `order`    | string | Sort order (`$order`). E.g. `date DESC`              |
| `group`    | string | Group by columns (`$group`). E.g. `ward`             |
| `having`   | string | Post-aggregation filter (`$having`). E.g. `count(*) > 10` |
| `q`        | string | Full-text search across all text columns             |
| `limit`    | number | Max rows to return (1-50000, default 100)            |
| `offset`   | number | Pagination offset                                    |

## Client Configuration

All examples below use the hosted endpoint. Replace the URL with `http://localhost:3000/mcp` for local development.

### Claude Desktop

**Settings > Connectors > Add custom connector**, enter:

```
https://yyc-odata-mcp.baobabtech.app/mcp
```

### Claude Code

```bash
claude mcp add --transport http calgary-open-data https://yyc-odata-mcp.baobabtech.app/mcp
```

### Cursor

In `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "calgary-open-data": {
      "url": "https://yyc-odata-mcp.baobabtech.app/mcp"
    }
  }
}
```

### ChatGPT

**Settings > Apps & Connectors > Advanced settings**, enable **Developer mode**, click **Create**, enter:

```
https://yyc-odata-mcp.baobabtech.app/mcp
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
git clone https://github.com/YOUR_USERNAME/calgary-open-data-mcp.git
cd calgary-open-data-mcp
pnpm install
```

Deploy via the [Vercel CLI](https://vercel.com/docs/cli) or connect the repo in the Vercel dashboard.

**Optional:** Set a `SOCRATA_APP_TOKEN` environment variable in your Vercel project settings for higher Socrata API rate limits. You can register for a free app token at [data.calgary.ca](https://data.calgary.ca).

### Cloudflare Workers

A self-contained Cloudflare Worker lives in the `cloudflare/` directory.

```bash
cd cloudflare
pnpm install
pnpm dev       # local development
pnpm deploy    # deploy to Cloudflare
```

**Optional:** Set a `SOCRATA_APP_TOKEN` secret via `wrangler secret put SOCRATA_APP_TOKEN`.

### Local Development

```bash
pnpm install
pnpm dev
```

The MCP endpoint will be available at `http://localhost:3000/mcp`.

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

All remote endpoints use **Streamable HTTP** — the current MCP transport standard. The npx CLI uses **stdio** transport for local use.

## License

ISC
