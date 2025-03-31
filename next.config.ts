import type { NextConfig } from "next";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for node: protocol imports from Inngest
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        "async_hooks": false,
        "diagnostics_channel": false,
        "http": false,
        "https": false,
        "net": false,
        "tls": false,
        "fs": false,
        "util": false,
        "zlib": false,
        "path": false,
        "url": false,
        "stream": false,
        "crypto": false,
        "os": false,
        "events": false
      };
    }
    return config;
  },
};

export default nextConfig;
