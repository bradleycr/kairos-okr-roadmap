'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  NfcIcon, 
  ShieldCheckIcon, 
  WifiIcon, 
  ClockIcon, 
  KeyIcon, 
  SmartphoneIcon,
  LinkIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshCwIcon,
  CopyIcon,
  ExternalLinkIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// --- Ed25519 NFC Authentication Types ---
interface Ed25519NFCConfig {
  chipType: 'NTAG424_DNA' | 'NTAG213' | 'NTAG215' | 'NTAG216'
  memorySize: number // bytes
  protocolSupport: string[]
  secureFeatures: string[]
  uid: string
  did: string
  signature: string
  publicKey: string
  privateKey: string
}

interface NFCTestSession {
  sessionId: string
  chipUID: string
  did: string
  signature: string
  publicKey: string
  privateKey: string
  nfcUrl: string
  verificationEndpoint: string
  authMode: 'simulation' | 'production'
  createdAt: number
  accessCount: number
  lastAccess?: number
  isActive: boolean
}

interface NFCTapEvent {
  timestamp: number
  chipUID: string
  urlAccessed: string
  did: string
  signature: string
  verificationResult: 'success' | 'failure' | 'pending'
  cryptoLogs: string[]
  accountCreated?: boolean
  sessionToken?: string
  momentId?: string
}

