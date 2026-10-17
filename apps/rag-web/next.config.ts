import type { NextConfig } from "next";
import path from "node:path";

// Static export: `next build` writes the whole UI to out/. There is no server runtime and no route handlers;
// the page calls /api/answer, /api/explore and /api/health on its own origin, which the reverse proxy sends to portfolio-api.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
