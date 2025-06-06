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
  SmartphoneIcon
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
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 animate-[fadeIn_0.5s_ease-out]">
          <AlertTriangleIcon className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <strong>Optimize NFC Experience</strong>
                <p className="text-sm mt-1">{recommendations?.message}</p>
              </div>
              <Button
                size="sm"
                onClick={openInChrome}
                className="ml-4 bg-blue-600 hover:bg-blue-700 text-white"
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
        <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20 animate-[fadeIn_0.5s_ease-out]">
          <CheckCircleIcon className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center justify-between">
              <div>
                <strong>Optimized for iPhone</strong>
                <p className="text-sm mt-1">{recommendations?.message}</p>
              </div>
              <div className="ml-4 text-green-600">
                <SmartphoneIcon className="h-5 w-5" />
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="border border-border shadow-lg bg-card/80 backdrop-blur-sm animate-[slideIn_0.5s_ease-out] relative">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <div className="relative">
              <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              {verificationState.status === 'verifying' && (
                <div className="absolute inset-0 animate-spin">
                  <div className="w-full h-full border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
            <span className="font-mono tracking-wide">RITUAL.AUTHENTICATION.PROTOCOL</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm font-mono">
            {verificationState.status === 'verifying' 
              ? <span className="animate-pulse">CONNECTING TO DECENTRALIZED NETWORK...</span>
              : <span>Cryptographic pendant detected - initiating verification</span>
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
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
              <AlertDescription className="text-destructive">
                {verificationState.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          {verificationState.status === 'success' && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          )}

          {(verificationState.status === 'failure' || verificationState.status === 'error') && (
            <div className="space-y-3">
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
              >
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
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