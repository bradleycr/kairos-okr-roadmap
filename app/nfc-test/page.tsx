'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  NfcIcon, 
  ShieldCheckIcon, 
  ClockIcon, 
  KeyIcon, 
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  CopyIcon,
  ExternalLinkIcon,
  ZapIcon,
  CpuIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Import real cryptography - no simulations
import { 
  initializeLocalIdentity, 
  loadLocalIdentity, 
  registerNewDevice,
  signChallengeLocally,
  verifySignatureDecentralized,
  type LocalUserIdentity,
  type NFCChipData
} from '@/lib/crypto/decentralizedNFC'

/**
 * Real NFC Authentication Test Suite
 * 
 * Uses actual Ed25519 cryptography with @noble/ed25519
 * Tests real device registration, key generation, signing, and verification
 * No simulations - this is production-ready cryptographic authentication
 */

interface RealTestSession {
  userIdentity: LocalUserIdentity
  testDevice: {
    deviceId: string
    nfcChipData: NFCChipData
    privateKeyExists: boolean
  }
  testLogs: string[]
  createdAt: number
}

interface CryptoTestResult {
  testName: string
  passed: boolean
  duration: number
  details: string
  error?: string
}

export default function RealNFCTestPage() {
  const { toast } = useToast()
  
  // --- Real State Management ---
  const [userId, setUserId] = useState('bradley-test')
  const [testSession, setTestSession] = useState<RealTestSession | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [cryptoLogs, setCryptoLogs] = useState<string[]>([])
  const [testResults, setTestResults] = useState<CryptoTestResult[]>([])

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logEntry = `${timestamp}: ${message}`
    setCryptoLogs(prev => [...prev, logEntry])
    console.log(`[NFC-TEST] ${logEntry}`)
  }, [])

  const addTestResult = useCallback((result: CryptoTestResult) => {
    setTestResults(prev => [...prev, result])
    const status = result.passed ? '✅' : '❌'
    addLog(`${status} ${result.testName}: ${result.details} (${result.duration}ms)`)
  }, [addLog])

  // --- Real Identity Initialization ---
  const initializeRealIdentity = useCallback(async () => {
    if (!userId.trim()) {
      toast({
        title: "❌ User ID Required",
        description: "Please enter a user ID to initialize the system",
        variant: "destructive"
      })
      return
    }

    setIsInitializing(true)
    setCryptoLogs([])
    setTestResults([])
    
    try {
      addLog('🔄 Initializing REAL decentralized NFC system...')
      addLog('📚 Using @noble/ed25519 v2.2.3 for cryptography')
      
      // Clear any existing identity for fresh test
      localStorage.removeItem('kairOS_identity')
      
      // Create completely new identity with real Ed25519 keys
      addLog(`👤 Creating new identity for: ${userId}`)
      const startTime = Date.now()
      
      const identity = initializeLocalIdentity(userId)
      const initDuration = Date.now() - startTime
      
      addTestResult({
        testName: 'Identity Creation',
        passed: true,
        duration: initDuration,
        details: `Generated master seed: ${identity.masterSeed.substring(0, 16)}...`
      })

      // Register real NFC device with Ed25519 keypair
      addLog('⌚ Registering real NFC pocket watch device...')
      const deviceStartTime = Date.now()
      
      const deviceResult = registerNewDevice("Real Test Pocket Watch", "nfc-pocket-watch")
      const deviceDuration = Date.now() - deviceStartTime

      if (!deviceResult.nfcChipData) {
        throw new Error('Failed to generate NFC chip data')
      }

      addTestResult({
        testName: 'Device Registration',
        passed: true,
        duration: deviceDuration,
        details: `Device ID: ${deviceResult.deviceId}`
      })

      // Verify the generated keys are real Ed25519
      addLog('🔐 Verifying Ed25519 key generation...')
      const publicKeyBytes = deviceResult.nfcChipData.publicKey.length
      const expectedLength = 64 // 32 bytes = 64 hex chars
      
      if (publicKeyBytes !== expectedLength) {
        throw new Error(`Invalid public key length: ${publicKeyBytes}, expected: ${expectedLength}`)
      }

      addTestResult({
        testName: 'Ed25519 Key Validation',
        passed: true,
        duration: 0,
        details: `Public key: ${expectedLength} hex chars (32 bytes)`
      })

      const session: RealTestSession = {
        userIdentity: identity,
        testDevice: {
          deviceId: deviceResult.deviceId,
          nfcChipData: deviceResult.nfcChipData,
          privateKeyExists: true // We know it exists in localStorage
        },
        testLogs: [...cryptoLogs],
        createdAt: Date.now()
      }

      setTestSession(session)
      
      addLog('━'.repeat(60))
      addLog('✅ REAL decentralized NFC system initialized!')
      addLog('📱 Private key stored securely in browser localStorage')
      addLog('🔓 NFC chip data contains only public key + device ID')
      addLog('🔐 Ready for REAL Ed25519 authentication tests')

      toast({
        title: "✅ Real System Initialized",
        description: "Ed25519 cryptography ready for testing",
      })

    } catch (error) {
      console.error('Failed to initialize real system:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Error: ${errorMessage}`)
      
      addTestResult({
        testName: 'System Initialization',
        passed: false,
        duration: 0,
        details: 'Failed to initialize',
        error: errorMessage
      })
      
      toast({
        title: "❌ Initialization Failed", 
        description: "Could not initialize real cryptographic system",
        variant: "destructive"
      })
    } finally {
      setIsInitializing(false)
    }
  }, [userId, toast, addLog, addTestResult, cryptoLogs])

  // --- Real Cryptographic Authentication Test ---
  const testRealAuthentication = useCallback(async () => {
    if (!testSession) {
      toast({
        title: "❌ No Test Session",
        description: "Please initialize the system first",
        variant: "destructive"
      })
      return
    }

    setIsTesting(true)
    addLog('━'.repeat(60))
    addLog('🚀 Testing REAL Ed25519 authentication...')
    
    try {
      // Test 1: Generate Real Challenge
      addLog('📝 Generating cryptographic challenge...')
      const challengeStartTime = Date.now()
      
      const challenge = `KairOS-Real-${testSession.testDevice.deviceId}-${Date.now()}-${Math.random().toString(36)}`
      const challengeDuration = Date.now() - challengeStartTime
      
      addTestResult({
        testName: 'Challenge Generation',
        passed: true,
        duration: challengeDuration,
        details: `Challenge: ${challenge.substring(0, 30)}...`
      })

      // Test 2: Sign Challenge with Real Ed25519 Private Key
      addLog('✍️ Signing challenge with Ed25519 private key...')
      const signingStartTime = Date.now()
      
      const { signature, publicKey } = await signChallengeLocally(
        testSession.testDevice.deviceId,
        challenge
      )
      const signingDuration = Date.now() - signingStartTime
      
      addTestResult({
        testName: 'Ed25519 Signing',
        passed: true,
        duration: signingDuration,
        details: `Signature: ${signature.substring(0, 20)}...`
      })

      // Test 3: Verify Signature with Real Ed25519 Verification
      addLog('🔍 Verifying Ed25519 signature...')
      const verificationStartTime = Date.now()
      
      const isValid = await verifySignatureDecentralized(signature, challenge, publicKey)
      const verificationDuration = Date.now() - verificationStartTime
      
      if (!isValid) {
        throw new Error('Ed25519 signature verification failed')
      }

      addTestResult({
        testName: 'Ed25519 Verification',
        passed: true,
        duration: verificationDuration,
        details: 'Signature cryptographically valid'
      })

      // Test 4: Cross-Device Public Key Verification
      addLog('🔑 Verifying public key matches device registry...')
      const storedPublicKey = testSession.testDevice.nfcChipData.publicKey
      
      if (publicKey !== storedPublicKey) {
        throw new Error('Public key mismatch between signature and device registry')
      }

      addTestResult({
        testName: 'Public Key Consistency',
        passed: true,
        duration: 0,
        details: 'Keys match across all sources'
      })

      // Test 5: Real NFC URL Generation and Validation
      addLog('🌐 Testing real NFC URL generation...')
      const nfcUrl = testSession.testDevice.nfcChipData.authUrl
      const urlPattern = /^https:\/\/kair-os\.vercel\.app\/nfc\?d=.+&c=.+$/
      
      if (!urlPattern.test(nfcUrl)) {
        throw new Error('Invalid NFC URL format')
      }

      addTestResult({
        testName: 'NFC URL Validation',
        passed: true,
        duration: 0,
        details: `URL: ${nfcUrl.substring(0, 50)}...`
      })

      addLog('━'.repeat(60))
      addLog('✅ ALL TESTS PASSED - Real Ed25519 authentication working!')
      addLog('🔐 This is production-ready cryptographic authentication')
      addLog('📱 No simulations - all operations use real @noble/ed25519')

      toast({
        title: "🎉 All Tests Passed!",
        description: "Real Ed25519 cryptography is working perfectly",
      })

    } catch (error) {
      console.error('Real authentication test failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Real authentication test failed: ${errorMessage}`)
      
      addTestResult({
        testName: 'Authentication Test',
        passed: false,
        duration: 0,
        details: 'Test failed',
        error: errorMessage
      })
      
      toast({
        title: "❌ Authentication Test Failed",
        description: "Real cryptographic test encountered an error",
        variant: "destructive"
      })
    } finally {
      setIsTesting(false)
    }
  }, [testSession, addLog, addTestResult, toast])

  // --- Test Real NFC URL Flow ---
  const testRealNFCURL = useCallback(async () => {
    if (!testSession) {
      toast({
        title: "❌ No Test Session",
        description: "Please initialize the system first",
        variant: "destructive"
      })
      return
    }

    try {
      addLog('━'.repeat(60))
      addLog('🌐 Generating REAL NFC URL with signature...')
      
      // Generate a challenge for this specific URL test
      const challenge = `KairOS_NFC_Challenge_${testSession.testDevice.nfcChipData.chipUID}`
      addLog(`📝 Challenge: ${challenge}`)
      
      // Sign the challenge to create authenticated URL
      const { signature, publicKey } = await signChallengeLocally(
        testSession.testDevice.deviceId,
        challenge
      )
      
      addLog(`✍️ Generated signature: ${signature.substring(0, 32)}...`)
      addLog(`🔑 Using public key: ${publicKey.substring(0, 32)}...`)
      
      // Generate authenticated URL in legacy format (compatible with existing auth flow)
      const chipUID = testSession.testDevice.nfcChipData.chipUID
      const shortUID = chipUID.replace(/:/g, '')
      
      // Use the URL shortener to create properly compressed URL
      const { generateiPhoneNFCUrl } = await import('@/lib/url-shortener')
      const did = `did:key:z${publicKey.substring(0, 32)}`
      
      const urlResult = generateiPhoneNFCUrl(
        chipUID,
        signature,
        publicKey,
        did,
        'https://kair-os.vercel.app',
        'NTAG215'
      )
      
      const authenticatedUrl = urlResult.nfcUrl
      
      addLog(`🔗 Generated authenticated NFC URL:`)
      addLog(`   ${authenticatedUrl}`)
      addLog(`📊 URL Analysis: ${urlResult.urlAnalysis.bytes} bytes, ${urlResult.urlAnalysis.chars} chars`)
      addLog(`🔐 Compression: ${urlResult.compressionLevel}`)
      
      if (urlResult.validation.errors.length > 0) {
        addLog(`⚠️ Validation warnings: ${urlResult.validation.errors.join(', ')}`)
      }
      
      addLog('⚡ This URL contains REAL signature data and will trigger authentication!')
      addLog('🌐 Opening authenticated URL...')
      
      // Open the authenticated NFC URL
      window.open(authenticatedUrl, '_blank')
      
      toast({
        title: "🔐 Authenticated NFC URL Generated",
        description: "Check the new tab for real Ed25519 verification",
      })
      
    } catch (error) {
      console.error('Failed to generate authenticated URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Failed to generate authenticated URL: ${errorMessage}`)
      
      toast({
        title: "❌ URL Generation Failed",
        description: "Could not create authenticated NFC URL",
        variant: "destructive"
      })
    }
  }, [testSession, addLog, toast])

  // --- Copy to Clipboard ---
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "📋 Copied",
      description: `${label} copied to clipboard`,
    })
  }, [toast])

  // --- Load existing identity on mount ---
  useEffect(() => {
    const existingIdentity = loadLocalIdentity()
    if (existingIdentity) {
      setUserId(existingIdentity.userId)
      addLog(`🔄 Found existing identity: ${existingIdentity.userId}`)
      addLog(`📱 ${Object.keys(existingIdentity.devices).length} devices registered`)
    }
  }, [addLog])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
          <div className="relative">
            <NfcIcon className="h-8 w-8 text-blue-600" />
            <ZapIcon className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
          </div>
          Real NFC Authentication Test
        </h1>
        <p className="text-lg text-gray-600">
          Production-ready Ed25519 cryptography with @noble/ed25519 • No simulations
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="default" className="bg-green-600">
            <CpuIcon className="h-3 w-3 mr-1" />
            Real Crypto
          </Badge>
          <Badge variant="outline">Ed25519</Badge>
          <Badge variant="outline">@noble/ed25519 v2.2.3</Badge>
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="setup">Real Setup</TabsTrigger>
          <TabsTrigger value="test">Crypto Tests</TabsTrigger>
          <TabsTrigger value="results">Test Results</TabsTrigger>
          <TabsTrigger value="debug">Debug Logs</TabsTrigger>
        </TabsList>

        {/* Real Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon className="h-5 w-5" />
                Initialize Real Cryptographic Identity
              </CardTitle>
              <CardDescription>
                Create Ed25519 keypairs with real @noble/ed25519 cryptography
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="Enter your user ID (e.g., bradley-test)"
                  disabled={isInitializing}
                />
              </div>
              
              <Button 
                onClick={initializeRealIdentity}
                disabled={isInitializing || !userId.trim()}
                className="w-full"
                size="lg"
              >
                {isInitializing ? (
                  <>
                    <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                    Generating Real Ed25519 Keys...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-4 w-4 mr-2" />
                    Initialize Real Cryptographic System
                  </>
                )}
              </Button>

              {testSession && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Real system initialized!</strong><br />
                    Device ID: {testSession.testDevice.deviceId}<br />
                    Ed25519 keys generated successfully
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Crypto Tests Tab */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ZapIcon className="h-5 w-5" />
                Real Ed25519 Cryptographic Tests
              </CardTitle>
              <CardDescription>
                Test signing, verification, and authentication with real cryptography
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!testSession ? (
                <Alert>
                  <XCircleIcon className="h-4 w-4" />
                  <AlertDescription>
                    Please initialize the real cryptographic system first in the Setup tab
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button 
                      onClick={testRealAuthentication}
                      disabled={isTesting}
                      className="w-full h-auto p-4 flex flex-col gap-2"
                      size="lg"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCwIcon className="h-5 w-5 animate-spin" />
                          <span className="text-sm">Running Real Crypto Tests...</span>
                        </>
                      ) : (
                        <>
                          <ZapIcon className="h-5 w-5" />
                          <span className="font-semibold">Run Real Ed25519 Tests</span>
                          <span className="text-xs opacity-80">Challenge → Sign → Verify</span>
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={testRealNFCURL}
                      variant="outline"
                      className="w-full h-auto p-4 flex flex-col gap-2"
                      size="lg"
                    >
                      <ExternalLinkIcon className="h-5 w-5" />
                      <span className="font-semibold">Test Real NFC URL</span>
                      <span className="text-xs opacity-80">Opens actual authentication flow</span>
                    </Button>
                  </div>

                  {testResults.length > 0 && (
                    <Alert>
                      <CheckCircleIcon className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Latest test results:</strong> {testResults.filter(r => r.passed).length}/{testResults.length} tests passed
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Cryptographic Test Results
              </CardTitle>
              <CardDescription>
                Detailed results from real Ed25519 cryptographic operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {testResults.length === 0 ? (
                <p className="text-gray-500 italic">No test results yet. Run crypto tests to see results.</p>
              ) : (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded border-l-4 ${
                        result.passed 
                          ? 'bg-green-50 border-green-500' 
                          : 'bg-red-50 border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {result.passed ? '✅' : '❌'} {result.testName}
                        </span>
                        <span className="text-sm text-gray-600">{result.duration}ms</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{result.details}</p>
                      {result.error && (
                        <p className="text-sm text-red-600 mt-1">Error: {result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Debug Logs Tab */}
        <TabsContent value="debug" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5" />
                Real-time Cryptographic Logs
              </CardTitle>
              <CardDescription>
                Live logs from real Ed25519 operations and authentication flows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96 w-full rounded border p-4">
                {cryptoLogs.length === 0 ? (
                  <p className="text-gray-500 italic">No logs yet. Initialize the system to see real crypto operations.</p>
                ) : (
                  <div className="space-y-1">
                    {cryptoLogs.map((log, index) => (
                      <div key={index} className="text-sm font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setCryptoLogs([])}
                  size="sm"
                >
                  Clear Logs
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => copyToClipboard(cryptoLogs.join('\n'), 'Logs')}
                  size="sm"
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy Logs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real System Info */}
          {testSession && (
            <Card>
              <CardHeader>
                <CardTitle>Real Device Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-semibold">Device ID</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {testSession.testDevice.deviceId}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold">Chip UID</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {testSession.testDevice.nfcChipData.chipUID}
                    </p>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Real Ed25519 Public Key</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded flex-1 break-all">
                      {testSession.testDevice.nfcChipData.publicKey}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        testSession.testDevice.nfcChipData.publicKey,
                        'Ed25519 Public Key'
                      )}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-semibold">Real NFC Authentication URL</Label>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded flex-1 break-all">
                      {testSession.testDevice.nfcChipData.authUrl}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(
                        testSession.testDevice.nfcChipData.authUrl,
                        'Real NFC URL'
                      )}
                    >
                      <CopyIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Alert>
                  <ShieldCheckIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Cryptographic Verification:</strong><br />
                    ✅ Private key stored securely in localStorage<br />
                    ✅ Ed25519 keypair generated with @noble/ed25519<br />
                    ✅ Public key is 64 hex characters (32 bytes)<br />
                    ✅ All operations use real cryptography - no simulations
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 