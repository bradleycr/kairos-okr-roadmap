"use client"

/**
 * 🚨 KairOS Global Error - Critical System Failure
 * 
 * Emergency error page for critical system failures with recovery protocols
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertOctagonIcon,
  RefreshCwIcon, 
  TerminalIcon,
  PowerIcon,
  ShieldOffIcon,
  WifiOffIcon,
  ZapOffIcon,
  HomeIcon,
  LifeBuoyIcon,
  AlertTriangleIcon
} from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [recoverySteps, setRecoverySteps] = useState<string[]>([])
  const [isRecovering, setIsRecovering] = useState(false)

  useEffect(() => {
    console.error("Global error:", error)
    // Activate emergency mode after 3 seconds
    const timer = setTimeout(() => setEmergencyMode(true), 3000)
    return () => clearTimeout(timer)
  }, [error])

  const initiateRecovery = async () => {
    setIsRecovering(true)
    setRecoverySteps([])
    
    const recoverySequence = [
      "🔴 INITIATING EMERGENCY PROTOCOLS",
      "🛡️ Isolating affected systems...",
      "🔄 Attempting quantum state reset...",
      "⚡ Rerouting neural pathways...",
      "🧠 Purging corrupted memory banks...",
      "🔧 Rebuilding matrix connections...",
      "✅ Recovery sequence complete",
      "🚀 System ready for restart"
    ]

    for (const step of recoverySequence) {
      await new Promise(resolve => setTimeout(resolve, 1200))
      setRecoverySteps(prev => [...prev, step])
    }
    
    setIsRecovering(false)
  }

  const handleEmergencyReset = () => {
    setRecoverySteps([])
    setEmergencyMode(false)
    reset()
  }

  return (
    <html lang="en">
      <head>
        <title>KairOS - Critical System Failure</title>
        <style jsx>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'JetBrains Mono', monospace; }
        `}</style>
      </head>
      <body>
        <div className="h-screen w-screen bg-gradient-to-br from-red-950 via-black to-orange-950 relative overflow-hidden">
          {/* Critical Error Background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-red-800/30 to-orange-600/20 animate-pulse"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(220,38,38,0.2)_0%,transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(234,88,12,0.2)_0%,transparent_50%)]"></div>
          </div>

          {/* Emergency Alert Grid */}
          <div className="absolute inset-0 opacity-10">
            <motion.div
              animate={{ 
                backgroundPosition: ['0px 0px', '50px 50px']
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: 'linear' 
              }}
              className="w-full h-full"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, rgba(220, 38, 38, 0.5) 1px, transparent 1px),
                  linear-gradient(-45deg, rgba(220, 38, 38, 0.5) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center p-8 text-center text-white">
            
            {/* Critical Alert Icon */}
            <motion.div
              className="mb-8 relative"
              animate={{
                scale: emergencyMode ? [1, 1.2, 1] : [1, 1.05, 1],
                rotate: [0, -1, 1, 0]
              }}
              transition={{
                duration: emergencyMode ? 1 : 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <motion.div
                className="relative p-8 rounded-full bg-red-600/20 border-2 border-red-500/50 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <AlertOctagonIcon className="h-20 w-20 text-red-400" />
                
                {/* Critical Warning Pulses */}
                <motion.div
                  className="absolute inset-0 border-2 border-red-400/60 rounded-full"
                  animate={{ 
                    scale: [1, 2, 3], 
                    opacity: [0.8, 0.4, 0] 
                  }}
                  transition={{ 
                    duration: emergencyMode ? 1 : 2, 
                    repeat: Infinity 
                  }}
                />
                <motion.div
                  className="absolute inset-0 border-2 border-orange-400/40 rounded-full"
                  animate={{ 
                    scale: [1, 1.8, 2.5], 
                    opacity: [0.6, 0.3, 0] 
                  }}
                  transition={{ 
                    duration: emergencyMode ? 1.2 : 2.5, 
                    repeat: Infinity,
                    delay: 0.3
                  }}
                />
              </motion.div>
            </motion.div>

            {/* Critical Error Title */}
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <motion.h1 
                className="text-5xl md:text-6xl font-bold text-red-400 mb-4 select-none"
                animate={emergencyMode ? { 
                  textShadow: [
                    '0 0 10px rgba(239, 68, 68, 0.8)',
                    '0 0 20px rgba(239, 68, 68, 1)',
                    '0 0 10px rgba(239, 68, 68, 0.8)'
                  ]
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  filter: 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.5))'
                }}
              >
                CRITICAL FAILURE
              </motion.h1>
              <div className="flex items-center justify-center gap-2 text-xl text-orange-300">
                <ShieldOffIcon className="h-6 w-6" />
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  System integrity compromised
                </span>
              </div>
            </motion.div>

            {/* Emergency Status */}
            <AnimatePresence>
              {emergencyMode && (
                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="bg-red-600/20 border border-red-500/40 rounded-lg px-6 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-3 text-red-300">
                      <motion.div
                        className="w-3 h-3 bg-red-500 rounded-full"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '14px' }}>
                        EMERGENCY MODE ACTIVATED
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Description */}
            <motion.div 
              className="space-y-4 mb-8 max-w-2xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-lg text-gray-300 leading-relaxed" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                A critical malfunction has occurred in the KairOS quantum core. 
                All non-essential systems have been disabled for safety.
              </p>
              
              {error.digest && (
                <motion.div 
                  className="bg-black/40 backdrop-blur-sm border border-red-500/30 rounded-lg p-4"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2 text-sm text-red-300" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <TerminalIcon className="h-4 w-4" />
                    <span>CRITICAL ERROR ID: {error.digest}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Emergency Actions */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                onClick={handleEmergencyReset}
                className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg rounded-lg transition-all"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <div className="relative flex items-center gap-2">
                  <PowerIcon className="h-5 w-5" />
                  Emergency Restart
                </div>
              </button>

              <button 
                onClick={initiateRecovery}
                disabled={isRecovering}
                className="group relative overflow-hidden border-2 border-orange-500/50 hover:border-orange-500/70 hover:bg-orange-500/10 text-orange-300 px-8 py-4 text-lg rounded-lg transition-all disabled:opacity-50"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                <motion.div
                  animate={isRecovering ? { rotate: 360 } : {}}
                  transition={{ duration: 2, repeat: isRecovering ? Infinity : 0, ease: 'linear' }}
                  className="relative flex items-center gap-2"
                >
                  <LifeBuoyIcon className="h-5 w-5" />
                  {isRecovering ? 'Recovering...' : 'Recovery Protocol'}
                </motion.div>
              </button>
            </motion.div>

            {/* Recovery Console */}
            <AnimatePresence>
              {recoverySteps.length > 0 && (
                <motion.div 
                  className="w-full max-w-lg mb-8"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="bg-black/50 backdrop-blur-sm border border-green-500/40 rounded-lg p-6" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    <div className="text-green-400 mb-3 flex items-center gap-2 text-sm">
                      <TerminalIcon className="h-4 w-4" />
                      <span>RECOVERY CONSOLE</span>
                    </div>
                    <div className="space-y-2 text-green-300 text-sm">
                      {recoverySteps.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-green-500">{'>'}</span>
                          <span>{step}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* System Status */}
            <motion.div 
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
            >
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full border border-red-500/30" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                <motion.div
                  className="w-2 h-2 bg-red-500 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span>STATUS: CRITICAL</span>
                <span className="text-red-400">•</span>
                <span>PRIORITY: MAXIMUM</span>
                <span className="text-red-400">•</span>
                <span>MODE: {emergencyMode ? 'EMERGENCY' : 'NORMAL'}</span>
              </div>
            </motion.div>
          </div>
        </div>
      </body>
    </html>
  )
} 