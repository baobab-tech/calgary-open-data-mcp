const HOSTED_URL = "https://yyc-odata-mcp.baobabtech.app";

export default function Home() {
  return (
    <main
      style={{
        padding: "2rem",
        fontFamily: "system-ui",
        maxWidth: "640px",
        lineHeight: 1.6,
      }}
    >
      <h1>Calgary Open Data MCP Server</h1>
      <p>
        <strong>Unofficial</strong> &mdash; not affiliated with or endorsed by
        the City of Calgary. This server provides MCP tools that query the
        publicly available{" "}
        <a href="https://data.calgary.ca">Calgary Open Data</a> portal
        (Socrata).
      </p>

      <h2>Available tools</h2>
      <ul>
        <li>
          <strong>search_datasets</strong> &mdash; Search the catalog by
          keyword, category, or tag
        </li>
        <li>
          <strong>get_dataset_metadata</strong> &mdash; Get schema and details
          for a dataset ID
        </li>
        <li>
          <strong>query_dataset</strong> &mdash; Query any dataset with SoQL
        </li>
      </ul>

      <h2>Add to your MCP client</h2>

      <h3>Claude Desktop</h3>
      <p>
        Open{" "}
        <strong>
          Settings &rarr; Connectors &rarr; Add custom connector
        </strong>{" "}
        and enter:
      </p>
      <pre>
        <code>{HOSTED_URL}/mcp</code>
      </pre>

      <h3>Claude Code</h3>
      <pre>
        <code>claude mcp add --transport http calgary-open-data {HOSTED_URL}/mcp</code>
      </pre>

      <h3>ChatGPT</h3>
      <p>
        Go to{" "}
        <strong>
          Settings &rarr; Apps &amp; Connectors &rarr; Advanced settings
        </strong>
        , enable <strong>Developer mode</strong>, then click{" "}
        <strong>Create</strong> and enter:
      </p>
      <pre>
        <code>{HOSTED_URL}/mcp</code>
      </pre>

      <h3>Hugging Face Chat</h3>
      <p>
        Click <strong>+</strong> in the chat input, select{" "}
        <strong>MCP Servers &rarr; Add Server</strong>, and enter:
      </p>
      <pre>
        <code>{HOSTED_URL}/mcp</code>
      </pre>

      <h3>Run locally with npx</h3>
      <p>For stdio transport, no server needed:</p>
      <pre>
        <code>npx calgary-open-data-mcp</code>
      </pre>
      <p>
        To add as a local server in <strong>Claude Desktop</strong>, add to your{" "}
        <code>claude_desktop_config.json</code>:
      </p>
      <pre>
        <code>
          {JSON.stringify(
            {
              mcpServers: {
                "calgary-open-data": {
                  command: "npx",
                  args: ["calgary-open-data-mcp"],
                },
              },
            },
            null,
            2
          )}
        </code>
      </pre>
      <p>
        Or in <strong>Claude Code</strong>:
      </p>
      <pre>
        <code>claude mcp add calgary-open-data -- npx calgary-open-data-mcp</code>
      </pre>

      <h3>Other MCP clients</h3>
      <p>
        Connect via Streamable HTTP at <code>{HOSTED_URL}/mcp</code>, or run
        locally with <code>npx calgary-open-data-mcp</code> over stdio.
      </p>
    </main>
  );
}
