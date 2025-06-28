/**
 * NFCAuthFlow Component
 * 
 * Main authentication flow orchestrator with beautiful crypto-themed UI
 * Handles all authentication states with professional polish
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  NfcIcon, 
  ShieldCheckIcon,
  HomeIcon,
  RefreshCwIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  SmartphoneIcon,
  UserIcon
} from 'lucide-react'
import type { NFCVerificationState, NFCParameters } from '../types/nfc.types'
import { NFCStatusDisplayWithAnimations } from './NFCStatusDisplay'
import { NFCProgressIndicator } from './NFCProgressIndicator'
import { NFCDebugPanel } from './NFCDebugPanel'
import { useDeviceDetection } from '../hooks/useDeviceDetection'

interface NFCAuthFlowProps {
  verificationState: NFCVerificationState
  nfcParams: NFCParameters
  format: string
}

export function NFCAuthFlow({ verificationState, nfcParams, format }: NFCAuthFlowProps) {
  const router = useRouter()
  const { capabilities, openInChrome, getOptimizationRecommendations } = useDeviceDetection()
  
  const recommendations = getOptimizationRecommendations()
  const shouldPromptChromeSwitch = recommendations?.shouldPromptChromeSwitch && 
    Object.keys(nfcParams).length > 0

  const shouldShowIPhoneInfo = capabilities?.isIPhone && Object.keys(nfcParams).length > 0

  return (
    <>
      {/* Chrome Switch Prompt for Android Non-Chrome Users */}
      {shouldPromptChromeSwitch && verificationState.status === 'initializing' && (
        <Alert className="border-warning/20 bg-warning/10 animate-[fadeIn_0.5s_ease-out]">
          <AlertTriangleIcon className="h-4 w-4 text-warning" />
          <AlertDescription className="text-foreground">
            <div className="flex items-center justify-between">
              <div>
                <strong>Optimize NFC Experience</strong>
                <p className="text-sm mt-1">{recommendations?.message}</p>
              </div>
              <Button
                size="sm"
                onClick={openInChrome}
                className="ml-4 bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
              >
                <SmartphoneIcon className="h-3 w-3 mr-1" />
                {recommendations?.actionText}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* iPhone Optimization Message */}
      {shouldShowIPhoneInfo && verificationState.status === 'initializing' && (
        <Alert className="border-success/20 bg-success/10 animate-[fadeIn_0.5s_ease-out]">
          <CheckCircleIcon className="h-4 w-4 text-success" />
          <AlertDescription className="text-foreground">
            <div className="flex items-center justify-between">
              <div>
                <strong>Optimized for iPhone</strong>
                <p className="text-sm mt-1">{recommendations?.message}</p>
              </div>
              <div className="ml-4 text-success">
                <SmartphoneIcon className="h-5 w-5" />
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border border-primary/20 shadow-lift bg-card/90 backdrop-blur-sm animate-[slideIn_0.5s_ease-out] relative mx-auto max-w-lg">
        <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="flex items-center gap-2 text-sm sm:text-base lg:text-lg">
            <div className="relative flex-shrink-0">
              <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              {verificationState.status === 'verifying' && (
                <div className="absolute inset-0 animate-spin">
                  <div className="w-full h-full border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <span className="font-mono tracking-wide text-primary text-xs sm:text-sm lg:text-base truncate">
              RITUAL.AUTHENTICATION.PROTOCOL
            </span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm font-mono text-muted-foreground mt-1">
            {verificationState.status === 'verifying' 
              ? <span className="animate-pulse">CONNECTING TO DECENTRALIZED NETWORK...</span>
              : <span>Cryptographic pendant detected - initiating verification</span>
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 px-4 sm:px-6 pb-4 sm:pb-6">
          {/* Debug Panel */}
          <NFCDebugPanel 
            verificationState={verificationState}
            nfcParams={nfcParams}
            format={format}
          />

          {/* Status Display */}
          <NFCStatusDisplayWithAnimations verificationState={verificationState} />
          
          {/* Progress Indicator */}
          <NFCProgressIndicator verificationState={verificationState} />
          
          {/* Error Message */}
          {(verificationState.status === 'failure' || verificationState.status === 'error') && (
            <Alert className="border-destructive/20 bg-destructive/10">
              <AlertTriangleIcon className="h-4 w-4 text-destructive" />
              <AlertDescription className="text-destructive text-sm">
                {verificationState.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {verificationState.status === 'success' && (
            <div className="pt-2">
              <Button
                onClick={async () => {
                  try {
                    // 🔐 CRYPTO: Ensure secure session exists before navigation
                    const { SessionManager } = await import('@/lib/nfc/sessionManager')
                    
                    let currentSession = await SessionManager.getCurrentSession()
                    
                    // Create session if it doesn't exist
                    if (!currentSession.isActive && nfcParams.chipUID) {
                      console.log('🔐 Creating secure session for profile access')
                      const newSession = await SessionManager.createSession(nfcParams.chipUID)
                      if (!newSession) {
                        throw new Error('Failed to create secure session')
                      }
                      currentSession = await SessionManager.getCurrentSession()
                    }
                    
                    if (!currentSession.isActive) {
                      throw new Error('Unable to establish secure session')
                    }
                    
                    // Construct profile URL with secure authentication parameters
                    const profileUrl = new URL('/profile', window.location.origin)
                    profileUrl.searchParams.set('verified', 'true')
                    profileUrl.searchParams.set('source', 'nfc-auth')
                    profileUrl.searchParams.set('chipUID', nfcParams.chipUID || '')
                    profileUrl.searchParams.set('session', currentSession.currentUser?.sessionId || '')
                    profileUrl.searchParams.set('momentId', verificationState.momentId || `moment_${Date.now()}`)
                    profileUrl.searchParams.set('auth_timestamp', Date.now().toString())
                    
                    console.log('🚀 Navigating to profile with verified session:', {
                      sessionId: currentSession.currentUser?.sessionId?.slice(-8) || 'unknown',
                      chipUID: nfcParams.chipUID?.slice(-4) || 'unknown'
                    })
                    
                    router.push(profileUrl.toString())
                  } catch (error) {
                    console.error('❌ Failed to create session for profile access:', error)
                    // Show error and provide fallback
                    alert('Failed to create secure session. Please try tapping your NFC chip again.')
                  }
                }}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm"
              >
                <UserIcon className="h-4 w-4 mr-2" />
                Visit Your Profile
              </Button>
            </div>
          )}

          {(verificationState.status === 'failure' || verificationState.status === 'error') && (
            <div className="space-y-3 pt-2">
              <Button
                onClick={() => window.location.reload()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-sm"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full border-muted text-muted-foreground hover:bg-muted font-mono text-sm"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
} 