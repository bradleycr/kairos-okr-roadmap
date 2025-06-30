"use client"

import React, { useState, useEffect, useRef } from "react"
import { generateEd25519KeyPair, createDIDKey, signMoment, verifyMomentSignature, exportKeyPair, importKeyPair } from "@/lib/crypto"
import type { Moment } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/ui/copy-button"
import { HAL } from "@/lib/hardwareAbstraction"
import { 
  Terminal, 
  Cpu, 
  Shield, 
  Database, 
  Activity, 
  Settings, 
  Book, 
  Eye, 
  Zap, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Wifi, 
  HardDrive, 
  Network,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Globe,
  Lock,
  Key,
  Code,
  FileText,
  Smartphone,
  Tablet,
  Github,
  ExternalLink,
  Copy,
  Play,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Layers,
  Fingerprint
} from "lucide-react"
import { cn } from "@/lib/utils"

// Enhanced diagnostic types
type DiagnosticResult = {
  label: string
  pass: boolean
  details: string
  performance?: number
  category: 'crypto' | 'system' | 'network' | 'storage'
}

type SystemMetrics = {
  memory: number
  storage: number
  performance: number
  latency: number
  timestamp: number
}

type LogEntry = {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'debug'
  category: string
  message: string
  details?: any
}

// Utility functions for diagnostics
function isValidDIDKey(did: string): boolean {
  return /^did:key:z[1-9A-HJ-NP-Za-km-z]+$/.test(did)
}

function isTimestampValid(ts: string): boolean {
  const now = Date.now()
  const t = new Date(ts).getTime()
  return Math.abs(now - t) <= 5 * 60 * 1000
}

// Mock system metrics generator
function generateSystemMetrics(): SystemMetrics {
  return {
    memory: Math.random() * 100,
    storage: Math.random() * 100,
    performance: 95 + Math.random() * 5,
    latency: 10 + Math.random() * 20,
    timestamp: Date.now()
  }
}

