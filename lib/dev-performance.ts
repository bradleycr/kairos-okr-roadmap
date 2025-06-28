/**
 * Development Performance Optimization Utilities
 * Helps identify and resolve performance bottlenecks in development
 */

// --- Performance Monitoring ---
export class DevPerformanceMonitor {
  private static instance: DevPerformanceMonitor
  private metrics: Map<string, number> = new Map()
  private startTimes: Map<string, number> = new Map()

  static getInstance(): DevPerformanceMonitor {
    if (!DevPerformanceMonitor.instance) {
      DevPerformanceMonitor.instance = new DevPerformanceMonitor()
    }
    return DevPerformanceMonitor.instance
  }

  // Start timing an operation
  start(operation: string): void {
    if (process.env.NODE_ENV === 'development') {
      this.startTimes.set(operation, performance.now())
    }
  }

  // End timing and log if slow
  end(operation: string, threshold: number = 100): number {
    if (process.env.NODE_ENV !== 'development') return 0

    const startTime = this.startTimes.get(operation)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.metrics.set(operation, duration)
    this.startTimes.delete(operation)

    if (duration > threshold) {
      console.warn(`⚠️ Slow operation: ${operation} took ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  // Get performance report
  getReport(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }

  // Clear metrics
  clear(): void {
    this.metrics.clear()
    this.startTimes.clear()
  }
}

// --- Lazy Loading Utilities ---
export const lazyWithPerformance = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  name: string
) => {
  const monitor = DevPerformanceMonitor.getInstance()
  
  return React.lazy(() => {
    monitor.start(`lazy-${name}`)
    return importFn().then(module => {
      monitor.end(`lazy-${name}`)
      return module
    })
  })
}

// --- Heavy Computation Debouncer ---
export const debounceHeavyComputation = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): T => {
  let timeoutId: NodeJS.Timeout
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), delay)
  }) as T
}

// --- Memory Usage Tracker ---
export const trackMemoryUsage = (operation: string) => {
  if (process.env.NODE_ENV !== 'development' || !performance.memory) {
    return { before: 0, after: 0, delta: 0 }
  }

  const before = performance.memory.usedJSHeapSize
  
  return {
    before,
    finish: () => {
      const after = performance.memory.usedJSHeapSize
      const delta = after - before
      
      if (delta > 1024 * 1024) { // More than 1MB
        console.warn(`🧠 Memory spike in ${operation}: +${(delta / 1024 / 1024).toFixed(2)}MB`)
      }
      
      return { before, after, delta }
    }
  }
}

// --- Crypto Operations Optimizer ---
export const optimizeCryptoOperations = {
  // Cache expensive crypto operations
  cache: new Map<string, any>(),
  
  // Memoized crypto function wrapper
  memoize: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    keyFn: (...args: Parameters<T>) => string
  ) => {
    return (async (...args: Parameters<T>) => {
      const key = keyFn(...args)
      
      if (optimizeCryptoOperations.cache.has(key)) {
        return optimizeCryptoOperations.cache.get(key)
      }
      
      const monitor = DevPerformanceMonitor.getInstance()
      monitor.start(`crypto-${fn.name}`)
      
      const result = await fn(...args)
      
      monitor.end(`crypto-${fn.name}`, 50) // Crypto should be fast
      optimizeCryptoOperations.cache.set(key, result)
      
      return result
    }) as T
  },
  
  // Clear crypto cache
  clearCache: () => {
    optimizeCryptoOperations.cache.clear()
  }
}

// --- Bundle Analysis Helper ---
export const analyzeBundleImpact = (componentName: string) => {
  if (process.env.NODE_ENV !== 'development') return

  const monitor = DevPerformanceMonitor.getInstance()
  monitor.start(`render-${componentName}`)
  
  return {
    finish: () => monitor.end(`render-${componentName}`, 16) // Target 60fps
  }
}

// --- Development Recommendations ---
export const getPerformanceRecommendations = (): string[] => {
  const recommendations: string[] = []
  const monitor = DevPerformanceMonitor.getInstance()
  const report = monitor.getReport()
  
  // Check for slow operations
  const slowOps = Object.entries(report).filter(([_, time]) => time > 100)
  if (slowOps.length > 0) {
    recommendations.push('Consider optimizing slow operations: ' + slowOps.map(([op]) => op).join(', '))
  }
  
  // Check for crypto operations
  const cryptoOps = Object.keys(report).filter(key => key.startsWith('crypto-'))
  if (cryptoOps.length > 5) {
    recommendations.push('Consider caching crypto operations to improve performance')
  }
  
  // Check for memory usage
  if (performance.memory && performance.memory.usedJSHeapSize > 50 * 1024 * 1024) {
    recommendations.push('High memory usage detected. Consider lazy loading heavy components')
  }
  
  return recommendations
}

// --- React Import (for lazy loading) ---
import React from 'react'

// --- Export Performance Hook ---
export const usePerformanceMonitor = () => {
  const monitor = DevPerformanceMonitor.getInstance()
  
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const recommendations = getPerformanceRecommendations()
        if (recommendations.length > 0) {
          console.group('🚀 KairOS Performance Recommendations')
          recommendations.forEach(rec => console.log('💡', rec))
          console.groupEnd()
        }
      }, 30000) // Check every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [])
  
  return {
    start: monitor.start.bind(monitor),
    end: monitor.end.bind(monitor),
    getReport: monitor.getReport.bind(monitor),
    clear: monitor.clear.bind(monitor)
  }
} 