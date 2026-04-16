import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    typedEnv: true,
  },
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default nextConfig