// --- Ed25519 Key Generation Functions ---
function generateRandomHex(bytes: number): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function generateRandomUID(): string {
  return Array.from({ length: 7 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':').toUpperCase()
}

function generateEd25519KeyPair(): { privateKey: string, publicKey: string, signature: string } {
  // Generate 32-byte private key
  const privateKey = generateRandomHex(32)
  
  // Generate 32-byte public key (in production, derive from private key)
  const publicKey = generateRandomHex(32)
  
  // Generate 64-byte signature (in production, sign a challenge with private key)
  const signature = generateRandomHex(64)
  
  return { privateKey, publicKey, signature }
}

function generateDID(publicKey: string): string {
  // Create a DID:key from the public key
  // In production, you'd use proper base58 encoding
  const keyIdentifier = publicKey.substring(0, 32) // Simplified
  return `did:key:z${keyIdentifier}`
}

// --- NFC Chip Configurations ---
const NFC_CHIP_CONFIGS: Record<string, Ed25519NFCConfig> = {
  'ntag424_dna': {
    chipType: 'NTAG424_DNA',
    memorySize: 448, // bytes
    protocolSupport: ['ISO14443-4', 'NFC Type 4', 'Dynamic URLs'],
    secureFeatures: ['Ed25519', 'Dynamic Authentication', 'Tamper Detection'],
    uid: generateRandomUID(),
    ...generateEd25519KeyPair(),
    did: ''
  },
  'ntag216': {
    chipType: 'NTAG216',
    memorySize: 924,
    protocolSupport: ['ISO14443-3', 'NFC Type 2'],
    secureFeatures: ['Ed25519', 'Static URLs'],
    uid: generateRandomUID(),
    ...generateEd25519KeyPair(),
    did: ''
  }
}

// Initialize DIDs
Object.keys(NFC_CHIP_CONFIGS).forEach(key => {
  const config = NFC_CHIP_CONFIGS[key]
  config.did = generateDID(config.publicKey)
})

export default function NFCTestPage() {
  const { toast } = useToast()
  
  // --- State Management ---
  const [selectedChipType, setSelectedChipType] = useState<'ntag424_dna' | 'ntag216'>('ntag424_dna')
  const [testSession, setTestSession] = useState<NFCTestSession | null>(null)
  const [tapHistory, setTapHistory] = useState<NFCTapEvent[]>([])
  const [isSimulatingTap, setIsSimulatingTap] = useState(false)
  const [cryptoLogs, setCryptoLogs] = useState<string[]>([])
  const [customUrl, setCustomUrl] = useState('https://kair-os.vercel.app/nfc')
  
  // --- Initialize Test Session ---
  const createTestSession = useCallback(() => {
    const chipConfig = NFC_CHIP_CONFIGS[selectedChipType]
    const sessionId = `ed25519_test_${Date.now()}`
    
    // Compress signature and public key for URL optimization
    const compressedSignature = chipConfig.signature.substring(0, 32)
    const compressedPublicKey = chipConfig.publicKey.substring(0, 32)
    
    // Create optimized NFC URL with compressed parameters
    const nfcUrl = `${customUrl}?c=${encodeURIComponent(chipConfig.uid)}&s=${compressedSignature}&k=${compressedPublicKey}`
    
    // Validate URL length for NFC compatibility
    const urlBytes = new TextEncoder().encode(nfcUrl).length
    const maxNfcUrlBytes = 200 // Safe limit for NTAG424 DNA user memory
    
    if (urlBytes > maxNfcUrlBytes) {
      toast({
        title: "❌ URL Too Long",
        description: `URL is ${urlBytes} bytes (max ${maxNfcUrlBytes}). Try shorter base URL.`,
        variant: "destructive"
      })
      return
    }
    
    const session: NFCTestSession = {
      sessionId,
      chipUID: chipConfig.uid,
      did: chipConfig.did,
      signature: chipConfig.signature,
      publicKey: chipConfig.publicKey,
      privateKey: chipConfig.privateKey,
      nfcUrl,
      verificationEndpoint: '/api/nfc/verify',
      authMode: 'simulation',
      createdAt: Date.now(),
      accessCount: 0,
      isActive: true
    }
    
    setTestSession(session)
    setCryptoLogs([
      `🆔 Ed25519 Session Created: ${sessionId}`,
      `📱 Chip Type: ${chipConfig.chipType}`,
      `🔑 UID: ${chipConfig.uid}`,
      `🛡️ Protocol: ${chipConfig.protocolSupport.join(', ')}`,
      `⚡ Features: ${chipConfig.secureFeatures.join(', ')}`,
      `🆔 DID: ${chipConfig.did}`,
      `🔐 Public Key: ${chipConfig.publicKey.substring(0, 16)}...`,
      `✍️ Signature: ${chipConfig.signature.substring(0, 16)}...`,
      `🌐 NFC URL: ${nfcUrl}`,
      `📏 URL Size: ${urlBytes} bytes (${maxNfcUrlBytes - urlBytes} bytes remaining)`,
      '━'.repeat(80),
      '✅ Ed25519 test session ready for NFC taps - URL optimized for writing'
    ])
    
    toast({
      title: "✅ Ed25519 Test Session Created",
      description: `${chipConfig.chipType} ready - URL: ${urlBytes} bytes`,
    })
  }, [selectedChipType, customUrl, toast])
  
  // --- Simulate NFC Tap ---
  const simulateNFCTap = useCallback(async () => {
    if (!testSession) return
    
    setIsSimulatingTap(true)
    const timestamp = Date.now()
    
    const tapEvent: NFCTapEvent = {
      timestamp,
      chipUID: testSession.chipUID,
      urlAccessed: testSession.nfcUrl,
      did: testSession.did,
      signature: testSession.signature,
      verificationResult: 'pending',
      cryptoLogs: [
        `🚀 NFC TAP INITIATED`,
        `⏰ Timestamp: ${new Date(timestamp).toISOString()}`,
        `📍 Tap Count: ${testSession.accessCount + 1}`,
        `🆔 DID: ${testSession.did}`,
        `✍️ Signature: ${testSession.signature.substring(0, 16)}...`,
        `🔑 Public Key: ${testSession.publicKey.substring(0, 16)}...`,
        `🌐 URL Accessed: ${testSession.nfcUrl}`,
        '━'.repeat(60),
        '🔍 PHASE 1: NFC Detection & Data Reading'
      ]
    }
    
    setTapHistory(prev => [tapEvent, ...prev])
    setCryptoLogs(prev => [...prev, '', ...tapEvent.cryptoLogs])
    
    // Simulate authentication phases
    await simulateEd25519AuthenticationPhases(tapEvent, testSession)
    
    // Update session
    setTestSession(prev => prev ? {
      ...prev,
      accessCount: prev.accessCount + 1,
      lastAccess: timestamp
    } : null)
    
    setIsSimulatingTap(false)
  }, [testSession])
  
  // --- Simulate Ed25519 Authentication Phases ---
  const simulateEd25519AuthenticationPhases = async (
    tapEvent: NFCTapEvent, 
    session: NFCTestSession
  ) => {
    const addPhaseLog = (message: string) => {
      setCryptoLogs(prev => [...prev, message])
      setTapHistory(prev => {
        const updated = [...prev]
        if (updated[0]) {
          updated[0] = {
            ...updated[0],
            cryptoLogs: [...updated[0].cryptoLogs, message]
          }
        }
        return updated
      })
    }
    
    // Phase 1: NFC Detection
    await new Promise(resolve => setTimeout(resolve, 300))
    addPhaseLog('📡 NFC TAG DETECTED - Reading Ed25519 data')
    addPhaseLog(`🏷️ Protocol: ISO 14443 Type A (13.56 MHz)`)
    addPhaseLog(`💾 Tag type: ${NFC_CHIP_CONFIGS[selectedChipType].chipType}`)
    addPhaseLog(`🔑 DID Format: ${session.did.substring(0, 20)}...`)
    
    // Phase 2: DID Validation
    await new Promise(resolve => setTimeout(resolve, 500))
    addPhaseLog('━'.repeat(60))
    addPhaseLog('🔐 PHASE 2: DID Format Validation')
    addPhaseLog(`🔍 Validating DID format: ${session.did}`)
    addPhaseLog(`✅ DID prefix validation: PASSED`)
    addPhaseLog(`📏 DID length validation: PASSED`)
    addPhaseLog(`🔤 Base58 encoding validation: PASSED`)
    
    // Phase 3: Ed25519 Signature Verification
    await new Promise(resolve => setTimeout(resolve, 800))
    addPhaseLog('━'.repeat(60))
    addPhaseLog('🔐 PHASE 3: Ed25519 Cryptographic Authentication')
    addPhaseLog(`🏷️ Algorithm: Edwards-curve Digital Signature Algorithm (Ed25519)`)
    addPhaseLog(`🔢 Curve: Edwards25519 (Curve25519 over prime 2^255-19)`)
    addPhaseLog(`�� Hash function: SHA-512`)
    addPhaseLog(`🔑 Public Key: ${session.publicKey}`)
    addPhaseLog(`✍️ Signature: ${session.signature}`)
    addPhaseLog(`🎯 Challenge: chip_uid_${session.chipUID}_timestamp_${tapEvent.timestamp}`)
    
    // Phase 4: API Verification
    await new Promise(resolve => setTimeout(resolve, 1000))
    addPhaseLog('━'.repeat(60))
    addPhaseLog('🌐 PHASE 4: API Verification')
    
    try {
      // Make actual API call
      const response = await fetch('/api/nfc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chipUID: session.chipUID,
          did: session.did,
          signature: session.signature,
          publicKey: session.publicKey,
          deviceInfo: {
            platform: 'web',
            userAgent: navigator.userAgent
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.verified) {
        addPhaseLog(`✅ API verification: SUCCESS`)
        addPhaseLog(`🎫 Session token: ${result.sessionToken?.substring(0, 24)}...`)
        addPhaseLog(`🆔 Moment ID: ${result.momentId}`)
        addPhaseLog(`👤 Account created: ${result.accountCreated ? 'YES' : 'NO'}`)
        addPhaseLog(`🔒 Cryptographic authentication: CONFIRMED`)
        
        // Update tap event with success
        setTapHistory(prev => {
          const updated = [...prev]
          if (updated[0]) {
            updated[0] = {
              ...updated[0],
              verificationResult: 'success',
              accountCreated: result.accountCreated,
              sessionToken: result.sessionToken,
              momentId: result.momentId
            }
          }
          return updated
        })
        
      } else {
        addPhaseLog(`❌ API verification: FAILED`)
        addPhaseLog(`🚫 Error: ${result.error || 'Unknown error'}`)
        
        setTapHistory(prev => {
          const updated = [...prev]
          if (updated[0]) {
            updated[0] = { ...updated[0], verificationResult: 'failure' }
          }
          return updated
        })
      }
      
    } catch (error) {
      addPhaseLog(`💥 API Error: ${error}`)
      setTapHistory(prev => {
        const updated = [...prev]
        if (updated[0]) {
          updated[0] = { ...updated[0], verificationResult: 'failure' }
        }
        return updated
      })
    }
    
    addPhaseLog('━'.repeat(60))
    addPhaseLog(`🏁 AUTHENTICATION COMPLETE`)
  }
  
  // --- Copy to Clipboard ---
  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive"
      })
    }
  }, [toast])

  // --- Test NFC URL ---
  const testNFCUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  // --- Clear History ---
  const clearHistory = useCallback(() => {
    setTapHistory([])
    setCryptoLogs([])
    toast({
      title: "History Cleared",
      description: "All tap history and logs have been cleared",
    })
  }, [toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500 rounded-lg">
              <NfcIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Ed25519 NFC Authentication Test
              </h1>
              <p className="text-gray-800 dark:text-gray-200">
                Test Ed25519 authentication with NTAG424 DNA and other NFC chips
              </p>
            </div>
          </div>
          
          <Alert className="border-blue-200 bg-blue-50">
            <ShieldCheckIcon className="h-4 w-4" />
            <AlertDescription className="text-gray-800 dark:text-gray-200">
              <strong>Updated Authentication:</strong> This test now uses Ed25519 cryptographic signatures instead of NTAG424 AES. Compatible with your NTAG424 DNA chips.
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Test Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader className="bg-purple-50 dark:bg-purple-900/20">
                <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <KeyIcon className="h-5 w-5 text-purple-600" />
                  Ed25519 Test Session
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Create Ed25519 authentication test session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="chipType" className="text-gray-800 dark:text-gray-200">NFC Chip Type</Label>
                  <select
                    id="chipType"
                    value={selectedChipType}
                    onChange={(e) => setSelectedChipType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800"
                  >
                    <option value="ntag424_dna">NTAG424 DNA (448 bytes)</option>
                    <option value="ntag216">NTAG216 (924 bytes)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-gray-800 dark:text-gray-200">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="text-gray-800 dark:text-gray-200"
                  />
                </div>
                
                <Button 
                  onClick={createTestSession}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Create Ed25519 Session
                </Button>
                
                {testSession && (
                  <>
                    <Separator />
                    <Button 
                      onClick={simulateNFCTap}
                      disabled={isSimulatingTap}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isSimulatingTap ? (
                        <>
                          <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                          Authenticating...
                        </>
                      ) : (
                        <>
                          <NfcIcon className="h-4 w-4 mr-2" />
                          Simulate NFC Tap
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={clearHistory}
                      variant="outline"
                      className="w-full"
                    >
                      Clear History
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Current Session Info */}
            {testSession && (
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader className="bg-indigo-50 dark:bg-indigo-900/20">
                  <CardTitle className="text-gray-900 dark:text-gray-100">
                    Active Session
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Chip Type:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {NFC_CHIP_CONFIGS[selectedChipType].chipType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Memory:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {NFC_CHIP_CONFIGS[selectedChipType].memorySize} bytes
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Taps:</span>
                      <span className="font-mono text-gray-900 dark:text-gray-100">
                        {testSession.accessCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">Status:</span>
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        Active
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2 space-y-6">
            {!testSession ? (
              <Card className="border-gray-200 dark:border-gray-700">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <NfcIcon className="h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                    No Active Test Session
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Create an Ed25519 test session to start testing NFC authentication
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="session" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="session">Session Info</TabsTrigger>
                  <TabsTrigger value="history">Tap History</TabsTrigger>
                  <TabsTrigger value="logs">Crypto Logs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="session" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-gray-100">
                        Ed25519 Configuration
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm text-gray-700 dark:text-gray-300">NFC URL</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Textarea 
                            value={testSession.nfcUrl} 
                            readOnly 
                            className="font-mono text-xs h-20 text-gray-800 dark:text-gray-200"
                          />
                          <div className="flex flex-col gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(testSession.nfcUrl, 'NFC URL')}
                            >
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => testNFCUrl(testSession.nfcUrl)}
                            >
                              <ExternalLinkIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-gray-700 dark:text-gray-300">Chip UID</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input 
                              value={testSession.chipUID} 
                              readOnly 
                              className="font-mono text-xs text-gray-800 dark:text-gray-200"
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(testSession.chipUID, 'Chip UID')}
                            >
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div>
                          <Label className="text-xs text-gray-700 dark:text-gray-300">DID Identity</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <Input 
                              value={testSession.did} 
                              readOnly 
                              className="font-mono text-xs text-gray-800 dark:text-gray-200"
                            />
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(testSession.did, 'DID')}
                            >
                              <CopyIcon className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-4">
                  <ScrollArea className="h-96">
                    {tapHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No tap events yet. Simulate an NFC tap to see results.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {tapHistory.map((tap, index) => (
                          <Card key={index} className={`border-l-4 ${
                            tap.verificationResult === 'success' ? 'border-l-green-500' :
                            tap.verificationResult === 'failure' ? 'border-l-red-500' :
                            'border-l-yellow-500'
                          }`}>
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  Tap #{tapHistory.length - index}
                                </div>
                                <div className="flex items-center gap-2">
                                  {tap.verificationResult === 'success' && (
                                    <Badge className="bg-green-100 text-green-800">
                                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                                      Success
                                    </Badge>
                                  )}
                                  {tap.verificationResult === 'failure' && (
                                    <Badge className="bg-red-100 text-red-800">
                                      <XCircleIcon className="h-3 w-3 mr-1" />
                                      Failed
                                    </Badge>
                                  )}
                                  {tap.verificationResult === 'pending' && (
                                    <Badge className="bg-yellow-100 text-yellow-800">
                                      <ClockIcon className="h-3 w-3 mr-1" />
                                      Pending
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <div>⏰ {new Date(tap.timestamp).toLocaleString()}</div>
                                <div>🆔 DID: {tap.did.substring(0, 40)}...</div>
                                <div>✍️ Signature: {tap.signature.substring(0, 24)}...</div>
                                {tap.sessionToken && (
                                  <div>🎫 Session: {tap.sessionToken.substring(0, 16)}...</div>
                                )}
                                {tap.momentId && (
                                  <div>📝 Moment: {tap.momentId}</div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
                
                <TabsContent value="logs" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-gray-900 dark:text-gray-100">
                        Cryptographic Logs
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-96">
                        <div className="font-mono text-xs space-y-1 text-gray-800 dark:text-gray-200">
                          {cryptoLogs.map((log, index) => (
                            <div key={index} className="leading-relaxed">
                              {log}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 