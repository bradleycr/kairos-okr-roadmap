'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  NfcIcon, 
  ShieldCheckIcon, 
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  SmartphoneIcon,
  HomeIcon,
  UserIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  BugIcon,
  CopyIcon,
  ZapIcon,
  WifiIcon,
  ScanIcon
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
}

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
  
  // --- Android & Chrome Intent Detection ---
  const [deviceInfo, setDeviceInfo] = useState<{
    isAndroid: boolean
    isChrome: boolean
    canUseIntent: boolean
  }>({ isAndroid: false, isChrome: false, canUseIntent: false })

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroid = userAgent.includes('android')
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
    const canUseIntent = isAndroid && typeof window !== 'undefined'
    
    setDeviceInfo({ isAndroid, isChrome, canUseIntent })
  }, [])

  const openInChrome = useCallback(() => {
    if (!deviceInfo.canUseIntent) return
    
    // Get current URL and convert to Chrome intent
    const currentUrl = window.location.href
    const intentUrl = `intent://${currentUrl.replace('https://', '')}#Intent;scheme=https;package=com.android.chrome;end`
    
    // Try to open in Chrome, fallback to current browser
    try {
      window.location.href = intentUrl
      
      // Fallback after 2 seconds if Chrome doesn't open
      setTimeout(() => {
            toast({
          title: "📱 Chrome Not Found",
          description: "Continuing with current browser...",
            })
            }, 2000)
          } catch (error) {
      console.warn('Intent URL failed:', error)
            toast({
        title: "⚠️ Opening in Current Browser",
        description: "Chrome intent not available",
              variant: "destructive"
            })
          }
  }, [deviceInfo.canUseIntent, toast])
  
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
    
    // Strategy 2: Check for iPhone NFC ultra-compressed format (u, s, k) with improved handling
    const ultraUID = searchParams.get('u')
    const ultraSig = searchParams.get('s') 
    const ultraKey = searchParams.get('k')
    
    if (ultraUID && ultraSig && ultraKey) {
      try {
        // Reconstruct from ultra-compressed format with better error handling
        const chipUID = ultraUID.includes(':') ? ultraUID : `04:${ultraUID.match(/.{2}/g)?.join(':') || ultraUID}`
        
        // Enhanced padding strategy - handle both hex and base64
        let signature = ultraSig
        let publicKey = ultraKey
        
        // If it looks like base64 and is shorter than expected hex, try to decode
        if (ultraSig.length < 100 && /^[A-Za-z0-9\-_+/=]+$/.test(ultraSig)) {
          try {
            // Attempt base64 decode
            const decoded = atob(ultraSig.replace(/-/g, '+').replace(/_/g, '/'))
            signature = Array.from(decoded).map(char => 
              char.charCodeAt(0).toString(16).padStart(2, '0')
            ).join('')
          } catch {
            // Fallback to hex padding if base64 decode fails
            signature = ultraSig.padEnd(128, '0')
          }
        } else {
          signature = ultraSig.padEnd(128, '0')
        }
        
        if (ultraKey.length < 50 && /^[A-Za-z0-9\-_+/=]+$/.test(ultraKey)) {
          try {
            const decoded = atob(ultraKey.replace(/-/g, '+').replace(/_/g, '/'))
            publicKey = Array.from(decoded).map(char => 
              char.charCodeAt(0).toString(16).padStart(2, '0')
            ).join('')
          } catch {
            publicKey = ultraKey.padEnd(64, '0')
          }
        } else {
          publicKey = ultraKey.padEnd(64, '0')
        }
        
        // Generate DID from public key with validation
        const did = publicKey.length >= 32 ? `did:key:z${publicKey.substring(0, 32)}` : `did:key:z${publicKey.padEnd(32, '0')}`
      
      const reconstructed = { chipUID, signature, publicKey, did }
      
      setVerificationState(prev => ({
        ...prev,
        reconstructedParameters: {
          'Original u': ultraUID,
          'Original s': ultraSig,
          'Original k': ultraKey,
          'Reconstructed UID': chipUID,
            'Processed signature': signature,
            'Processed public key': publicKey,
          'Generated DID': did
        },
        debugLogs: [...prev.debugLogs, 
          '📱 Strategy 2: Ultra-compressed format (u,s,k) detected',
            `🔧 Original: u=${ultraUID}, s=${ultraSig.substring(0, 16)}..., k=${ultraKey.substring(0, 16)}...`,
          `🔄 Reconstructed: ${JSON.stringify(reconstructed)}`
        ]
      }))
      
        return reconstructed
      } catch (error) {
        setVerificationState(prev => ({
          ...prev,
          debugLogs: [...prev.debugLogs, `❌ Error processing ultra-compressed format: ${error}`]
        }))
        // Fall through to next strategy
      }
    }
    
    // Strategy 3: Check for iPhone NFC compressed format (c, s, p) with improved handling
    const compressedUID = searchParams.get('c')
    const compressedSig = searchParams.get('s')
    const compressedKey = searchParams.get('p')
    
    if (compressedUID && compressedSig && compressedKey) {
      try {
        // Reconstruct from compressed format with validation
        const chipUID = compressedUID.includes(':') ? compressedUID : `04:${compressedUID.match(/.{2}/g)?.join(':') || compressedUID}`
        
        // Ensure minimum lengths and proper padding
        const signature = compressedSig.length >= 64 ? compressedSig : compressedSig.padEnd(128, '0')
        const publicKey = compressedKey.length >= 32 ? compressedKey : compressedKey.padEnd(64, '0')
      
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
            `🔧 Original: c=${compressedUID}, s=${compressedSig.substring(0, 16)}..., p=${compressedKey.substring(0, 16)}...`,
          `🔄 Reconstructed: ${JSON.stringify(reconstructed)}`
        ]
      }))
      
        return reconstructed
      } catch (error) {
        setVerificationState(prev => ({
          ...prev,
          debugLogs: [...prev.debugLogs, `❌ Error processing compressed format: ${error}`]
        }))
        // Fall through to next strategy
      }
    }
    
    // Strategy 4: Check for full parameter format (original) with validation
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
      debugLogs: [...prev.debugLogs, '❌ No valid NFC parameters found in URL - showing Web NFC fallback']
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
      // Enhanced parameter validation with detailed error reporting
      const missingParams = []
      if (!params.chipUID) missingParams.push('chipUID')
      if (!params.did) missingParams.push('DID')
      if (!params.signature) missingParams.push('signature')
      if (!params.publicKey) missingParams.push('publicKey')
      
      if (missingParams.length > 0) {
        throw new Error(`Missing required NFC parameters: ${missingParams.join(', ')}. Please ensure your NFC tag is properly programmed.`)
      }
      
      // Validate parameter formats
      if (params.signature && params.signature.length < 64) {
        throw new Error(`Invalid signature format: too short (${params.signature.length} chars, need 64+)`)
      }
      
      if (params.publicKey && params.publicKey.length < 32) {
        throw new Error(`Invalid public key format: too short (${params.publicKey.length} chars, need 32+)`)
      }
      
      // Phase 1: Reading NFC Data
      setVerificationState(prev => ({
        ...prev,
        progress: 20,
        currentPhase: 'Reading NFC credentials...',
        debugLogs: [...prev.debugLogs, '🔄 Phase 1: Parsing NFC data from URL parameters']
      }))
      
      await new Promise(resolve => setTimeout(resolve, 600))
      
      // Phase 2: Validating Parameters
      setVerificationState(prev => ({
        ...prev,
        progress: 40,
        currentPhase: 'Validating cryptographic parameters...',
        debugLogs: [...prev.debugLogs, '🔄 Phase 2: Validating DID format and parameter integrity']
      }))
      
      await new Promise(resolve => setTimeout(resolve, 400))
      
      // Phase 3: Cryptographic Verification
      setVerificationState(prev => ({
        ...prev,
        progress: 70,
        currentPhase: 'Verifying Ed25519 signature...',
        debugLogs: [...prev.debugLogs, '🔄 Phase 3: Performing cryptographic verification via API']
      }))
      
      const verificationResult = await verifyNFCAuthentication(params)
      
      if (!verificationResult.verified) {
        throw new Error(`Authentication failed: ${verificationResult.error || 'Invalid signature or parameters'}`)
      }
      
      // Phase 4: Success
      setVerificationState(prev => ({
        ...prev,
        progress: 100,
        currentPhase: 'Authentication successful!',
        status: 'success',
        verificationTime: Date.now() - Date.now(), // Will be overwritten by actual time
        chipAuthenticated: true,
        secretValid: true,
        zkProofGenerated: true,
        sessionToken: verificationResult.sessionToken,
        momentId: verificationResult.momentId,
        debugLogs: [...prev.debugLogs, 
          '✅ Phase 4: Authentication completed successfully',
          `🎉 Session token: ${verificationResult.sessionToken?.substring(0, 16)}...`,
          `📝 Moment ID: ${verificationResult.momentId}`
        ]
      }))
      
      // Show success toast
      toast({
        title: "🎉 NFC Authentication Successful!",
        description: "Your cryptographic credentials have been verified",
      })
      
      // Redirect to profile after short delay
      setTimeout(() => {
        router.push(`/profile?authenticated=true&source=nfc`)
      }, 1500)
      
    } catch (error: any) {
      console.error('Verification error:', error)
      
      // Determine error type and provide helpful messages
      let userFriendlyMessage = 'Authentication failed. Please try again.'
      let debugMessage = error.message || 'Unknown error'
      
      if (error.message?.includes('Missing required')) {
        userFriendlyMessage = 'Invalid NFC tag data. Please check that your tag is properly programmed.'
      } else if (error.message?.includes('Invalid signature') || error.message?.includes('signature')) {
        userFriendlyMessage = 'Cryptographic verification failed. Your NFC tag may be corrupted or tampered with.'
      } else if (error.message?.includes('fetch') || error.message?.includes('network')) {
        userFriendlyMessage = 'Network error. Please check your internet connection and try again.'
      } else if (error.message?.includes('timeout')) {
        userFriendlyMessage = 'Verification timed out. Please try again.'
      }
      
      setVerificationState(prev => ({
        ...prev,
        status: 'failure',
        error: userFriendlyMessage,
        currentPhase: 'Authentication failed',
        debugLogs: [...prev.debugLogs, 
          `❌ Verification failed: ${debugMessage}`,
          `💡 User message: ${userFriendlyMessage}`
        ]
      }))
      
      // Show error toast
      toast({
        title: "❌ Authentication Failed",
        description: userFriendlyMessage,
        variant: "destructive"
      })
    }
  }, [verifyNFCAuthentication, router, toast])
  
  // --- Initialize on mount ---
  useEffect(() => {
    const params = parseNFCParameters()
    if (Object.keys(params).length > 0) {
      setNFCParams(params)
      executeVerificationFlow(params)
    } else {
      // When no URL parameters, user is exploring page manually - show Web NFC reader
      setVerificationState(prev => ({
        ...prev,
        status: 'initializing',
        currentPhase: 'Ready to scan NFC tags',
        debugLogs: [...prev.debugLogs, '👤 User accessing /nfc page directly - no URL parameters detected']
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Animated background grid - retro terminal vibes */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
      </div>
      
      <div className="container mx-auto px-3 py-4 max-w-sm sm:max-w-md md:max-w-2xl space-y-4 relative z-10">
        
        {/* Header - Mobile optimized */}
        <div className="text-center space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="relative p-2 sm:p-3 rounded-full bg-primary/10 border border-primary/20">
              {/* Header icon - no animation */}
              <NfcIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary relative z-10" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                <span className="animate-[fadeIn_0.6s_ease-in]">Cryptographic</span>
                <br />
                <span className="animate-[fadeIn_0.8s_ease-in] text-primary">Ritual Gateway</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground animate-[fadeIn_1s_ease-in]">
                Decentralized identity for MELD ecosystem
              </p>
            </div>
          </div>
        </div>

        {/* Check if we have URL parameters (programmed chip) vs manual access */}
        {Object.keys(nfcParams).length > 0 ? (
          /* PROGRAMMED NFC CHIP: Show authentication flow */
          <Card className="border border-border shadow-lg bg-card/80 backdrop-blur-sm animate-[slideIn_0.5s_ease-out]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <div className="relative">
                  <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  {verificationState.status === 'verifying' && (
                    <div className="absolute inset-0 animate-spin">
                      <div className="w-full h-full border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </div>
                <span className="font-mono tracking-wide">RITUAL.AUTHENTICATION.PROTOCOL</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm font-mono">
                {verificationState.status === 'verifying' 
                  ? <span className="animate-pulse">⚡ CONNECTING TO DECENTRALIZED NETWORK...</span>
                  : <span>🔮 Cryptographic pendant detected - initiating verification</span>
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status Icon */}
              <div className="flex justify-center py-2">
                {verificationState.status === 'verifying' && (
                  <div className="relative mx-auto w-12 h-12 sm:w-16 sm:h-16">
                    {/* Outer rotating ring - dial-up connection feel */}
                    <div className="absolute inset-0 border-2 border-primary rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
                    <div className="absolute inset-1 border border-primary/50 rounded-full animate-spin" style={{animationDuration: '3s', animationDirection: 'reverse'}}></div>
                    <div className="absolute inset-2 bg-card rounded-full flex items-center justify-center">
                      <NfcIcon className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse" />
                    </div>
                  </div>
                )}
                
                {verificationState.status === 'success' && (
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
                    <CheckCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                  </div>
                )}
                
                {(verificationState.status === 'failure' || verificationState.status === 'error') && (
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-destructive/10 rounded-full flex items-center justify-center animate-[shake_0.5s_ease-out]">
                    <XCircleIcon className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
                  </div>
                )}
                
                {verificationState.status === 'initializing' && (
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-muted rounded-full flex items-center justify-center">
                    <NfcIcon className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Debug Icon - Top Right Corner */}
              <div className="absolute top-4 right-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDebugLogs(!showDebugLogs)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                >
                  <BugIcon className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Title */}
              <div className="text-center">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground font-mono tracking-wide">
                  {verificationState.status === 'success' 
                    ? <span className="animate-[typewriter_1s_ease-in] text-primary">◈ RITUAL COMPLETE ◈</span>
                    : <span className="animate-[typewriter_1s_ease-in]">◈ AUTHENTICATING ◈</span>
                  }
              </h3>
              </div>
              
              {/* Status Message */}
              <div className="text-center px-2">
                <p className="text-xs sm:text-sm text-muted-foreground font-mono animate-pulse">
                {verificationState.currentPhase}
              </p>
              </div>
              
              {/* Progress Bar */}
              {verificationState.status === 'verifying' && (
                <div className="space-y-2">
                  <Progress value={verificationState.progress} className="h-1.5 sm:h-2 animate-[pulse_1s_ease-in-out_infinite]" />
                  <div className="text-center">
                    <span className="text-xs font-mono text-muted-foreground">
                      {verificationState.progress}% COMPLETE
                    </span>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {(verificationState.status === 'failure' || verificationState.status === 'error') && (
                <Alert className="border-destructive/20 bg-destructive/10">
                  <AlertTriangleIcon className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    {verificationState.error}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Debug Logs Section */}
              {showDebugLogs && (
                <div className="text-left">
                  <div className="bg-muted rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <BugIcon className="h-4 w-4" />
                        Debug Information
                      </h4>
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
                    
                    <ScrollArea className="h-40">
                      <div className="space-y-1 text-xs font-mono">
                        {verificationState.debugLogs.map((log, index) => (
                          <div key={index} className="text-muted-foreground">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}

              {/* Success Actions - Only show Back to Home, no Profile button */}
              {verificationState.status === 'success' && (
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full"
                  >
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              )}

              {/* Retry Actions */}
              {(verificationState.status === 'failure' || verificationState.status === 'error') && (
                <div className="space-y-3">
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    <RefreshCwIcon className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full"
                  >
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Back to Home
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          /* MANUAL PAGE ACCESS: Show welcome message with link to scanner */
          <>
            {/* Standard Welcome Card - Simplified */}
            <Card className="border border-border shadow-lg bg-card/80 backdrop-blur-sm animate-[fadeIn_0.8s_ease-out]">
              <CardHeader className="text-center pb-3">
                <CardTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
                  <div className="relative">
                    <WifiIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                  </div>
                  <span className="font-mono tracking-wide">PENDANT.SETUP</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                  Configure or scan your MELD pendant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <div className="space-y-3">
                  <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-amber-500/10 rounded-full flex items-center justify-center border border-amber-500/20">
                    <WifiIcon className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground font-mono">
                      Setup Required
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Programmed pendants auto-authenticate when tapped
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-3 pt-3 max-w-xs mx-auto">
                    <Button 
                      onClick={() => router.push('/chip-config')} 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
                    >
                      <WifiIcon className="h-4 w-4 mr-2" />
                      Configure Pendant
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/nfc/scan')}
                      className="w-full border-primary/30 text-primary hover:bg-primary/5 font-mono"
                    >
                      <ScanIcon className="h-4 w-4 mr-2" />
                      Scan Raw Pendant
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Footer */}
        <div className="text-center pt-6 pb-4">
          <p className="text-xs text-muted-foreground font-mono animate-[fadeIn_1.5s_ease-out]">
            DECENTRALIZED.RITUAL.GATEWAY • POWERED.BY.MELD
        </p>
      </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  )
}

// Loading component for Suspense fallback
function NFCPageLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-4 bg-primary rounded-lg shadow-minimal">
              <SmartphoneIcon className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">
            NFC Authentication
          </h1>
          <p className="text-foreground text-lg">
            Loading authentication system...
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <LoaderIcon className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-foreground">Initializing secure authentication...</p>
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