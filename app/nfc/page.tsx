'use client'

/**
 * NFC Authentication Gateway
 * 
 * Professional Web3 NFC authentication system for decentralized identity
 * Enterprise-grade architecture with beautiful crypto-themed UI
 * 
 * Built for MELD ecosystem and edge computing applications
 */

import React, { Suspense, useEffect } from 'react'
import { NfcIcon, LoaderIcon, SmartphoneIcon } from 'lucide-react'

// Import our professional component architecture
import { useNFCParameterParser } from './hooks/useNFCParameterParser'
import { useNFCAuthentication } from './hooks/useNFCAuthentication'
import { NFCAuthFlow } from './components/NFCAuthFlow'
import { NFCWelcomeScreen } from './components/NFCWelcomeScreen'

/**
 * Main NFC Authentication Content
 */
function NFCPageContent() {
  // Parse URL parameters intelligently
  const { 
    parsedParams, 
    format, 
    debugInfo, 
    hasValidParameters 
  } = useNFCParameterParser()

  // Handle authentication flow
  const { 
    verificationState, 
    executeAuthentication 
  } = useNFCAuthentication()

  // Auto-start authentication when valid parameters are detected
  useEffect(() => {
    if (hasValidParameters() && verificationState.status === 'initializing') {
      executeAuthentication(parsedParams)
    }
  }, [hasValidParameters, parsedParams, verificationState.status, executeAuthentication])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Animated background grid - retro terminal vibes */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
      </div>
      
      <div className="container mx-auto px-3 py-4 max-w-sm sm:max-w-md md:max-w-2xl space-y-4 relative z-10">
        
        {/* Professional Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="relative p-2 sm:p-3 rounded-full bg-primary/10 border border-primary/20">
              <NfcIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary relative z-10" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                <span className="animate-[fadeIn_0.6s_ease-in]">Cryptographic</span>
                <br />
                <span className="animate-[fadeIn_0.8s_ease-in] text-primary">Ritual Gateway</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground animate-[fadeIn_1s_ease-in]">
                Decentralized identity for MELD ecosystem
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - Conditional Rendering */}
        {hasValidParameters() ? (
          /* PROGRAMMED NFC CHIP: Show authentication flow */
          <NFCAuthFlow 
            verificationState={verificationState}
            nfcParams={parsedParams}
            format={format}
          />
        ) : (
          /* MANUAL PAGE ACCESS: Show welcome screen */
          <NFCWelcomeScreen />
        )}

        {/* Professional Footer */}
        <div className="text-center pt-6 pb-4">
          <p className="text-xs text-muted-foreground font-mono animate-[fadeIn_1.5s_ease-out]">
            DECENTRALIZED.RITUAL.GATEWAY • POWERED.BY.MELD
          </p>
        </div>
      </div>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

/**
 * Loading Component for Suspense
 */
function NFCPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-primary rounded-lg shadow-minimal">
              <SmartphoneIcon className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            NFC Authentication
          </h1>
          <p className="text-foreground text-lg">
            Loading authentication system...
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-foreground">Initializing secure authentication...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Main Page Export with Suspense Boundary
 */
export default function NFCPage() {
  return (
    <Suspense fallback={<NFCPageLoading />}>
      <NFCPageContent />
    </Suspense>
  )
} 