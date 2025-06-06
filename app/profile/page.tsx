'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  UserIcon, 
  ShieldCheckIcon, 
  SparklesIcon,
  ClockIcon,
  NfcIcon,
  ZapIcon,
  KeyIcon,
  CalendarIcon,
  ActivityIcon,
  ArrowLeftIcon,
  LogOutIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// --- Real User Data Types ---
interface RealUserProfile {
  chipUID?: string
  uid?: string
  did: string
  displayName: string
  publicKey: string
  privateKey?: string
  address?: string
  verificationCount: number
  joinedAt: string
  lastSeen: string
  totalMoments: number
  recentMoments: RealMoment[]
  sessionToken?: string
  source: 'nfc' | 'url-params' | 'api'
}

interface LocalNFCAccount {
  uid: string
  did: string
  address: string
  privateKey: string
  publicKey: string
  created: number
  source: 'web-nfc' | 'url-params'
}

interface RealMoment {
  id: string
  timestamp: string
  type: 'nfc_authentication'
  verificationTime: number
  deviceInfo?: string
}

// Create wrapper component for useSearchParams
function ProfileContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // --- State Management ---
  const [userProfile, setUserProfile] = useState<RealUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // --- Fetch Real User Data ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Check for NFC-created account first (from localStorage)
        const nfcSource = searchParams.get('source')
        const nfcUID = searchParams.get('uid')
        
        if (nfcSource === 'nfc' && nfcUID) {
          // Load from localStorage (decentralized)
          const accountData = localStorage.getItem(`kairos:account:${nfcUID}`)
          
          if (accountData) {
            const localAccount: LocalNFCAccount = JSON.parse(accountData)
            
            const profile: RealUserProfile = {
              uid: localAccount.uid,
              did: localAccount.did,
              displayName: `NFC User ${localAccount.uid.substring(0, 8)}`,
              publicKey: localAccount.publicKey,
              privateKey: localAccount.privateKey,
              address: localAccount.address,
              verificationCount: 1,
              joinedAt: new Date(localAccount.created).toISOString(),
              lastSeen: new Date().toISOString(),
              totalMoments: 1,
              recentMoments: [{
                id: `nfc-${Date.now()}`,
                timestamp: new Date(localAccount.created).toISOString(),
                type: 'nfc_authentication',
                verificationTime: 150,
                deviceInfo: navigator.userAgent
              }],
              source: 'nfc'
            }
            
            setUserProfile(profile)
            
            toast({
              title: "🎉 Welcome to Your Decentralized Profile!",
              description: "Your account is stored locally on your device - no servers required!",
            })
            
            setIsLoading(false)
            return
          }
        }
        
        // Fallback to API-based profile (existing code)
        const chipUID = searchParams.get('chipUID')
        const sessionToken = searchParams.get('session')
        const verified = searchParams.get('verified')
        const did = searchParams.get('did')
        
        if (!chipUID && !nfcUID) {
          setError('No account identifier provided')
          setIsLoading(false)
          return
        }

        // Fetch real user data from API
        const response = await fetch(`/api/nfc/verify?chipUID=${encodeURIComponent(chipUID || '')}`)
        const data = await response.json()
        
        if (data.success && data.found) {
          // Convert API response to profile format
          const profile: RealUserProfile = {
            chipUID: data.account.chipUID,
            did: data.account.did,
            displayName: data.account.displayName,
            publicKey: data.account.publicKey,
            verificationCount: data.account.verificationCount,
            joinedAt: data.account.joinedAt,
            lastSeen: data.account.lastSeen,
            totalMoments: data.account.totalMoments,
            recentMoments: [], // Will be populated by separate API call if needed
            sessionToken,
            source: 'api'
          }
          
          setUserProfile(profile)
          
          // Fetch user moments for activity tab
          try {
            const momentsResponse = await fetch(`/api/nfc/verify?moments=${encodeURIComponent(chipUID)}`)
            const momentsData = await momentsResponse.json()
            
            if (momentsData.success && momentsData.found && momentsData.moments) {
              profile.recentMoments = momentsData.moments
              profile.totalMoments = momentsData.totalMoments
              setUserProfile({ ...profile })
            }
          } catch (error) {
            console.warn('Failed to fetch user moments:', error)
          }
          
          // Show welcome toast if coming from NFC authentication
          if (verified === 'true') {
            toast({
              title: "🎉 Authentication Successful!",
              description: `Welcome ${profile.displayName}! Your NFC chip was verified successfully.`,
            })
          }
        } else {
          setError(`User not found: ${data.message || 'Unknown error'}`)
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        setError('Failed to load user profile')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchUserProfile()
  }, [searchParams, toast])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-foreground">Loading your KairOS profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">Profile Not Found</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={() => router.push('/')} className="mt-4">
                Return to KairOS
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to KairOS
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              toast({
                title: "Signed Out",
                description: "You have been signed out of KairOS",
              })
              router.push('/')
            }}
            className="flex items-center gap-2"
          >
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile Header */}
        <Card className="border-0 shadow-minimal bg-card mb-8">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {userProfile.displayName}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Verified KairOS Member
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-primary" />
                  Verified
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <NfcIcon className="h-4 w-4 text-accent" />
                  NFC Enabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <ZapIcon className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">{userProfile.verificationCount}</div>
              <div className="text-sm text-foreground">Verifications</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {Math.floor((Date.now() - new Date(userProfile.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-foreground">Days Active</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <ActivityIcon className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold text-accent">{userProfile.totalMoments}</div>
              <div className="text-sm text-foreground">Total Moments</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium text-foreground">Display Name:</span>
                    <p className="text-muted-foreground mt-1">{userProfile.displayName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">{userProfile.source === 'nfc' ? 'NFC UID:' : 'Chip UID:'}</span>
                    <p className="text-muted-foreground mt-1 font-mono text-sm">{userProfile.uid || userProfile.chipUID}</p>
                  </div>
                  {userProfile.address && (
                    <div>
                      <span className="font-medium text-foreground">Ethereum Address:</span>
                      <p className="text-muted-foreground mt-1 font-mono text-sm">{userProfile.address}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">Account Type:</span>
                    <p className="text-muted-foreground mt-1">
                      {userProfile.source === 'nfc' ? 'Decentralized (Local Storage)' : 'Server-based'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Joined:</span>
                    <p className="text-muted-foreground mt-1">{new Date(userProfile.joinedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Last Seen:</span>
                    <p className="text-muted-foreground mt-1">{new Date(userProfile.lastSeen).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyIcon className="h-5 w-5" />
                  Cryptographic Identity
                </CardTitle>
                <CardDescription>
                  Your decentralized identity and cryptographic credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <span className="font-medium text-foreground">Decentralized Identifier (DID):</span>
                  <div className="mt-2 p-3 bg-muted rounded-lg border">
                    <p className="font-mono text-sm break-all">{userProfile.did}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(userProfile.did)
                        toast({ title: "📋 DID Copied to Clipboard" })
                      }}
                    >
                      Copy DID
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-foreground">Ed25519 Public Key:</span>
                  <div className="mt-2 p-3 bg-muted rounded-lg border">
                    <p className="font-mono text-sm break-all">{userProfile.publicKey}</p>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-2"
                      onClick={() => {
                        navigator.clipboard.writeText(userProfile.publicKey)
                        toast({ title: "📋 Public Key Copied" })
                      }}
                    >
                      Copy Public Key
                    </Button>
                  </div>
                </div>

                {userProfile.address && (
                  <div>
                    <span className="font-medium text-foreground">Ethereum-Compatible Address:</span>
                    <div className="mt-2 p-3 bg-muted rounded-lg border">
                      <p className="font-mono text-sm">{userProfile.address}</p>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(userProfile.address!)
                          toast({ title: "📋 Address Copied" })
                        }}
                      >
                        Copy Address
                      </Button>
                    </div>
                  </div>
                )}

                {userProfile.privateKey && userProfile.source === 'nfc' && (
                  <div>
                    <span className="font-medium text-foreground text-red-600">⚠️ Private Key (Keep Secret!):</span>
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="font-mono text-sm break-all text-red-800 dark:text-red-200">{userProfile.privateKey}</p>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
                          onClick={() => {
                            navigator.clipboard.writeText(userProfile.privateKey!)
                            toast({ 
                              title: "🔐 Private Key Copied",
                              description: "Keep this secret and secure!",
                              variant: "destructive"
                            })
                          }}
                        >
                          Copy Private Key
                        </Button>
                      </div>
                      <div className="mt-3 text-xs text-red-700 dark:text-red-300">
                        <p><strong>⚠️ Security Warning:</strong></p>
                        <ul className="mt-1 space-y-1 list-disc list-inside">
                          <li>This private key controls your identity</li>
                          <li>Never share it with anyone</li>
                          <li>Store it securely (password manager, hardware wallet)</li>
                          <li>Anyone with this key can impersonate you</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <span className="font-medium text-foreground">Storage:</span>
                  <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200 text-sm">
                      {userProfile.source === 'nfc' ? (
                        <>
                          <strong>🌐 Decentralized:</strong> Your account is stored locally on your device using Web3 principles. 
                          No servers, no databases - you own your data completely.
                        </>
                      ) : (
                        <>
                          <strong>☁️ Server-based:</strong> Your account is managed by KairOS servers for convenience and recovery.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ActivityIcon className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your recent NFC authentication sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userProfile.recentMoments.length > 0 ? (
                  <div className="space-y-4">
                    {userProfile.recentMoments.map((moment, index) => (
                      <div key={moment.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                        <div className="flex-shrink-0">
                          <NfcIcon className="h-6 w-6 text-accent" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">
                            NFC Authentication #{userProfile.verificationCount - index}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(moment.timestamp).toLocaleString()}
                          </p>
                          {moment.deviceInfo && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Device: {moment.deviceInfo}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {moment.verificationTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <NfcIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-foreground">Loading your KairOS profile...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfileContent />
    </Suspense>
  )
} 