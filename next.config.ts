import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    // local uploads served from /uploads/*
  },
  // data/*.json + uploads/* are read with dynamic fs paths, which the
  // deployment file-tracer cannot always see. Force them into every server
  // trace so Vercel (and Docker/standalone) bundles serve committed content.
  outputFileTracingIncludes: {
    "/*": ["./data/**/*", "./uploads/**/*"],
  },
  experimental: {
    // Needed for server actions file handling
  },
};

export default nextConfig;
