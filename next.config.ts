import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this directory so Next/Turbopack
  // doesn't pick up an unrelated lockfile higher in the filesystem.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
