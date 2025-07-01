"use client"

/**
 * ⚡ KairOS Error - System Malfunction Detected
 * 
 * Interactive error page with diagnostic animations
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
    // Log the error to an error reporting service
    console.error('Application Error:', error)
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50/30 via-background to-red-100/20">
      <div className="max-w-md mx-auto text-center space-y-6 p-8">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <AlertTriangleIcon className="w-8 h-8 text-red-600" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-600">
            We encountered an unexpected error. This has been logged and we're looking into it.
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={handleReset}
            className="bg-red-600 hover:bg-red-700"
          >
            <RefreshCwIcon className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = '/'}
            className="border-red-200 text-red-600 hover:bg-red-50"
          >
            <HomeIcon className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
} 