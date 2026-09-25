import type { NextConfig } from "next";
import path from "node:path";

// Static export: `next build` writes a self-contained site to out/, which any
// static file server (see Dockerfile) can serve without a Node runtime.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  outputFileTracingRoot: path.join(__dirname),
};
export default nextConfig;
