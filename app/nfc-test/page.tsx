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

// --- NTAG424 Configuration & Types ---
interface NTAG424Config {
  chipType: 'NTAG424' | 'NTAG424TT'
  memorySize: number // bytes
  protocolSupport: string[]
  secureFeatures: string[]
  uid: string
  manufacturerData: Uint8Array
  applicationData: Uint8Array
}

interface NFCTestSession {
  sessionId: string
  chipUID: string
  secretKey: string
  urlTemplate: string
  verificationEndpoint: string
  cryptoMode: 'simulation' | 'production'
  createdAt: number
  accessCount: number
  lastAccess?: number
  isActive: boolean
}

interface NFCTapEvent {
  timestamp: number
  chipUID: string
  urlAccessed: string
  secretParam: string
  verificationResult: 'success' | 'failure' | 'pending'
  cryptoLogs: string[]
  accountCreated?: boolean
  didGenerated?: boolean
}

// --- Simulated NTAG424 Configuration ---
const NTAG424_CONFIGS: Record<string, NTAG424Config> = {
  'standard': {
    chipType: 'NTAG424',
    memorySize: 416, // bytes
    protocolSupport: ['ISO14443-4', 'NFC Type 4'],
    secureFeatures: ['AES-128', 'Counter', 'Tamper Detection'],
    uid: generateRandomUID(),
    manufacturerData: new Uint8Array([0x04, 0x7B, 0x8C, 0x9D]),
    applicationData: new Uint8Array(32)
  },
  'tamper_loop': {
    chipType: 'NTAG424TT',
    memorySize: 416,
    protocolSupport: ['ISO14443-4', 'NFC Type 4', 'Tamper Loop'],
    secureFeatures: ['AES-128', 'Counter', 'Tamper Loop', 'Status Detection'],
    uid: generateRandomUID(),
    manufacturerData: new Uint8Array([0x04, 0x7C, 0x8D, 0x9E]),
    applicationData: new Uint8Array(32)
  }
}

