# 🚀 Development Performance Guide

This guide covers optimizations for maximum development server performance in KairOS.

## ⚡ Quick Start - Optimized Dev Server

```bash
# Use the optimized dev command (with Turbopack)
pnpm dev

# For legacy compatibility (slower)
pnpm dev:legacy

# With performance monitoring
pnpm perf:monitor
```

## 🎯 Performance Targets

| Metric | Target | Current Optimization |
|--------|--------|---------------------|
| Cold Start | <5s | Turbopack + optimized webpack |
| Hot Reload | <2s | Faster source maps + split chunks disabled |
| Memory Usage | <500MB | Optimized dependencies + cleanup |
| Error Rate | 0% | Enhanced error handling |

## 🔧 Development Environment Setup

### Environment Variables

Create a `.env.local` file for optimal development performance:

```bash
# Performance optimizations
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
TSC_NONPOLLING_WATCHER=1

# Memory management
NODE_OPTIONS="--max-old-space-size=4096 --max-new-space-size=1024"

# Development features
ANALYZE_BUNDLE=false
DISABLE_ESLINT_PLUGIN=true
DEV_PERFORMANCE_MONITOR=true

# Cache directories
TURBOPACK_CACHE_DIR=.next/cache/turbopack
SWC_CACHE_DIR=.next/cache/swc

# Performance thresholds
DEV_COLD_START_THRESHOLD=5000
DEV_HOT_RELOAD_THRESHOLD=2000
DEV_MEMORY_THRESHOLD=500
```

### System Optimizations

For MacBook Pro Intel (recommended):

```bash
# Increase file watcher limits
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Optimize Node.js for development
export NODE_OPTIONS="--max-old-space-size=4096"

# Use fast disk (SSD recommended)
# Ensure project is on local SSD, not network drive
```

## 📊 Performance Monitoring

### Real-time Monitoring

```bash
# Run with performance monitoring
pnpm perf:monitor

# View performance logs
tail -f .next/performance.log

# Check performance summary
cat .next/performance-summary.json | jq '.'
```

### Manual Performance Checks

```bash
# System info
pnpm perf:check

# Bundle analysis (production)
pnpm build:analyze

# Profile build
pnpm build:profile
```

## 🛠️ Implemented Optimizations

### 1. Next.js Configuration (`next.config.mjs`)

- **Turbopack**: Enabled by default for faster builds
- **Source Maps**: `eval-cheap-module-source-map` for development
- **Bundle Splitting**: Disabled in development for faster rebuilds
- **Module Resolution**: Optimized for development builds
- **Caching**: Enhanced static asset caching

### 2. TypeScript Configuration (`tsconfig.json`)

- **Incremental Builds**: Enabled with cache in `.next/cache/`
- **Skip Lib Check**: Faster compilation
- **Assume Changes**: Optimized dependency checking

### 3. Development Scripts (`package.json`)

```json
{
  "dev": "next dev --turbo",                    // Default optimized
  "dev:fast": "... --turbo",                    // Maximum speed
  "dev:debug": "DEBUG=1 next dev --turbo",      // Debug mode
  "dev:profile": "... --experimental-upload-trace", // Profiling
  "perf:monitor": "node scripts/dev-performance-monitor.js" // Monitoring
}
```

### 4. Webpack Optimizations

**Development Mode:**
- Faster source maps (`eval-cheap-module-source-map`)
- Disabled unnecessary optimizations
- Named module IDs for better debugging
- Reduced bundle processing

**Bundle Size Reduction:**
- Tree-shaking optimization (lucide-react has built-in tree-shaking)
- External packages for heavy dependencies  
- Development React builds

## 🐛 Troubleshooting

### Slow Cold Start (>5s)

1. **Check imports**: Large imports in main pages slow startup
   ```bash
   # Find large imports
   grep -r "import.*from.*node_modules" app/ --include="*.tsx" --include="*.ts"
   ```

2. **Clear cache**: Stale cache can slow builds
   ```bash
   pnpm clean:turbo
   # or
   pnpm clean:all
   ```

3. **Check memory**: Insufficient memory slows builds
   ```bash
   # Monitor during startup
   htop
   ```

### Slow Hot Reload (>2s)

1. **Large components**: Split large components
2. **Heavy computations**: Move to separate files
3. **Source maps**: Ensure using fast source maps
4. **Dependencies**: Check for unnecessary re-renders

### Memory Issues

1. **Memory leaks**: Check useEffect cleanup
2. **Large state**: Reduce state size in development
3. **Cache buildup**: Regular cache cleanup

### Frequent Errors

1. **TypeScript**: Check `tsconfig.json` setup
2. **Import paths**: Verify path mappings
3. **Dependencies**: Update to latest compatible versions

## 📈 Performance Metrics Tracking

The performance monitor tracks:

- **Cold Start Time**: Initial server startup
- **Hot Reload Times**: Change-to-update duration
- **Memory Usage**: Heap and RSS memory
- **Error Rate**: Compilation and runtime errors
- **Build Success Rate**: Successful vs failed builds

### Reading Performance Reports

```bash
# View current status
grep "Performance Status" .next/performance.log | tail -1

# Get recommendations
grep "Recommendations" .next/performance.log | tail -1
```

## 🎯 Advanced Optimizations

### Custom Build Optimizations

For specific needs, you can customize:

```javascript
// next.config.mjs additions
experimental: {
  turbo: {
    // Custom Turbopack rules
    rules: {
      '*.custom': ['custom-loader'],
    }
  }
}
```

### IDE Integration

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false,
  "eslint.enable": false
}
```

### CI/CD Optimizations

```yaml
# GitHub Actions example
- name: Setup Node.js
  uses: actions/setup-node@v3
  with:
    node-version: '18'
    cache: 'pnpm'

- name: Install dependencies
  run: |
    npm install -g pnpm
    pnpm install --frozen-lockfile

- name: Build with performance tracking
  run: pnpm build:profile
```

## 🚨 Performance Alerts

Monitor these thresholds:

- **Cold Start > 5s**: Investigation needed
- **Hot Reload > 2s**: Optimization required
- **Memory > 500MB**: Potential memory leak
- **Error Rate > 5%**: Code quality issue

## 📚 Additional Resources

- [Next.js Performance Docs](https://nextjs.org/docs/advanced-features/performance)
- [Turbopack Documentation](https://turbo.build/pack)
- [TypeScript Performance Guide](https://github.com/microsoft/TypeScript/wiki/Performance)
- [Webpack Optimization](https://webpack.js.org/guides/build-performance/)

---

For questions or issues with development performance, check the performance logs or run the monitor for detailed insights. 