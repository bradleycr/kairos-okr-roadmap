#!/usr/bin/env node

/**
 * 🚀 Development Performance Monitor
 * 
 * Tracks and reports on development server performance metrics:
 * - Cold start time measurement
 * - Hot reload time tracking  
 * - Memory usage monitoring
 * - Error rate tracking
 * - Build time analysis
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevPerformanceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      coldStartTime: 0,
      hotReloadTimes: [],
      memoryUsage: [],
      errorCount: 0,
      successfulBuilds: 0,
      lastError: null,
      uptime: 0
    };
    this.logFile = path.join('.next', 'performance.log');
    this.isReady = false;
    
    this.initializeLogging();
    this.setupProcessMonitoring();
  }

  initializeLogging() {
    // Ensure .next directory exists
    if (!fs.existsSync('.next')) {
      fs.mkdirSync('.next', { recursive: true });
    }
    
    // Initialize log file
    const header = `\n=== Dev Performance Monitor Started: ${new Date().toISOString()} ===\n`;
    fs.writeFileSync(this.logFile, header);
    
    console.log('🔍 Performance Monitor initialized');
    console.log(`📊 Logs: ${this.logFile}`);
  }

  setupProcessMonitoring() {
    // Monitor memory usage every 30 seconds
    setInterval(() => {
      const usage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: Math.round(usage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      });
      
      // Keep only last 100 measurements
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }, 30000);

    // Status report every 5 minutes
    setInterval(() => {
      this.generateStatusReport();
    }, 5 * 60 * 1000);
  }

  startDevServer() {
    console.log('🚀 Starting Next.js dev server with performance tracking...');
    
    const devProcess = spawn('pnpm', ['run', 'dev'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let buildStartTime = null;
    let isFirstBuild = true;

    devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(data);
      
      // Track cold start
      if (output.includes('Ready in') && isFirstBuild) {
        this.metrics.coldStartTime = Date.now() - this.startTime;
        console.log(`\n✅ Cold start completed in ${this.metrics.coldStartTime}ms`);
        this.logMetric('Cold Start', this.metrics.coldStartTime);
        this.isReady = true;
        isFirstBuild = false;
      }
      
      // Track hot reloads
      if (output.includes('compiling') || output.includes('Compiling')) {
        buildStartTime = Date.now();
      }
      
      if (output.includes('Compiled') && buildStartTime) {
        const hotReloadTime = Date.now() - buildStartTime;
        this.metrics.hotReloadTimes.push(hotReloadTime);
        this.metrics.successfulBuilds++;
        console.log(`⚡ Hot reload: ${hotReloadTime}ms`);
        this.logMetric('Hot Reload', hotReloadTime);
        buildStartTime = null;
      }
    });

    devProcess.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(data);
      
      // Track errors
      if (output.includes('Error:') || output.includes('Failed to compile')) {
        this.metrics.errorCount++;
        this.metrics.lastError = {
          timestamp: Date.now(),
          message: output.trim()
        };
        this.logMetric('Error', output.trim());
      }
    });

    devProcess.on('close', (code) => {
      console.log(`\n📊 Dev server closed with code ${code}`);
      this.generateFinalReport();
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down performance monitor...');
      this.generateFinalReport();
      devProcess.kill('SIGINT');
      process.exit(0);
    });
  }

  logMetric(type, value) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${type}: ${value}\n`;
    fs.appendFileSync(this.logFile, logEntry);
  }

  generateStatusReport() {
    this.metrics.uptime = Date.now() - this.startTime;
    
    const avgHotReload = this.metrics.hotReloadTimes.length > 0 
      ? Math.round(this.metrics.hotReloadTimes.reduce((a, b) => a + b, 0) / this.metrics.hotReloadTimes.length)
      : 0;
    
    const lastMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    
    const report = `
📊 === Performance Status Report ===
⏱️  Uptime: ${Math.round(this.metrics.uptime / 1000 / 60)} minutes
🚀 Cold Start: ${this.metrics.coldStartTime}ms
⚡ Avg Hot Reload: ${avgHotReload}ms (${this.metrics.hotReloadTimes.length} total)
✅ Successful Builds: ${this.metrics.successfulBuilds}
❌ Errors: ${this.metrics.errorCount}
🧠 Memory: ${lastMemory ? `${lastMemory.heapUsed}MB used, ${lastMemory.rss}MB RSS` : 'No data'}
=================================
`;
    
    console.log(report);
    this.logMetric('Status Report', report);
  }

  generateFinalReport() {
    const totalUptime = Date.now() - this.startTime;
    const avgHotReload = this.metrics.hotReloadTimes.length > 0 
      ? Math.round(this.metrics.hotReloadTimes.reduce((a, b) => a + b, 0) / this.metrics.hotReloadTimes.length)
      : 0;
    
    const slowReloads = this.metrics.hotReloadTimes.filter(time => time > 2000).length;
    const successRate = this.metrics.successfulBuilds / (this.metrics.successfulBuilds + this.metrics.errorCount) * 100;
    
    const finalReport = `
🏁 === Final Performance Report ===
⏱️  Total Session: ${Math.round(totalUptime / 1000 / 60)} minutes
🚀 Cold Start: ${this.metrics.coldStartTime}ms ${this.metrics.coldStartTime < 5000 ? '✅' : '❌'}
⚡ Hot Reload Avg: ${avgHotReload}ms ${avgHotReload < 2000 ? '✅' : '❌'}
🐌 Slow Reloads (>2s): ${slowReloads}
📈 Success Rate: ${successRate.toFixed(1)}%
✅ Total Builds: ${this.metrics.successfulBuilds}
❌ Total Errors: ${this.metrics.errorCount}

🎯 Performance Goals:
- Cold Start <5s: ${this.metrics.coldStartTime < 5000 ? 'PASS' : 'FAIL'}
- Hot Reload <2s: ${avgHotReload < 2000 ? 'PASS' : 'FAIL'}  
- 30min uptime: ${totalUptime > 30 * 60 * 1000 ? 'PASS' : 'PENDING'}
- Error-free: ${this.metrics.errorCount === 0 ? 'PASS' : 'FAIL'}

💡 Recommendations:
${this.generateRecommendations()}
=====================================
`;
    
    console.log(finalReport);
    this.logMetric('Final Report', finalReport);
    
    // Save summary to file
    fs.writeFileSync('.next/performance-summary.json', JSON.stringify(this.metrics, null, 2));
    console.log('📄 Performance summary saved to .next/performance-summary.json');
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.metrics.coldStartTime > 5000) {
      recommendations.push('- Consider using --turbo flag for faster cold starts');
      recommendations.push('- Check for unnecessary imports in your main pages');
    }
    
    const avgHotReload = this.metrics.hotReloadTimes.length > 0 
      ? this.metrics.hotReloadTimes.reduce((a, b) => a + b, 0) / this.metrics.hotReloadTimes.length
      : 0;
    
    if (avgHotReload > 2000) {
      recommendations.push('- Enable faster source maps (eval-cheap-module-source-map)');
      recommendations.push('- Consider reducing bundle size or splitting large components');
    }
    
    if (this.metrics.errorCount > 5) {
      recommendations.push('- Review recent changes that may be causing errors');
      recommendations.push('- Check for TypeScript configuration issues');
    }
    
    const lastMemory = this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1];
    if (lastMemory && lastMemory.heapUsed > 500) {
      recommendations.push('- Memory usage is high, check for memory leaks in useEffect hooks');
    }
    
    return recommendations.length > 0 ? recommendations.join('\n') : '- Performance looks good! 🎉';
  }
}

// Run the monitor
const monitor = new DevPerformanceMonitor();
monitor.startDevServer(); 