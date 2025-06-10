'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  NfcIcon, 
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  UserIcon,
  AlertTriangleIcon,
  ArrowLeftIcon,
  CopyIcon,
  SmartphoneIcon,
  ZapIcon
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// --- Types ---
interface WebNFCSupport {
  isSupported: boolean
  canReadUID: boolean
  browserName: string
}

interface SimplifiedAccount {
  uid: string
  did: string
  created: number
  source: 'web-nfc' | 'url-params'
  address: string
  privateKey: string
  publicKey: string
}

// --- Web NFC API Helper Functions ---
const checkWebNFCSupport = (): WebNFCSupport => {
  // Check for basic Web NFC API availability
  const hasNDEF = typeof window !== 'undefined' && 'NDEFReader' in window
  
  // More permissive browser detection - support Chrome, Edge, Opera on any platform
  const userAgent = navigator.userAgent.toLowerCase()
  const isSupportedBrowser = (
    userAgent.includes('chrome') || 
    userAgent.includes('edg/') || 
    userAgent.includes('opera') ||
    userAgent.includes('chromium')
  ) && !userAgent.includes('ios') // Exclude iOS (uses Safari engine)
  
  // Support both Android and desktop for testing, but emphasize Android for production
  const isAndroid = userAgent.includes('android')
  const isDesktop = !userAgent.includes('mobile') && !userAgent.includes('tablet')
  
  return {
    isSupported: hasNDEF && isSupportedBrowser,
    canReadUID: hasNDEF && 'serialNumber' in (window as any).NDEFReadingEvent?.prototype,
    browserName: isSupportedBrowser 
      ? (isAndroid ? 'Chrome Android (Optimal)' : 'Chrome Desktop (Limited)')
      : 'Unsupported Browser'
  }
}

const generateDIDFromUID = async (uid: string): Promise<{ did: string; keyPair: CryptoKeyPair; address: string }> => {
  // Create deterministic seed from UID
  const encoder = new TextEncoder()
  const uidData = encoder.encode(`kairos:uid:${uid}`)
  
  // Generate deterministic seed using crypto.subtle
  const seedHash = await crypto.subtle.digest('SHA-256', uidData)
  const seed = new Uint8Array(seedHash).slice(0, 32) // 32 bytes for Ed25519
  
  // Generate Ed25519 keypair from seed (deterministic)
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'Ed25519',
      namedCurve: 'Ed25519'
    },
    true, // extractable
    ['sign', 'verify']
  )
  
  // Export public key to create DID
  const publicKeyArrayBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey)
  const publicKeyBytes = new Uint8Array(publicKeyArrayBuffer)
  
  // Create DID from public key (did:key format)
  const publicKeyHex = Array.from(publicKeyBytes).map(b => b.toString(16).padStart(2, '0')).join('')
  const did = `did:key:z${publicKeyHex.substring(0, 32)}`
  
  // Create Ethereum-style address for compatibility
  const addressHash = await crypto.subtle.digest('SHA-256', publicKeyBytes)
  const address = `0x${Array.from(new Uint8Array(addressHash)).slice(-20).map(b => b.toString(16).padStart(2, '0')).join('')}`
  
  return { did, keyPair, address }
}

