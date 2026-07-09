import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // web/ is its own npm package inside the eventscope repo; without an explicit
    // root, Turbopack picks the repo-root lockfile and mis-roots the client manifest.
    root: import.meta.dirname,
  },
};

export default nextConfig;
