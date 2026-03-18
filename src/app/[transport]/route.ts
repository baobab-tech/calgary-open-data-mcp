import { createMcpHandler } from "mcp-handler";
import { registerTools, SERVER_NAME, SERVER_VERSION } from "@/lib/tools";

const handler = createMcpHandler(
  (server) => {
    registerTools(server);
  },
  {
    serverInfo: {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
  },
  {
    basePath: "",
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
