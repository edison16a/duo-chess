import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The Stockfish worker fetches its wasm from /engine, so make sure it is
  // served with a long cache and the right MIME type on every host.
  async headers() {
    return [
      {
        source: "/engine/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
