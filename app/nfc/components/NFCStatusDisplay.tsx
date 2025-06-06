/**
 * NFCStatusDisplay Component
 * 
 * Gorgeous animated status display for NFC authentication states
 * Professional crypto-themed UI with terminal aesthetics
 */

'use client'

import React from 'react'
import { 
  NfcIcon, 
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon
} from 'lucide-react'
import type { NFCVerificationState } from '../types/nfc.types'

interface NFCStatusDisplayProps {
  verificationState: NFCVerificationState
}

export function NFCStatusDisplay({ verificationState }: NFCStatusDisplayProps) {
  const getStatusIcon = () => {
    switch (verificationState.status) {
      case 'verifying':
        return (
          <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16">
            {/* Outer rotating ring - dial-up connection feel */}
            <div className="absolute inset-0 border-2 border-primary rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
            <div className="absolute inset-1 border border-primary/50 rounded-full animate-spin" style={{animationDuration: '3s', animationDirection: 'reverse'}}></div>
            <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
              <NfcIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
            </div>
          </div>
        )
      
      case 'success':
        return (
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
            <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        )
      
      case 'failure':
      case 'error':
        return (
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-destructive/10 rounded-full flex items-center justify-center animate-[shake_0.5s_ease-out]">
            <XCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
          </div>
        )
      
      default:
        return (
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center">
            <NfcIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
          </div>
        )
    }
  }

  const getStatusTitle = () => {
    switch (verificationState.status) {
      case 'success':
        return (
          <span className="animate-[typewriter_1s_ease-in] text-primary">
            ◈ RITUAL COMPLETE ◈
          </span>
        )
      default:
        return (
          <span className="animate-[typewriter_1s_ease-in]">
            ◈ AUTHENTICATING ◈
          </span>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Status Icon */}
      <div className="flex justify-center py-2">
        {getStatusIcon()}
      </div>
      
      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground font-mono tracking-wide">
          {getStatusTitle()}
        </h3>
      </div>
      
      {/* Status Message */}
      <div className="text-center px-2">
        <p className="text-xs sm:text-sm text-muted-foreground font-mono animate-pulse">
          {verificationState.currentPhase}
        </p>
      </div>
    </div>
  )
}

// Add the keyframe animations via styled component wrapper
export function NFCStatusDisplayWithAnimations({ verificationState }: NFCStatusDisplayProps) {
  return (
    <>
      <NFCStatusDisplay verificationState={verificationState} />
      <style jsx>{`
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </>
  )
} 