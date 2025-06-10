'use client'

/**
 * 🔐 PIN Setup Component
 * 
 * Prompts users to set up a PIN for cross-device account access
 * Essential for maintaining account persistence across devices
 */

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ShieldCheckIcon, ShieldXIcon, KeyRoundIcon } from 'lucide-react'

interface PINSetupProps {
  chipUID: string
  hasPIN: boolean
  onPINSetup: (pin: string) => Promise<boolean>
  onDismiss?: () => void
}

export function PINSetup({ chipUID, hasPIN, onPINSetup, onDismiss }: PINSetupProps) {
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [error, setError] = useState('')

  const handleSetupPIN = async () => {
    // Validation
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits')
      return
    }

    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers')
      return
    }

    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }

    setIsSettingUp(true)
    setError('')

    try {
      const success = await onPINSetup(pin)
      
      if (success) {
        // Success handled by parent component
        setPin('')
        setConfirmPin('')
      } else {
        setError('Failed to set up PIN. Please try again.')
      }
    } catch (error) {
      setError('An error occurred while setting up PIN')
    } finally {
      setIsSettingUp(false)
    }
  }

  if (hasPIN) {
    return (
      <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
            <ShieldCheckIcon className="h-5 w-5" />
            PIN Protection Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-green-600 dark:text-green-400">
                Your account is protected with a PIN for cross-device access.
              </p>
              <p className="text-xs text-muted-foreground">
                Chip: {chipUID.slice(-6)}
              </p>
            </div>
            <Badge variant="secondary" className="bg-green-100 dark:bg-green-900">
              ✅ Secured
            </Badge>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
          <ShieldXIcon className="h-5 w-5" />
          Set Up PIN Protection
        </CardTitle>
        <CardDescription className="text-amber-600 dark:text-amber-400">
          Secure your account for cross-device access. Without a PIN, your account only works on this device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Alert className="border-amber-200 dark:border-amber-800">
          <KeyRoundIcon className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Important:</strong> To access your account from other devices, you'll need to tap your NFC chip AND enter your PIN. 
            This ensures security while enabling cross-device persistence.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">Create PIN (4-6 digits)</Label>
            <Input
              id="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN..."
              maxLength={6}
              className="font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPin">Confirm PIN</Label>
            <Input
              id="confirmPin"
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm PIN..."
              maxLength={6}
              className="font-mono"
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSetupPIN}
              disabled={!pin || !confirmPin || isSettingUp}
              className="flex-1"
            >
              {isSettingUp ? 'Setting up...' : 'Set Up PIN'}
            </Button>
            
            {onDismiss && (
              <Button
                variant="outline"
                onClick={onDismiss}
                disabled={isSettingUp}
              >
                Later
              </Button>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            Your PIN is encrypted and stored securely. KairOS cannot recover your PIN if you forget it.
          </p>
        </div>
      </CardContent>
    </Card>
  )
} 