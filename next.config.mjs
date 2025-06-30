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
}

export default nextConfig
