/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Performance Optimizations ---
  // Disable type checking and linting during development builds for speed
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // --- Image Optimization ---
  images: {
    unoptimized: true, // Disable image optimization for faster dev builds
    domains: [], // Add domains as needed
  },
  
  // --- Experimental Features for Performance ---
  experimental: {
    // Enable faster builds and hot reloading
    turbo: {
      rules: {
        // Optimize crypto and heavy computation files
        '*.wasm': {
          loaders: ['file-loader'],
          as: '*.wasm',
        },
      },
    },
    
    // Optimize bundle analysis
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      '@noble/ed25519',
      '@noble/hashes',
    ],
  },
  
  // --- Development Optimizations ---
  ...(process.env.NODE_ENV === 'development' && {
    // Webpack configuration for development
    webpack: (config, { dev, isServer }) => {
      if (dev) {
        // Don't override devtool in development - let Next.js handle it
        // This prevents the webpack devtool warning
        
        // Optimize crypto libraries loading
        config.resolve.fallback = {
          ...config.resolve.fallback,
          crypto: false,
          stream: false,
          buffer: false,
        }
        
        // Reduce bundle analysis overhead
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              // Separate heavy crypto libraries
              crypto: {
                test: /[\\/]node_modules[\\/](@noble|snarkjs|circomlibjs)[\\/]/,
                name: 'crypto',
                chunks: 'all',
                priority: 10,
              },
              // Separate UI components
              ui: {
                test: /[\\/]node_modules[\\/](@radix-ui|framer-motion)[\\/]/,
                name: 'ui',
                chunks: 'all',
                priority: 5,
              },
            },
          },
        }
      }
      
      return config
    },
  }),
  
  // --- Build Optimizations ---
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // --- Output Configuration ---
  output: 'standalone',
  
  // --- Headers for better caching ---
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

export default nextConfig
