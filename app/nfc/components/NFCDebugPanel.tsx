/**
 * NFCDebugPanel Component
 * 
 * Professional debug interface for developers and troubleshooting
 * Provides comprehensive logging and system information
 */

'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { 
  BugIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  SmartphoneIcon
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
  const [deviceInfo, setDeviceInfo] = useState<{
    fingerprint: string
    platform: string
    language: string
    screenSize: string
    concurrency: string
    hasLocalProfile: boolean
    sessionExists: boolean
    apiSessionExists: boolean
    apiSessionId: string
    currentUser: string
  } | null>(null)

  useEffect(() => {
    // Gather device information for debugging
    const gatherDeviceInfo = async () => {
      try {
        // Generate device fingerprint using the same logic as the session manager
        const stableComponents = [
          navigator.platform || 'unknown',
          navigator.language || 'en',
          Math.max(screen.width, screen.height) + 'x' + Math.min(screen.width, screen.height),
          navigator.hardwareConcurrency?.toString() || '4'
        ]
        
        let hash = 0
        const fingerprint = stableComponents.join('|')
        for (let i = 0; i < fingerprint.length; i++) {
          const char = fingerprint.charCodeAt(i)
          hash = ((hash << 5) - hash) + char
          hash = hash & hash
        }
        const deviceFingerprint = `device_${Math.abs(hash).toString(16)}`

        // Check for local profile and session
        const hasLocalProfile = nfcParams.chipUID ? 
          localStorage.getItem(`kairos:profile:${nfcParams.chipUID}`) !== null : false
        
        const sessionExists = nfcParams.chipUID ? 
          localStorage.getItem(`kairos:session:${nfcParams.chipUID}`) !== null : false

        // Check API session
        const apiSessionId = localStorage.getItem('kairos_session_id')
        const currentUser = localStorage.getItem('kairos_current_user')

        setDeviceInfo({
          fingerprint: deviceFingerprint,
          platform: navigator.platform || 'unknown',
          language: navigator.language || 'en',
          screenSize: Math.max(screen.width, screen.height) + 'x' + Math.min(screen.width, screen.height),
          concurrency: navigator.hardwareConcurrency?.toString() || '4',
          hasLocalProfile,
          sessionExists,
          apiSessionExists: !!apiSessionId,
          apiSessionId: apiSessionId?.slice(-8) || 'none',
          currentUser: currentUser?.slice(-4) || 'none'
        })
      } catch (error) {
        console.warn('Failed to gather device info for debug panel:', error)
      }
    }

    if (isVisible) {
      gatherDeviceInfo()
      // Refresh every 2 seconds when visible
      const interval = setInterval(gatherDeviceInfo, 2000)
      return () => clearInterval(interval)
    }
  }, [isVisible, nfcParams.chipUID])

  const copyDebugInfo = useCallback(() => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      format,
      nfcParams,
      deviceInfo,
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
  }, [verificationState, nfcParams, format, toast, deviceInfo])

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
        
        {/* Device Fingerprint Info */}
        {deviceInfo && (
          <div className="mb-4 p-3 bg-background rounded border">
            <div className="text-xs font-mono space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <SmartphoneIcon className="h-3 w-3" />
                <strong>Device Information</strong>
              </div>
              <div><strong>Fingerprint:</strong> {deviceInfo.fingerprint}</div>
              <div><strong>Platform:</strong> {deviceInfo.platform}</div>
              <div><strong>Language:</strong> {deviceInfo.language}</div>
              <div><strong>Screen:</strong> {deviceInfo.screenSize}</div>
              <div><strong>CPU Cores:</strong> {deviceInfo.concurrency}</div>
              <div><strong>Local Profile:</strong> {deviceInfo.hasLocalProfile ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Device Session:</strong> {deviceInfo.sessionExists ? '✅ Yes' : '❌ No'}</div>
              <div><strong>API Session:</strong> {deviceInfo.apiSessionExists ? '✅ Yes' : '❌ No'}</div>
              <div><strong>Session ID:</strong> {deviceInfo.apiSessionId}</div>
              <div><strong>Current User:</strong> {deviceInfo.currentUser}</div>
            </div>
          </div>
        )}
        
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