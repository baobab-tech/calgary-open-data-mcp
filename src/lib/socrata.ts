const CALGARY_DOMAIN = "data.calgary.ca";
const DISCOVERY_BASE = "https://api.us.socrata.com/api/catalog/v1";

interface DiscoveryResult {
  results: Array<{
    resource: {
      name: string;
      id: string;
      description: string;
      type: string;
      updatedAt: string;
      columns_name: string[];
      columns_datatype: string[];
    };
    classification: {
      categories: string[];
      tags: string[];
    };
    metadata: {
      domain: string;
    };
    permalink: string;
  }>;
  resultSetSize: number;
}

interface DatasetMetadata {
  id: string;
  name: string;
  description: string;
  columns: Array<{
    name: string;
    fieldName: string;
    dataTypeName: string;
    description: string;
  }>;
  rowsUpdatedAt: number;
  category: string;
  tags: string[];
  license: string;
}

export async function searchDatasets(params: {
  query?: string;
  categories?: string;
  tags?: string;
  limit?: number;
  offset?: number;
}): Promise<{ datasets: Array<Record<string, unknown>>; totalCount: number }> {
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

  const data: DiscoveryResult = await res.json();

  return {
    totalCount: data.resultSetSize,
    datasets: data.results.map((r) => ({
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

export async function getDatasetMetadata(datasetId: string): Promise<Record<string, unknown>> {
  const url = `https://${CALGARY_DOMAIN}/api/views/${datasetId}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Metadata API error: ${res.status} ${await res.text()}`);

  const data: DatasetMetadata = await res.json();

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
    columns: data.columns?.map((c) => ({
      name: c.name,
      fieldName: c.fieldName,
      type: c.dataTypeName,
      description: c.description,
    })),
  };
}

export async function queryDataset(params: {
  datasetId: string;
  select?: string;
  where?: string;
  order?: string;
  group?: string;
  having?: string;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ rows: unknown[]; count: number }> {
  const url = new URL(`https://${CALGARY_DOMAIN}/resource/${params.datasetId}.json`);

  if (params.select) url.searchParams.set("$select", params.select);
  if (params.where) url.searchParams.set("$where", params.where);
  if (params.order) url.searchParams.set("$order", params.order);
  if (params.group) url.searchParams.set("$group", params.group);
  if (params.having) url.searchParams.set("$having", params.having);
  if (params.q) url.searchParams.set("$q", params.q);
  url.searchParams.set("$limit", String(params.limit ?? 100));
  if (params.offset) url.searchParams.set("$offset", String(params.offset));

  const appToken = process.env.SOCRATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (appToken) headers["X-App-Token"] = appToken;

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`SODA API error: ${res.status} ${await res.text()}`);

  const rows: unknown[] = await res.json();

  return { rows, count: rows.length };
}
