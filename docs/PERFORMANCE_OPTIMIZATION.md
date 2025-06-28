# KairOS Performance Optimization Guide

This guide helps resolve performance issues in both development and production environments.

## 🚀 Quick Fixes Applied

### Service Worker 404 Fix
- **Issue**: Browser requests `/sw.js` but file doesn't exist
- **Solution**: Created `public/sw.js` with minimal PWA functionality
- **Result**: No more 404 errors, proper PWA support

### Development Performance Improvements
- **Issue**: Slow dev server due to heavy crypto libraries and large bundle
- **Solution**: Optimized Next.js config with:
  - Bundle splitting for crypto and UI libraries
  - Turbo mode support
  - Optimized package imports
  - Proper webpack configuration (avoiding devtool override warnings)

### Configuration Warnings Fixed
- **Issue**: Invalid `swcMinify` in experimental options
- **Solution**: Removed deprecated option (SWC minification is enabled by default in Next.js 15)
- **Issue**: Webpack devtool override causing performance warnings
- **Solution**: Let Next.js handle devtool configuration automatically

## 🛠 Performance Scripts

### Development Commands
```bash
# Standard development (current)
pnpm dev

# Faster development with Turbo (recommended)
pnpm dev:fast

# Development with profiling
pnpm dev:profile

# Check system performance
pnpm perf:check
```

### Build & Analysis
```bash
# Build with bundle analysis
pnpm build:analyze

# Clean build cache
pnpm clean

# Complete clean reinstall
pnpm clean:all
```

## 📊 Performance Monitoring

### Built-in Performance Monitor
The app includes a development performance monitor that:
- Tracks slow operations (>100ms)
- Monitors crypto operations
- Provides memory usage warnings
- Gives optimization recommendations

### Usage in Components
```typescript
import { usePerformanceMonitor } from '@/lib/dev-performance'

function MyComponent() {
  const perf = usePerformanceMonitor()
  
  useEffect(() => {
    perf.start('heavy-operation')
    // ... heavy operation
    perf.end('heavy-operation')
  }, [])
}
```

## 🎯 Common Performance Issues & Solutions

### 1. Slow Crypto Operations
**Problem**: Ed25519, hashing, and ZK-proof operations are expensive

**Solutions**:
- Use `optimizeCryptoOperations.memoize()` for repeated operations
- Implement debouncing with `debounceHeavyComputation()`
- Move heavy crypto to Web Workers

```typescript
import { optimizeCryptoOperations, debounceHeavyComputation } from '@/lib/dev-performance'

// Memoize expensive crypto operations
const memoizedSign = optimizeCryptoOperations.memoize(
  signMessage,
  (message) => `sign-${message}`
)

// Debounce heavy computations
const debouncedProofGeneration = debounceHeavyComputation(generateProof, 500)
```

### 2. Large Bundle Size
**Problem**: 20+ Radix UI components and heavy libraries slow initial load

**Solutions**:
- Use dynamic imports for heavy components
- Implement lazy loading with performance tracking

```typescript
import { lazyWithPerformance } from '@/lib/dev-performance'

const HeavyComponent = lazyWithPerformance(
  () => import('./HeavyComponent'),
  'HeavyComponent'
)
```

### 3. Memory Leaks
**Problem**: Crypto operations and large state can cause memory issues

**Solutions**:
- Use `trackMemoryUsage()` to identify leaks
- Clear crypto cache periodically
- Implement proper cleanup in useEffect

```typescript
import { trackMemoryUsage, optimizeCryptoOperations } from '@/lib/dev-performance'

useEffect(() => {
  const memTracker = trackMemoryUsage('component-mount')
  
  return () => {
    const stats = memTracker.finish()
    if (stats.delta > 5 * 1024 * 1024) { // 5MB threshold
      optimizeCryptoOperations.clearCache()
    }
  }
}, [])
```

## 🔧 Next.js Configuration Optimizations

### Development Optimizations
- **Turbo Mode**: Faster builds with `--turbo` flag
- **Bundle Splitting**: Separate crypto and UI libraries
- **Package Import Optimization**: Tree-shaking for large libraries
- **Proper Webpack Config**: Avoids devtool override warnings

