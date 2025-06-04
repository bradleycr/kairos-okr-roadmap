'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  NfcIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  SmartphoneIcon,
  KeyIcon,
  ClockIcon,
  WalletIcon,
  ZapIcon,
  ArrowRightIcon,
  HomeIcon,
  UserIcon,
  AlertTriangleIcon,
  RefreshCwIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// --- Types ---
interface NFCVerificationState {
  status: 'initializing' | 'verifying' | 'success' | 'failure' | 'error'
  progress: number
  currentPhase: string
  verificationTime?: number
  debugLogs: string[]
  error?: string
  
  // Results
  chipAuthenticated?: boolean
  secretValid?: boolean
  zkProofGenerated?: boolean
  momentCaptured?: boolean
  sessionToken?: string
  momentId?: string
}

interface NFCParams {
  did?: string        // DID identifier (did:key:z...)
  signature?: string  // Ed25519 signature (hex)
  publicKey?: string  // Ed25519 public key (hex)
  chipUID?: string    // Chip UID for reference
  // Remove timestamp and counter - not needed for Ed25519
}

const VERIFICATION_PHASES = [
  { name: '📡 Reading NFC Parameters', description: 'Reading DID and signature from NFC tag' },
  { name: '🔍 Validating DID Format', description: 'Verifying DID format and structure' },
  { name: '🔐 Verifying Ed25519 Signature', description: 'Cryptographic signature verification' },
  { name: '⚡ Generating ZK Proof', description: 'Creating zero-knowledge proof for moment' },
  { name: '💾 Capturing Moment', description: 'Storing encrypted moment data' },
  { name: '✅ Authentication Complete', description: 'Ed25519 authentication successful' }
]

