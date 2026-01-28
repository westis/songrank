import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: ".",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co", // Spotify album artwork
      },
    ],
  },
};

export default nextConfig;
