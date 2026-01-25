import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Habilitar output standalone solo para Docker (variable de entorno)
  output: process.env.STANDALONE === 'true' ? 'standalone' : undefined,
};

export default nextConfig;
