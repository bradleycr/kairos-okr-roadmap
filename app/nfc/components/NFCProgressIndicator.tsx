/**
 * NFCProgressIndicator Component
 * 
 * Progress visualization for authentication flows
 * Clean, professional progress tracking with percentage display
 */

'use client'

import React from 'react'
import { Progress } from '@/components/ui/progress'
import type { NFCVerificationState } from '../types/nfc.types'

interface NFCProgressIndicatorProps {
  verificationState: NFCVerificationState
}

export function NFCProgressIndicator({ verificationState }: NFCProgressIndicatorProps) {
  if (verificationState.status !== 'verifying') return null

  return (
    <div className="space-y-2">
      <Progress 
        value={verificationState.progress} 
        className="h-1.5 sm:h-2 animate-[pulse_1s_ease-in-out_infinite]" 
      />
      <div className="text-center">
        <span className="text-xs font-mono text-muted-foreground">
          {verificationState.progress}% COMPLETE
        </span>
      </div>
    </div>
  )
} 