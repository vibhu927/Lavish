import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    // local uploads served from /uploads/*
  },
  experimental: {
    // Needed for server actions file handling
  },
};

export default nextConfig;
