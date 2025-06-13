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
import { useToast } from '@/components/ui/use-toast'
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
async function generateDecentralizedNFCConfig(chipUID: string): Promise<{ 
  privateKey: string, 
  publicKey: string, 
  signature: string,
  privateKeyBytes: Uint8Array,
  publicKeyBytes: Uint8Array,
  challengeMessage: string,
  did: string,
  deviceId: string
}> {
  try {
    // Import the decentralized NFC functions
    const { 
      loadLocalIdentity, 
      initializeLocalIdentity,
      registerNewDevice
    } = await import('@/lib/crypto/decentralizedNFC')
    
    // Check if user has a local identity, create one if not
    let identity = loadLocalIdentity()
    if (!identity) {
      // Auto-create identity for chip config
      identity = initializeLocalIdentity('chip-config-user')
    }
    
    // Register a new device for this chip
    const { deviceId, nfcChipData } = registerNewDevice(
      `NFC Chip ${chipUID.substring(0, 8)}`, 
      "nfc-pocket-watch"
    )
    
    if (!nfcChipData) {
      throw new Error('Failed to generate NFC chip data')
    }
    
    // Reload identity to get the updated object with the new device
    identity = loadLocalIdentity()
    if (!identity || !identity.devices[deviceId]) {
      throw new Error('Failed to create device in local identity')
    }
    
    // Update the chip UID to match the provided one
    // Note: In real deployment, chipUID would be read from actual hardware
    identity.devices[deviceId].chipUID = chipUID
    localStorage.setItem('kairOS_identity', JSON.stringify(identity))
    
    // Convert public key to bytes
    const publicKeyBytes = new Uint8Array(
      nfcChipData.publicKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    )
    
    // Generate a challenge message
    const challengeMessage = `KairOS_NFC_Challenge_${chipUID}`
    
    // Create a signature for this specific challenge using decentralized auth
    const { DecentralizedNFCAuth } = await import('@/lib/crypto/decentralizedNFC')
    const { signature } = await DecentralizedNFCAuth.authenticateLocally(deviceId, challengeMessage)
    
    // Convert signature to bytes
    const signatureBytes = new Uint8Array(
      signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
    )
    
    // Generate a simple DID (for compatibility)
    const did = `did:key:z${nfcChipData.publicKey.substring(0, 32)}`
    
    // For security, we don't return the actual private key
    // Instead, we return a placeholder since the private key stays in localStorage
    const privateKeyPlaceholder = 'STORED_LOCALLY_IN_BROWSER_' + generateRandomHex(16)
    
    return {
      privateKey: privateKeyPlaceholder,
      publicKey: nfcChipData.publicKey,
      signature,
      privateKeyBytes: new Uint8Array(32), // Placeholder - real key stays local
      publicKeyBytes,
      challengeMessage,
      did,
      deviceId
    }
    
  } catch (error) {
    console.error('Failed to generate decentralized NFC config:', error)
    throw new Error(`Decentralized crypto generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// --- Decentralized NFC URL Generation ---
function generateDecentralizedNFCUrl(
  deviceId: string,
  chipUID: string,
  baseUrl: string
): {
  nfcUrl: string
  urlAnalysis: { bytes: number; chars: number; compatibility: Record<string, string> }
  compressionLevel: string
} {
  // Generate new decentralized format: /nfc?d=deviceId&c=chipUID
  const encodedChipUID = encodeURIComponent(chipUID)
  const nfcUrl = `${baseUrl}/nfc?d=${deviceId}&c=${encodedChipUID}`
  
  const bytes = new TextEncoder().encode(nfcUrl).length
  const chars = nfcUrl.length
  
  return {
    nfcUrl,
    urlAnalysis: {
      bytes,
      chars,
      compatibility: {
        'NTAG213': bytes <= 137 ? 'Perfect' : 'Too Large',
        'NTAG215': bytes <= 504 ? 'Perfect' : 'Too Large',
        'NTAG216': bytes <= 904 ? 'Perfect' : 'Too Large',
        'NTAG424_DNA': bytes <= 416 ? 'Perfect' : 'Too Large'
      }
    },
    compressionLevel: 'Decentralized (No Private Keys)'
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

// --- Enhanced URL Generation with Crypto-Safe Compression ---
function generateCryptoSafeNFCUrl(
  chipUID: string,
  signature: string,
  publicKey: string,
  did: string,
  baseUrl: string,
  chipType: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA'
): {
  nfcUrl: string
  urlAnalysis: { bytes: number; chars: number; compatibility: Record<string, string> }
  compressionLevel: string
  validation: { valid: boolean, errors: string[], warnings: string[] }
} {
  const validation = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  }

  // Chip memory constraints with conservative estimates for reliable NFC writing
  const chipLimits = {
    'NTAG213': 120,   // Conservative limit for ultra-small chips
    'NTAG215': 450,   // Conservative limit for medium chips  
    'NTAG216': 850,   // Conservative limit for large chips
    'NTAG424_DNA': 220 // Conservative limit for secure chips
  }

  const limit = chipLimits[chipType]
  let nfcUrl: string
  let compressionLevel: string

  // Always start with full format for maximum compatibility
  const fullUrl = `${baseUrl}/nfc?did=${encodeURIComponent(did)}&signature=${signature}&publicKey=${publicKey}&uid=${chipUID}`
  const fullBytes = new TextEncoder().encode(fullUrl).length

  if (fullBytes <= limit) {
    // Full format fits - use it for maximum reliability
    nfcUrl = fullUrl
    compressionLevel = 'full-parameters (crypto-safe)'
  } else if (chipType === 'NTAG213' || chipType === 'NTAG424_DNA') {
    // For smallest chips, we need maximum compression but must preserve crypto integrity
    // Use a crypto-safe compressed format that doesn't truncate essential data
    const compactUID = chipUID.replace(/:/g, '')
    
    // Only compress if signature and key are at minimum safe lengths
    if (signature.length >= 128 && publicKey.length >= 64) {
      // Use shortened parameter names but keep full crypto data
      nfcUrl = `${baseUrl}/nfc?c=${compactUID}&s=${signature}&p=${publicKey}`
      compressionLevel = 'compressed-safe (no truncation)'
    } else {
      validation.errors.push('Cryptographic parameters too short for safe compression')
      nfcUrl = fullUrl // Fallback to full format
      compressionLevel = 'full-parameters (fallback)'
    }
  } else {
    // For medium/large chips, use minimal compression
    const compactUID = chipUID.replace(/:/g, '')
    nfcUrl = `${baseUrl}/nfc?uid=${compactUID}&sig=${signature}&key=${publicKey}&did=${encodeURIComponent(did)}`
    compressionLevel = 'minimal-compression (crypto-safe)'
  }

  // Final validation
  const finalBytes = new TextEncoder().encode(nfcUrl).length
  if (finalBytes > limit) {
    validation.errors.push(`URL too long for ${chipType}: ${finalBytes} bytes > ${limit} limit`)
    validation.valid = false
  }

  // Validate that we haven't compromised crypto integrity
  if (signature.length < 128 || publicKey.length < 64) {
    validation.errors.push('Cryptographic parameters insufficient for secure authentication')
    validation.valid = false
  }

  const compatibility = {
    'NTAG213': finalBytes <= 120 ? '✅ Crypto-safe fit' : '❌ Too large',
    'NTAG215': finalBytes <= 450 ? '✅ Crypto-safe fit' : '❌ Too large',
    'NTAG216': finalBytes <= 850 ? '✅ Crypto-safe fit' : '❌ Too large',
    'NTAG424_DNA': finalBytes <= 220 ? '✅ Crypto-safe fit' : '❌ Too large'
  }

  return {
    nfcUrl,
    urlAnalysis: {
      bytes: finalBytes,
      chars: nfcUrl.length,
      compatibility
    },
    compressionLevel,
    validation
  }
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
    isIPhone: boolean
    isSafari: boolean
    canUseIntent: boolean
  }>({ isAndroid: false, isChrome: false, isIPhone: false, isSafari: false, canUseIntent: false })

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase()
    const isAndroid = userAgent.includes('android')
    const isChrome = userAgent.includes('chrome') && !userAgent.includes('edg')
    const isIPhone = userAgent.includes('iphone') || userAgent.includes('ipad')
    const isSafari = userAgent.includes('safari') && !userAgent.includes('chrome')
    const canUseIntent = isAndroid && typeof window !== 'undefined'
    
    setDeviceInfo({ isAndroid, isChrome, isIPhone, isSafari, canUseIntent })
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
    // Always generate regular HTTPS URLs for chips
    // Intent logic will be handled in-app when URL is opened
    const urlData = generateOptimizedNFCUrl(chipUID, signature, publicKey, did, baseUrl, chipType)
    
    return {
      nfcUrl: urlData.nfcUrl, // Always HTTPS URL
      urlAnalysis: {
        ...urlData.urlAnalysis,
        urlType: 'HTTPS (Universal)',
        isIntent: false // No intent URLs on chips
      },
      compressionLevel: urlData.compressionLevel
    }
  }, [])

  // --- Generate New NTAG424 DNA Configuration ---
  const generateNTAG424Config = useCallback(async () => {
    setIsGenerating(true)
    
    try {
      const chipId = chipName || `KAIROS_${generateRandomHex(4).toUpperCase()}`
      const chipUID = generateChipUID()
      
      // Step 1: Generate REAL cryptographic keypair with decentralized validation
      const keyPair = await generateDecentralizedNFCConfig(chipUID)
      const did = keyPair.did
      
      // Step 2: Validate cryptographic parameters
      if (!keyPair.signature || !keyPair.publicKey || !keyPair.challengeMessage || !keyPair.deviceId) {
        throw new Error('Incomplete cryptographic parameters generated')
      }
      
      // Step 3: Generate URLs with crypto-safe compression strategies
      let urlResult: {
        nfcUrl: string
        urlAnalysis: { bytes: number; chars: number; compatibility: Record<string, string> }
        compressionLevel: string
        validation?: { valid: boolean, errors: string[], warnings: string[] }
      }
      
      // Use new crypto-safe URL generation that preserves authentication integrity
      const cryptoSafeUrl = generateCryptoSafeNFCUrl(
        chipUID,
        keyPair.signature,
        keyPair.publicKey,
        did,
        customBaseUrl,
        selectedChipType
      )
      
      // Check if crypto-safe generation succeeded
      if (cryptoSafeUrl.validation.valid) {
        urlResult = cryptoSafeUrl
      } else {
        // Log validation errors for debugging
        console.warn('Crypto-safe URL generation failed:', cryptoSafeUrl.validation.errors)
        
        // For very small chips where crypto-safe compression fails,
        // fall back to decentralized format but warn about limitations
        if (selectedChipType === 'NTAG213' || selectedChipType === 'NTAG424_DNA') {
          const decentralizedUrl = generateDecentralizedNFCUrl(
            keyPair.deviceId,
            chipUID,
            customBaseUrl
          )
          
          urlResult = {
            ...decentralizedUrl,
            validation: {
              valid: false,
              errors: ['Using decentralized format due to space constraints'],
              warnings: ['This URL requires device registration and may not work on all devices']
            }
          }
        } else {
          // For larger chips, should not fail - use fallback
          urlResult = {
            nfcUrl: `${customBaseUrl}/nfc?error=generation_failed`,
            urlAnalysis: {
              bytes: 0,
              chars: 0,
              compatibility: {
                'NTAG213': '❌ Generation failed',
                'NTAG215': '❌ Generation failed',
                'NTAG216': '❌ Generation failed',
                'NTAG424_DNA': '❌ Generation failed'
              }
            },
            compressionLevel: 'error',
            validation: cryptoSafeUrl.validation
          }
        }
      }
      
      // Step 4: Create test URL for legacy compatibility
      const fullTestUrl = `${customBaseUrl}/nfc?did=${encodeURIComponent(did)}&signature=${keyPair.signature}&publicKey=${keyPair.publicKey}&uid=${chipUID}&challenge=${encodeURIComponent(keyPair.challengeMessage)}`
      
      // Step 5: Validate using local decentralized verification
      try {
        const { DecentralizedNFCAuth } = await import('@/lib/crypto/decentralizedNFC')
        
        // Test local verification
        const verified = await DecentralizedNFCAuth.verifyLocally(
          keyPair.signature,
          keyPair.challengeMessage,
          keyPair.publicKey
        )
        
        if (!verified) {
          throw new Error('Generated configuration failed local verification')
        }
        
      } catch (verifyError) {
        throw new Error(`Local verification failed: ${verifyError instanceof Error ? verifyError.message : 'Unknown error'}`)
      }
      
      const config: NTAG424Config = {
        chipId,
        chipUID,
        did,
        signature: keyPair.signature,
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        nfcUrl: urlResult.nfcUrl,
        testUrl: fullTestUrl,
        createdAt: new Date().toISOString(),
        challengeMessage: keyPair.challengeMessage,
        urlAnalysis: {
          ...urlResult.urlAnalysis,
          urlType: 'Decentralized HTTPS',
          isIntent: false
        },
        validated: true // Mark as pre-validated with local crypto
      }
      
      setConfigs(prev => [config, ...prev])
      setChipName('')
      
      toast({
        title: `✅ NFC Config Generated`,
        description: `${config.chipId} ready - ${urlResult.urlAnalysis.bytes} bytes - ${urlResult.compressionLevel === 'Decentralized (No Private Keys)' ? 'Decentralized format (requires local storage)' : 'Production-safe format (works anywhere)'}`,
      })
      
    } catch (error) {
      console.error('❌ Decentralized configuration generation failed:', error)
      toast({
        title: "❌ Generation Failed",
        description: error instanceof Error ? error.message : "Unable to generate decentralized chip configuration",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }, [chipName, customBaseUrl, selectedChipType, toast])
  
  // --- Test End-to-End Authentication Flow ---
  const testEndToEndAuthFlow = useCallback(async (config: NTAG424Config) => {
    try {
      toast({
        title: "🧪 Testing End-to-End Auth Flow",
        description: "Simulating complete NFC authentication...",
      })
      
      // Step 1: Test URL parameter parsing
      const url = new URL(config.nfcUrl, window.location.origin)
      const testParams = new URLSearchParams(url.search)
      
      // Step 2: Test compressed format reconstruction (if using compressed format)
      let reconstructedParams = {}
      if (testParams.has('u') && testParams.has('s') && testParams.has('k')) {
        // Ultra-compressed format
        const ultraUID = testParams.get('u')!
        const ultraSig = testParams.get('s')!
        const ultraKey = testParams.get('k')!
        
        // Test base64 decoding if applicable
        try {
          const decoded = atob(ultraSig.replace(/-/g, '+').replace(/_/g, '/'))
          const signature = Array.from(decoded).map(char => 
            char.charCodeAt(0).toString(16).padStart(2, '0')
          ).join('')
          
          const decodedKey = atob(ultraKey.replace(/-/g, '+').replace(/_/g, '/'))
          const publicKey = Array.from(decodedKey).map(char => 
            char.charCodeAt(0).toString(16).padStart(2, '0')
          ).join('')
          
          reconstructedParams = {
            chipUID: ultraUID.includes(':') ? ultraUID : `04:${ultraUID.match(/.{2}/g)?.join(':') || ultraUID}`,
            signature,
            publicKey,
            did: `did:key:z${publicKey.substring(0, 32)}`
          }
        } catch {
          // Fallback to hex padding
          reconstructedParams = {
            chipUID: ultraUID.includes(':') ? ultraUID : `04:${ultraUID.match(/.{2}/g)?.join(':') || ultraUID}`,
            signature: ultraSig.padEnd(128, '0'),
            publicKey: ultraKey.padEnd(64, '0'),
            did: `did:key:z${ultraKey.substring(0, 32)}`
          }
        }
      } else {
        // Full format or other compressed formats
        reconstructedParams = {
          chipUID: config.chipUID,
          signature: config.signature,
          publicKey: config.publicKey,
          did: config.did
        }
      }
      
      // Step 3: Test cryptographic verification
      const verifyResponse = await fetch('/api/nfc/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reconstructedParams,
          challenge: config.challengeMessage,
          deviceInfo: {
            platform: 'web',
            userAgent: navigator.userAgent
          }
        })
      })
      
      const verifyResult = await verifyResponse.json()
      
      if (!verifyResult.success || !verifyResult.verified) {
        throw new Error(`Authentication test failed: ${verifyResult.error || 'Unknown error'}`)
      }
      
      // Step 4: Test account creation/persistence
      const accountData = verifyResult.data
      
      if (!accountData || !accountData.did || !accountData.accountId) {
        throw new Error('Account creation failed during authentication test')
      }
      
      toast({
        title: "✅ End-to-End Test SUCCESS",
        description: `Complete flow verified: URL → Parse → Crypto → Account (${accountData.accountId})`,
      })
      
      return {
        success: true,
        results: {
          urlParsingSuccessful: true,
          cryptoVerificationSuccessful: true,
          accountCreationSuccessful: true,
          reconstructedParams,
          accountData
        }
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast({
        title: "❌ End-to-End Test FAILED",
        description: errorMessage,
        variant: "destructive"
      })
      
      return {
        success: false,
        error: errorMessage
      }
    }
  }, [toast])
  
  // --- Create Browser Testing URL ---
  const createBrowserTestUrl = useCallback((config: NTAG424Config) => {
    // Create a special test URL that bypasses NFC and simulates a chip tap
    const testUrl = `${window.location.origin}/nfc?${new URL(config.nfcUrl).searchParams.toString()}&test=browser_simulation&source=chip_config_test`
    window.open(testUrl, '_blank')
    
    toast({
      title: "🧪 Browser Test Opened",
      description: "Testing authentication flow in new tab (no NFC chip required)",
    })
  }, [toast])

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-xl blur-lg opacity-75 animate-pulse"></div>
              <div className="relative p-4 bg-primary rounded-xl">
                <NfcIcon className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-primary">
                NFC Chip Setup
              </h1>
              <p className="text-muted-foreground text-lg">
                Generate secure URLs for NFC chips
              </p>
            </div>
          </div>
          
          <Alert className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
            <NfcIcon className="h-4 w-4 text-primary" />
            <AlertDescription>
              <strong>Quick Workflow:</strong> Generate URL → Copy → Open NFC app → Paste → Write to chip
            </AlertDescription>
          </Alert>

          {/* Enhanced Web NFC Status */}
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
                    <p className="text-xs text-muted-foreground mt-1">
                      {nfcCompatibility && nfcCompatibility.supported 
                        ? `Direct NFC writing available ${nfcCompatibility.fallbackRequired ? '(with copy-paste backup)' : ''}`
                        : `Copy-paste method available`
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
                  Generator
                </CardTitle>
                <CardDescription>
                  Create NFC chip configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="chipName">Chip Name (Optional)</Label>
                  <Input
                    id="chipName"
                    placeholder="e.g., KAIROS_CHIP_01"
                    value={chipName}
                    onChange={(e) => setChipName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="chipType">NFC Chip Type</Label>
                  <select
                    id="chipType"
                    value={selectedChipType}
                    onChange={(e) => setSelectedChipType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-card"
                  >
                    <option value="NTAG213">NTAG213 (137 bytes)</option>
                    <option value="NTAG215">NTAG215 (492 bytes)</option>
                    <option value="NTAG216">NTAG216 (900 bytes)</option>
                    <option value="NTAG424_DNA">NTAG424 DNA (256 bytes)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://kair-os.vercel.app"
                  />
                </div>
                
                <Button 
                  onClick={generateNTAG424Config}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
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
                      'NTAG424_DNA': { memory: 256, price: '$1.50', compression: 'Secure' }
                    }
                    const spec = chipSpecs[selectedChipType]
                    const urlLength = customBaseUrl.length + 35 // Estimate
                    const utilizationPercent = Math.round((urlLength / spec.memory) * 100)
                    
                    return (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex justify-between">
                            <span>Memory:</span>
                            <span className="font-mono text-primary">{spec.memory}B</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Price:</span>
                            <span className="font-mono text-primary">{spec.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Type:</span>
                            <span className="font-mono text-primary">{spec.compression}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Usage:</span>
                            <span className="font-mono text-primary">{utilizationPercent}%</span>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span>URL Fit Analysis:</span>
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
                              <AlertTriangleIcon className="h-3 w-3 text-orange-500" />
                            ) : (
                              <AlertTriangleIcon className="h-3 w-3 text-destructive" />
                            )}
                            <span className="text-xs text-muted-foreground">
                              {utilizationPercent <= 70 ? 'Perfect fit' : 
                               utilizationPercent <= 90 ? 'Good fit' : 'Tight fit'}
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
                    Ready to Generate
                  </h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    Create your first NFC chip configuration
                  </p>
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
                            <Label className="text-sm font-medium">Copy this URL for NFC apps</Label>
                            <div className="mt-2">
                              <Textarea 
                                value={config.nfcUrl}
                                readOnly
                                className="font-mono text-sm h-20 bg-muted"
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
                                  onClick={() => testEndToEndAuthFlow(config)}
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
                                  onClick={() => createBrowserTestUrl(config)}
                                >
                                  <ExternalLinkIcon className="h-4 w-4 mr-2" />
                                  Open Test
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
                              ✅ <strong>Format:</strong> Optimized compression with base64 encoding
                            </div>
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="instructions" className="space-y-4">
                          {/* Enhanced Web NFC Instructions (when available) */}
                          {nfcCompatibility?.supported && (
                            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm space-y-3">
                              <div className="flex items-center gap-2">
                                <ZapIcon className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium">🚀 Direct Web NFC Writing:</h4>
                              </div>
                              <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                                <li>Click the <strong>"Write Directly"</strong> button above</li>
                                <li>Grant NFC permission when prompted</li>
                                <li>Hold your NFC chip close to your device</li>
                                <li>Keep steady until writing completes</li>
                                <li>Test by tapping the chip</li>
                              </ol>
                              <div className="flex items-start gap-2 bg-white/50 dark:bg-gray-900/50 rounded p-2 text-xs">
                                <InfoIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-blue-800 dark:text-blue-200">
                                    💡 Web NFC Tips:
                                  </p>
                                  <ul className="mt-1 space-y-0.5 text-blue-600 dark:text-blue-300">
                                    <li>• Works best on Chrome/Edge with Android</li>
                                    <li>• Keep chip within 1-2cm during writing</li>
                                    <li>• If write fails, try copy-paste method below</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm space-y-3">
                            <h4 className="font-medium">📱 Universal NFC Programming:</h4>
                            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                              <li>Copy the URL above using the "Copy" button</li>
                              <li>Download <strong>"NFC Tools"</strong> (free on iOS/Android)</li>
                              <li>Open your NFC app and tap <strong>"Write"</strong></li>
                              <li>Select <strong>"Add a record"</strong> → <strong>"URL/URI"</strong></li>
                              <li>Paste the copied URL into the text field</li>
                              <li>Tap <strong>"Write"</strong> and hold your NFC chip near your phone</li>
                              <li>Wait for the success sound/vibration</li>
                              <li>Test by tapping the chip - it should open the URL</li>
                            </ol>
                            <div className="mt-3 pt-3 border-t border-primary/20">
                              {deviceInfo.isIPhone ? (
                                <p className="text-xs text-muted-foreground">
                                  <strong>iPhone:</strong> NFC authentication works perfectly in Safari when you tap programmed chips. Writing requires NFC Tools app.
                                </p>
                              ) : deviceInfo.isAndroid ? (
                                <p className="text-xs text-muted-foreground">
                                  <strong>Android:</strong> App will suggest Chrome for optimal NFC authentication when you tap the chip.
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  <strong>All platforms:</strong> NFC authentication works on any modern browser with programmed chips.
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 text-sm space-y-3">
                            <h4 className="font-medium">💡 Pro Tips:</h4>
                            <ul className="space-y-1 text-muted-foreground text-xs">
                              <li>• <strong>iPhone:</strong> NFC antenna is near the top back (camera area)</li>
                              <li>• <strong>Android:</strong> NFC antenna is usually in center back</li>
                              <li>• <strong>Writing distance:</strong> Hold chip within 1-2cm of phone</li>
                              <li>• <strong>If write fails:</strong> Try "Erase tag" first, then write</li>
                              <li>• <strong>Alternative apps:</strong> TagWriter by NXP, Trigger, etc.</li>
                              <li>• <strong>Testing:</strong> Written chips work on any NFC-enabled phone</li>
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