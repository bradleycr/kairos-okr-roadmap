'use client'

/**
 * 🎨 Profile Header Component
 * 
 * Modern, modular profile header with wallet integration
 * Separates concerns from the main profile page
 */

import React from 'react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Wallet, 
  Shield, 
  Download, 
  Upload,
  Settings,
  ExternalLink
} from 'lucide-react'
import { useAccount, useEnsName, useEnsAvatar } from 'wagmi'
import type { LocalAccountProfile } from '@/lib/nfc/accountManager'

interface ProfileHeaderProps {
  profile: LocalAccountProfile
  onExport?: () => void
  onImport?: () => void
  onSettings?: () => void
  className?: string
}

export function ProfileHeader({ 
  profile, 
  onExport, 
  onImport, 
  onSettings,
  className = "" 
}: ProfileHeaderProps) {
  const { address, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! })

  // Generate avatar fallback from profile data
  const generateAvatarFallback = (name: string) => {
    return name.slice(0, 2).toUpperCase()
  }

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  return (
    <Card className={`border-primary/20 shadow-lift ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage 
                src={ensAvatar || undefined} 
                alt={profile.displayName}
              />
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {generateAvatarFallback(profile.displayName || profile.username || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-foreground">
                {profile.displayName || profile.username}
              </h1>
              {profile.username && profile.displayName && (
                <p className="text-muted-foreground text-sm">
                  @{profile.username}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm text-muted-foreground max-w-md">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex flex-col sm:ml-auto gap-3">
            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-green-200 text-green-700 bg-green-50">
                <Shield className="h-3 w-3 mr-1" />
                Authenticated
              </Badge>
              
              {isConnected && (
                <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                  <Wallet className="h-3 w-3 mr-1" />
                  Wallet Connected
                </Badge>
              )}
              
              {profile.hasPIN && (
                <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                  PIN Enabled
                </Badge>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {onExport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExport}
                  className="gap-1"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              )}
              
              {onImport && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onImport}
                  className="gap-1"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
              )}
              
              {onSettings && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSettings}
                  className="gap-1"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Chip UID</p>
              <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {formatAddress(profile.chipUID)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-muted-foreground">Account ID</p>
              <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {formatAddress(profile.accountId)}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-muted-foreground">Device</p>
              <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {profile.deviceName || 'Unknown Device'}
              </p>
            </div>
            
            {isConnected && address && (
              <div className="space-y-1">
                <p className="text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-xs bg-muted px-2 py-1 rounded flex items-center gap-1">
                  {formatAddress(address)}
                  <ExternalLink 
                    className="h-3 w-3 cursor-pointer hover:text-primary" 
                    onClick={() => window.open(`https://etherscan.io/address/${address}`, '_blank')}
                  />
                </p>
              </div>
            )}
            
            {ensName && (
              <div className="space-y-1">
                <p className="text-muted-foreground">ENS Name</p>
                <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                  {ensName}
                </p>
              </div>
            )}
            
            <div className="space-y-1">
              <p className="text-muted-foreground">DID</p>
              <p className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {profile.did.slice(0, 20)}...
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton loader for profile header
export function ProfileHeaderSkeleton() {
  return (
    <Card className="border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
          </div>
          
          <div className="flex flex-col sm:ml-auto gap-3">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-muted animate-pulse rounded-full" />
              <div className="h-6 w-24 bg-muted animate-pulse rounded-full" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                <div className="h-6 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 