"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Lock, Unlock, Shield, AlertCircle, Eye, EyeOff } from "lucide-react"

interface PINEntryProps {
  chipUID: string
  isNewDevice?: boolean
  displayName?: string
  onSuccess: (account: any) => void
  onCancel?: () => void
  className?: string
}

export default function PINEntry({ 
  chipUID, 
  isNewDevice = false, 
  displayName, 
  onSuccess, 
  onCancel,
  className 
}: PINEntryProps) {
  const [pin, setPIN] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState('')
  const [showPIN, setShowPIN] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handlePINChange = (value: string) => {
    // Only allow digits and limit to reasonable PIN length
    const cleanValue = value.replace(/\D/g, '').slice(0, 8)
    setPIN(cleanValue)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!pin || pin.length < 4) {
      setError('PIN must be at least 4 digits')
      return
    }

    setIsVerifying(true)
    setError('')

    try {
      // Import the account manager
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      
      // Verify PIN and authenticate
      const result = await NFCAccountManager.authenticateAfterPIN(chipUID, pin)
      
      if (result.success && result.account) {
        console.log('✅ PIN authentication successful')
        
        // Smart routing logic for better UX
        if (isNewDevice) {
          // Returning user on NEW device: Show success screen for security awareness
          onSuccess(result.account)
        } else {
          // Returning user on familiar device (expired session): Go directly to profile
          const profileUrl = new URL('/profile', window.location.origin)
          profileUrl.searchParams.set('verified', 'true')
          profileUrl.searchParams.set('source', 'pin')
          profileUrl.searchParams.set('chipUID', chipUID)
          profileUrl.searchParams.set('session', `pin_session_${Date.now()}`)
          
          // Brief success feedback before redirect
          setIsVerifying(false)
          setTimeout(() => {
            window.location.href = profileUrl.toString()
          }, 300)
        }
      } else {
        setAttempts(prev => prev + 1)
        setError(result.error || 'Incorrect PIN')
        setPIN('')
        
        // Focus input for retry
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      }
    } catch (error) {
      console.error('PIN verification failed:', error)
      setAttempts(prev => prev + 1)
      setError(error instanceof Error ? error.message : 'Authentication failed')
      setPIN('')
    } finally {
      if (isNewDevice) {
        setIsVerifying(false)
      }
      // For returning users, keep loading state during redirect
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <div className={`h-screen w-screen flex items-center justify-center p-4 ${className}`} style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0,
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}>
      <Card className="w-full max-w-sm border border-primary/20 shadow-lg bg-card/95 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-lg font-mono tracking-wide">
            {isNewDevice ? 'New Device Detected' : 'Enter PIN'}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {isVerifying && !isNewDevice 
              ? 'Taking you to your profile...'
              : isNewDevice 
                ? `Welcome back${displayName ? `, ${displayName}` : ''}! Please verify it's you on this new device.`
                : 'Please enter your PIN to continue'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* PIN Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type={showPIN ? "text" : "password"}
                  placeholder="Enter PIN"
                  value={pin}
                  onChange={(e) => handlePINChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="text-center text-xl tracking-[0.5em] pr-12 py-6 bg-muted/30 border-muted-foreground/20 focus:border-primary/50 transition-colors"
                  disabled={isVerifying}
                  maxLength={8}
                  autoComplete="off"
                  inputMode="numeric"
                  style={{ letterSpacing: '0.5em' }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted/50"
                  onClick={() => setShowPIN(!showPIN)}
                  disabled={isVerifying}
                  tabIndex={-1}
                >
                  {showPIN ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center font-mono">
                4-8 digits required
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive" className="border-destructive/30 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                  {attempts > 0 && attempts < 3 && (
                    <span className="block mt-1 text-xs font-mono">
                      Attempt {attempts}/3
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isVerifying}
                  className="flex-1 font-mono"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!pin || pin.length < 4 || isVerifying}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isNewDevice ? 'Verifying' : 'Opening Profile'}
                  </>
                ) : (
                  <>
                    <Unlock className="mr-2 h-4 w-4" />
                    Unlock
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Minimal footer info */}
          <div className="pt-4 border-t border-muted/30">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground font-mono">
              <Lock className="h-3 w-3" />
              <span>Chip: {chipUID.slice(-6).toUpperCase()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 