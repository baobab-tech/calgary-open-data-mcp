import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchDatasets, getDatasetMetadata, queryDataset } from "./socrata.js";

export const SERVER_NAME = "calgary-open-data-mcp";
export const SERVER_VERSION = "1.0.0";

export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  registerTools(server);

  return server;
}

export function registerTools(server: McpServer) {
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
    async (params) => {
      const result = await searchDatasets(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
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
    async ({ datasetId }) => {
      const result = await getDatasetMetadata(datasetId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "query_dataset",
    "Query a Calgary Open Data dataset using SoQL (Socrata Query Language). Supports filtering, aggregation, sorting, and full-text search.",
    {
      datasetId: z
        .string()
        .regex(/^[a-z0-9]{4}-[a-z0-9]{4}$/, "Must be a Socrata four-by-four ID like 35ra-9556")
        .describe("The dataset's four-by-four ID"),
      select: z.string().optional().describe("Columns to return (SoQL $select). E.g. 'name, address, count(*)'"),
      where: z.string().optional().describe("Filter condition (SoQL $where). E.g. 'year > 2020'"),
      order: z.string().optional().describe("Sort order (SoQL $order). E.g. 'date DESC'"),
      group: z.string().optional().describe("Group by columns (SoQL $group). E.g. 'ward'"),
      having: z.string().optional().describe("Filter after aggregation (SoQL $having). E.g. 'count(*) > 10'"),
      q: z.string().optional().describe("Full-text search across all text columns"),
      limit: z.number().int().min(1).max(50000).optional().describe("Max rows to return (default 100)"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
    },
    async (params) => {
      const result = await queryDataset(params);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
