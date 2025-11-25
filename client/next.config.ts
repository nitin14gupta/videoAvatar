import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-940ccf6255b54fa799a9b01050e6c227.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'ccscontent.mafatlaleducation.dev',
      }
    ],
  },
};

export default nextConfig;
