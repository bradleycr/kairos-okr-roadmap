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
        // Check for authenticated user coming from NFC authentication
        const authenticated = searchParams.get('authenticated')
        const source = searchParams.get('source')
        const chipUID = searchParams.get('chipUID')
        const deviceId = searchParams.get('deviceId')
        const sessionToken = searchParams.get('sessionToken')
        const momentId = searchParams.get('momentId')
        
        if (authenticated === 'true' && source === 'nfc' && chipUID) {
          addLog('🔄 Loading authenticated user profile from NFC...')
          
          // Check if we have local identity data
          const { loadLocalIdentity } = await import('@/lib/crypto/decentralizedNFC')
          const identity = loadLocalIdentity()
          
          let profile: RealUserProfile
          
          if (identity && deviceId && identity.devices[deviceId]) {
            // Use decentralized local identity
            const device = identity.devices[deviceId]
            profile = {
              chipUID,
              uid: deviceId,
              did: `did:key:z${device.publicKey.substring(0, 32)}`,
              displayName: `${identity.userId} • ${device.displayName}`,
              publicKey: device.publicKey,
              verificationCount: 1,
              joinedAt: new Date(device.createdAt).toISOString(),
              lastSeen: new Date().toISOString(),
              totalMoments: 1,
              recentMoments: [{
                id: momentId || `auth-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'nfc_authentication',
                verificationTime: 150,
                deviceInfo: navigator.userAgent
              }],
              sessionToken,
              source: 'nfc'
            }
            
            addLog('✅ Loaded decentralized identity profile')
            
          } else {
            // Create a profile from authentication data
            profile = {
              chipUID,
              uid: deviceId || chipUID.replace(/:/g, ''),
              did: `did:nfc:${chipUID}`,
              displayName: `NFC User ${chipUID.substring(0, 11)}`,
              publicKey: 'Local device key - stored securely',
              verificationCount: 1,
              joinedAt: new Date().toISOString(),
              lastSeen: new Date().toISOString(),
              totalMoments: 1,
              recentMoments: [{
                id: momentId || `auth-${Date.now()}`,
                timestamp: new Date().toISOString(),
                type: 'nfc_authentication',
                verificationTime: 150,
                deviceInfo: navigator.userAgent
              }],
              sessionToken,
              source: 'nfc'
            }
            
            addLog('✅ Created authenticated user profile')
          }
          
          setUserProfile(profile)
          
          toast({
            title: "🎉 Welcome to KairOS!",
            description: `Authentication successful! Welcome ${profile.displayName}`,
          })
          
          setIsLoading(false)
          return
        }
        
        // Legacy flow for URL parameters or API-based profiles...
        const legacyChipUID = searchParams.get('chipUID')
        const legacySessionToken = searchParams.get('session')
        const verified = searchParams.get('verified')
        const did = searchParams.get('did')
        
        if (!legacyChipUID && !chipUID) {
          setError('No account identifier provided')
          setIsLoading(false)
          return
        }

        // For demo purposes, create a default profile if no API is available
        if (legacyChipUID) {
          const profile: RealUserProfile = {
            chipUID: legacyChipUID,
            did: did || `did:nfc:${legacyChipUID}`,
            displayName: `KairOS User ${legacyChipUID.substring(0, 8)}`,
            publicKey: 'Cryptographic key verified',
            verificationCount: 1,
            joinedAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            totalMoments: 1,
            recentMoments: [],
            sessionToken: legacySessionToken,
            source: 'api'
          }
          
          setUserProfile(profile)
          
          if (verified === 'true') {
            toast({
              title: "🎉 Authentication Successful!",
              description: `Welcome ${profile.displayName}! Your NFC chip was verified successfully.`,
            })
          }
        } else {
          setError('User profile could not be loaded')
        }
        
      } catch (error) {
        console.error('Failed to fetch user profile:', error)
        setError('Failed to load user profile')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Helper function for logging during profile loading
    const addLog = (message: string) => {
      console.log(`Profile: ${message}`)
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transcriptions">Transcriptions</TabsTrigger>
            <TabsTrigger value="ai-companion">AI Companion</TabsTrigger>
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

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your KairOS experience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="flex items-center justify-center gap-2 h-16" 
                    onClick={() => router.push('/nfc-test')}>
                    <NfcIcon className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Test NFC Device</div>
                      <div className="text-sm text-muted-foreground">Verify your chip</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="flex items-center justify-center gap-2 h-16"
                    onClick={() => router.push('/chip-config')}>
                    <KeyIcon className="h-6 w-6" />
                    <div className="text-left">
                      <div className="font-semibold">Configure Chip</div>
                      <div className="text-sm text-muted-foreground">Program new NFC</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transcriptions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Audio Transcriptions
                </CardTitle>
                <CardDescription>
                  Access your transcribed conversations and meetings via MELD nodes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
                  <SparklesIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transcriptions Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect to MELD audio nodes to start transcribing your conversations
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full sm:w-auto">
                      <NfcIcon className="h-4 w-4 mr-2" />
                      Connect to MELD Node
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Tap your NFC device near a MELD audio transcriber to get started
                    </p>
                  </div>
                </div>

                {/* Demo transcription entries */}
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Demo Meeting</Badge>
                      <span className="text-sm text-muted-foreground">Coming Soon</span>
                    </div>
                    <h4 className="font-semibold">Team Meeting - Project Planning</h4>
                    <p className="text-sm text-muted-foreground">45 minutes • Private transcription</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">Demo Call</Badge>
                      <span className="text-sm text-muted-foreground">Coming Soon</span>
                    </div>
                    <h4 className="font-semibold">Client Call - Feature Discussion</h4>
                    <p className="text-sm text-muted-foreground">32 minutes • Encrypted locally</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-companion" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="h-5 w-5" />
                  Personal AI Companion
                </CardTitle>
                <CardDescription>
                  Your decentralized AI assistant that learns from your transcriptions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <SparklesIcon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">KairOS AI • Personal</h3>
                      <p className="text-sm text-muted-foreground">Status: Initializing...</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-sm">🤖</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          Hello! I'm your personal AI companion. Once you start transcribing conversations, 
                          I'll learn your communication patterns and help you with insights, summaries, and suggestions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-2">
                    <h4 className="font-medium">What I can help with:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Summarize your transcribed meetings</li>
                      <li>• Extract action items and follow-ups</li>
                      <li>• Analyze communication patterns</li>
                      <li>• Suggest conversation improvements</li>
                      <li>• Generate meeting notes and reports</li>
                    </ul>
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" disabled className="w-full">
                      Start Conversation (Coming Soon)
                    </Button>
                  </div>
                </div>

                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">AI Companion Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Privacy Mode</div>
                        <div className="text-sm text-muted-foreground">All AI processing happens locally</div>
                      </div>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Learning Mode</div>
                        <div className="text-sm text-muted-foreground">Improve responses from your transcriptions</div>
                      </div>
                      <Badge variant="secondary">Enabled</Badge>
                    </div>
                  </CardContent>
                </Card>
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
                          if (userProfile.address) {
                            navigator.clipboard.writeText(userProfile.address)
                            toast({ title: "📋 Address Copied" })
                          }
                        }}
                      >
                        Copy Address
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Security Settings */}
                <div>
                  <h4 className="font-medium mb-4">Security Settings</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">Local Key Storage</div>
                        <div className="text-sm text-muted-foreground">Private keys stored securely on your device</div>
                      </div>
                      <Badge variant="secondary">Secure</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">NFC Authentication</div>
                        <div className="text-sm text-muted-foreground">Cryptographic authentication via NFC</div>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
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
              </CardHeader>
              <CardContent>
                {userProfile.recentMoments.length > 0 ? (
                  <div className="space-y-4">
                    {userProfile.recentMoments.map((moment) => (
                      <div key={moment.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                            <span className="font-medium">NFC Authentication</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(moment.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Verification completed in {moment.verificationTime}ms
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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