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
  HomeIcon
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
  secret?: string    // s= parameter
  chipUID?: string   // uid= parameter  
  timestamp?: string // t= parameter
  counter?: string   // c= parameter (optional)
  session?: string   // session= parameter (optional)
}

const VERIFICATION_PHASES = [
  { name: '📡 Detecting NFC Parameters', description: 'Reading URL parameters from NTAG424' },
  { name: '🔍 Validating Chip UID', description: 'Verifying chip identity and format' },
  { name: '🔐 Authenticating Secret', description: 'Verifying dynamic AES-128 secret' },
  { name: '⚡ Generating ZK Proof', description: 'Creating zero-knowledge proof for moment' },
  { name: '💾 Capturing Moment', description: 'Storing encrypted moment data' },
  { name: '✅ Authentication Complete', description: 'NFC authentication successful' }
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
    currentPhase: 'Initializing...',
    debugLogs: []
  })
  
  const [nfcParams, setNFCParams] = useState<NFCParams>({})
  const [isRetrying, setIsRetrying] = useState(false)
  
  // --- Parse URL Parameters ---
  const parseNFCParameters = useCallback((): NFCParams => {
    const params: NFCParams = {
      secret: searchParams.get('s') || undefined,
      chipUID: searchParams.get('uid') || undefined,
      timestamp: searchParams.get('t') || undefined,
      counter: searchParams.get('c') || undefined,
      session: searchParams.get('session') || undefined
    }
    
    return params
  }, [searchParams])
  
  // --- Verify NFC Authentication ---
  const verifyNFCAuthentication = useCallback(async (params: NFCParams) => {
    if (!params.secret || !params.chipUID || !params.timestamp) {
      throw new Error('Missing required NFC parameters (secret, uid, timestamp)')
    }
    
    const requestBody = {
      chipUID: params.chipUID,
      secret: params.secret,
      timestamp: parseInt(params.timestamp),
      counter: params.counter ? parseInt(params.counter) : undefined,
      sessionId: params.session,
      generateZKProof: true,
      momentData: {
        interactionType: 'nfc_tap' as const,
        participantCount: 1
      },
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
      throw new Error(`Verification failed: ${response.status} ${response.statusText}`)
    }
    
    return response.json()
  }, [])
  
  // --- Execute Verification Flow ---
  const executeVerificationFlow = useCallback(async (params: NFCParams) => {
    setVerificationState(prev => ({
      ...prev,
      status: 'verifying',
      progress: 0,
      debugLogs: ['🚀 Starting NTAG424 verification flow...']
    }))
    
    try {
      // Phase 1: Parameter Detection
      setVerificationState(prev => ({
        ...prev,
        progress: 16,
        currentPhase: VERIFICATION_PHASES[0].name,
        debugLogs: [...prev.debugLogs, 
          '📡 NFC parameters detected from URL',
          `🔑 Chip UID: ${params.chipUID}`,
          `🔐 Secret: ${params.secret?.substring(0, 16)}...`,
          `⏰ Timestamp: ${new Date(parseInt(params.timestamp!)).toISOString()}`
        ]
      }))
      
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Phase 2: UID Validation
      setVerificationState(prev => ({
        ...prev,
        progress: 33,
        currentPhase: VERIFICATION_PHASES[1].name,
        debugLogs: [...prev.debugLogs, '🔍 Validating chip UID format and authenticity']
      }))
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Phase 3: Secret Authentication (API Call)
      setVerificationState(prev => ({
        ...prev,
        progress: 50,
        currentPhase: VERIFICATION_PHASES[2].name,
        debugLogs: [...prev.debugLogs, '🔐 Sending verification request to KairOS API...']
      }))
      
      const verificationResult = await verifyNFCAuthentication(params)
      
      if (!verificationResult.verified) {
        throw new Error(verificationResult.error || 'Secret verification failed')
      }
      
      // Add API debug logs
      if (verificationResult.debugLogs) {
        setVerificationState(prev => ({
          ...prev,
          debugLogs: [...prev.debugLogs, ...verificationResult.debugLogs]
        }))
      }
      
      // Phase 4: ZK Proof Generation
      setVerificationState(prev => ({
        ...prev,
        progress: 75,
        currentPhase: VERIFICATION_PHASES[3].name,
        debugLogs: [...prev.debugLogs, '⚡ ZK proof generation in progress...']
      }))
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Phase 5: Moment Capture
      setVerificationState(prev => ({
        ...prev,
        progress: 90,
        currentPhase: VERIFICATION_PHASES[4].name,
        debugLogs: [...prev.debugLogs, '💾 Capturing and encrypting moment data...']
      }))
      
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Phase 6: Success
      setVerificationState(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
        currentPhase: VERIFICATION_PHASES[5].name,
        verificationTime: verificationResult.verificationTime,
        chipAuthenticated: verificationResult.chipAuthenticated,
        secretValid: verificationResult.secretValid,
        zkProofGenerated: verificationResult.zkProofGenerated,
        momentCaptured: verificationResult.momentCaptured,
        sessionToken: verificationResult.data?.sessionToken,
        momentId: verificationResult.data?.momentId,
        debugLogs: [...prev.debugLogs,
          '✅ NTAG424 authentication completed successfully!',
          `🎫 Session token: ${verificationResult.data?.sessionToken?.substring(0, 24)}...`,
          `🆔 Moment ID: ${verificationResult.data?.momentId}`,
          `⚡ Verification time: ${verificationResult.verificationTime}ms`
        ]
      }))
      
      toast({
        title: "NFC Authentication Successful",
        description: `Chip ${params.chipUID} authenticated in ${verificationResult.verificationTime}ms`,
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown verification error'
      
      setVerificationState(prev => ({
        ...prev,
        status: 'failure',
        error: errorMessage,
        debugLogs: [...prev.debugLogs,
          `❌ Verification failed: ${errorMessage}`,
          '🔧 Check chip programming and URL parameters'
        ]
      }))
      
      toast({
        title: "NFC Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [verifyNFCAuthentication, toast])
  
  // --- Retry Verification ---
  const retryVerification = useCallback(async () => {
    setIsRetrying(true)
    
    // Reset state
    setVerificationState({
      status: 'initializing',
      progress: 0,
      currentPhase: 'Retrying...',
      debugLogs: []
    })
    
    // Wait a moment then retry
    setTimeout(() => {
      const params = parseNFCParameters()
      executeVerificationFlow(params)
      setIsRetrying(false)
    }, 1000)
  }, [parseNFCParameters, executeVerificationFlow])
  
  // --- Initialize on Mount ---
  useEffect(() => {
    const params = parseNFCParameters()
    setNFCParams(params)
    
    if (params.secret && params.chipUID && params.timestamp) {
      // Valid NFC parameters - start verification
      executeVerificationFlow(params)
    } else {
      // Missing parameters - show error
      setVerificationState({
        status: 'error',
        progress: 0,
        currentPhase: 'Parameter Error',
        error: 'Missing required NFC parameters. This URL should be accessed by tapping an NTAG424 chip.',
        debugLogs: [
          '❌ Missing required URL parameters',
          '🏷️ Expected: ?s=SECRET&uid=CHIP_UID&t=TIMESTAMP',
          '📱 This page should be accessed by tapping an NFC tag'
        ]
      })
    }
  }, [parseNFCParameters, executeVerificationFlow])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <NfcIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NFC Authentication
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                NTAG424 Dynamic Authentication for KairOS
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Verification Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                <CardTitle className="flex items-center gap-2">
                  {verificationState.status === 'verifying' && <LoaderIcon className="h-5 w-5 animate-spin text-blue-600" />}
                  {verificationState.status === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-600" />}
                  {verificationState.status === 'failure' && <XCircleIcon className="h-5 w-5 text-red-600" />}
                  {verificationState.status === 'error' && <XCircleIcon className="h-5 w-5 text-red-600" />}
                  {verificationState.status === 'initializing' && <ClockIcon className="h-5 w-5 text-gray-600" />}
                  
                  Authentication Status
                </CardTitle>
                <CardDescription>
                  {verificationState.currentPhase}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{verificationState.progress}%</span>
                  </div>
                  <Progress value={verificationState.progress} className="h-3" />
                </div>
                
                {/* Status Message */}
                <Alert className={
                  verificationState.status === 'success' ? 'border-green-200 bg-green-50' :
                  verificationState.status === 'failure' || verificationState.status === 'error' ? 'border-red-200 bg-red-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  {verificationState.status === 'success' && <CheckCircleIcon className="h-4 w-4 text-green-600" />}
                  {(verificationState.status === 'failure' || verificationState.status === 'error') && <XCircleIcon className="h-4 w-4 text-red-600" />}
                  {verificationState.status === 'verifying' && <LoaderIcon className="h-4 w-4 text-blue-600 animate-spin" />}
                  <AlertDescription>
                    {verificationState.status === 'success' && 'NFC authentication completed successfully! Your moment has been captured and verified.'}
                    {verificationState.status === 'failure' && `Authentication failed: ${verificationState.error}`}
                    {verificationState.status === 'error' && `Configuration error: ${verificationState.error}`}
                    {verificationState.status === 'verifying' && 'Authenticating your NFC chip and generating cryptographic proofs...'}
                    {verificationState.status === 'initializing' && 'Initializing NFC authentication flow...'}
                  </AlertDescription>
                </Alert>
                
                {/* Verification Results */}
                {verificationState.status === 'success' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Chip Authenticated</span>
                        <Badge variant="outline" className="text-green-600">✓</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <KeyIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm">Secret Valid</span>
                        <Badge variant="outline" className="text-green-600">✓</Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ZapIcon className="h-4 w-4 text-purple-600" />
                        <span className="text-sm">ZK Proof Generated</span>
                        <Badge variant="outline" className="text-purple-600">✓</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <SmartphoneIcon className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Moment Captured</span>
                        <Badge variant="outline" className="text-blue-600">✓</Badge>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex gap-3">
                  {(verificationState.status === 'failure' || verificationState.status === 'error') && (
                    <Button 
                      onClick={retryVerification}
                      disabled={isRetrying}
                      className="flex-1"
                    >
                      {isRetrying ? (
                        <>
                          <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        'Retry Authentication'
                      )}
                    </Button>
                  )}
                  
                  {verificationState.status === 'success' && (
                    <>
                      <Button 
                        onClick={() => router.push('/zkMoments')}
                        className="flex-1"
                      >
                        <ArrowRightIcon className="h-4 w-4 mr-2" />
                        View My Moments
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/')}
                      >
                        <HomeIcon className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/nfc-test')}
                  >
                    Test NFC
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Debug Logs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Authentication Logs</CardTitle>
                <CardDescription>
                  Real-time verification process details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-64 p-4">
                  <div className="space-y-1">
                    {verificationState.debugLogs.map((log, index) => (
                      <div 
                        key={index} 
                        className="text-xs font-mono p-2 rounded bg-gray-50 dark:bg-gray-800 border"
                      >
                        {log}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar - Chip Info */}
          <div className="space-y-6">
            {/* Chip Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NfcIcon className="h-5 w-5 text-blue-600" />
                  Chip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nfcParams.chipUID ? (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Chip UID</div>
                      <div className="font-mono text-sm">{nfcParams.chipUID}</div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Timestamp</div>
                      <div className="font-mono text-sm">
                        {nfcParams.timestamp ? new Date(parseInt(nfcParams.timestamp)).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                    
                    {nfcParams.counter && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Access Counter</div>
                          <div className="font-mono text-sm">{nfcParams.counter}</div>
                        </div>
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-blue-600">
                        NTAG424 Compatible
                      </Badge>
                      <Badge variant="outline" className="text-green-600">
                        ISO 14443-4
                      </Badge>
                      <Badge variant="outline" className="text-purple-600">
                        AES-128 Secured
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No chip information available
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Authentication Phases */}
            <Card>
              <CardHeader>
                <CardTitle>Authentication Flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {VERIFICATION_PHASES.map((phase, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 p-2 rounded transition-colors ${
                      verificationState.progress >= (index + 1) * 16.67 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      verificationState.progress >= (index + 1) * 16.67 
                        ? 'bg-green-500' 
                        : 'bg-gray-300'
                    }`} />
                    <div>
                      <div className="text-sm font-medium">{phase.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {phase.description}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

// Loading component for Suspense fallback
function NFCPageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <NfcIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NFC Authentication
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                Loading NFC parameters...
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoaderIcon className="h-8 w-8 animate-spin text-blue-600" />
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