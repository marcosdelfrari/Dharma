import type { NextConfig } from "next";
import path from "path";

const apiOrigin =
  process.env.DHARMA_API_ORIGIN?.replace(/\/$/, "") || "http://localhost:8056";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
  },
  sassOptions: {
    includePaths: [path.join(process.cwd(), "styles")],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
