import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ffmpeg-static ships a precompiled binary referenced via
  // require('ffmpeg-static') returning a string path. Bundling it
  // breaks the path resolution: Webpack rewrites the require to
  // point at a path in .next/server/vendor-chunks/ that doesn't
  // actually contain the binary. Marking it external keeps the
  // import pointing at the real node_modules path at runtime.
  serverExternalPackages: ["ffmpeg-static"],
  // Vercel's file tracer won't pick up the binary on its own (it's
  // not a JS module import) — this tells it to include the binary
  // file in the serverless function bundle.
  outputFileTracingIncludes: {
    "/api/ion/audio-clip/[callId]": ["./node_modules/ffmpeg-static/ffmpeg"],
  },
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
