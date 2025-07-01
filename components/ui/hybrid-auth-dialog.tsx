/**
 * Hybrid Authentication Dialog
 * Offers choice between traditional wallet connection and NFC authentication
 * Inspired by Cursive Connections authentication patterns
 */

"use client"

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Wallet, 
  Smartphone, 
  Zap, 
  Shield, 
  Globe, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { walletIntegration, type WalletSession } from '@/lib/crypto/walletIntegration'
import { enhancedNFCDetector } from '@/lib/nfc/web-nfc-detector'

export interface HybridAuthProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (session: WalletSession | { type: 'nfc', chipUID: string }) => void
  onError?: (error: Error) => void
  title?: string
  description?: string
  allowNFCOnly?: boolean
  requireDonation?: boolean
}

type AuthStep = 'choice' | 'wallet-connecting' | 'nfc-listening' | 'success' | 'error'

export function HybridAuthDialog({
  isOpen,
  onOpenChange,
  onSuccess,
  onError,
  title = "Choose Authentication Method",
  description = "Connect with your preferred method to continue",
  allowNFCOnly = true,
  requireDonation = false
}: HybridAuthProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('choice')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nfcSupported, setNfcSupported] = useState(false)
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null)

  // Check NFC support on mount
  useEffect(() => {
    const checkNFCSupport = () => {
      setNfcSupported('NDEFReader' in window)
    }
    checkNFCSupport()
  }, [])

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('choice')
      setIsProcessing(false)
      setError(null)
      setWalletSession(null)
    }
  }, [isOpen])

  // Handle MetaMask connection
  const handleWalletConnect = async () => {
    try {
      setCurrentStep('wallet-connecting')
      setIsProcessing(true)
      setError(null)

      const session = await walletIntegration.connectMetaMask()
      if (!session) {
        throw new Error('Failed to connect wallet')
      }

      setWalletSession(session)
      setCurrentStep('success')
      
      // Brief success state before closing
      setTimeout(() => {
        onSuccess(session)
        onOpenChange(false)
      }, 1500)

    } catch (error) {
      console.error('❌ Wallet connection failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Wallet connection failed'
      setError(errorMessage)
      setCurrentStep('error')
      onError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle NFC authentication
  const handleNFCAuth = async () => {
    try {
      setCurrentStep('nfc-listening')
      setIsProcessing(true)
      setError(null)

      const success = await enhancedNFCDetector.startListeningMode({
        purpose: 'auth',
        timeoutMs: 40000,
        onSuccess: (chipUID) => {
          console.log('🏷️ NFC authentication successful:', chipUID)
          setCurrentStep('success')
          
          // Brief success state before closing
          setTimeout(() => {
            onSuccess({ type: 'nfc', chipUID })
            onOpenChange(false)
          }, 1500)
        },
        onError: (error) => {
          console.error('❌ NFC authentication failed:', error)
          setError(error.message)
          setCurrentStep('error')
          onError?.(error)
        }
      })

      if (!success) {
        throw new Error('Failed to start NFC listening')
      }

    } catch (error) {
      console.error('❌ NFC authentication failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'NFC authentication failed'
      setError(errorMessage)
      setCurrentStep('error')
      onError?.(error instanceof Error ? error : new Error(errorMessage))
      setIsProcessing(false)
    }
  }

  // Handle back to choice
  const handleBackToChoice = () => {
    enhancedNFCDetector.stopListening()
    setCurrentStep('choice')
    setIsProcessing(false)
    setError(null)
  }

  // Render auth choice screen
  const renderAuthChoice = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>

      <div className="space-y-4">
        {/* Traditional Wallet Option */}
        <Card className="hover:border-green-200 transition-colors cursor-pointer" onClick={handleWalletConnect}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900">Traditional Wallet</h4>
                  <p className="text-xs text-neutral-500">MetaMask, Rainbow, etc.</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">dApp Standard</Badge>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                <span>Universal</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>Self-custody</span>
              </div>
              {requireDonation && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Instant donations</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* NFC Authentication Option */}
        {allowNFCOnly && (
          <>
            <div className="relative">
              <Separator className="my-4" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="bg-white px-2 text-xs text-neutral-400">or</span>
              </div>
            </div>

            <Card 
              className={`hover:border-green-200 transition-colors ${nfcSupported ? 'cursor-pointer' : 'opacity-50'}`}
              onClick={nfcSupported ? handleNFCAuth : undefined}
            >
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-neutral-900">NFC Authentication</h4>
                      <p className="text-xs text-neutral-500">Tap your pendant/chip</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">KairOS Native</Badge>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-neutral-600">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Instant</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Cross-device</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Privacy-first</span>
                  </div>
                </div>

                {!nfcSupported && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertCircle className="w-3 h-3" />
                    <span>NFC not supported on this device</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {requireDonation && (
        <div className="text-center text-xs text-neutral-500 bg-green-50 p-3 rounded-lg">
          💚 Your choices will support real conservation efforts
        </div>
      )}
    </div>
  )

  // Render processing states
  const renderProcessingState = () => {
    const states = {
      'wallet-connecting': {
        icon: <Wallet className="w-8 h-8 text-orange-600" />,
        title: 'Connecting Wallet',
        description: 'Please approve the connection in your wallet'
      },
      'nfc-listening': {
        icon: <Smartphone className="w-8 h-8 text-blue-600 animate-pulse" />,
        title: 'Listening for NFC',
        description: 'Tap your pendant or NFC chip to authenticate'
      },
      'success': {
        icon: <CheckCircle className="w-8 h-8 text-green-600" />,
        title: 'Authentication Successful',
        description: 'Welcome! Redirecting you now...'
      },
      'error': {
        icon: <AlertCircle className="w-8 h-8 text-red-600" />,
        title: 'Authentication Failed',
        description: error || 'Something went wrong'
      }
    }

    const state = states[currentStep as keyof typeof states]
    if (!state) return null

    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          {currentStep === 'wallet-connecting' || currentStep === 'nfc-listening' ? (
            <div className="relative">
              {state.icon}
              <Loader2 className="w-4 h-4 animate-spin absolute -top-1 -right-1" />
            </div>
          ) : (
            state.icon
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-neutral-900">{state.title}</h3>
          <p className="text-sm text-neutral-500">{state.description}</p>
        </div>

        {(currentStep === 'error' || currentStep === 'nfc-listening') && (
          <Button 
            variant="outline" 
            onClick={handleBackToChoice}
            className="w-full"
          >
            Try Another Method
          </Button>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="sr-only">Authentication</DialogTitle>
          <DialogDescription className="sr-only">
            Choose your authentication method
          </DialogDescription>
        </DialogHeader>
        
        {currentStep === 'choice' ? renderAuthChoice() : renderProcessingState()}
      </DialogContent>
    </Dialog>
  )
} 