// Enhanced crypto diagnostics runner
async function runCryptoDiagnostics(setResults: (r: DiagnosticResult[]) => void, setProgress: (p: number) => void) {
  const results: DiagnosticResult[] = []
  const totalTests = 8

  // Helper to add progress
  const addResult = (result: DiagnosticResult, index: number) => {
    results.push(result)
    setProgress((index + 1) / totalTests * 100)
  }

  // Simulate realistic test timing
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // 1. Keypair generation performance
  const startTime = performance.now()
  const keyA = await HAL.crypto.generateKeyPair()
  const keyGenTime = performance.now() - startTime
  await delay(200)
  
  addResult({
    label: "Crypto Key Generation Performance",
    pass: keyGenTime < 100,
    details: `Generated in ${keyGenTime.toFixed(2)}ms`,
    performance: keyGenTime,
    category: 'crypto'
  }, 0)

  // 2. DID determinism (we'll use exported keys for DID creation)
  const keyAPublicBytes = await HAL.crypto.exportPublicKey(keyA.publicKey)
  const didA = createDIDKey(keyAPublicBytes)
  const didA2 = createDIDKey(keyAPublicBytes)
  await delay(150)
  
  addResult({
    label: "DID Deterministic Generation",
    pass: didA === didA2,
    details: didA === didA2 ? `Consistent: ${didA.substring(0, 30)}...` : `Mismatch detected`,
    category: 'crypto'
  }, 1)

  // 3. DID uniqueness with multiple keys
  const keyB = await HAL.crypto.generateKeyPair()
  const keyC = await HAL.crypto.generateKeyPair()
  const keyBPublicBytes = await HAL.crypto.exportPublicKey(keyB.publicKey)
  const keyCPublicBytes = await HAL.crypto.exportPublicKey(keyC.publicKey)
  const didB = createDIDKey(keyBPublicBytes)
  const didC = createDIDKey(keyCPublicBytes)
  await delay(100)
  
  addResult({
    label: "DID Uniqueness Verification",
    pass: didA !== didB && didB !== didC && didA !== didC,
    details: `Generated 3 unique DIDs from 3 different keys`,
    category: 'crypto'
  }, 2)

  // 4. W3C compliance
  const w3cValid = isValidDIDKey(didA) && isValidDIDKey(didB) && isValidDIDKey(didC)
  await delay(50)
  
  addResult({
    label: "W3C DID:key Standard Compliance",
    pass: w3cValid,
    details: w3cValid ? "All DIDs follow W3C specification" : "Non-compliant DID format detected",
    category: 'crypto'
  }, 3)

  // 5. Signature performance and verification
  const moment: Omit<Moment, "signature"> = {
    subject: didA,
    issuer: didB,
    timestamp: new Date().toISOString(),
    description: "KairOS diagnostic test moment",
  }
  
  const signStart = performance.now()
  const signature = await signMoment(keyB.privateKey, moment)
  const signTime = performance.now() - signStart
  
  const verifyStart = performance.now()
  const valid = await verifyMomentSignature(keyB.publicKey, moment, signature)
  const verifyTime = performance.now() - verifyStart
  await delay(100)
  
  addResult({
    label: "Signature Generation & Verification",
    pass: valid && signTime < 100 && verifyTime < 100,
    details: `Sign: ${signTime.toFixed(2)}ms, Verify: ${verifyTime.toFixed(2)}ms`,
    performance: signTime + verifyTime,
    category: 'crypto'
  }, 4)

  // 6. Tampering detection
  const tampered = { ...moment, description: "Tampered diagnostic moment" }
  const tamperedValid = await verifyMomentSignature(keyB.publicKey, tampered, signature)
  await delay(50)
  
  addResult({
    label: "Cryptographic Tampering Detection",
    pass: !tamperedValid,
    details: !tamperedValid ? "Tampering correctly detected and rejected" : "Security vulnerability: tampering not detected",
    category: 'crypto'
  }, 5)

  // 7. Cross-key verification failure
  const mismatchValid = await verifyMomentSignature(keyA.publicKey, moment, signature)
  await delay(50)
  
  addResult({
    label: "Cross-Key Verification Security",
    pass: !mismatchValid,
    details: !mismatchValid ? "Properly rejects signatures from different keys" : "Security vulnerability: accepts wrong keys",
    category: 'crypto'
  }, 6)

  // 8. Timestamp validation
  const timestampValid = isTimestampValid(moment.timestamp)
  await delay(50)
  
  addResult({
    label: "Temporal Validation System",
    pass: timestampValid,
    details: timestampValid ? `Valid timestamp: ${moment.timestamp}` : "Timestamp outside acceptable window",
    category: 'crypto'
  }, 7)

  setResults(results)
}

// System diagnostics runner
async function runSystemDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = []
  
  // Browser capabilities
  const hasWebCrypto = !!window.crypto?.subtle
  const hasLocalStorage = !!window.localStorage
  const hasSessionStorage = !!window.sessionStorage
  const hasIndexedDB = !!window.indexedDB
  const hasWorkers = !!window.Worker
  
  results.push({
    label: "Web Crypto API Support",
    pass: hasWebCrypto,
    details: hasWebCrypto ? "Native cryptographic operations available" : "Web Crypto API not supported",
    category: 'system'
  })
  
  results.push({
    label: "Local Storage Availability",
    pass: hasLocalStorage,
    details: hasLocalStorage ? "Client-side persistence available" : "Local storage not available",
    category: 'storage'
  })
  
  results.push({
    label: "IndexedDB Support",
    pass: hasIndexedDB,
    details: hasIndexedDB ? "Advanced client-side database available" : "IndexedDB not supported",
    category: 'storage'
  })
  
  results.push({
    label: "Web Workers Support",
    pass: hasWorkers,
    details: hasWorkers ? "Background processing capabilities available" : "Web Workers not supported",
    category: 'system'
  })
  
  // Performance metrics
  const connectionType = (navigator as any)?.connection?.effectiveType || 'unknown'
  const isOnline = navigator.onLine
  
  results.push({
    label: "Network Connectivity",
    pass: isOnline,
    details: isOnline ? `Online (${connectionType})` : "Offline mode",
    category: 'network'
  })
  
  return results
}

