'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  NfcIcon, 
  CopyIcon, 
  KeyIcon,
  QrCodeIcon,
  SmartphoneIcon,
  CheckIcon,
  RefreshCwIcon,
  InfoIcon,
  ExternalLinkIcon,
  ShieldCheckIcon,
  ZapIcon,
  TrendingDownIcon,
  GaugeIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  WifiIcon,
  RocketIcon
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { generateiPhoneNFCUrl } from '@/lib/url-shortener'

// --- Web NFC Imports ---
import { WebNFCDetector, NFCStatusIndicator, type NFCSupport, type NFCCompatibility } from '@/lib/nfc/web-nfc-detector'
import { WebNFCWriter, type NFCWriteResult } from '@/lib/nfc/web-nfc-writer'
import { NFCWriteDialog, useNFCWriteDialog } from '@/components/ui/nfc-write-dialog'

// --- Types ---
interface NTAG424Config {
  chipId: string
  chipUID: string
  did: string
  signature: string
  publicKey: string
  privateKey: string
  nfcUrl: string
  httpsUrl: string
  testUrl: string
  createdAt: string
  challengeMessage: string
  urlAnalysis: {
    bytes: number
    chars: number
    compatibility: Record<string, string>
    urlType: string
    isIntent: boolean
  }
  validated?: boolean
}

// --- Utility Functions ---
function generateRandomHex(bytes: number): string {
  const array = new Uint8Array(bytes)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function generateChipUID(): string {
  // Generate realistic NTAG424 DNA UID (7 bytes)
  return [
    '04', // NXP manufacturer byte
    generateRandomHex(1),
    generateRandomHex(1), 
    generateRandomHex(1),
    generateRandomHex(1),
    generateRandomHex(1),
    generateRandomHex(1)
  ].join(':').toUpperCase()
}

// --- Real Ed25519 Cryptography Functions ---
async function generateRealEd25519KeyPair(chipUID: string): Promise<{ 
  privateKey: string, 
  publicKey: string, 
  signature: string,
  privateKeyBytes: Uint8Array,
  publicKeyBytes: Uint8Array,
  challengeMessage: string,
  did: string
}> {
  // Call the server to generate real crypto
  const response = await fetch('/api/crypto/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chipUID })
  })
  
  if (!response.ok) {
    throw new Error('Failed to generate cryptographic keys')
  }
  
  const data = await response.json()
  
  return {
    privateKey: data.privateKey,
    publicKey: data.publicKey,
    signature: data.signature,
    privateKeyBytes: new Uint8Array(data.privateKeyBytes),
    publicKeyBytes: new Uint8Array(data.publicKeyBytes),
    challengeMessage: data.challengeMessage,
    did: data.did
  }
}

// --- iPhone NFC URL Generation ---
function generateOptimizedNFCUrl(
  chipUID: string,
  signature: string,
  publicKey: string,
  did: string,
  baseUrl: string,
  chipType: string
): {
  nfcUrl: string
  urlAnalysis: { bytes: number; chars: number; compatibility: Record<string, string> }
  compressionLevel: string
} {
  return generateiPhoneNFCUrl(
    chipUID,
    signature,
    publicKey,
    did,
    baseUrl,
    chipType as 'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA'
  )
}

