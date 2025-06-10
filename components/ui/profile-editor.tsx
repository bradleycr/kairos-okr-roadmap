'use client'

/**
 * 🎨 Profile Editor Component
 * 
 * Modern, accessible profile editing with real-time validation
 * Syncs changes with database while maintaining crypto security
 */

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { 
  SaveIcon, 
  UserIcon, 
  AtSignIcon, 
  MessageSquareIcon, 
  SmartphoneIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  LoaderIcon
} from 'lucide-react'

interface ProfileData {
  displayName: string
  username: string
  bio: string
  deviceName: string
  chipUID: string
}

interface ProfileEditorProps {
  currentProfile: ProfileData
  onSave: (updates: Partial<ProfileData>) => Promise<boolean>
  isLoading?: boolean
}

export function ProfileEditor({ currentProfile, onSave, isLoading = false }: ProfileEditorProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    displayName: currentProfile.displayName || '',
    username: currentProfile.username || '',
    bio: currentProfile.bio || '',
    deviceName: currentProfile.deviceName || ''
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validation rules
  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'displayName':
        if (!value.trim()) return 'Display name is required'
        if (value.length > 50) return 'Display name must be 50 characters or less'
        return null
      
      case 'username':
        if (!value.trim()) return 'Username is required'
        if (value.length > 30) return 'Username must be 30 characters or less'
        if (!/^[a-z0-9_]+$/.test(value)) return 'Username can only contain lowercase letters, numbers, and underscores'
        return null
      
      case 'bio':
        if (value.length > 200) return 'Bio must be 200 characters or less'
        return null
      
      case 'deviceName':
        if (value.length > 50) return 'Device name must be 50 characters or less'
        return null
      
      default:
        return null
    }
  }

  const handleInputChange = (field: string, value: string) => {
    // Auto-format username to lowercase
    if (field === 'username') {
      value = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Check for changes
    const hasCurrentChanges = Object.keys(formData).some(key => 
      formData[key as keyof typeof formData] !== currentProfile[key as keyof ProfileData]
    )
    setHasChanges(hasCurrentChanges)
    
    // Validate field
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error || '' }))
  }

  const handleSave = async () => {
    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData])
      if (error) newErrors[field] = error
    })
    
    if (Object.keys(newErrors).some(key => newErrors[key])) {
      setErrors(newErrors)
      toast({
        title: "❌ Validation Error",
        description: "Please fix the errors before saving",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    
    try {
      const success = await onSave(formData)
      
      if (success) {
        setHasChanges(false)
        toast({
          title: "✅ Profile Updated",
          description: "Your changes have been saved and synced across devices",
        })
      } else {
        toast({
          title: "⚠️ Partial Save",
          description: "Changes saved locally, but database sync failed",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Save failed:', error)
      toast({
        title: "❌ Save Failed",
        description: "Could not save your changes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setFormData({
      displayName: currentProfile.displayName || '',
      username: currentProfile.username || '',
      bio: currentProfile.bio || '',
      deviceName: currentProfile.deviceName || ''
    })
    setHasChanges(false)
    setErrors({})
  }

  return (
    <Card className="border-primary/20 shadow-lift">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserIcon className="h-5 w-5 text-primary" />
          Profile Information
        </CardTitle>
        <CardDescription>
          Update your basic profile information. Changes sync across all your devices.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            Display Name
          </Label>
          <Input
            id="displayName"
            value={formData.displayName}
            onChange={(e) => handleInputChange('displayName', e.target.value)}
            placeholder="Your display name"
            className={errors.displayName ? 'border-destructive' : ''}
            disabled={isLoading || isSaving}
          />
          {errors.displayName && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircleIcon className="h-3 w-3" />
              {errors.displayName}
            </p>
          )}
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="flex items-center gap-2">
            <AtSignIcon className="h-4 w-4" />
            Username
          </Label>
          <Input
            id="username"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            placeholder="your_username"
            className={errors.username ? 'border-destructive' : ''}
            disabled={isLoading || isSaving}
          />
          {errors.username && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircleIcon className="h-3 w-3" />
              {errors.username}
            </p>
          )}
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="flex items-center gap-2">
            <MessageSquareIcon className="h-4 w-4" />
            Bio
          </Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            placeholder="Tell others about yourself..."
            rows={3}
            className={errors.bio ? 'border-destructive' : ''}
            disabled={isLoading || isSaving}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{errors.bio && <span className="text-destructive">{errors.bio}</span>}</span>
            <span>{formData.bio.length}/200</span>
          </div>
        </div>

        {/* Device Name */}
        <div className="space-y-2">
          <Label htmlFor="deviceName" className="flex items-center gap-2">
            <SmartphoneIcon className="h-4 w-4" />
            Device Name
          </Label>
          <Input
            id="deviceName"
            value={formData.deviceName}
            onChange={(e) => handleInputChange('deviceName', e.target.value)}
            placeholder="My iPhone"
            className={errors.deviceName ? 'border-destructive' : ''}
            disabled={isLoading || isSaving}
          />
          {errors.deviceName && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertCircleIcon className="h-3 w-3" />
              {errors.deviceName}
            </p>
          )}
        </div>

        {/* Crypto Security Notice */}
        <Alert className="border-success/20 bg-success/10">
          <CheckCircleIcon className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">
            <strong>Crypto-Secured:</strong> Your sensitive data (private keys, transcriptions) stays on-device. 
            Only basic profile info syncs across devices.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isLoading}
            className="flex items-center gap-2"
          >
            {isSaving ? (
              <LoaderIcon className="h-4 w-4 animate-spin" />
            ) : (
              <SaveIcon className="h-4 w-4" />
            )}
            Save Changes
          </Button>
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges || isSaving || isLoading}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 