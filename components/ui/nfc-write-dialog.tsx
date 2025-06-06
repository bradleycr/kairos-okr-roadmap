/**
 * 📱 NFC Write Progress Dialog - Elegant Mobile-First Experience
 * 
 * Beautiful, animated dialog that provides real-time feedback during NFC writing
 * operations. Features progress tracking, error handling, and stunning mobile UX.
 * 
 * @author KairOS Team
 * @version 1.0.0
 */

'use client'

import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  NfcIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  RefreshCwIcon,
  WifiIcon,
  ZapIcon,
  ShieldCheckIcon,
  AlertTriangleIcon
} from 'lucide-react'
import type { NFCWriteStatus, NFCWriteResult } from '@/lib/nfc/web-nfc-writer'

interface NFCWriteDialogProps {
  isOpen: boolean
  onClose: () => void
  status: NFCWriteStatus | null
  result: NFCWriteResult | null
  onRetry?: () => void
  onCancel?: () => void
  chipName?: string
}

/**
 * 🎨 Beautiful NFC Write Dialog Component
 * 
 * Provides an immersive, mobile-optimized experience for NFC writing
 * with real-time progress, animations, and comprehensive feedback.
 */
export function NFCWriteDialog({
  isOpen,
  onClose,
  status,
  result,
  onRetry,
  onCancel,
  chipName = 'NFC Tag'
}: NFCWriteDialogProps) {

  // --- Status-Based Styling & Animation ---
  const getPhaseConfig = (phase: NFCWriteStatus['phase']) => {
    const configs = {
      detecting: {
        icon: <RefreshCwIcon className="h-8 w-8 animate-spin text-primary" />,
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        title: 'Preparing...',
        animation: 'animate-pulse'
      },
      connecting: {
        icon: <WifiIcon className="h-8 w-8 text-blue-600 animate-pulse" />,
        color: 'text-blue-600', 
        bgColor: 'bg-blue-100',
        title: 'Waiting for NFC Tag',
        animation: 'animate-bounce'
      },
      writing: {
        icon: <ZapIcon className="h-8 w-8 text-orange-600 animate-pulse" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100', 
        title: 'Writing to Tag',
        animation: 'animate-pulse'
      },
      verifying: {
        icon: <ShieldCheckIcon className="h-8 w-8 text-purple-600 animate-spin" />,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        title: 'Verifying Write',
        animation: 'animate-spin'
      },
      complete: {
        icon: <CheckCircleIcon className="h-8 w-8 text-green-600" />,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        title: 'Success!',
        animation: 'animate-bounce'
      },
      error: {
        icon: <XCircleIcon className="h-8 w-8 text-red-600" />,
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        title: 'Write Failed',
        animation: 'animate-pulse'
      }
    }
    
    return configs[phase] || configs.detecting
  }

  const currentConfig = status ? getPhaseConfig(status.phase) : getPhaseConfig('detecting')
  const isComplete = status?.phase === 'complete' || result?.success
  const hasError = status?.phase === 'error' || (result && !result.success)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-auto bg-white dark:bg-gray-900 border-0 shadow-2xl">
        <div className="flex flex-col items-center space-y-6 p-6">
          
          {/* 🎯 Animated Header Icon */}
          <div className="relative">
            <div className={`absolute inset-0 ${currentConfig.bgColor} rounded-full blur-lg opacity-75 ${currentConfig.animation}`}></div>
            <div className={`relative p-6 ${currentConfig.bgColor} rounded-full`}>
              {currentConfig.icon}
            </div>
          </div>

          {/* 📝 Status Title & Message */}
          <div className="text-center space-y-2">
            <h3 className={`text-xl font-semibold ${currentConfig.color}`}>
              {isComplete ? '✅ Write Complete!' : 
               hasError ? '❌ Write Failed' : 
               currentConfig.title}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm">
              {status?.message || 'Preparing NFC write operation...'}
            </p>
            
            {chipName && (
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Target: <span className="font-mono">{chipName}</span>
              </p>
            )}
          </div>

          {/* 📊 Progress Bar (only show during active operations) */}
          {status && !isComplete && !hasError && (
            <div className="w-full space-y-2">
              <Progress 
                value={status.progress} 
                className="h-2 bg-gray-200 dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{Math.round(status.progress)}%</span>
              </div>
            </div>
          )}

          {/* ✅ Success Details */}
          {isComplete && result?.success && (
            <Alert className="w-full border-green-200 bg-green-50 dark:bg-green-900/20">
              <CheckCircleIcon className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                <div className="space-y-1">
                  <p className="font-medium">NFC tag programmed successfully!</p>
                  {result.bytesWritten && (
                    <p className="text-xs">
                      📊 Wrote {result.bytesWritten} bytes to tag
                    </p>
                  )}
                  <p className="text-xs">
                    🎯 Your NFC tag is ready to use - test by tapping it!
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* ❌ Error Details */}
          {hasError && result?.error && (
            <Alert className="w-full border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertTriangleIcon className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                <div className="space-y-2">
                  <p className="font-medium">Write operation failed</p>
                  <p className="text-xs">{result.error.details}</p>
                  
                  {result.error.suggestions.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium mb-1">💡 Try these solutions:</p>
                      <ul className="text-xs space-y-0.5">
                        {result.error.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-red-400">•</span>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 🎯 Action Buttons */}
          <div className="flex gap-3 w-full">
            {/* Show during active operations */}
            {status && !isComplete && !hasError && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onCancel}
                  className="flex-1"
                >
                  Cancel
                </Button>
                
                <div className="flex-1" /> {/* Spacer */}
              </>
            )}

            {/* Show on completion */}
            {isComplete && (
              <Button 
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                Done
              </Button>
            )}

            {/* Show on error */}
            {hasError && (
              <>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Close
                </Button>
                
                {onRetry && (
                  <Button 
                    onClick={onRetry}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </>
            )}
          </div>

          {/* 📱 Mobile Positioning Hint */}
          {status?.phase === 'connecting' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 w-full">
              <div className="flex items-center gap-3">
                <NfcIcon className="h-5 w-5 text-blue-600 animate-pulse" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">
                    📱 Position your NFC tag
                  </p>
                  <p className="text-blue-600 dark:text-blue-300 text-xs mt-1">
                    Hold the tag close to the back of your phone (near the camera on most devices)
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * 🎨 Hook for Managing NFC Write Dialog State
 * 
 * Provides convenient state management for the NFC write dialog
 * with TypeScript support and elegant API.
 */
export function useNFCWriteDialog() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [status, setStatus] = React.useState<NFCWriteStatus | null>(null)
  const [result, setResult] = React.useState<NFCWriteResult | null>(null)

  const openDialog = () => {
    setIsOpen(true)
    setStatus(null)
    setResult(null)
  }

  const closeDialog = () => {
    setIsOpen(false)
    setStatus(null)
    setResult(null)
  }

  const updateStatus = (newStatus: NFCWriteStatus) => {
    setStatus(newStatus)
  }

  const setWriteResult = (writeResult: NFCWriteResult) => {
    setResult(writeResult)
    setStatus(null)
  }

  return {
    isOpen,
    status,
    result,
    openDialog,
    closeDialog,
    updateStatus,
    setWriteResult
  }
} 