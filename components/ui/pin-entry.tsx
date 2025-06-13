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
        onSuccess(result.account)
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
      setIsVerifying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <div className={`flex items-center justify-center min-h-[60vh] p-4 ${className}`}>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-xl">
            {isNewDevice ? 'Welcome Back' : 'Enter PIN'}
          </CardTitle>
          <CardDescription>
            {isNewDevice 
              ? `Welcome back${displayName ? `, ${displayName}` : ''}! Please enter your PIN to access your account on this device.`
              : 'Please enter your PIN to continue'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* PIN Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type={showPIN ? "text" : "password"}
                  placeholder="Enter your PIN"
                  value={pin}
                  onChange={(e) => handlePINChange(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-10 text-center text-lg tracking-widest"
                  disabled={isVerifying}
                  maxLength={8}
                  autoComplete="off"
                  inputMode="numeric"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                  onClick={() => setShowPIN(!showPIN)}
                  disabled={isVerifying}
                >
                  {showPIN ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Enter your 4-8 digit PIN
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error}
                  {attempts > 0 && (
                    <span className="block mt-1 text-xs">
                      Attempt {attempts}/3
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isVerifying}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={!pin || pin.length < 4 || isVerifying}
                className="flex-1"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
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

          {/* Additional Info */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Chip ID: {chipUID.slice(-8).toUpperCase()}</span>
            </div>
            {isNewDevice && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Your account is secured with end-to-end encryption
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 