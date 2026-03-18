import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/mcp",
        destination:
          "https://calgary-open-data-mcp.olivier-c23.workers.dev/mcp",
      },
    ];
  },
};

export default nextConfig;
