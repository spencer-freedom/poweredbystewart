import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /ion/codex was renamed to /ion/schema as part of the broader
      // Codex → Schema rename. Keep the old URL working for any
      // external links Spencer already shared.
      { source: "/ion/codex", destination: "/ion/schema", permanent: true },
    ];
  },
};

export default nextConfig;
