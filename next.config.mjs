/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Performance Optimizations ---
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // --- External Packages (moved from experimental in Next.js 15) ---
  serverExternalPackages: ['@noble/curves', '@noble/hashes'],
  
  // --- Build Optimizations ---
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // --- Output Configuration ---
  output: 'standalone',
  
  // --- Development Configuration for Subdomains ---
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ]
  },
  
  // --- Error Handling for Production ---
  experimental: {
    // Better error handling in production
    optimizePackageImports: ['@/components', '@/lib', '@/src'],
  },
  
  // --- Webpack optimizations for minification ---
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Optimize for production builds
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
}

export default nextConfig
