/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Performance Optimizations ---
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // --- Development Performance Optimizations ---
  ...(process.env.NODE_ENV === 'development' && {
    // Note: lucide-react already has tree-shaking built-in, no modular imports needed
  }),
  
  // --- External Packages (moved from experimental in Next.js 15) ---
  serverExternalPackages: ['@noble/curves', '@noble/hashes', 'snarkjs', 'circomlibjs'],
  
  // --- Build Optimizations ---
  compiler: {
    // Remove console logs in production only
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
          },
          // Cache static assets in development for faster reloads
          ...(process.env.NODE_ENV === 'development' ? [{
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }] : [])
        ]
      }
    ]
  },
  
  // --- Enhanced Experimental Features ---
  experimental: {
    // Better error handling in production
    optimizePackageImports: ['@/components', '@/lib', '@/src'],
    // Turbopack optimizations
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
    // Enable faster development builds
    ...(process.env.NODE_ENV === 'development' && {
      optimizeCss: false,
      craCompat: false,
    }),
  },
  
  // --- Enhanced Webpack Configuration ---
  webpack: (config, { dev, isServer }) => {
    // Development optimizations
    if (dev) {
      // Faster source maps for development
      config.devtool = 'eval-cheap-module-source-map';
      
      // Optimize for faster rebuilds
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
      
      // Reduce bundle size in development
      config.resolve.alias = {
        ...config.resolve.alias,
        // Use development builds of React
        'react': 'react/index.js',
        'react-dom': 'react-dom/index.js',
      };
    }
    
    // Production optimizations and SSR fixes
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      // Disable IndexedDB-related modules during SSR
      'idb-keyval': false,
      indexeddb: false,
    };
    
    // Suppress pino-pretty warning from WalletConnect dependencies
    const originalIgnoreWarnings = config.ignoreWarnings || [];
    config.ignoreWarnings = [
      ...originalIgnoreWarnings,
      {
        module: /pino-pretty/,
      },
      /Module not found: Can't resolve 'pino-pretty'/,
    ];
    
    // Optimize for large dependencies
    config.optimization = {
      ...config.optimization,
      moduleIds: dev ? 'named' : 'deterministic',
    };
    
    return config;
  },
}

export default nextConfig
