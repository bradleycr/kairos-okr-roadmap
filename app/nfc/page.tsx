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
  RefreshCwIcon,
  BugIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CopyIcon
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
  
  // Debug Info
  urlParameters?: Record<string, string>
  apiResponse?: any
  reconstructedParameters?: Record<string, string>
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
  const [showDebugLogs, setShowDebugLogs] = useState(false)
  
  // --- Parse URL Parameters ---
  const parseNFCParameters = useCallback((): NFCParams => {
    const allParams: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      allParams[key] = value
    })
    
    // Store original URL parameters for debugging
    setVerificationState(prev => ({
      ...prev,
      urlParameters: allParams,
      debugLogs: [...prev.debugLogs, `🔍 Raw URL params: ${JSON.stringify(allParams)}`]
    }))
    
    // Strategy 1: Check for ultra-short URL pattern (from /n/[id] redirect)
    const source = searchParams.get('source')
    if (source === 'short_url') {
      const params = {
        did: searchParams.get('did') || undefined,
        signature: searchParams.get('signature') || undefined,
        publicKey: searchParams.get('publicKey') || undefined,
        chipUID: searchParams.get('uid') || undefined
      }
      
      setVerificationState(prev => ({
        ...prev,
        debugLogs: [...prev.debugLogs, '📱 Strategy 1: Short URL format detected', `✅ Parsed: ${JSON.stringify(params)}`]
      }))
      
      return params
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
      
      const reconstructed = { chipUID, signature, publicKey, did }
      
      setVerificationState(prev => ({
        ...prev,
        reconstructedParameters: {
          'Original u': ultraUID,
          'Original s': ultraSig,
          'Original k': ultraKey,
          'Reconstructed UID': chipUID,
          'Padded signature': signature,
          'Padded public key': publicKey,
          'Generated DID': did
        },
        debugLogs: [...prev.debugLogs, 
          '📱 Strategy 2: Ultra-compressed format (u,s,k) detected',
          `🔧 Original: u=${ultraUID}, s=${ultraSig}, k=${ultraKey}`,
          `🔄 Reconstructed: ${JSON.stringify(reconstructed)}`
        ]
      }))
      
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
      
      const reconstructed = { chipUID, signature, publicKey, did }
      
      setVerificationState(prev => ({
        ...prev,
        reconstructedParameters: {
          'Original c': compressedUID,
          'Original s': compressedSig,
          'Original p': compressedKey,
          'Reconstructed UID': chipUID,
          'Padded signature': signature,
          'Padded public key': publicKey,
          'Generated DID': did
        },
        debugLogs: [...prev.debugLogs, 
          '📱 Strategy 3: Compressed format (c,s,p) detected',
          `🔧 Original: c=${compressedUID}, s=${compressedSig}, p=${compressedKey}`,
          `🔄 Reconstructed: ${JSON.stringify(reconstructed)}`
        ]
      }))
      
      return { did, signature, publicKey, chipUID }
    }
    
    // Strategy 4: Check for full parameter format (original)
    const fullDID = searchParams.get('did')
    const fullSig = searchParams.get('signature') 
    const fullKey = searchParams.get('publicKey')
    const fullUID = searchParams.get('uid')
    
    if (fullDID && fullSig && fullKey && fullUID) {
      const params = {
        did: fullDID,
        signature: fullSig,
        publicKey: fullKey,
        chipUID: fullUID
      }
      
      setVerificationState(prev => ({
        ...prev,
        debugLogs: [...prev.debugLogs, '📱 Strategy 4: Full format detected', `✅ Parsed: ${JSON.stringify(params)}`]
      }))
      
      return params
    }
    
    // No valid parameters found
    setVerificationState(prev => ({
      ...prev,
      debugLogs: [...prev.debugLogs, '❌ No valid NFC parameters found in URL']
    }))
    
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
    
    setVerificationState(prev => ({
      ...prev,
      debugLogs: [...prev.debugLogs, `🚀 Sending API request to /api/nfc/verify`, `📦 Request body: ${JSON.stringify(requestBody, null, 2)}`]
    }))
    
    const response = await fetch('/api/nfc/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })
    
    const responseData = await response.json()
    
    setVerificationState(prev => ({
      ...prev,
      apiResponse: responseData,
      debugLogs: [...prev.debugLogs, 
        `📡 API Response (${response.status}): ${JSON.stringify(responseData, null, 2)}`
      ]
    }))
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status} - ${responseData.error || 'Unknown error'}`)
    }
    
    return responseData
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

  // --- Copy Debug Info Function ---
  const copyDebugInfo = useCallback(() => {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      verificationState,
      urlParameters: verificationState.urlParameters,
      reconstructedParameters: verificationState.reconstructedParameters,
      nfcParams,
      apiResponse: verificationState.apiResponse,
      debugLogs: verificationState.debugLogs
    }
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2))
    toast({
      title: "Debug info copied!",
      description: "Full debug information copied to clipboard",
    })
  }, [verificationState, nfcParams, toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Minimal Auth Card */}
        <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center">
            
            {/* Debug Icon - Top Right Corner */}
            <div className="absolute top-4 right-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugLogs(!showDebugLogs)}
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
              >
                <BugIcon className="h-4 w-4" />
              </Button>
            </div>
            
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
            
            {/* Debug Logs Section */}
            {showDebugLogs && (
              <div className="mb-6 text-left">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <BugIcon className="h-4 w-4" />
                      Debug Information
                    </h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={copyDebugInfo}
                      className="h-6 px-2 text-xs"
                    >
                      <CopyIcon className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  
                  <ScrollArea className="h-48">
                    <div className="space-y-2 text-xs font-mono">
                      {/* URL Parameters */}
                      {verificationState.urlParameters && (
                        <div className="bg-blue-50 p-2 rounded border border-blue-200">
                          <div className="font-semibold text-blue-700 mb-1">📍 URL Parameters:</div>
                          {Object.entries(verificationState.urlParameters).map(([key, value]) => (
                            <div key={key} className="text-blue-600">
                              {key}: {value}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Reconstructed Parameters */}
                      {verificationState.reconstructedParameters && (
                        <div className="bg-purple-50 p-2 rounded border border-purple-200">
                          <div className="font-semibold text-purple-700 mb-1">🔄 Reconstructed:</div>
                          {Object.entries(verificationState.reconstructedParameters).map(([key, value]) => (
                            <div key={key} className="text-purple-600">
                              {key}: {String(value).substring(0, 50)}{String(value).length > 50 ? '...' : ''}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* API Response */}
                      {verificationState.apiResponse && (
                        <div className="bg-green-50 p-2 rounded border border-green-200">
                          <div className="font-semibold text-green-700 mb-1">📡 API Response:</div>
                          <div className="text-green-600">
                            Status: {verificationState.apiResponse.verified ? '✅ Verified' : '❌ Failed'}
                          </div>
                          <div className="text-green-600">
                            Error: {verificationState.apiResponse.error || 'None'}
                          </div>
                        </div>
                      )}
                      
                      {/* Debug Logs */}
                      <div className="bg-gray-100 p-2 rounded border">
                        <div className="font-semibold text-gray-700 mb-1">📋 Debug Logs:</div>
                        {verificationState.debugLogs.map((log, index) => (
                          <div key={index} className="text-gray-600 py-0.5">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
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