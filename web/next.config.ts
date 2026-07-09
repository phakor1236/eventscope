import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // web/ is its own npm package inside the eventscope repo; without this Next
    // picks the repo-root lockfile as the workspace root and warns.
    root: __dirname,
  },
};

export default nextConfig;
