import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // for the Docker standalone build
  output: 'standalone',
  images: {
    // covers come from the R2 CDN; don't run them through Next's optimizer
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.18.37'],
};

export default nextConfig;
