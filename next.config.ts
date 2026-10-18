import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
    optimizePackageImports: [
      '@phosphor-icons/react',
      'date-fns',
      'clsx',
      'tailwind-merge',
    ],
  },
};

export default nextConfig;
