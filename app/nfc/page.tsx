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
import PINEntry from '@/components/ui/pin-entry'
// import { BondDialog } from '@/components/ui/bond-dialog' // Temporarily commented out

/**
 * Main NFC Authentication Content
 */
function NFCPageContent() {
  // Parse URL parameters intelligently
  const { 
    parsedParams, 
    format, 
    debugInfo, 
    hasValidParameters,
    accountInitialized,
    requiresPIN,
    pinGateInfo,
    isSameChip,
    currentSession,
    showBondDialog,
    newUserInfo,
    // Legacy card states (simplified)
    pinVerificationComplete,
    handlePINSuccess,
    handleBondCreate,
    handleBondDialogClose
  } = useNFCParameterParser()

  // Handle authentication flow
  const { 
    verificationState, 
    executeAuthentication 
  } = useNFCAuthentication()

  // 🔍 DEBUG: Add debugging for legacy-full format URLs
  useEffect(() => {
    console.log('🔍 NFC Page Debug Info:', {
      hasValidParameters: hasValidParameters(),
      requiresPIN,
      accountInitialized,
      pinVerificationComplete,
      format,
      chipUID: parsedParams.chipUID,
      debugInfo: debugInfo.slice(-3) // Last 3 debug messages
    })
    
    if (format === 'legacy-full') {
      console.log('🎯 Legacy-full format detected:', {
        parsedParams,
        hasValidParameters: hasValidParameters(),
        requiresPIN,
        accountInitialized,
        pinVerificationComplete,
        verificationState: verificationState.status
      })
    }
  }, [hasValidParameters, requiresPIN, accountInitialized, pinVerificationComplete, format, parsedParams, debugInfo, verificationState.status])

  // Auto-start authentication when valid parameters are detected and no PIN required
  useEffect(() => {
    if (hasValidParameters() && !requiresPIN && accountInitialized && verificationState.status === 'initializing') {
      console.log('🔐 Auto-starting authentication for authenticated card')
      executeAuthentication(parsedParams)
    }
  }, [hasValidParameters, requiresPIN, accountInitialized, parsedParams, verificationState.status, executeAuthentication])

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden touch-none" style={{ position: 'fixed', top: 0, left: 0 }}>
      {/* Holographic Background Effect - Matching Main Page */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,181,145,0.08)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(144,193,196,0.12)_0%,transparent_50%)]"></div>
      </div>
      
      <div className="h-full w-full flex flex-col px-4 relative z-10" style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' 
      }}>
        {/* Header */}
        <div className="text-center pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8 flex-shrink-0">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="relative p-3 rounded-full bg-primary/10 border border-primary/20">
              <NfcIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary relative z-10 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-mono font-light tracking-wider text-foreground/90">
              KairOS
            </h1>
          </div>
        </div>

        {/* Main Content - Conditional Rendering with improved mobile centering */}
        <div className="flex-1 flex items-center justify-center min-h-0 pb-8">
          {hasValidParameters() ? (
            /* PROGRAMMED NFC CHIP - Check PIN requirements */
            <>
              {requiresPIN ? (
                /* PIN REQUIRED: Show PIN entry form */
                <PINEntry
                  chipUID={parsedParams.chipUID!}
                  isNewDevice={pinGateInfo?.isNewDevice}
                  displayName={pinGateInfo?.displayName}
                  onSuccess={handlePINSuccess}
                />
              ) : accountInitialized && pinVerificationComplete ? (
                /* AUTHENTICATED: Show auth flow */
                <NFCAuthFlow 
                  verificationState={verificationState}
                  nfcParams={parsedParams}
                  format={format}
                />
              ) : (
                /* LOADING: Show processing state */
                <div className="text-center space-y-4">
                  <LoaderIcon className="h-8 w-8 animate-spin text-primary mx-auto" />
                  <p className="text-sm text-muted-foreground font-mono">
                    {parsedParams.chipUID ? 
                      `Processing authentication for ${parsedParams.chipUID.slice(-4)}...` : 
                      'Checking authentication requirements...'
                    }
                  </p>
                  {debugInfo.length > 0 && (
                    <div className="text-xs text-muted-foreground/70 font-mono max-w-xs">
                      {debugInfo[debugInfo.length - 1]}
                    </div>
                  )}
                  {/* 🔍 DEBUG: Show more debugging info for legacy-full format */}
                  {format === 'legacy-full' && (
                    <div className="text-xs text-red-400 font-mono max-w-md mt-4 space-y-1">
                      <div>🎯 Legacy-full format detected</div>
                      <div>ChipUID: {parsedParams.chipUID}</div>
                      <div>Has Valid Params: {hasValidParameters() ? '✅' : '❌'}</div>
                      <div>Requires PIN: {requiresPIN ? '🔒' : '🆓'}</div>
                      <div>Account Init: {accountInitialized ? '✅' : '❌'}</div>
                      <div>PIN Verified: {pinVerificationComplete ? '✅' : '❌'}</div>
                      <div>Verification State: {verificationState.status}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* MANUAL PAGE ACCESS: Show welcome screen */
            <NFCWelcomeScreen />
          )}
        </div>
      </div>

      {/* Bond Dialog - Temporarily disabled */}
      {/* {showBondDialog && newUserInfo && currentSession?.currentUser && (
        <BondDialog
          isOpen={showBondDialog}
          onClose={handleBondDialogClose}
          currentUser={{
            chipUID: currentSession.currentUser?.chipUID || '',
            displayName: currentSession.currentUser?.displayName || 'Unknown User'
          }}
          newUser={newUserInfo}
          onBondCreate={handleBondCreate}
        />
      )} */}
    </div>
  )
}

/**
 * Loading Component for Suspense
 */
function NFCPageLoading() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 relative overflow-hidden touch-none" style={{ position: 'fixed', top: 0, left: 0 }}>
      {/* Holographic Background Effect */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-accent/25 to-secondary/15 animate-pulse"></div>
      </div>
      
      <div className="h-full w-full flex items-center justify-center px-4 relative z-10" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
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