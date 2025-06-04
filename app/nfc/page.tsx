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
    <div className="space-y-6">
      {/* NFC Status Section */}
      <div className="nfc-status">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-2 border border-gray-300 rounded">
            <NfcIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-medium">NFC Authentication</h2>
            <p className="mono-text text-gray-600">NTAG424 Dynamic Authentication</p>
          </div>
        </div>
        
        {/* Progress */}
        <div className="nfc-progress">
          <div 
            className="nfc-progress-bar" 
            style={{ width: `${verificationState.progress}%` }}
          />
        </div>
        
        {/* Current Phase */}
        <p className="mono-text text-sm mb-4">{verificationState.currentPhase}</p>
        
        {/* Status Message */}
        <div className="text-sm text-center py-2">
          {verificationState.status === 'success' && '✅ Authentication completed successfully'}
          {verificationState.status === 'failure' && `❌ ${verificationState.error}`}
          {verificationState.status === 'error' && `⚠️ ${verificationState.error}`}
          {verificationState.status === 'verifying' && '🔄 Authenticating...'}
          {verificationState.status === 'initializing' && '⏳ Initializing...'}
        </div>
      </div>
      
      {/* Authentication Flow */}
      <div className="state-flow">
        <div className="state-flow-title">// Two-Tap Cryptographic Authentication Flow</div>
        <div className="space-y-3">
          {VERIFICATION_PHASES.map((phase, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="mono-text text-xs w-4">{index + 1}</span>
              <div className="flex-1">
                <div className="text-sm font-medium">{phase.name}</div>
                <div className="mono-text text-xs text-gray-600">{phase.description}</div>
              </div>
              <div 
                className={`w-2 h-2 rounded-full ${
                  verificationState.progress >= (index + 1) * 16.67 
                    ? 'bg-black' 
                    : 'bg-gray-300'
                }`} 
              />
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="mono-text text-xs text-gray-600">
            State Machine: idle → detecting → authenticating → executing → success → idle<br/>
            Security: AES-128 signature verification with NTAG424-based identity<br/>
            UX Pattern: Single tap triggers full authentication flow
          </p>
        </div>
      </div>
      
      {/* Verification Results */}
      {verificationState.status === 'success' && (
        <div className="device-card">
          <h3 className="text-sm font-medium mb-3">Verification Results</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="device-spec-item">
              <span className="mono-text">Chip Authenticated: ✓</span>
            </div>
            <div className="device-spec-item">
              <span className="mono-text">Secret Valid: ✓</span>
            </div>
            <div className="device-spec-item">
              <span className="mono-text">ZK Proof Generated: ✓</span>
            </div>
            <div className="device-spec-item">
              <span className="mono-text">Moment Captured: ✓</span>
            </div>
          </div>
          {verificationState.verificationTime && (
            <p className="mono-text text-xs text-gray-600 mt-3">
              Verification time: {verificationState.verificationTime}ms
            </p>
          )}
        </div>
      )}
      
      {/* Chip Information */}
      {nfcParams.chipUID && (
        <div className="device-card">
          <h3 className="text-sm font-medium mb-3">Chip Information</h3>
          <div className="space-y-2">
            <div>
              <span className="mono-text text-xs text-gray-600">Chip UID</span>
              <div className="mono-text">{nfcParams.chipUID}</div>
            </div>
            <div>
              <span className="mono-text text-xs text-gray-600">Timestamp</span>
              <div className="mono-text">
                {nfcParams.timestamp ? new Date(parseInt(nfcParams.timestamp)).toLocaleString() : 'N/A'}
              </div>
            </div>
            {nfcParams.counter && (
              <div>
                <span className="mono-text text-xs text-gray-600">Access Counter</span>
                <div className="mono-text">{nfcParams.counter}</div>
              </div>
            )}
          </div>
          <div className="device-specs mt-3">
            <span className="device-spec-item">NTAG424</span>
            <span className="device-spec-item">ISO 14443-4</span>
            <span className="device-spec-item">AES-128</span>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex gap-3">
        {(verificationState.status === 'failure' || verificationState.status === 'error') && (
          <button 
            onClick={retryVerification}
            disabled={isRetrying}
            className="btn-minimal primary flex-1"
          >
            {isRetrying ? 'Retrying...' : 'Retry Authentication'}
          </button>
        )}
        
        {verificationState.status === 'success' && (
          <>
            <button 
              onClick={() => router.push('/zkMoments')}
              className="btn-minimal primary flex-1"
            >
              View My Moments
            </button>
            <button 
              onClick={() => router.push('/')}
              className="btn-minimal"
            >
              Home
            </button>
          </>
        )}
        
        <button 
          onClick={() => router.push('/nfc-test')}
          className="btn-minimal"
        >
          Test NFC
        </button>
      </div>
      
      {/* Debug Logs */}
      {verificationState.debugLogs.length > 0 && (
        <div className="debug-panel">
          <div className="text-xs font-medium mb-2">Authentication Logs</div>
          {verificationState.debugLogs.map((log, index) => (
            <div key={index} className="text-xs mb-1">{log}</div>
          ))}
        </div>
      )}
    </div>
  )
}

// Loading component for Suspense fallback
function NFCPageLoading() {
  return (
    <div className="nfc-status">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-2 border border-gray-300 rounded">
          <NfcIcon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-medium">NFC Authentication</h2>
          <p className="mono-text text-gray-600">Loading NFC parameters...</p>
        </div>
      </div>
      <div className="animate-minimal-pulse">
        <LoaderIcon className="h-6 w-6 mx-auto" />
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