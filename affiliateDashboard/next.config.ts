import path from "path";
import type { NextConfig } from "next";

/** Monorepo: trace files from repo root (single lockfile at parent). */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, ".."),

  /** Allow embedding the dashboard in Elementor (any parent origin). API stays server-only. */
  async headers() {
    return [
      {
        source: "/embed",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors *",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
