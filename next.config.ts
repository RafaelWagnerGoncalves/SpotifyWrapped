import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.scdn.co",
      },
      {
        protocol: "https",
        hostname: "mosaic.scdn.co",
      },
      {
        protocol: "https",
        hostname: "image-cdn-*.spotifycdn.com",
      },
      {
        protocol: "https",
        hostname: "wrapped-images.spotifycdn.com",
      },
    ],
  },
};

export default nextConfig;
