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
  chipUID: string
  did: string
  displayName: string
  publicKey: string
  verificationCount: number
  joinedAt: string
  lastSeen: string
  totalMoments: number
  recentMoments: RealMoment[]
  sessionToken?: string
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
        // Get parameters from URL
        const chipUID = searchParams.get('chipUID')
        const sessionToken = searchParams.get('session')
        const verified = searchParams.get('verified')
        const did = searchParams.get('did')
        
        if (!chipUID) {
          setError('No chip UID provided')
          setIsLoading(false)
          return
        }

        // Fetch real user data from API
        const response = await fetch(`/api/nfc/verify?chipUID=${encodeURIComponent(chipUID)}`)
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
            sessionToken
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
              <p className="text-gray-800 dark:text-gray-200">Loading your KairOS profile...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-32">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Profile Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
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
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm mb-8">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src="" />
                <AvatarFallback className="bg-purple-500 text-white text-2xl">
                  {userProfile.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {userProfile.displayName}
                </h1>
                <p className="text-gray-700 dark:text-gray-300 mt-2">
                  Verified KairOS Member
                </p>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline" className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                  Verified
                </Badge>
                <Badge variant="outline" className="flex items-center gap-2">
                  <NfcIcon className="h-4 w-4 text-blue-500" />
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
              <ZapIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{userProfile.verificationCount}</div>
              <div className="text-sm text-gray-800 dark:text-gray-300">Verifications</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {Math.floor((Date.now() - new Date(userProfile.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-300">Days Active</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <ActivityIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{userProfile.totalMoments}</div>
              <div className="text-sm text-gray-800 dark:text-gray-300">Total Moments</div>
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
                    <span className="font-medium text-gray-800 dark:text-gray-200">Display Name:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{userProfile.displayName}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Chip UID:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1 font-mono text-sm">{userProfile.chipUID}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Joined:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{new Date(userProfile.joinedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Last Seen:</span>
                    <p className="text-gray-700 dark:text-gray-300 mt-1">{new Date(userProfile.lastSeen).toLocaleDateString()}</p>
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
                  Your decentralized identity and cryptographic proof
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Decentralized Identifier (DID):</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 font-mono text-sm break-all bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {userProfile.did}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Ed25519 Public Key:</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1 font-mono text-sm break-all bg-gray-50 dark:bg-gray-800 p-2 rounded">
                    {userProfile.publicKey}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">Verification Status:</span>
                  <p className="text-green-600 mt-1 flex items-center gap-2">
                    <CheckCircleIcon className="h-4 w-4" />
                    Cryptographically Verified
                  </p>
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
                      <div key={moment.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex-shrink-0">
                          <NfcIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            NFC Authentication #{userProfile.verificationCount - index}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(moment.timestamp).toLocaleString()}
                          </p>
                          {moment.deviceInfo && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              Device: {moment.deviceInfo}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {moment.verificationTime}ms
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <NfcIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No recent activity</p>
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-32">
          <div className="text-center space-y-4">
            <LoaderIcon className="h-12 w-12 animate-spin text-purple-600 mx-auto" />
            <p className="text-gray-800 dark:text-gray-200">Loading your KairOS profile...</p>
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