const createAccountFromUID = async (uid: string): Promise<SimplifiedAccount> => {
  // Use the new privacy-first account manager
  const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
  
  try {
    const result = await NFCAccountManager.authenticateOrCreateAccount(uid)
    const { account, isNewAccount, isNewDevice } = result
    
    console.log(`🔐 Account status: ${isNewAccount ? 'New' : 'Existing'}, Device: ${isNewDevice ? 'New' : 'Familiar'}`)
    
    // Convert to SimplifiedAccount format for compatibility
    const simplifiedAccount: SimplifiedAccount = {
      uid: account.chipUID,
      did: account.did,
      address: account.accountId, // Use accountId as address for compatibility
      privateKey: account.privateKey,
      publicKey: account.publicKey,
      created: Date.parse(account.createdAt),
      source: 'web-nfc'
    }
    
    return simplifiedAccount
    
  } catch (error) {
    console.error('Privacy-first account creation failed, falling back to legacy:', error)
    
    // Fallback to legacy account creation
    const { did, keyPair, address } = await generateDIDFromUID(uid)
    
    const privateKeyArrayBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
    const publicKeyArrayBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey)
    
    const privateKeyHex = Array.from(new Uint8Array(privateKeyArrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    const publicKeyHex = Array.from(new Uint8Array(publicKeyArrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
    
    const account: SimplifiedAccount = {
      uid,
      did,
      address,
      privateKey: privateKeyHex,
      publicKey: publicKeyHex,
      created: Date.now(),
      source: 'web-nfc'
    }
    
    // Legacy storage
    localStorage.setItem(`kairos:account:${uid}`, JSON.stringify(account))
    localStorage.setItem('kairos:current-account', uid)
    
    return account
  }
}

// Main Web NFC Scanner Component
function WebNFCScanner() {
  const { toast } = useToast()
  const router = useRouter()
  const [isScanning, setIsScanning] = useState(false)
  const [webNFCSupport, setWebNFCSupport] = useState<WebNFCSupport | null>(null)
  const [discoveredAccount, setDiscoveredAccount] = useState<SimplifiedAccount | null>(null)

  useEffect(() => {
    const support = checkWebNFCSupport()
    setWebNFCSupport(support)
  }, [])

  const startWebNFCScan = async () => {
    if (!webNFCSupport?.isSupported) {
      toast({
        title: "⚠️ Web NFC Not Supported",
        description: "Web NFC is only available on Chrome for Android",
        variant: "destructive"
      })
      return
    }

    try {
      setIsScanning(true)
      
      // Request NFC permission
      const ndef = new (window as any).NDEFReader()
      
      // Set up reading event handler
      ndef.addEventListener('reading', async (event: any) => {
        const { serialNumber, message } = event
        
        if (serialNumber) {
          toast({
            title: "🏷️ NFC Chip Detected",
            description: `UID: ${serialNumber}`,
          })
          
          try {
            // Create account from UID
            const account = await createAccountFromUID(serialNumber)
            setDiscoveredAccount(account)
            
            toast({
              title: "✅ Account Created Successfully",
              description: `DID: ${account.did.substring(0, 20)}...`,
            })

            // Auto-redirect to profile after 2 seconds
            setTimeout(() => {
              // Use proper authentication flow instead of direct profile access
              router.push(`/nfc?chipUID=${account.uid}&deviceId=scanned-device-${Date.now()}&challenge=nfc-scan-auth`)
            }, 2000)
            
          } catch (error) {
            console.error('Account creation failed:', error)
            toast({
              title: "❌ Account Creation Failed",
              description: "Could not create account from NFC chip",
              variant: "destructive"
            })
          }
        }
      })

      ndef.addEventListener('readingerror', (event: any) => {
        console.error('NFC Reading Error:', event)
        toast({
          title: "❌ NFC Read Error",
          description: "Could not read the NFC chip",
          variant: "destructive"
        })
      })

      // Start scanning
      await ndef.scan()
      
      toast({
        title: "📡 NFC Scanning Active",
        description: "Hold an NFC chip near your device",
      })
      
    } catch (error) {
      console.error('Web NFC Error:', error)
      toast({
        title: "❌ NFC Permission Denied",
        description: "Please enable NFC in your browser settings",
        variant: "destructive"
      })
      setIsScanning(false)
    }
  }

  const stopNFCScan = () => {
    setIsScanning(false)
    // Note: NDEFReader doesn't have a stop method, it stops when component unmounts
  }

  if (!webNFCSupport) {
    return <div className="animate-pulse">Checking NFC support...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border border-border shadow-lg bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ZapIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-mono">Pendant Scanner</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Create accounts from unprogrammed MELD pendants
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* NFC Support Status */}
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
            <span className="text-sm font-medium">Browser Support:</span>
            <Badge variant={webNFCSupport.isSupported ? "default" : "destructive"}>
              {webNFCSupport.browserName}
            </Badge>
          </div>

          {/* Scan Controls */}
          {webNFCSupport.isSupported ? (
            <div className="space-y-3">
              <Button 
                onClick={isScanning ? stopNFCScan : startWebNFCScan}
                className="w-full"
                variant={isScanning ? "destructive" : "default"}
                size="lg"
              >
                {isScanning ? (
                  <>
                    <XCircleIcon className="h-4 w-4 mr-2" />
                    Stop Scanning
                  </>
                ) : (
                  <>
                    <NfcIcon className="h-4 w-4 mr-2" />
                    Start Scan
                  </>
                )}
              </Button>

              {isScanning && (
                <div className="text-center space-y-2">
                  <LoaderIcon className="h-6 w-6 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Hold a pendant near your device...
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Alert>
              <AlertTriangleIcon className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                Pendant scanning requires <strong>Chrome on Android</strong>. 
                On other platforms, use programmed pendants with the main gateway.
              </AlertDescription>
            </Alert>
          )}

          {/* Discovered Account */}
          {discoveredAccount && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-3">
              <h4 className="font-medium text-primary text-sm">✨ Identity Created</h4>
              <div className="space-y-1 text-xs font-mono">
                <div><strong>Pendant:</strong> {discoveredAccount.uid}</div>
                <div><strong>Identity:</strong> {discoveredAccount.did}</div>
                <div><strong>Address:</strong> {discoveredAccount.address}</div>
                <div><strong>Created:</strong> {new Date(discoveredAccount.created).toLocaleString()}</div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(discoveredAccount.did)
                    toast({ title: "📋 Identity Copied" })
                  }}
                  className="text-xs"
                >
                  <CopyIcon className="h-3 w-3 mr-1" />
                  Copy ID
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={() => router.push(`/nfc?chipUID=${discoveredAccount.uid}&deviceId=scanned-device-${Date.now()}&challenge=nfc-scan-auth`)}
                  className="text-xs"
                >
                  <UserIcon className="h-3 w-3 mr-1" />
                  Authenticate
                </Button>
              </div>

              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <CheckCircleIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-800 dark:text-green-200 text-xs">
                  <strong>Redirecting to profile...</strong> Account created locally on your device.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Implementation Notes */}
          <div className="text-xs text-muted-foreground space-y-1 pt-3 border-t">
            <p><strong>How it works:</strong></p>
            <ul className="space-y-1 ml-4">
              <li>• Reads unique ID from any NFC pendant</li>
              <li>• Generates deterministic identity from pendant ID</li>
              <li>• Creates local account for MELD ecosystem</li>
              <li>• Compatible with NTAG213/215/216 chips</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NFCScanPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto px-3 py-4 max-w-sm sm:max-w-md md:max-w-2xl space-y-4">
        
        {/* Header */}
        <div className="text-center space-y-2 pt-4">
          <div className="flex items-center justify-center gap-2">
            <div className="p-2 sm:p-3 rounded-full bg-primary/10 border border-primary/20">
              <SmartphoneIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight">Pendant Scanner</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Discover identities from raw pendants</p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/nfc')}
            className="text-muted-foreground hover:text-foreground text-xs"
          >
            <ArrowLeftIcon className="h-3 w-3 mr-1" />
            Back to Gateway
          </Button>
        </div>

        {/* Web NFC Scanner */}
        <WebNFCScanner />

        {/* Info Card */}
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="p-4 text-center space-y-3">
            <div className="mx-auto w-10 h-10 bg-muted rounded-full flex items-center justify-center">
              <NfcIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Want to program pendants?</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Create programmable pendants with embedded authentication
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/chip-config')} size="sm" className="text-xs">
              Configure Pendants
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center pt-4 pb-4">
          <p className="text-xs text-muted-foreground">
            Pendant Scanner • MELD Ecosystem
          </p>
        </div>
      </div>
    </div>
  )
} 