export default function ChipConfigPage() {
  const { toast } = useToast()
  
  // --- State Management ---
  const [configs, setConfigs] = useState<NTAG424Config[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [chipName, setChipName] = useState('')
  const [customBaseUrl, setCustomBaseUrl] = useState('https://kair-os.vercel.app')
  const [selectedChipType, setSelectedChipType] = useState<'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA'>('NTAG213')
  
  // --- Web NFC State Management ---
  const [nfcSupport, setNfcSupport] = useState<NFCSupport | null>(null)
  const [nfcCompatibility, setNfcCompatibility] = useState<NFCCompatibility | null>(null)
  const [isCheckingNFC, setIsCheckingNFC] = useState(false)
  const [nfcWriter, setNfcWriter] = useState<WebNFCWriter | null>(null)
  const writeDialog = useNFCWriteDialog()

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

  // --- Generate Android Chrome Intent URL ---
  const generateAndroidIntentUrl = useCallback((nfcUrl: string): string => {
    // Convert HTTPS URL to Chrome intent format for optimal Android experience
    const intentUrl = nfcUrl.replace('https://', '')
    return `intent://${intentUrl}#Intent;scheme=https;package=com.android.chrome;end`
  }, [])

  // --- Check Device Capabilities ---
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

  // --- Initialize Web NFC Writer (client-side only) ---
  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      setNfcWriter(new WebNFCWriter())
    }
  }, [])

  // --- Web NFC Detection on Mount ---
  useEffect(() => {
    const detectNFCCapabilities = async () => {
      setIsCheckingNFC(true)
      try {
        // Detect basic support capabilities
        const support = await WebNFCDetector.detectSupport()
        setNfcSupport(support)
        
        // Get detailed compatibility analysis
        const compatibility = await WebNFCDetector.checkCompatibility()
        setNfcCompatibility(compatibility)
        
        // If high reliability, show a subtle notification
        if (support.estimatedReliability === 'high') {
          toast({
            title: "🚀 Web NFC Detected!",
            description: "Direct NFC writing is available on your device",
          })
        }
      } catch (error) {
        console.warn('NFC detection failed:', error)
        // Silent fail - NFC detection shouldn't break the page
      } finally {
        setIsCheckingNFC(false)
      }
    }

    detectNFCCapabilities()
  }, [toast])

  // --- Web NFC Write Handler ---
  const handleWebNFCWrite = useCallback(async (config: NTAG424Config) => {
    if (!nfcWriter) {
      toast({
        title: "❌ Web NFC Not Available",
        description: "Web NFC writer is not initialized",
        variant: "destructive"
      })
      return
    }

    try {
      // Open the beautiful progress dialog
      writeDialog.openDialog()
      
      // Start the write operation with progress tracking
      const result = await nfcWriter.writeConfig(config, {
        timeout: 15000, // 15 second timeout for mobile UX
        onProgress: writeDialog.updateStatus
      })
      
      // Show the result in the dialog
      writeDialog.setWriteResult(result)
      
      // Update toast based on result
      if (result.success) {
        toast({
          title: "🎉 NFC Write Success!",
          description: `${config.chipId} written successfully - ${result.bytesWritten} bytes`,
        })
      } else {
        toast({
          title: "❌ NFC Write Failed",
          description: result.message,
          variant: "destructive"
        })
      }
      
    } catch (error: any) {
      const errorResult: NFCWriteResult = {
        success: false,
        message: error.message || 'Unknown error occurred',
        error: {
          code: 'UNEXPECTED_ERROR',
          details: error.message || 'An unexpected error occurred during NFC writing',
          suggestions: [
            'Try the copy-paste method as backup',
            'Refresh the page and try again',
            'Check that NFC is enabled in device settings'
          ]
        }
      }
      
      writeDialog.setWriteResult(errorResult)
      
      toast({
        title: "💥 Unexpected Error",
        description: "Web NFC write failed unexpectedly",
        variant: "destructive"
      })
    }
  }, [nfcWriter, writeDialog, toast])

  // --- Web NFC Retry Handler ---
  const handleNFCWriteRetry = useCallback(() => {
    // Find the last config that was being written
    const lastConfig = configs[0] // Assuming most recent is first
    if (lastConfig) {
      writeDialog.closeDialog()
      // Retry after a small delay to allow dialog to close
      setTimeout(() => handleWebNFCWrite(lastConfig), 100)
    }
  }, [configs, writeDialog, handleWebNFCWrite])

  // --- Web NFC Cancel Handler ---
  const handleNFCWriteCancel = useCallback(() => {
    if (nfcWriter) {
      nfcWriter.cancelWrite()
    }
    writeDialog.closeDialog()
    
    toast({
      title: "🛑 Write Cancelled",
      description: "NFC write operation was cancelled",
    })
  }, [nfcWriter, writeDialog, toast])

  // --- Smart URL Generation (Intent-first for Android) ---
  const generateSmartNFCUrl = useCallback((
    chipUID: string,
    signature: string,
    publicKey: string,
    did: string,
    baseUrl: string,
    chipType: string
  ) => {
    // Generate the optimized URL first
    const urlData = generateOptimizedNFCUrl(chipUID, signature, publicKey, did, baseUrl, chipType)
    
    // For Android Chrome users, use intent URL by default
    let finalUrl = urlData.nfcUrl
    let urlType = 'HTTPS (Universal)'
    
    if (deviceInfo.isAndroid && deviceInfo.isChrome) {
      finalUrl = generateAndroidIntentUrl(urlData.nfcUrl)
      urlType = 'Chrome Intent (Optimized)'
    } else if (deviceInfo.isAndroid && deviceInfo.canUseIntent) {
      finalUrl = generateAndroidIntentUrl(urlData.nfcUrl)
      urlType = 'Chrome Intent (Recommended)'
    }
    
    return {
      nfcUrl: finalUrl,
      httpsUrl: urlData.nfcUrl, // Keep original for fallback
      urlAnalysis: {
        ...urlData.urlAnalysis,
        urlType,
        isIntent: finalUrl.startsWith('intent://')
      },
      compressionLevel: urlData.compressionLevel
    }
  }, [deviceInfo, generateAndroidIntentUrl])

  // --- Generate New NTAG424 DNA Configuration ---
  const generateNTAG424Config = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      const chipId = chipName || `KAIROS_${generateRandomHex(4).toUpperCase()}`
      const chipUID = generateChipUID()
      
      const keyPair = await generateRealEd25519KeyPair(chipUID)
      const did = keyPair.did
      
      // Use the SMART URL generator that defaults to intent URLs for Android
      const urlResult = generateSmartNFCUrl(
        chipUID,
        keyPair.signature,
        keyPair.publicKey,
        did,
        customBaseUrl,
        selectedChipType
      )
      
      // Create full test URL for verification
      const testUrl = `${customBaseUrl}/nfc?did=${encodeURIComponent(did)}&signature=${keyPair.signature}&publicKey=${keyPair.publicKey}&uid=${chipUID}&challenge=${encodeURIComponent(keyPair.challengeMessage)}`
      
      const config: NTAG424Config = {
        chipId,
        chipUID,
        did,
        signature: keyPair.signature,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        nfcUrl: urlResult.nfcUrl,
        testUrl,
        createdAt: new Date().toISOString(),
        challengeMessage: keyPair.challengeMessage,
        urlAnalysis: urlResult.urlAnalysis,
        httpsUrl: urlResult.httpsUrl // Store fallback URL
      }
      
      setConfigs(prev => [config, ...prev])
      setChipName('')
      
      toast({
        title: `✅ Smart NFC URL Generated (${urlResult.compressionLevel})`,
        description: `${config.chipId} ready - ${urlResult.urlAnalysis.urlType} - ${urlResult.urlAnalysis.bytes} bytes`,
      })
      
    } catch (error) {
      console.error('❌ Configuration generation failed:', error)
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : "Unable to generate chip configuration",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [chipName, customBaseUrl, selectedChipType, generateSmartNFCUrl, toast])
  
  // --- Validate NFC URL Against Live API ---
  const validateNFCUrl = useCallback(async (config: NTAG424Config) => {
    try {
      toast({
        title: "🔍 Testing URL...",
        description: "Validating against live authentication API",
      })
      
      // Test the URL by calling our verification API
      const response = await fetch('/api/nfc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chipUID: config.chipUID,
          did: config.did,
          signature: config.signature,
          publicKey: config.publicKey,
          challenge: config.challengeMessage,
          deviceInfo: {
            platform: 'web',
            userAgent: navigator.userAgent
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.verified) {
        toast({
          title: "✅ URL Validation SUCCESS",
          description: "This URL will work on real NFC chips!",
        })
        
        // Update the config to mark it as validated
        setConfigs(prev => prev.map(c => 
          c.chipId === config.chipId 
            ? { ...c, validated: true }
            : c
        ))
        
      } else {
        toast({
          title: "❌ URL Validation FAILED",
          description: result.error || "URL may not work reliably",
          variant: "destructive"
        })
      }
      
    } catch (error) {
      toast({
        title: "💥 Validation Error",
        description: "Could not test URL - check network connection",
        variant: "destructive"
      })
    }
  }, [toast])

  // --- Test NFC URL ---
  const testNFCUrl = useCallback((url: string) => {
    window.open(url, '_blank')
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-her-orange-400 to-her-orange-500 rounded-xl blur-lg opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-primary rounded-xl">
                <NfcIcon className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary">
                NFC URL Generator
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-lg">
                Generate <span className="font-semibold text-primary">copy-paste URLs</span> for NFC programming apps
              </p>
            </div>
          </div>
          
          <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10">
            <NfcIcon className="h-4 w-4 text-primary" />
            <AlertDescription className="text-gray-800 dark:text-gray-200">
              <strong>🎯 Universal Workflow:</strong> Generate URL → Copy → Open NFC Tools app → Paste into "URL/URI" → Write to NFC tag. Works on iPhone, Android & other NFC programming tools!
            </AlertDescription>
          </Alert>

          {/* 🚀 Web NFC Status Indicator - Progressive Enhancement */}
          {nfcSupport && (
            <Alert className={`border ${
              nfcSupport.estimatedReliability === 'high' ? 'border-green-200 bg-green-50 dark:bg-green-900/20' :
              nfcSupport.estimatedReliability === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
              nfcSupport.estimatedReliability === 'low' ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/20' :
              'border-gray-200 bg-gray-50 dark:bg-gray-900/20'
            }`}>
              <div className="flex items-center gap-2">
                {isCheckingNFC ? (
                  <RefreshCwIcon className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="text-lg">
                    {NFCStatusIndicator.getStatusEmoji(nfcSupport.estimatedReliability)}
                  </span>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${NFCStatusIndicator.getStatusColor(nfcSupport.estimatedReliability)}`}>
                      {isCheckingNFC ? 'Checking Web NFC...' : NFCStatusIndicator.getStatusMessage(nfcSupport.estimatedReliability)}
                    </span>
                    {nfcSupport.estimatedReliability === 'high' && (
                      <Badge variant="outline" className="text-green-700 border-green-500 bg-green-100 dark:bg-green-900/20">
                        <RocketIcon className="h-3 w-3 mr-1" />
                        Enhanced
                      </Badge>
                    )}
                  </div>
                  {nfcSupport.estimatedReliability === 'high' && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {nfcCompatibility && nfcCompatibility.supported 
                        ? `✨ Direct NFC writing available ${nfcCompatibility.fallbackRequired ? '(with copy-paste backup)' : ''}`
                        : `�� ${nfcCompatibility && nfcCompatibility.reason} - Copy-paste method available`
                      }
                    </p>
                  )}
                </div>
                {nfcSupport.estimatedReliability === 'high' && (
                  <WifiIcon className="h-4 w-4 text-green-600 animate-pulse" />
                )}
              </div>
            </Alert>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Generator */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border border-border shadow-minimal bg-card">
              <CardHeader className="bg-muted/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <NfcIcon className="h-5 w-5 text-primary" />
                  NFC URL Generator
                </CardTitle>
                <CardDescription className="text-gray-700 dark:text-gray-300">
                  Create URLs optimized for NFC programming apps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="chipName" className="text-gray-800 dark:text-gray-300 font-medium">Chip Name (Optional)</Label>
                  <Input
                    id="chipName"
                    placeholder="e.g., KAIROS_CHIP_01"
                    value={chipName}
                    onChange={(e) => setChipName(e.target.value)}
                    className="text-gray-800 dark:text-gray-300 border-border focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chipType" className="text-gray-800 dark:text-gray-300 font-medium">NFC Chip Type</Label>
                  <select
                    id="chipType"
                    value={selectedChipType}
                    onChange={(e) => setSelectedChipType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md text-gray-800 dark:text-gray-300 bg-card focus:border-primary"
                  >
                    <option value="NTAG213">NTAG213 (137 bytes) - Ultra Cheap</option>
                    <option value="NTAG215">NTAG215 (492 bytes) - Standard</option>
                    <option value="NTAG216">NTAG216 (900 bytes) - Large</option>
                    <option value="NTAG424_DNA">NTAG424 DNA (256 bytes) - Secure</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-gray-800 dark:text-gray-300 font-medium">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://kair-os.vercel.app"
                    className="text-gray-800 dark:text-gray-300 border-border focus:border-primary"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    💡 Use your live domain: kair-os.vercel.app
                  </p>
                </div>
                
                <Button 
                  onClick={generateNTAG424Config}
                  disabled={isGenerating}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-minimal transition-all duration-200"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating URL...
                    </>
                  ) : (
                    <>
                      <SmartphoneIcon className="h-4 w-4 mr-2" />
                      Generate NFC URL
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Chip Specifications */}
            <Card className="border border-border shadow-minimal bg-card">
              <CardHeader className="bg-muted/10">
                <CardTitle className="text-primary flex items-center gap-2">
                  <KeyIcon className="h-5 w-5 text-primary" />
                  {selectedChipType} Specs
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 text-sm">
                  {(() => {
                    const chipSpecs = {
                      'NTAG213': { memory: 137, price: '$0.15', compression: 'Ultra' },
                      'NTAG215': { memory: 492, price: '$0.25', compression: 'Standard' },
                      'NTAG216': { memory: 900, price: '$0.35', compression: 'Full' },
                      'NTAG424_DNA': { memory: 256, price: '$1.50', compression: 'Standard' }
                    }
                    const spec = chipSpecs[selectedChipType]
                    const urlLength = customBaseUrl.length + 35 // Estimate
                    const utilizationPercent = Math.round((urlLength / spec.memory) * 100)
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Memory:</span>
                            <span className="font-mono text-primary">{spec.memory}B</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Price:</span>
                            <span className="font-mono text-primary">{spec.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Compression:</span>
                            <span className="font-mono text-primary">{spec.compression}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700 dark:text-gray-300">Est. Usage:</span>
                            <span className="font-mono text-primary">{utilizationPercent}%</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-700 dark:text-gray-300">URL Fit Analysis:</span>
                            <span className="text-xs font-mono">
                              ~{urlLength}/{spec.memory}B
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(utilizationPercent, 100)} 
                            className="h-2"
                          />
                          <div className="flex items-center gap-1 mt-1">
                            {utilizationPercent <= 70 ? (
                              <CheckCircleIcon className="h-3 w-3 text-primary" />
                            ) : utilizationPercent <= 90 ? (
                              <AlertTriangleIcon className="h-3 w-3 text-destructive" />
                            ) : (
                              <AlertTriangleIcon className="h-3 w-3 text-destructive" />
                            )}
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {utilizationPercent <= 70 ? 'Perfect fit for NFC programming' : 
                               utilizationPercent <= 90 ? 'Should work fine' : 'May need shorter URL'}
                            </span>
                          </div>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Generated Configurations */}
          <div className="lg:col-span-2">
            {configs.length === 0 ? (
              <Card className="border border-border shadow-minimal bg-card">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-lg opacity-50 animate-pulse"></div>
                    <div className="relative p-4 bg-primary rounded-full">
                      <NfcIcon className="h-16 w-16 text-primary-foreground" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    No NFC URLs Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
                    Generate your first URL optimized for NFC programming apps. Works with NFC Tools, TagWriter, and other apps!
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-500">
                    <CopyIcon className="h-4 w-4" />
                    <span>Simple copy-paste workflow</span>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {configs.map((config, index) => (
                  <Card key={index} className="border border-border shadow-minimal bg-card">
                    <CardHeader className="bg-muted/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg text-primary flex items-center gap-2">
                            {config.chipId}
                            {config.validated && (
                              <Badge variant="outline" className="text-green-700 border-green-500 bg-green-50">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="text-gray-700 dark:text-gray-300">
                            Created {new Date(config.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-primary border-primary/20 bg-primary/10">
                          {config.urlAnalysis.bytes} bytes
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Tabs defaultValue="url" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="url">📱 NFC URL</TabsTrigger>
                          <TabsTrigger value="instructions">📋 How to Use</TabsTrigger>
                          <TabsTrigger value="config">🔧 Details</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="url" className="space-y-4">
                          <div>
                            <Label className="text-sm text-gray-700 dark:text-gray-300 font-medium">Copy this URL into NFC programming apps</Label>
                            <div className="mt-2">
                              <Textarea 
                                value={config.nfcUrl}
                                readOnly
                                className="font-mono text-sm h-20 text-foreground bg-muted border-border"
                              />
                              <div className="flex gap-2 mt-3">
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-primary hover:bg-primary/90"
                                  onClick={() => copyToClipboard(config.nfcUrl, 'NFC URL')}
                                >
                                  <CopyIcon className="h-4 w-4 mr-2" />
                                  Copy for NFC Tools
                                </Button>

                                {/* HTTPS Fallback Button - For Non-Android or Issues */}
                                {config.httpsUrl && config.httpsUrl !== config.nfcUrl && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      copyToClipboard(config.httpsUrl, 'HTTPS Fallback URL')
                                      toast({
                                        title: "📋 HTTPS URL Copied!",
                                        description: "Universal fallback for all devices",
                                      })
                                    }}
                                    className="border-2 border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                  >
                                    <CopyIcon className="h-4 w-4 mr-2" />
                                    Copy HTTPS Fallback
                                  </Button>
                                )}

                                {/* Intent URL Info - Show when intent is being used */}
                                {config.urlAnalysis.isIntent && (
                                  <div className="text-xs text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border border-blue-200">
                                    🚀 Using Chrome Intent URL - optimized for Android
                                  </div>
                                )}

                                {/* 🚀 Web NFC Write Button - Progressive Enhancement */}
                                {nfcCompatibility?.supported && nfcSupport?.estimatedReliability && nfcSupport.estimatedReliability !== 'none' && (
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleWebNFCWrite(config)}
                                    className={`border-2 transition-all duration-200 ${
                                      nfcSupport.estimatedReliability === 'high' 
                                        ? 'border-green-500 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20' 
                                        : 'border-orange-500 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                                    }`}
                                  >
                                    <ZapIcon className="h-4 w-4 mr-2" />
                                    Write Directly
                                  </Button>
                                )}

                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => validateNFCUrl(config)}
                                  className={config.validated ? 'border-green-500 text-green-700' : ''}
                                >
                                  {config.validated ? (
                                    <>
                                      <CheckCircleIcon className="h-4 w-4 mr-2" />
                                      Verified
                                    </>
                                  ) : (
                                    <>
                                      <ShieldCheckIcon className="h-4 w-4 mr-2" />
                                      Test Auth
                                    </>
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => testNFCUrl(config.nfcUrl)}
                                >
                                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                                  Open
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm">
                            <h4 className="font-medium text-primary mb-2">📊 Compatibility Analysis:</h4>
                            <div className="grid grid-cols-2 gap-2 text-foreground text-xs">
                              {Object.entries(config.urlAnalysis.compatibility).map(([chip, status]) => (
                                <div key={chip} className="flex justify-between">
                                  <span>{chip}:</span>
                                  <span>{status}</span>
                                </div>
                              ))}
                            </div>

                            {/* 🚀 Web NFC Compatibility Status */}
                            {nfcSupport && (
                              <>
                                <div className="mt-3 pt-3 border-t border-border">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">
                                      {NFCStatusIndicator.getStatusEmoji(nfcSupport.estimatedReliability)}
                                    </span>
                                    <span className="font-medium text-foreground">Web NFC Status:</span>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between">
                                      <span>Browser:</span>
                                      <span className={nfcSupport.isSupportedBrowser ? 'text-green-600' : 'text-red-600'}>
                                        {nfcSupport.isSupportedBrowser ? '✅ Compatible' : '❌ Unsupported'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Platform:</span>
                                      <span className={nfcSupport.isSupportedPlatform ? 'text-green-600' : 'text-red-600'}>
                                        {nfcSupport.isSupportedPlatform ? '✅ Compatible' : '❌ Limited'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Direct Write:</span>
                                      <span className={nfcCompatibility?.supported ? 'text-green-600' : 'text-gray-600'}>
                                        {nfcCompatibility?.supported ? '✅ Available' : '📋 Copy-paste only'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Reliability:</span>
                                      <span className={NFCStatusIndicator.getStatusColor(nfcSupport.estimatedReliability)}>
                                        {nfcSupport.estimatedReliability === 'high' ? '🚀 Excellent' :
                                         nfcSupport.estimatedReliability === 'medium' ? '⚠️ Good' :
                                         nfcSupport.estimatedReliability === 'low' ? '🔧 Experimental' : '📋 Fallback'}
                                      </span>
                                    </div>
                                    {deviceInfo.canUseIntent && (
                                      <div className="flex justify-between">
                                        <span>Intent URLs:</span>
                                        <span className="text-blue-600">
                                          🚀 Available
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                              <strong>Total size:</strong> {config.urlAnalysis.bytes} bytes ({config.urlAnalysis.chars} characters)
                            </div>
                            <div className="mt-2 pt-2 border-t border-border text-xs text-muted-foreground">
                              ✅ <strong>Format:</strong> Uses ultra-compressed format with base64 encoding - optimized for all chip types
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="instructions" className="space-y-4">
                          {/* 🚀 Web NFC Instructions (when available) */}
                          {nfcCompatibility?.supported && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm space-y-3">
                              <div className="flex items-center gap-2">
                                <ZapIcon className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium text-foreground">🚀 Direct Web NFC Writing (Enhanced Method):</h4>
                              </div>
                              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Click the <strong>"Write Directly"</strong> button above</li>
                                <li>Grant NFC permission when prompted by your browser</li>
                                <li>Hold your NFC tag close to your device when instructed</li>
                                <li>Keep the tag steady until writing completes (a few seconds)</li>
                                <li>Test by tapping the tag - it should open the URL immediately</li>
                              </ol>
                              <div className="flex items-start gap-2 bg-white/50 dark:bg-gray-900/50 rounded p-2 text-xs">
                                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-blue-800 dark:text-blue-200">
                                    💡 Web NFC Tips:
                                  </p>
                                  <ul className="mt-1 space-y-0.5 text-blue-600 dark:text-blue-300">
                                    <li>• Works best on Chrome/Edge browsers with Android</li>
                                    <li>• Keep tag within 1-2cm of device during writing</li>
                                    <li>• If write fails, try the copy-paste method below</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 🚀 Android Chrome Intent Instructions */}
                          {deviceInfo.canUseIntent && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm space-y-3">
                              <div className="flex items-center gap-2">
                                <RocketIcon className="h-5 w-5 text-blue-600" />
                                <h4 className="font-medium text-foreground">🚀 Android Chrome Intent (Ultimate Method):</h4>
                              </div>
                              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Click the <strong>"Copy Intent"</strong> button above</li>
                                <li>Use the intent URL in your NFC programming app</li>
                                <li>When NFC tag is tapped, it will <strong>guarantee</strong> opening in Chrome</li>
                                <li>Better NFC support, faster authentication, app-like experience</li>
                              </ol>
                              <div className="flex items-start gap-2 bg-white/50 dark:bg-gray-900/50 rounded p-2 text-xs">
                                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-blue-800 dark:text-blue-200">
                                    🎯 Why Intent URLs are Better on Android:
                                  </p>
                                  <ul className="mt-1 space-y-0.5 text-blue-600 dark:text-blue-300">
                                    <li>• Bypasses browser selection dialog</li>
                                    <li>• Guaranteed Chrome compatibility for NFC auth</li>
                                    <li>• Faster tag → authentication workflow</li>
                                    <li>• More reliable than generic HTTPS URLs</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm space-y-3">
                            <h4 className="font-medium text-foreground">📱 Universal NFC Programming Steps (Copy-Paste Method):</h4>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                              <li>Copy the URL above using the "Copy" button</li>
                              <li>Download <strong>"NFC Tools"</strong> (free on iOS/Android)</li>
                              <li>Open your NFC app and tap <strong>"Write"</strong></li>
                              <li>Select <strong>"Add a record"</strong> → <strong>"URL/URI"</strong></li>
                              <li>Paste the copied URL into the text field</li>
                              <li>Tap <strong>"Write"</strong> and hold your NFC tag near your phone</li>
                              <li>Wait for the success sound/vibration</li>
                              <li>Test by tapping the tag - it should open the URL in your browser</li>
                            </ol>
                          </div>
                          
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm space-y-3">
                            <h4 className="font-medium text-foreground">💡 Universal NFC Tips:</h4>
                            <ul className="space-y-1 text-muted-foreground text-xs">
                              <li>• <strong>iPhone:</strong> NFC antenna is near the top back (camera area)</li>
                              <li>• <strong>Android:</strong> NFC antenna is usually in the center back</li>
                              <li>• <strong>Writing distance:</strong> Hold tag within 1-2cm of phone</li>
                              <li>• <strong>If write fails:</strong> Try "Erase tag" first, then write</li>
                              <li>• <strong>Alternative apps:</strong> TagWriter by NXP, Trigger, etc.</li>
                              <li>• <strong>Testing:</strong> Written tags work on any NFC-enabled phone</li>
                            </ul>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="config" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-gray-700 dark:text-gray-300">Chip UID</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input 
                                  value={config.chipUID} 
                                  readOnly 
                                  className="font-mono text-xs text-foreground"
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(config.chipUID, 'Chip UID')}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-xs text-gray-700 dark:text-gray-300">DID Identity</Label>
                              <div className="flex items-center gap-2 mt-1">
                                <Input 
                                  value={config.did} 
                                  readOnly 
                                  className="font-mono text-xs text-foreground"
                                />
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => copyToClipboard(config.did, 'DID')}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <Label className="text-sm text-gray-700 dark:text-gray-300">Full Test URL (for debugging)</Label>
                            <div className="mt-2">
                              <Textarea 
                                value={config.testUrl}
                                readOnly
                                className="font-mono text-xs h-24 text-foreground"
                              />
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="mt-2"
                                onClick={() => copyToClipboard(config.testUrl, 'Test URL')}
                              >
                                <CopyIcon className="h-3 w-3 mr-2" />
                                Copy Test URL
                              </Button>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 Beautiful Web NFC Write Dialog */}
      <NFCWriteDialog
        isOpen={writeDialog.isOpen}
        onClose={writeDialog.closeDialog}
        status={writeDialog.status}
        result={writeDialog.result}
        onRetry={handleNFCWriteRetry}
        onCancel={handleNFCWriteCancel}
        chipName={configs[0]?.chipId}
      />
    </div>
  )
} 