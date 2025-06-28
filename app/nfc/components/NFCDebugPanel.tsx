/**
 * NFCDebugPanel Component
 * 
 * Professional debug interface for developers and troubleshooting
 * Provides comprehensive logging and system information
 */

'use client'

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { 
  BugIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon
} from 'lucide-react'
import type { NFCVerificationState, NFCParameters } from '../types/nfc.types'

interface NFCDebugPanelProps {
  verificationState: NFCVerificationState
  nfcParams: NFCParameters
  format: string
}

export function NFCDebugPanel({ verificationState, nfcParams, format }: NFCDebugPanelProps) {
  const { toast } = useToast()
  const [isVisible, setIsVisible] = useState(false)

  const copyDebugInfo = useCallback(() => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      format,
      nfcParams,
      verificationState: {
        ...verificationState,
        // Don't include debug logs in the copy to avoid recursion
        debugLogs: verificationState.debugLogs.slice(-10) // Last 10 logs only
      }
    }
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
    toast({
      title: "📋 Debug Info Copied",
      description: "Full debug information copied to clipboard",
    })
  }, [verificationState, nfcParams, format, toast])

  if (!isVisible) {
    return (
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
        >
          <BugIcon className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="text-left mt-4">
      <div className="bg-muted rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
            <BugIcon className="h-4 w-4" />
            Debug Information
          </h4>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={copyDebugInfo}
              className="h-6 px-2 text-xs"
            >
              <CopyIcon className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 px-2 text-xs"
            >
              <EyeOffIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
        
        {/* Parameters Info */}
        <div className="mb-4 p-3 bg-background rounded border">
          <div className="text-xs font-mono space-y-1">
            <div><strong>Format:</strong> {format}</div>
            <div><strong>Parameters:</strong> {Object.keys(nfcParams).length} keys</div>
            {nfcParams.deviceId && <div><strong>Device ID:</strong> {nfcParams.deviceId}</div>}
            {nfcParams.chipUID && <div><strong>Chip UID:</strong> {nfcParams.chipUID}</div>}
            {nfcParams.did && <div><strong>DID:</strong> {nfcParams.did.substring(0, 30)}...</div>}
          </div>
        </div>
        
        {/* Debug Logs - Simple scrollable div instead of ScrollArea */}
        <div className="h-40 w-full rounded border p-4 overflow-y-auto bg-background">
          {verificationState.debugLogs.length === 0 ? (
            <p className="text-gray-500 italic text-xs">No debug logs yet.</p>
          ) : (
            <div className="space-y-1">
              {verificationState.debugLogs.map((log, index) => (
                <div key={index} className="text-xs font-mono text-muted-foreground">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 