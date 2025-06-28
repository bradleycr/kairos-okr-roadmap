"use client"

/**
 * ⚡ KairOS Error - System Malfunction Detected
 * 
 * Beautiful, interactive error page with diagnostic animations
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangleIcon,
  RefreshCwIcon, 
  TerminalIcon,
  ZapIcon,
  WifiIcon,
  HomeIcon,
  BugIcon,
  ShieldIcon,
  ActivityIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [diagnostics, setDiagnostics] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  // Diagnostic simulation
  const runDiagnostics = async () => {
    setIsAnalyzing(true)
    setDiagnostics([])
    
    const diagnosticSteps = [
      "🔍 Scanning quantum entanglement matrix...",
      "🧠 Analyzing neural pathway integrity...", 
      "🔧 Checking cryptographic signatures...",
      "📡 Testing NFC field resonance...",
      "⚡ Validating holographic protocols...",
      "🛡️ Security clearance: VERIFIED",
      "✅ Diagnostic complete"
    ]

    for (const step of diagnosticSteps) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setDiagnostics(prev => [...prev, step])
    }
    
    setIsAnalyzing(false)
  }

  const handleReset = () => {
    setDiagnostics([])
    setShowDetails(false)
    reset()
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-background via-red-900/5 to-orange-900/5 relative overflow-hidden">
      {/* Error-themed Holographic Background */}
      <div className="absolute inset-0 opacity-25">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/15 to-yellow-500/10 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(239,68,68,0.1)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(245,158,11,0.1)_0%,transparent_50%)]"></div>
      </div>

      {/* Alert Grid Pattern */}
      <div className="absolute inset-0 opacity-5">
        <motion.div
          animate={{ 
            backgroundPosition: ['0px 0px', '60px 60px']
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: 'linear' 
          }}
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(239, 68, 68, 0.4) 1px, transparent 1px),
              linear-gradient(rgba(239, 68, 68, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center">
        
        {/* Animated Alert Icon */}
        <motion.div
          className="mb-8 relative"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -2, 2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <motion.div
            className="relative p-6 rounded-full bg-red-500/10 border border-red-500/30 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
          >
            <AlertTriangleIcon className="h-16 w-16 text-red-500" />
            
            {/* Warning Pulse */}
            <motion.div
              className="absolute inset-0 border-2 border-red-500/40 rounded-full"
              animate={{ 
                scale: [1, 1.5, 2], 
                opacity: [0.6, 0.3, 0] 
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity 
              }}
            />
          </motion.div>
        </motion.div>

        {/* Error Title */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-mono font-bold text-red-500 mb-4">
            SYSTEM ERROR
          </h1>
          <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
            <BugIcon className="h-5 w-5" />
            <span className="font-mono">Quantum flux destabilization detected</span>
          </div>
        </motion.div>

        {/* Error Description */}
        <motion.div 
          className="space-y-4 mb-8 max-w-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-lg text-muted-foreground leading-relaxed">
            An unexpected anomaly has occurred in the KairOS matrix. 
            Our quantum engineers are investigating the disturbance.
          </p>
          
          {error.digest && (
            <motion.div 
              className="bg-muted/30 backdrop-blur-sm border border-muted/40 rounded-lg p-4"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-mono">
                <TerminalIcon className="h-4 w-4" />
                <span>Error ID: {error.digest}</span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button 
            onClick={handleReset}
            size="lg" 
            className="group relative overflow-hidden bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-lg font-mono"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              initial={{ x: '-100%' }}
              whileHover={{ x: '100%' }}
              transition={{ duration: 0.6 }}
            />
            <RefreshCwIcon className="mr-2 h-5 w-5" />
            Restart System
          </Button>

          <Button 
            variant="outline" 
            size="lg"
            onClick={runDiagnostics}
            disabled={isAnalyzing}
            className="group border-orange-500/30 hover:border-orange-500/50 hover:bg-orange-500/10 px-8 py-4 text-lg font-mono"
          >
            <motion.div
              animate={isAnalyzing ? { rotate: 360 } : {}}
              transition={{ duration: 2, repeat: isAnalyzing ? Infinity : 0, ease: 'linear' }}
            >
              <ActivityIcon className="mr-2 h-5 w-5" />
            </motion.div>
            {isAnalyzing ? 'Analyzing...' : 'Run Diagnostics'}
          </Button>
        </motion.div>

        {/* Diagnostic Output */}
        <AnimatePresence>
          {diagnostics.length > 0 && (
            <motion.div 
              className="w-full max-w-md mb-8"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="bg-black/20 backdrop-blur-sm border border-green-500/30 rounded-lg p-4 font-mono text-sm">
                <div className="text-green-400 mb-2 flex items-center gap-2">
                  <TerminalIcon className="h-4 w-4" />
                  <span>DIAGNOSTIC CONSOLE</span>
                </div>
                <div className="space-y-1 text-green-300">
                  {diagnostics.map((step, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {step}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Links */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Link 
            href="/" 
            className="group flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors p-3 rounded-lg hover:bg-primary/5"
          >
            <HomeIcon className="h-4 w-4 group-hover:animate-pulse" />
            <span className="font-mono">Return Home</span>
          </Link>
          
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="group flex items-center gap-2 text-muted-foreground hover:text-orange-500 transition-colors p-3 rounded-lg hover:bg-orange-500/5"
          >
            <ShieldIcon className="h-4 w-4 group-hover:animate-pulse" />
            <span className="font-mono">Error Details</span>
          </button>
        </motion.div>

        {/* Error Details Panel */}
        <AnimatePresence>
          {showDetails && (
            <motion.div 
              className="mt-6 w-full max-w-2xl"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-muted/20 backdrop-blur-sm border border-muted/30 rounded-lg p-6">
                <h3 className="text-lg font-mono font-bold text-foreground mb-4">
                  Technical Details
                </h3>
                <div className="text-sm font-mono text-muted-foreground space-y-2">
                  <div><strong>Message:</strong> {error.message}</div>
                  <div><strong>Type:</strong> {error.name}</div>
                  {error.stack && (
                    <div className="mt-4">
                      <strong>Stack Trace:</strong>
                      <pre className="mt-2 text-xs bg-black/20 p-3 rounded border border-muted/20 overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <motion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-muted/20 backdrop-blur-sm px-4 py-2 rounded-full border border-muted/30">
            <motion.div
              className="w-2 h-2 bg-orange-500 rounded-full"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span>STATUS: ERROR</span>
            <span className="text-primary">•</span>
            <span>RECOVERY MODE: ACTIVE</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 