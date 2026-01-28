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
      {
        protocol: "https",
        hostname: "mosaic.scdn.co", // Spotify playlist artwork
      },
      {
        protocol: "https",
        hostname: "image-cdn-ak.spotifycdn.com", // Spotify artist images
      },
      {
        protocol: "https",
        hostname: "image-cdn-fa.spotifycdn.com", // Spotify artist images (fallback)
      },
    ],
  },
};

export default nextConfig;