### Production Optimizations
- **Console Removal**: Automatic console.log removal
- **Standalone Output**: Optimized deployment bundle
- **Service Worker Caching**: Proper PWA caching strategy

### Common Configuration Issues Avoided
```javascript
// ❌ Don't do this (causes warnings)
experimental: {
  swcMinify: true, // Deprecated in Next.js 15
}

webpack: (config, { dev }) => {
  if (dev) {
    config.devtool = 'eval-cheap-module-source-map' // Causes performance warning
  }
  return config
}

// ✅ Do this instead
experimental: {
  // swcMinify is enabled by default in Next.js 15
  optimizePackageImports: ['@radix-ui/react-icons'],
}

webpack: (config, { dev }) => {
  if (dev) {
    // Let Next.js handle devtool configuration
    // Only modify other webpack options
  }
  return config
}
```

## 📱 PWA & Service Worker

### Service Worker Features
- **Caching Strategy**: Network-first with cache fallback
- **Offline Support**: Basic offline page for navigation requests
- **Background Sync**: Ready for future NFC operation queuing
- **Push Notifications**: Framework for future notifications

### PWA Manifest
- **Optimized Icons**: Efficient icon sizes and formats
- **Proper Caching**: Long-term caching for static assets
- **Mobile Optimization**: Portrait-first design

## 🚨 Performance Monitoring

### Automatic Recommendations
The performance monitor provides automatic recommendations every 30 seconds in development:
- Slow operation identification
- Memory usage warnings
- Crypto operation optimization suggestions

### Manual Performance Checks
```typescript
import { DevPerformanceMonitor, getPerformanceRecommendations } from '@/lib/dev-performance'

// Get current performance metrics
const monitor = DevPerformanceMonitor.getInstance()
const report = monitor.getReport()
console.log('Performance Report:', report)

// Get optimization recommendations
const recommendations = getPerformanceRecommendations()
console.log('Recommendations:', recommendations)
```

## 🎨 UI Performance

### Heavy Component Optimization
- **Lazy Loading**: Use React.lazy for heavy components
- **Memoization**: Use React.memo for expensive renders
- **Virtual Scrolling**: For large lists (if needed)

### Animation Performance
- **Framer Motion**: Optimized with `layout` animations
- **CSS Transforms**: Use transform instead of position changes
- **GPU Acceleration**: Leverage will-change and transform3d

## 🔍 Debugging Performance Issues

### Development Tools
1. **React DevTools Profiler**: Identify slow renders
2. **Browser Performance Tab**: Analyze main thread blocking
3. **Network Tab**: Check for slow asset loading
4. **Memory Tab**: Monitor memory usage patterns

### Performance Metrics to Watch
- **First Contentful Paint (FCP)**: < 1.5s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.5s
- **Cumulative Layout Shift (CLS)**: < 0.1

## ⚠️ Common Configuration Warnings & Fixes

### Next.js 15 Specific Issues
1. **swcMinify Warning**: Remove from experimental config (enabled by default)
2. **Webpack devtool Warning**: Don't override in development mode
3. **Turbo Mode**: Use `--turbo` flag for faster builds
4. **Package Optimization**: Use `optimizePackageImports` for tree-shaking

### Troubleshooting Steps
```bash
# If you see configuration warnings:
1. Check next.config.mjs for deprecated options
2. Remove custom devtool settings in development
3. Use Next.js defaults where possible
4. Restart dev server after config changes

# Performance troubleshooting:
pnpm clean          # Clear build cache
pnpm perf:check     # Check system performance
pnpm dev:fast       # Use optimized development mode
```

## 🚀 Production Deployment

### Vercel Optimizations
- **Edge Functions**: For crypto operations
- **Image Optimization**: Automatic WebP conversion
- **Static Generation**: Pre-render static pages
- **CDN Caching**: Global asset distribution

### Performance Budget
- **Bundle Size**: < 500KB initial JS
- **Total Assets**: < 2MB
- **API Response Time**: < 200ms
- **Service Worker**: < 50KB

## 📈 Continuous Monitoring

### Performance Metrics
- Monitor Core Web Vitals in production
- Track bundle size changes in CI/CD
- Set up performance budgets
- Use Lighthouse CI for automated audits

### Alerting
- Set up alerts for performance regressions
- Monitor error rates for crypto operations
- Track service worker registration success rates 