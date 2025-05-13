import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Improve server action stability
  experimental: {
    serverActions: {
      // Allow using server actions imported from anywhere
      allowedOrigins: ['localhost:3000'],
      // Increase the timeout for server actions
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
