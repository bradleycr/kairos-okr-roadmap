'use client'

/**
 * NFC Gateway - Minimal Holographic Interface
 * 
 * Elegant NFC authentication matching the KairOS holographic aesthetic
 * Minimal design inspired by the Figma interface
 */

import React, { Suspense, useEffect } from 'react'
import { NfcIcon, LoaderIcon } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden">
      {/* Holographic Background Effect - Matching Main Page */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,181,145,0.08)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(144,193,196,0.12)_0%,transparent_50%)]"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-md relative z-10">
        {/* Minimal Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative p-3 rounded-full bg-primary/10 border border-primary/20">
              <NfcIcon className="h-8 w-8 text-primary relative z-10 animate-pulse" />
            </div>
          </div>
          <h1 className="text-3xl font-mono font-light tracking-wider text-foreground/90 mb-2">
            KairOS
          </h1>
          <p className="text-lg font-mono font-light tracking-wide text-muted-foreground/70">
            Connect your key
          </p>
        </div>

        {/* Main Content - Conditional Rendering */}
        <div className="min-h-[400px] flex items-center justify-center">
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
        </div>
      </div>
    </div>
  )
}

/**
 * Loading Component for Suspense
 */
function NFCPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden">
      {/* Holographic Background Effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
      </div>
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="relative p-4 rounded-full bg-primary/10 border border-primary/20 mx-auto w-fit">
              <LoaderIcon className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-mono font-light text-foreground/90">
                KairOS
              </h1>
              <p className="text-muted-foreground font-mono text-sm">
                Initializing secure gateway...
              </p>
            </div>
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