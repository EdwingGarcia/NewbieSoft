import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  trailingSlash: true,
  basePath: '/frontend',
  // assetPrefix: '/frontend',
};

export default nextConfig;