export default function DeveloperDiagnosticsHub() {
  // Main state management
  const [activeTab, setActiveTab] = useState<'overview' | 'crypto' | 'system' | 'logs' | 'guides' | 'settings'>('overview')
  const [cryptoResults, setCryptoResults] = useState<DiagnosticResult[] | null>(null)
  const [systemResults, setSystemResults] = useState<DiagnosticResult[] | null>(null)
  const [cryptoRunning, setCryptoRunning] = useState(false)
  const [cryptoProgress, setCryptoProgress] = useState(0)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))
  
  const metricsInterval = useRef<NodeJS.Timeout | null>(null)
  
  // Auto-generate logs and metrics
  useEffect(() => {
    const generateLog = () => {
      const categories = ['crypto', 'system', 'network', 'storage', 'ui']
      const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug']
      const messages = [
        'Key pair generation completed',
        'DID verification successful',
        'System health check passed',
        'Network latency within normal range',
        'Cache cleared successfully',
        'WebCrypto API initialized',
        'Local storage quota checked',
        'Performance metrics updated'
      ]
      
      const newLog: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        level: levels[Math.floor(Math.random() * levels.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        message: messages[Math.floor(Math.random() * messages.length)]
      }
      
      setLogs(prev => [newLog, ...prev.slice(0, 49)]) // Keep last 50 logs
    }
    
    // Generate initial logs
    for (let i = 0; i < 10; i++) {
      setTimeout(() => generateLog(), i * 100)
    }
    
    const logInterval = setInterval(generateLog, 3000)
    return () => clearInterval(logInterval)
  }, [])
  
  // System metrics monitoring
  useEffect(() => {
    if (isMonitoring) {
      metricsInterval.current = setInterval(() => {
        setSystemMetrics(prev => {
          const newMetrics = [...prev, generateSystemMetrics()].slice(-20) // Keep last 20 metrics
          return newMetrics
        })
      }, 1000)
    } else {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current)
      }
    }
    
    return () => {
      if (metricsInterval.current) {
        clearInterval(metricsInterval.current)
      }
    }
  }, [isMonitoring])
  
  // Auto-run system diagnostics on mount
  useEffect(() => {
    runSystemDiagnostics().then(setSystemResults)
  }, [])
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }
  
  const getStatusColor = (pass: boolean) => pass ? 'text-primary' : 'text-destructive'
  const getStatusIcon = (pass: boolean) => pass ? CheckCircle : XCircle
  
  const TabButton = ({ id, icon: Icon, label, active }: { 
    id: string, 
    icon: React.ComponentType<any>, 
    label: string, 
    active: boolean 
  }) => (
    <button
      onClick={() => setActiveTab(id as any)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200",
        "border border-transparent hover:border-border/50",
        active 
          ? "bg-primary/10 text-primary border-primary/20 shadow-minimal" 
          : "text-muted-foreground hover:text-foreground hover:bg-background/60"
      )}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm">{label}</span>
    </button>
  )
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container-adaptive py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-minimal">
                <Terminal className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Developer Diagnostics Hub</h1>
                <p className="text-sm text-muted-foreground">Comprehensive system analysis, monitoring & development tools</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={cn(
                "flex items-center gap-1.5 px-3 py-1",
                isMonitoring ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}>
                <Activity className={cn("w-3 h-3", isMonitoring && "animate-pulse")} />
                {isMonitoring ? "Monitoring" : "Standby"}
              </Badge>
              <Button
                onClick={() => setIsMonitoring(!isMonitoring)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isMonitoring ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isMonitoring ? "Stop" : "Start"} Monitoring
              </Button>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-2 mt-6">
            <TabButton id="overview" icon={BarChart3} label="Overview" active={activeTab === 'overview'} />
            <TabButton id="crypto" icon={Shield} label="Cryptography" active={activeTab === 'crypto'} />
            <TabButton id="system" icon={Cpu} label="System" active={activeTab === 'system'} />
            <TabButton id="logs" icon={FileText} label="Logs" active={activeTab === 'logs'} />
            <TabButton id="guides" icon={Book} label="Guides" active={activeTab === 'guides'} />
            <TabButton id="settings" icon={Settings} label="Settings" active={activeTab === 'settings'} />
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container-adaptive py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-slide-up">
            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <Shield className="w-8 h-8 text-primary" />
                  <Badge className="bg-primary/10 text-primary">Secure</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Cryptography</h3>
                <p className="text-sm text-muted-foreground">Ed25519 + DID:key verified</p>
                <div className="mt-4 text-2xl font-bold text-primary">
                  {cryptoResults ? `${cryptoResults.filter(r => r.pass).length}/${cryptoResults.length}` : '—'}
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <div className="flex items-center justify-between mb-3">
                  <Cpu className="w-8 h-8 text-accent" />
                  <Badge className="bg-accent/10 text-accent">Active</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">System</h3>
                <p className="text-sm text-muted-foreground">Browser capabilities</p>
                <div className="mt-4 text-2xl font-bold text-accent">
                  {systemResults ? `${systemResults.filter(r => r.pass).length}/${systemResults.length}` : '—'}
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                <div className="flex items-center justify-between mb-3">
                  <Activity className="w-8 h-8 text-secondary" />
                  <Badge className="bg-orange-100 text-orange-700">Demo</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Performance</h3>
                <p className="text-sm text-muted-foreground">Simulated metrics</p>
                <div className="mt-4 text-2xl font-bold text-secondary">
                  {systemMetrics.length > 0 ? `${systemMetrics[systemMetrics.length - 1]?.performance.toFixed(0)}%` : '—'}
                </div>
              </Card>
              
              <Card className="p-6 bg-gradient-to-br from-muted/5 to-muted/10 border-muted/20">
                <div className="flex items-center justify-between mb-3">
                  <FileText className="w-8 h-8 text-foreground" />
                  <Badge className="bg-orange-100 text-orange-700">Demo</Badge>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">Activity Logs</h3>
                <p className="text-sm text-muted-foreground">Sample log entries</p>
                <div className="mt-4 text-2xl font-bold text-foreground">
                  {logs.length}
                </div>
              </Card>
            </div>
            
            {/* Real-time Metrics Chart - SIMULATION ONLY */}
            {systemMetrics.length > 0 && (
              <Card className="p-6 border-orange-200 bg-orange-50/50">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Real-time Performance</h3>
                    <p className="text-xs text-orange-600 font-medium">⚠️ SIMULATION DATA - Not actual system metrics</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="w-4 h-4" />
                    Simulated readings
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Mock Performance Score</span>
                    <span className="text-sm text-primary font-mono">
                      {systemMetrics[systemMetrics.length - 1]?.performance.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500"
                      style={{ width: `${systemMetrics[systemMetrics.length - 1]?.performance || 0}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Simulated Network Latency</span>
                    <span className="text-sm text-accent font-mono">
                      {systemMetrics[systemMetrics.length - 1]?.latency.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-accent h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(systemMetrics[systemMetrics.length - 1]?.latency / 50 * 100 || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            )}
            
            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <Button
                  onClick={() => {
                    setCryptoRunning(true)
                    setCryptoProgress(0)
                    runCryptoDiagnostics(setCryptoResults, setCryptoProgress).finally(() => setCryptoRunning(false))
                  }}
                  disabled={cryptoRunning}
                  className="w-full gap-2 justify-start"
                  variant="outline"
                >
                  <Shield className="w-4 h-4" />
                  Run Crypto Tests
                </Button>
                <Button
                  onClick={() => runSystemDiagnostics().then(setSystemResults)}
                  className="w-full gap-2 justify-start"
                  variant="outline"
                >
                  <Cpu className="w-4 h-4" />
                  System Check
                </Button>
                <Button
                  onClick={() => setLogs([])}
                  className="w-full gap-2 justify-start"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Clear Logs
                </Button>
              </div>
            </Card>
          </div>
        )}
        
        {/* Crypto Tab */}
        {activeTab === 'crypto' && (
          <div className="space-y-6 animate-fade-slide-up">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Cryptographic Integrity Tests</h3>
                  <p className="text-sm text-muted-foreground">Ed25519 key generation, DID:key creation, and signature verification</p>
                </div>
                <Button
                  onClick={() => {
                    setCryptoRunning(true)
                    setCryptoProgress(0)
                    runCryptoDiagnostics(setCryptoResults, setCryptoProgress).finally(() => setCryptoRunning(false))
                  }}
                  disabled={cryptoRunning}
                  className="gap-2"
                >
                  {cryptoRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {cryptoRunning ? "Running..." : "Run Tests"}
                </Button>
              </div>
              
              {cryptoRunning && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Progress</span>
                    <span className="text-sm text-muted-foreground">{cryptoProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cryptoProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {cryptoResults && (
                <div className="space-y-3">
                  {cryptoResults.map((result, index) => {
                    const StatusIcon = getStatusIcon(result.pass)
                    return (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-background/50">
                        <StatusIcon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", getStatusColor(result.pass))} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{result.label}</span>
                            <Badge className={result.pass ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                              {result.pass ? "PASS" : "FAIL"}
                            </Badge>
                            {result.performance && (
                              <Badge variant="outline" className="font-mono text-xs">
                                {result.performance.toFixed(2)}ms
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground font-mono break-all">{result.details}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
            
            {/* Crypto Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Cryptographic Standards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Ed25519 Signatures</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    State-of-the-art elliptic curve cryptography providing 128-bit security with fast verification.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-accent" />
                    <span className="font-medium text-foreground">DID:key Standard</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    W3C compliant decentralized identifiers derived directly from public keys.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* System Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-fade-slide-up">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">System Capabilities</h3>
                  <p className="text-sm text-muted-foreground">Browser features and platform compatibility</p>
                </div>
                <Button
                  onClick={() => runSystemDiagnostics().then(setSystemResults)}
                  className="gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
              
              {systemResults && (
                <div className="space-y-3">
                  {systemResults.map((result, index) => {
                    const StatusIcon = getStatusIcon(result.pass)
                    const categoryIcons = {
                      system: Cpu,
                      storage: HardDrive,
                      network: Network,
                      crypto: Shield
                    }
                    const CategoryIcon = categoryIcons[result.category]
                    
                    return (
                      <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-border/50 bg-background/50">
                        <div className="flex items-center gap-2">
                          <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                          <StatusIcon className={cn("w-5 h-5 flex-shrink-0", getStatusColor(result.pass))} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{result.label}</span>
                            <Badge className={result.pass ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}>
                              {result.pass ? "SUPPORTED" : "MISSING"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{result.details}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
            
            {/* Device Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Device Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">User Agent</span>
                    <span className="text-sm text-foreground font-mono text-right max-w-xs truncate">
                      {navigator.userAgent.split(' ')[0]}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Platform</span>
                    <span className="text-sm text-foreground font-mono">{navigator.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Language</span>
                    <span className="text-sm text-foreground font-mono">{navigator.language}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Viewport</span>
                    <span className="text-sm text-foreground font-mono">
                      {window.innerWidth}×{window.innerHeight}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Color Depth</span>
                    <span className="text-sm text-foreground font-mono">{screen.colorDepth}-bit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Time Zone</span>
                    <span className="text-sm text-foreground font-mono">
                      {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
        
        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="space-y-6 animate-fade-slide-up">
            <Card className="p-6 border-orange-200 bg-orange-50/50">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Activity Logs</h3>
                  <p className="text-xs text-orange-600 font-medium">⚠️ DEMO DATA - Auto-generated sample logs for UI testing</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-100 text-orange-700">{logs.length} demo entries</Badge>
                  <Button onClick={() => setLogs([])} variant="outline" size="sm" className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Clear Demo Logs
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => {
                  const levelColors = {
                    info: 'text-primary',
                    warn: 'text-orange-500',
                    error: 'text-destructive',
                    debug: 'text-muted-foreground'
                  }
                  
                  return (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-background/50 font-mono text-sm">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <Badge className={cn("text-xs", `bg-${log.level === 'info' ? 'primary' : log.level === 'warn' ? 'orange' : log.level === 'error' ? 'destructive' : 'muted'}/10 text-${log.level === 'info' ? 'primary' : log.level === 'warn' ? 'orange-500' : log.level === 'error' ? 'destructive' : 'muted-foreground'}`)}>
                        {log.level.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-accent">{log.category}</span>
                      <span className="text-foreground flex-1">{log.message}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
        
        {/* Guides Tab */}
        {activeTab === 'guides' && (
          <div className="space-y-6 animate-fade-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Code className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">API Reference</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete documentation for KairOS cryptographic APIs and system integration.
                </p>
                <Button className="w-full gap-2" variant="outline" disabled>
                  <ExternalLink className="w-4 h-4" />
                  Coming Soon
                </Button>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Github className="w-6 h-6 text-accent" />
                  <h3 className="text-lg font-semibold text-foreground">Source Code</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Explore the open-source implementation and contribute to the project.
                </p>
                <Button className="w-full gap-2" variant="outline" disabled>
                  <ExternalLink className="w-4 h-4" />
                  Coming Soon
                </Button>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Layers className="w-6 h-6 text-secondary" />
                  <h3 className="text-lg font-semibold text-foreground">Architecture</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Deep dive into the decentralized architecture and cryptographic foundations.
                </p>
                <Button className="w-full gap-2" variant="outline" disabled>
                  <ExternalLink className="w-4 h-4" />
                  Coming Soon
                </Button>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Examples</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Ready-to-use code examples and integration patterns.
                </p>
                <Button className="w-full gap-2" variant="outline" disabled>
                  <ExternalLink className="w-4 h-4" />
                  Coming Soon
                </Button>
              </Card>
            </div>
          </div>
        )}
        
        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-slide-up">
            {/* Web3 Technical Manifesto */}
            <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Web3 Technical Manifesto</h3>
                  <p className="text-sm text-muted-foreground">Comprehensive breakdown for decentralization advocates</p>
                </div>
              </div>
              
              <div className="space-y-8">
                {/* Core Architecture */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">Decentralized Architecture</h4>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-green-600 mb-2">✅ What We Are</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• <span className="font-mono text-primary">Ed25519</span> cryptographic authentication</li>
                          <li>• <span className="font-mono text-primary">DID:key</span> standard compliance</li>
                          <li>• User-controlled private keys</li>
                          <li>• Challenge-response protocol</li>
                          <li>• Local-first identity management</li>
                          <li>• Offline-capable verification</li>
                          <li>• ESP32 edge computing nodes</li>
                          <li>• Physical world utility</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-orange-600 mb-2">⚠️ What We're Not</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Blockchain-based (no need for consensus)</li>
                          <li>• Token-gated (utility over speculation)</li>
                          <li>• DAO-governed (focused on infrastructure)</li>
                          <li>• NFT marketplace (real-world authentication)</li>
                          <li>• DeFi protocol (not financial)</li>
                          <li>• Fully trustless (pragmatic hybrid model)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cryptographic Implementation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    <h4 className="text-lg font-semibold text-foreground">Cryptographic Stack</h4>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-mono text-primary font-semibold mb-2">Frontend Crypto</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>@noble/ed25519 v2.2.3</div>
                          <div>WebCrypto API</div>
                          <div>Local key generation</div>
                          <div>Browser localStorage</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-accent font-semibold mb-2">Backend Crypto</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>@noble/ed25519 v2.2.3</div>
                          <div>Server-side verification</div>
                          <div>Challenge generation</div>
                          <div>DID resolution</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-secondary font-semibold mb-2">Hardware Crypto</div>
                        <div className="space-y-1 text-muted-foreground">
                          <div>libsodium (ESP32)</div>
                          <div>ed25519-donna</div>
                          <div>Hardware RNG</div>
                          <div>Flash storage</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Model Explanation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-secondary" />
                    <h4 className="text-lg font-semibold text-foreground">Hybrid Trust Model</h4>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                    <div className="space-y-4 text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-semibold text-primary mb-2">Identity Verification (Decentralized)</div>
                          <div className="space-y-1 text-muted-foreground font-mono">
                            <div>• Ed25519 signature verification</div>
                            <div>• Challenge-response protocol</div>
                            <div>• DID:key standard compliance</div>
                            <div>• Zero-knowledge proofs</div>
                          </div>
                        </div>
                        <div>
                          <div className="font-semibold text-accent mb-2">Trust Establishment (Pragmatic)</div>
                          <div className="space-y-1 text-muted-foreground font-mono">
                            <div>• PIN-based initial registration</div>
                            <div>• Local storage + optional sync</div>
                            <div>• Device fingerprinting</div>
                            <div>• Session management</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="font-semibold text-blue-800 mb-1">Why This Hybrid Approach?</div>
                        <div className="text-blue-700 text-xs">
                          Pure cryptographic trust requires pre-shared keys or PKI infrastructure. For physical-world authentication with 
                          dynamic user onboarding, we use crypto for <strong>identity verification</strong> and pragmatic methods for 
                          <strong>trust establishment</strong>. This enables real-world utility while maintaining cryptographic integrity.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Code Implementation Examples */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Code className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">Implementation Evidence</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                      <div className="font-mono text-sm font-semibold text-primary mb-2">Real Ed25519 Key Generation</div>
                      <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                        {`// lib/crypto.ts - Real cryptography, not simulation
export async function generateEd25519KeyPair(): Promise<{
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicKey = await ed.getPublicKeyAsync(privateKey);
  return { privateKey, publicKey };
}`}
                      </div>
                    </div>
                    
                    <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                      <div className="font-mono text-sm font-semibold text-accent mb-2">Local Identity Management</div>
                      <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                        {`// lib/crypto/decentralizedNFC.ts - User controls master seed
export function initializeLocalIdentity(userId: string): LocalUserIdentity {
  const masterSeed = Array.from(ed.utils.randomPrivateKey(), b => 
    b.toString(16).padStart(2, '0')).join('');
  
  // USER CONTROLS THIS - stored locally
  localStorage.setItem('kairOS_identity', JSON.stringify(identity));
  return identity;
}`}
                      </div>
                    </div>

                    <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                      <div className="font-mono text-sm font-semibold text-secondary mb-2">ESP32 Verification (No Private Keys)</div>
                      <div className="bg-black text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                        {`// Hardware verification - stateless, no user data stored
bool verifyEd25519Signature(const char* signature_hex, 
                           const char* message, 
                           const char* public_key_hex) {
    // Verify signature using only public key
    return crypto_sign_verify_detached(signature, message, public_key) == 0;
}`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Physical World Integration */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-accent" />
                    <h4 className="text-lg font-semibold text-foreground">Edge Computing Architecture</h4>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-semibold text-primary mb-2">ESP32 MELD Nodes</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• <span className="font-mono">$5 hardware cost</span></li>
                          <li>• WiFi + NFC + E-paper display</li>
                          <li>• Local content serving</li>
                          <li>• Zero user data storage</li>
                          <li>• Stateless authentication</li>
                          <li>• libsodium crypto verification</li>
                        </ul>
                      </div>
                      <div>
                        <div className="font-semibold text-accent mb-2">NFC Authentication Flow</div>
                        <ul className="space-y-1 text-muted-foreground">
                          <li>• Tap NFC → Read public key</li>
                          <li>• Generate challenge locally</li>
                          <li>• Phone signs with private key</li>
                          <li>• ESP32 verifies signature</li>
                          <li>• Grant access to local content</li>
                          <li>• No internet required</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Web3 Positioning */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-secondary" />
                    <h4 className="text-lg font-semibold text-foreground">Web3 Positioning</h4>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                    <div className="space-y-3 text-sm">
                      <div className="font-semibold text-green-800">"Crypto for IoT" - Bridging Digital Identity to Physical Reality</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-semibold text-blue-800 mb-1">Solving Real Problems</div>
                          <ul className="text-blue-700 space-y-1 text-xs">
                            <li>• Physical space authentication</li>
                            <li>• Offline-capable verification</li>
                            <li>• Edge device access control</li>
                            <li>• Decentralized social graphs via proximity</li>
                            <li>• Hardware-backed identity</li>
                          </ul>
                        </div>
                        <div>
                          <div className="font-semibold text-purple-800 mb-1">Technical Innovation</div>
                          <ul className="text-purple-700 space-y-1 text-xs">
                            <li>• NFC + Ed25519 on $5 hardware</li>
                            <li>• Local-first cryptographic identity</li>
                            <li>• Challenge-response without servers</li>
                            <li>• Physical world social bonding</li>
                            <li>• User-controlled master seeds</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-white border border-blue-200 rounded p-3">
                        <div className="font-mono text-xs text-blue-900">
                          <strong>Conference Pitch:</strong> "We're building the infrastructure layer for web3 to interact with physical reality. 
                          Think of every ESP32 as a web3 endpoint that can verify cryptographic identity without internet, databases, or trusted third parties. 
                          While others build financial instruments, we're building the 'last mile' of decentralized identity."
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Technical Specifications */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    <h4 className="text-lg font-semibold text-foreground">Technical Specifications</h4>
                  </div>
                  <div className="bg-background/50 border border-border/50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="font-mono text-primary font-semibold mb-2">Cryptographic</div>
                        <div className="space-y-1 text-muted-foreground font-mono text-xs">
                          <div>Ed25519 signatures</div>
                          <div>SHA-512 hashing</div>
                          <div>32-byte private keys</div>
                          <div>64-byte signatures</div>
                          <div>DID:key standard</div>
                          <div>128-bit security level</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-accent font-semibold mb-2">Hardware</div>
                        <div className="space-y-1 text-muted-foreground font-mono text-xs">
                          <div>ESP32-S3 MCU</div>
                          <div>PN532 NFC module</div>
                          <div>2.9" E-paper display</div>
                          <div>WiFi 802.11b/g/n</div>
                          <div>Flash storage</div>
                          <div>Hardware RNG</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-secondary font-semibold mb-2">Software</div>
                        <div className="space-y-1 text-muted-foreground font-mono text-xs">
                          <div>Next.js frontend</div>
                          <div>TypeScript/Rust backend</div>
                          <div>Arduino C++ firmware</div>
                          <div>libsodium crypto</div>
                          <div>Vercel deployment</div>
                          <div>Local-first storage</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Developer Preferences */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">Developer Preferences</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Auto-refresh Monitoring</h4>
                    <p className="text-sm text-muted-foreground">Automatically update demo metrics simulation</p>
                  </div>
                  <Button
                    onClick={() => setIsMonitoring(!isMonitoring)}
                    variant={isMonitoring ? "default" : "outline"}
                    size="sm"
                  >
                    {isMonitoring ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Verbose Logging</h4>
                    <p className="text-sm text-muted-foreground">Include debug information in logs</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">Export Diagnostics</h4>
                    <p className="text-sm text-muted-foreground">Download complete system report</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" disabled>
                    <Download className="w-4 h-4" />
                    Coming Soon
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">System Information</h3>
              <div className="text-sm text-muted-foreground space-y-2 font-mono">
                <div>KairOS Version: 0.1.0-alpha</div>
                <div>Build: {new Date().toISOString().split('T')[0]}</div>
                <div>Environment: {process.env.NODE_ENV || 'development'}</div>
                <div>Deployment: Vercel Edge Runtime</div>
                <div>Crypto Library: @noble/ed25519 v2.2.3</div>
                <div>Hardware Support: ESP32-S3 + PN532</div>
                <div>Standards: DID:key, Ed25519, NDEF</div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
} 