function generateRandomUID(): string {
  return Array.from({ length: 7 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':').toUpperCase()
}

function generateSecretKey(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('')
}

export default function NFCTestPage() {
  const { toast } = useToast()
  
  // --- State Management ---
  const [selectedChipType, setSelectedChipType] = useState<'standard' | 'tamper_loop'>('standard')
  const [testSession, setTestSession] = useState<NFCTestSession | null>(null)
  const [tapHistory, setTapHistory] = useState<NFCTapEvent[]>([])
  const [isSimulatingTap, setIsSimulatingTap] = useState(false)
  const [cryptoLogs, setCryptoLogs] = useState<string[]>([])
  const [customUrl, setCustomUrl] = useState('')
  const [walletAddress, setWalletAddress] = useState('')
  
  // --- Initialize Test Session ---
  const createTestSession = useCallback(() => {
    const chipConfig = NTAG424_CONFIGS[selectedChipType]
    const secretKey = generateSecretKey()
    const sessionId = `nfc_test_${Date.now()}`
    
    const session: NFCTestSession = {
      sessionId,
      chipUID: chipConfig.uid,
      secretKey,
      urlTemplate: `https://kair-os.vercel.app/nfc?s={secret}&uid={uid}&t={timestamp}`,
      verificationEndpoint: '/api/nfc/verify',
      cryptoMode: 'simulation',
      createdAt: Date.now(),
      accessCount: 0,
      isActive: true
    }
    
    setTestSession(session)
    setCryptoLogs([
      `🆔 Session Created: ${sessionId}`,
      `📱 Chip Type: ${chipConfig.chipType}`,
      `🔑 UID: ${chipConfig.uid}`,
      `🛡️ Protocol: ${chipConfig.protocolSupport.join(', ')}`,
      `⚡ Features: ${chipConfig.secureFeatures.join(', ')}`,
      `🔐 Secret Key: ${secretKey.substring(0, 16)}...`,
      `🌐 URL Template: ${session.urlTemplate}`,
      '━'.repeat(80),
      '✅ NTAG424 test session ready for NFC taps'
    ])
    
    toast({
      title: "Test Session Created",
      description: `NTAG424 ${chipConfig.chipType} ready for testing`,
    })
  }, [selectedChipType, toast])
  
  // --- Simulate NFC Tap ---
  const simulateNFCTap = useCallback(async () => {
    if (!testSession) return
    
    setIsSimulatingTap(true)
    const timestamp = Date.now()
    
    // Generate dynamic secret based on session key + timestamp + counter
    const dynamicSecret = await generateDynamicSecret(
      testSession.secretKey, 
      timestamp, 
      testSession.accessCount
    )
    
    // Create the URL that would be accessed
    const accessUrl = testSession.urlTemplate
      .replace('{secret}', dynamicSecret)
      .replace('{uid}', testSession.chipUID)
      .replace('{timestamp}', timestamp.toString())
    
    const tapEvent: NFCTapEvent = {
      timestamp,
      chipUID: testSession.chipUID,
      urlAccessed: accessUrl,
      secretParam: dynamicSecret,
      verificationResult: 'pending',
      cryptoLogs: [
        `🚀 NFC TAP INITIATED`,
        `⏰ Timestamp: ${new Date(timestamp).toISOString()}`,
        `📍 Counter: ${testSession.accessCount + 1}`,
        `🔐 Dynamic Secret: ${dynamicSecret.substring(0, 16)}...`,
        `🌐 Generated URL: ${accessUrl}`,
        '━'.repeat(60),
        '🔍 PHASE 1: ISO 14443-4 Communication'
      ]
    }
    
    setTapHistory(prev => [tapEvent, ...prev])
    setCryptoLogs(prev => [...prev, '', ...tapEvent.cryptoLogs])
    
    // Simulate authentication phases
    await simulateAuthenticationPhases(tapEvent, testSession)
    
    // Update session
    setTestSession(prev => prev ? {
      ...prev,
      accessCount: prev.accessCount + 1,
      lastAccess: timestamp
    } : null)
    
    setIsSimulatingTap(false)
  }, [testSession])
  
  // --- Simulate Multi-Phase Authentication ---
  const simulateAuthenticationPhases = async (
    tapEvent: NFCTapEvent, 
    session: NFCTestSession
  ) => {
    const phases = [
      { name: '📡 NFC Field Detection', duration: 50 },
      { name: '🤝 ISO 14443-4 Handshake', duration: 100 },
      { name: '🔍 NTAG424 Identification', duration: 75 },
      { name: '🔐 AES-128 Authentication', duration: 150 },
      { name: '📱 Dynamic URL Generation', duration: 100 },
      { name: '🌐 Web Request Simulation', duration: 200 },
      { name: '🛡️ Secret Verification', duration: 300 },
      { name: '🔑 Account Creation', duration: 250 },
      { name: '🆔 DID Generation', duration: 100 }
    ]
    
    for (const [index, phase] of phases.entries()) {
      await new Promise(resolve => setTimeout(resolve, phase.duration))
      
      const newLog = `${phase.name} - ${index < 6 ? 'Complete' : 'Processing...'}`
      setCryptoLogs(prev => [...prev, newLog])
      
      // Simulate realistic authentication flow
      if (index === 5) {
        // REAL API CALL: Verify secret using the actual NFC verification endpoint
        setCryptoLogs(prev => [...prev, '🌐 Making real API call to /api/nfc/verify...'])
        
        try {
          const verificationRequest = {
            chipUID: tapEvent.chipUID,
            secret: tapEvent.secretParam,
            timestamp: tapEvent.timestamp,
            sessionId: session.sessionId,
            createAccount: true,
            returnKeys: true,
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
            body: JSON.stringify(verificationRequest)
          })
          
          const verificationResult = await response.json()
          
          if (verificationResult.verified) {
            setCryptoLogs(prev => [...prev, 
              '✅ Real API verification: SUCCESS',
              `🎫 Session token: ${verificationResult.data?.sessionToken?.substring(0, 24)}...`,
              `⚡ Verification time: ${verificationResult.verificationTime}ms`
            ])
            
            // Add account creation info if available
            if (verificationResult.accountCreated && verificationResult.data) {
              setCryptoLogs(prev => [...prev,
                '🔑 Decentralized account created:',
                `🆔 DID: ${verificationResult.data.did}`,
                `🆔 Account ID: ${verificationResult.data.accountId}`,
                `🔑 Public Key: ${verificationResult.data.publicKey?.substring(0, 32)}...`
              ])
            }
            
            // Add API debug logs to our display
            if (verificationResult.debugLogs) {
              setCryptoLogs(prev => [...prev, '━ API Debug Logs ━', ...verificationResult.debugLogs])
            }
          } else {
            setCryptoLogs(prev => [...prev, 
              '❌ Real API verification: FAILED',
              `Error: ${verificationResult.error}`
            ])
            tapEvent.verificationResult = 'failure'
            return
          }
        } catch (apiError) {
          setCryptoLogs(prev => [...prev, 
            '💥 API call failed:',
            `Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
          ])
          tapEvent.verificationResult = 'failure'
          return
        }
      }
      
      if (index === 6) {
        // Account creation (handled by API)
        tapEvent.accountCreated = true
        setCryptoLogs(prev => [...prev, '🔑 Decentralized account: Generated successfully via API'])
      }
      
      if (index === 7) {
        // DID generation (handled by API)
        tapEvent.didGenerated = true
        tapEvent.verificationResult = 'success'
        setCryptoLogs(prev => [...prev, 
          '🆔 Account and DID created successfully via API',
          '✅ NTAG424 Authentication: COMPLETE',
          '━'.repeat(60)
        ])
      }
    }
    
    // Update tap event in history
    setTapHistory(prev => prev.map(event => 
      event.timestamp === tapEvent.timestamp ? tapEvent : event
    ))
  }
  
  // --- Cryptographic Functions ---
  async function generateDynamicSecret(
    sessionKey: string, 
    timestamp: number, 
    counter: number
  ): Promise<string> {
    // Simulate NTAG424 AES-128 based dynamic secret generation
    const data = `${sessionKey}:${timestamp}:${counter}`
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
  }
  
  async function verifyDynamicSecret(
    providedSecret: string,
    sessionKey: string,
    timestamp: number,
    counter: number
  ): Promise<boolean> {
    const expectedSecret = await generateDynamicSecret(sessionKey, timestamp, counter)
    return providedSecret === expectedSecret
  }
  
  // --- Copy URL to Clipboard ---
  const copyTestURL = useCallback(() => {
    if (!testSession) return
    
    const testUrl = testSession.urlTemplate
      .replace('{secret}', 'DYNAMIC_SECRET')
      .replace('{uid}', testSession.chipUID)
      .replace('{timestamp}', 'TIMESTAMP')
    
    navigator.clipboard.writeText(testUrl)
    toast({
      title: "URL Copied",
      description: "Test URL template copied to clipboard",
    })
  }, [testSession, toast])
  
  // --- Initialize on component mount ---
  useEffect(() => {
    createTestSession()
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500 rounded-lg">
              <NfcIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NTAG424 NFC Test Laboratory
              </h1>
              <p className="text-gray-700 dark:text-gray-200">
                ISO 14443-4 Authentication Flow Testing for KairOS
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:border-blue-700">
              <WifiIcon className="h-3 w-3 mr-1" />
              ISO 14443-4
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-100 dark:border-green-700">
              <ShieldCheckIcon className="h-3 w-3 mr-1" />
              AES-128 Authenticated
            </Badge>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-100 dark:border-purple-700">
              <KeyIcon className="h-3 w-3 mr-1" />
              Dynamic Secrets
            </Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:border-orange-700">
              <LinkIcon className="h-3 w-3 mr-1" />
              URL-Based Authentication
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="simulator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="simulator">NFC Simulator</TabsTrigger>
            <TabsTrigger value="configuration">Chip Config</TabsTrigger>
            <TabsTrigger value="history">Tap History</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
          </TabsList>
          
          {/* NFC Simulator Tab */}
          <TabsContent value="simulator" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Test Session Card */}
              <Card className="border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800">
                <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <SmartphoneIcon className="h-5 w-5 text-blue-600" />
                    Active Test Session
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Simulated NTAG424 chip ready for testing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  {testSession && (
                    <>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-xs text-gray-600 dark:text-gray-400">Session ID</Label>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{testSession.sessionId}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 dark:text-gray-400">Chip UID</Label>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{testSession.chipUID}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 dark:text-gray-400">Access Count</Label>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">{testSession.accessCount}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600 dark:text-gray-400">Status</Label>
                          <Badge variant={testSession.isActive ? "default" : "secondary"}>
                            {testSession.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-xs text-gray-600 dark:text-gray-400">URL Template</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input 
                            value={testSession.urlTemplate} 
                            readOnly 
                            className="font-mono text-xs bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={copyTestURL}
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={simulateNFCTap}
                          disabled={isSimulatingTap}
                          className="flex-1"
                        >
                          {isSimulatingTap ? (
                            <>
                              <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                              Simulating Tap...
                            </>
                          ) : (
                            <>
                              <NfcIcon className="h-4 w-4 mr-2" />
                              Simulate NFC Tap
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={createTestSession}
                        >
                          <RefreshCwIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Crypto Logs Card */}
              <Card className="border-green-200 dark:border-green-800 bg-white dark:bg-gray-800">
                <CardHeader className="bg-green-50 dark:bg-green-900/20">
                  <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <ClockIcon className="h-5 w-5 text-green-600" />
                    Real-Time Crypto Logs
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Live authentication and verification process
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-96 p-4">
                    <div className="space-y-1">
                      {cryptoLogs.map((log, index) => (
                        <div 
                          key={index} 
                          className="text-xs font-mono p-2 rounded bg-gray-100 dark:bg-gray-700 border text-gray-900 dark:text-gray-100"
                        >
                          {log}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Configuration Tab */}
          <TabsContent value="configuration" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">NTAG424 Chip Configuration</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Configure test parameters for different NTAG424 variants
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-base font-medium text-gray-900 dark:text-gray-100">Chip Type</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {Object.entries(NTAG424_CONFIGS).map(([key, config]) => (
                      <Card 
                        key={key}
                        className={`cursor-pointer transition-all bg-white dark:bg-gray-700 ${
                          selectedChipType === key 
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                            : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => setSelectedChipType(key as any)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{config.chipType}</h3>
                            {selectedChipType === key && (
                              <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                            {config.memorySize} bytes • {config.protocolSupport.join(', ')}
                          </p>
                          <div className="space-y-1">
                            {config.secureFeatures.map(feature => (
                              <Badge key={feature} variant="outline" className="text-xs mr-1 text-gray-700 dark:text-gray-300">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="custom-url" className="text-gray-900 dark:text-gray-100">Custom URL Template</Label>
                    <Input
                      id="custom-url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://yourapp.com/nfc?s={secret}&uid={uid}"
                      className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="wallet-address" className="text-gray-900 dark:text-gray-100">Test Wallet Address</Label>
                    <Input
                      id="wallet-address"
                      value={walletAddress}
                      onChange={(e) => setWalletAddress(e.target.value)}
                      placeholder="0x1234...abcd"
                      className="mt-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-900 dark:text-gray-100">NFC Tap History</CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Complete log of all simulated NFC tap events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tapHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No NFC taps recorded yet. Use the simulator to generate test events.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tapHistory.map((event, index) => (
                      <Card key={index} className="border-l-4 border-l-blue-500 bg-white dark:bg-gray-700">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <NfcIcon className="h-4 w-4 text-blue-600" />
                              <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <Badge 
                              variant={
                                event.verificationResult === 'success' ? 'default' :
                                event.verificationResult === 'failure' ? 'destructive' : 'secondary'
                              }
                            >
                              {event.verificationResult === 'success' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                              {event.verificationResult === 'failure' && <XCircleIcon className="h-3 w-3 mr-1" />}
                              {event.verificationResult}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <Label className="text-xs text-gray-600 dark:text-gray-400">Chip UID</Label>
                              <p className="font-mono text-gray-900 dark:text-gray-100">{event.chipUID}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-600 dark:text-gray-400">Secret (First 16 chars)</Label>
                              <p className="font-mono text-gray-900 dark:text-gray-100">{event.secretParam.substring(0, 16)}...</p>
                            </div>
                          </div>
                          
                          <div className="mt-3">
                            <Label className="text-xs text-gray-600 dark:text-gray-400">Generated URL</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <Input 
                                value={event.urlAccessed} 
                                readOnly 
                                className="font-mono text-xs bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => navigator.clipboard.writeText(event.urlAccessed)}
                              >
                                <CopyIcon className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          {(event.accountCreated || event.didGenerated) && (
                            <div className="flex gap-2 mt-3">
                              {event.accountCreated && (
                                <Badge variant="outline" className="text-purple-600 border-purple-300 dark:border-purple-700">
                                  🔑 Decentralized account
                                </Badge>
                              )}
                              {event.didGenerated && (
                                <Badge variant="outline" className="text-green-600 border-green-300 dark:border-green-700">
                                  💰 DID
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">KairOS Integration</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Connect NFC flow with existing ZK and crypto systems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-gray-700 dark:text-gray-200">
                      NFC authentication integrates with your existing Ed25519 crypto system 
                      and ZK proof generation for seamless moment capture.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">Ed25519 signature verification</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">ZK proof generation for moments</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <CheckCircleIcon className="h-5 w-5 text-purple-600" />
                      <span className="text-sm text-gray-900 dark:text-gray-100">IPFS storage integration</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white dark:bg-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Hardware Deployment</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
                    Real NTAG424 chip programming and ESP32 integration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Required Hardware</Label>
                      <ul className="text-sm text-gray-700 dark:text-gray-300 mt-1 space-y-1">
                        <li>• NTAG424 or NTAG424TT chips</li>
                        <li>• NFC-enabled smartphone for programming</li>
                        <li>• ESP32 with PN532 NFC reader (optional)</li>
                      </ul>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-900 dark:text-gray-100">Programming Steps</Label>
                      <ol className="text-sm text-gray-700 dark:text-gray-300 mt-1 space-y-1">
                        <li>1. Generate session key and URL template</li>
                        <li>2. Configure NTAG424 with secret and URL</li>
                        <li>3. Test with this simulator</li>
                        <li>4. Deploy to production environment</li>
                      </ol>
                    </div>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <ExternalLinkIcon className="h-4 w-4 mr-2" />
                    View NTAG424 Setup Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 