import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const CALGARY_DOMAIN = "data.calgary.ca";
const DISCOVERY_BASE = "https://api.us.socrata.com/api/catalog/v1";

async function searchDatasets(params: {
  query?: string;
  categories?: string;
  tags?: string;
  limit?: number;
  offset?: number;
}) {
  const url = new URL(DISCOVERY_BASE);
  url.searchParams.set("domains", CALGARY_DOMAIN);
  url.searchParams.set("search_context", CALGARY_DOMAIN);
  url.searchParams.set("only", "datasets");
  url.searchParams.set("limit", String(params.limit ?? 10));
  url.searchParams.set("offset", String(params.offset ?? 0));
  if (params.query) url.searchParams.set("q", params.query);
  if (params.categories) url.searchParams.set("categories", params.categories);
  if (params.tags) url.searchParams.set("tags", params.tags);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Discovery API error: ${res.status} ${await res.text()}`);
  const data: any = await res.json();

  return {
    totalCount: data.resultSetSize,
    datasets: data.results.map((r: any) => ({
      id: r.resource.id,
      name: r.resource.name,
      description: r.resource.description,
      type: r.resource.type,
      updatedAt: r.resource.updatedAt,
      categories: r.classification.categories,
      tags: r.classification.tags,
      columns: r.resource.columns_name,
      permalink: r.permalink,
    })),
  };
}

async function getDatasetMetadata(datasetId: string) {
  const res = await fetch(`https://${CALGARY_DOMAIN}/api/views/${datasetId}.json`);
  if (!res.ok) throw new Error(`Metadata API error: ${res.status} ${await res.text()}`);
  const data: any = await res.json();

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    category: data.category,
    tags: data.tags,
    license: data.license,
    lastUpdated: data.rowsUpdatedAt
      ? new Date(data.rowsUpdatedAt * 1000).toISOString()
      : null,
    columns: data.columns?.map((c: any) => ({
      name: c.name,
      fieldName: c.fieldName,
      type: c.dataTypeName,
      description: c.description,
    })),
  };
}

async function queryDataset(
  params: {
    datasetId: string;
    select?: string;
    where?: string;
    order?: string;
    group?: string;
    having?: string;
    q?: string;
    limit?: number;
    offset?: number;
  },
  appToken?: string,
) {
  const url = new URL(`https://${CALGARY_DOMAIN}/resource/${params.datasetId}.json`);
  if (params.select) url.searchParams.set("$select", params.select);
  if (params.where) url.searchParams.set("$where", params.where);
  if (params.order) url.searchParams.set("$order", params.order);
  if (params.group) url.searchParams.set("$group", params.group);
  if (params.having) url.searchParams.set("$having", params.having);
  if (params.q) url.searchParams.set("$q", params.q);
  url.searchParams.set("$limit", String(params.limit ?? 100));
  if (params.offset) url.searchParams.set("$offset", String(params.offset));

  const headers: Record<string, string> = {};
  if (appToken) headers["X-App-Token"] = appToken;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`SODA API error: ${res.status} ${await res.text()}`);
  const rows: unknown[] = await res.json();

  return { rows, count: rows.length };
}

interface Env {
  SOCRATA_APP_TOKEN?: string;
}

function createServer(env: Env) {
  const server = new McpServer({
    name: "calgary-open-data-mcp",
    version: "1.0.0",
  });

  server.tool(
    "search_datasets",
    "Search the Calgary Open Data catalog for datasets by keyword, category, or tags. Unofficial — not affiliated with the City of Calgary.",
    {
      query: z.string().optional().describe("Keyword search term"),
      categories: z.string().optional().describe("Filter by category name"),
      tags: z.string().optional().describe("Filter by tag"),
      limit: z.number().int().min(1).max(100).optional().describe("Number of results (default 10)"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
    },
    async (params) => ({
      content: [{ type: "text" as const, text: JSON.stringify(await searchDatasets(params), null, 2) }],
    }),
  );

  server.tool(
    "get_dataset_metadata",
    "Get detailed metadata and column schema for a specific Calgary Open Data dataset",
    {
      datasetId: z
        .string()
        .regex(/^[a-z0-9]{4}-[a-z0-9]{4}$/, "Must be a Socrata four-by-four ID like 35ra-9556")
        .describe("The dataset's four-by-four ID (e.g. 35ra-9556)"),
    },
    async ({ datasetId }) => ({
      content: [{ type: "text" as const, text: JSON.stringify(await getDatasetMetadata(datasetId), null, 2) }],
    }),
  );

  server.tool(
    "query_dataset",
    "Query a Calgary Open Data dataset using SoQL (Socrata Query Language). Supports filtering, aggregation, sorting, and full-text search.",
    {
      datasetId: z.string().regex(/^[a-z0-9]{4}-[a-z0-9]{4}$/).describe("The dataset's four-by-four ID"),
      select: z.string().optional().describe("Columns to return (SoQL $select)"),
      where: z.string().optional().describe("Filter condition (SoQL $where)"),
      order: z.string().optional().describe("Sort order (SoQL $order)"),
      group: z.string().optional().describe("Group by columns (SoQL $group)"),
      having: z.string().optional().describe("Filter after aggregation (SoQL $having)"),
      q: z.string().optional().describe("Full-text search across all text columns"),
      limit: z.number().int().min(1).max(50000).optional().describe("Max rows to return (default 100)"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
    },
    async (params) => ({
      content: [{ type: "text" as const, text: JSON.stringify(await queryDataset(params, env.SOCRATA_APP_TOKEN), null, 2) }],
    }),
  );

  return server;
}

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const url = new URL(request.url);

    // Landing page
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(
        `Calgary Open Data MCP Server (Cloudflare)\n\nUnofficial — not affiliated with the City of Calgary.\nConnect via Streamable HTTP at ${url.origin}/mcp`,
        { headers: { "content-type": "text/plain" } },
      );
    }

    const server = createServer(env);
    return createMcpHandler(server)(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