// Create wrapper component for useSearchParams
function NFCPageContent() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // --- State Management ---
  const [verificationState, setVerificationState] = useState<NFCVerificationState>({
    status: 'initializing',
    progress: 0,
    currentPhase: 'Initializing secure authentication...',
    debugLogs: []
  })
  
  const [nfcParams, setNFCParams] = useState<NFCParams>({})
  
  // --- Parse URL Parameters ---
  const parseNFCParameters = useCallback((): NFCParams => {
    // Strategy 1: Check for ultra-short URL pattern (from /n/[id] redirect)
    const source = searchParams.get('source')
    if (source === 'short_url') {
      return {
        did: searchParams.get('did') || undefined,
        signature: searchParams.get('signature') || undefined,
        publicKey: searchParams.get('publicKey') || undefined,
        chipUID: searchParams.get('uid') || undefined
      }
    }
    
    // Strategy 2: Check for iPhone NFC ultra-compressed format (u, s, k)
    const ultraUID = searchParams.get('u')
    const ultraSig = searchParams.get('s') 
    const ultraKey = searchParams.get('k')
    
    if (ultraUID && ultraSig && ultraKey) {
      // Reconstruct from ultra-compressed format
      const chipUID = `04:${ultraUID.match(/.{2}/g)?.join(':') || ultraUID}`
      
      // Pad compressed signature and public key back to full length
      const signature = ultraSig.padEnd(128, '0') // Pad to 128 chars (64 bytes)
      const publicKey = ultraKey.padEnd(64, '0')  // Pad to 64 chars (32 bytes)
      
      // Generate DID from public key
      const did = `did:key:z${publicKey.substring(0, 32)}`
      
      return { did, signature, publicKey, chipUID }
    }
    
    // Strategy 3: Check for iPhone NFC compressed format (c, s, p)
    const compressedUID = searchParams.get('c')
    const compressedSig = searchParams.get('s')
    const compressedKey = searchParams.get('p')
    
    if (compressedUID && compressedSig && compressedKey) {
      // Reconstruct from compressed format
      const chipUID = `04:${compressedUID.match(/.{2}/g)?.join(':') || compressedUID}`
      
      // Pad compressed signature and public key back to full length
      const signature = compressedSig.padEnd(128, '0') // Pad to 128 chars (64 bytes)
      const publicKey = compressedKey.padEnd(64, '0')  // Pad to 64 chars (32 bytes)
      
      // Generate DID from public key
      const did = `did:key:z${publicKey.substring(0, 32)}`
      
      return { did, signature, publicKey, chipUID }
    }
    
    // Strategy 4: Check for full parameter format (original)
    const fullDID = searchParams.get('did')
    const fullSig = searchParams.get('signature') 
    const fullKey = searchParams.get('publicKey')
    const fullUID = searchParams.get('uid')
    
    if (fullDID && fullSig && fullKey && fullUID) {
      return {
        did: fullDID,
        signature: fullSig,
        publicKey: fullKey,
        chipUID: fullUID
      }
    }
    
    // No valid parameters found
    return {}
  }, [searchParams])
  
  // --- Verify NFC Authentication ---
  const verifyNFCAuthentication = useCallback(async (params: NFCParams) => {
    if (!params.did || !params.signature || !params.publicKey || !params.chipUID) {
      throw new Error('Missing required NFC parameters')
    }
    
    const requestBody = {
      chipUID: params.chipUID,
      did: params.did,
      signature: params.signature,
      publicKey: params.publicKey,
      deviceInfo: {
        platform: 'web' as const,
        userAgent: navigator.userAgent
      }
    }
    
    const response = await fetch('/api/nfc/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    if (!response.ok) {
      throw new Error(`Authentication failed`)
    }
    
    return response.json()
  }, [])
  
  // --- Execute Verification Flow ---
  const executeVerificationFlow = useCallback(async (params: NFCParams) => {
    setVerificationState(prev => ({
      ...prev,
      status: 'verifying',
      progress: 0
    }))
    
    try {
      if (!params.chipUID || !params.did || !params.signature || !params.publicKey) {
        throw new Error('Invalid NFC parameters')
      }
      
      // Phase 1: Reading NFC Data
      setVerificationState(prev => ({
        ...prev,
        progress: 25,
        currentPhase: 'Reading NFC credentials...'
      }))
      
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Phase 2: Cryptographic Verification
      setVerificationState(prev => ({
        ...prev,
        progress: 60,
        currentPhase: 'Verifying digital signature...'
      }))
      
      const verificationResult = await verifyNFCAuthentication(params)
      
      if (!verificationResult.verified) {
        throw new Error('Authentication failed - invalid signature')
      }
      
      // Phase 3: Success
      setVerificationState(prev => ({
        ...prev,
        progress: 100,
        currentPhase: 'Authentication successful!',
        status: 'success',
        verificationTime: 1200,
        chipAuthenticated: true,
        sessionToken: verificationResult.sessionToken,
        momentId: verificationResult.momentId
      }))
      
      // Redirect to profile
      setTimeout(() => {
        router.push(`/profile?authenticated=true`)
      }, 1500)
      
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        status: 'failure',
        error: 'Authentication failed. Please try tapping your NFC tag again.',
        currentPhase: 'Authentication failed'
      }))
    }
  }, [verifyNFCAuthentication, router])
  
  // --- Initialize on mount ---
  useEffect(() => {
    const params = parseNFCParameters()
    if (Object.keys(params).length > 0) {
      setNFCParams(params)
      executeVerificationFlow(params)
    } else {
      setVerificationState(prev => ({
        ...prev,
        status: 'error',
        error: 'No NFC data detected. Please tap your NFC tag to authenticate.',
        currentPhase: 'Waiting for NFC...'
      }))
    }
  }, [executeVerificationFlow, parseNFCParameters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Minimal Auth Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            
            {/* Status Icon */}
            <div className="mb-6">
              {verificationState.status === 'verifying' && (
                <div className="relative mx-auto w-16 h-16">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-1 bg-white rounded-full flex items-center justify-center">
                    <NfcIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              )}
              
              {verificationState.status === 'success' && (
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
              )}
              
              {(verificationState.status === 'failure' || verificationState.status === 'error') && (
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircleIcon className="h-8 w-8 text-red-600" />
                </div>
              )}
              
              {verificationState.status === 'initializing' && (
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <NfcIcon className="h-6 w-6 text-gray-600 animate-pulse" />
                </div>
              )}
            </div>
            
            {/* Title */}
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {verificationState.status === 'success' ? 'Welcome!' : 'KairOS'}
            </h1>
            
            {/* Status Message */}
            <p className="text-gray-600 mb-6">
              {verificationState.currentPhase}
            </p>
            
            {/* Progress Bar */}
            {verificationState.status === 'verifying' && (
              <div className="mb-6">
                <Progress value={verificationState.progress} className="h-2" />
              </div>
            )}
            
            {/* Error Message */}
            {(verificationState.status === 'failure' || verificationState.status === 'error') && (
              <div className="mb-6">
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangleIcon className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {verificationState.error}
                  </AlertDescription>
                </Alert>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="space-y-3">
              {verificationState.status === 'success' && (
                <Button 
                  onClick={() => router.push('/profile')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                >
                  <UserIcon className="h-4 w-4 mr-2" />
                  Go to Profile
                </Button>
              )}
              
              {(verificationState.status === 'failure' || verificationState.status === 'error') && (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                onClick={() => router.push('/')}
                className="w-full text-gray-600"
              >
                <HomeIcon className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
            
          </CardContent>
        </Card>
        
        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-4">
          Secure NFC Authentication • Powered by KairOS
        </p>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function NFCPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-purple-950">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg">
              <SmartphoneIcon className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            iPhone NFC Authentication
          </h1>
          <p className="text-gray-800 dark:text-gray-200 text-lg">
            Loading iPhone NFC parameters...
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <LoaderIcon className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
            <p className="text-gray-800 dark:text-gray-200">Initializing secure authentication...</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function NFCPage() {
  return (
    <Suspense fallback={<NFCPageLoading />}>
      <NFCPageContent />
    </Suspense>
  )
} 