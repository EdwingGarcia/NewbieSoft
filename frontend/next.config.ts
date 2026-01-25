import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Habilitar output standalone para Docker
  output: 'standalone',
};

export default nextConfig;
