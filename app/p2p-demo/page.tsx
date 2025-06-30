/**
 * 🌐 P2P IPFS Decentralized Demo
 * 
 * Live demonstration of Phase 3 architecture:
 * - Browser-to-browser P2P discovery
 * - IPFS public key storage
 * - No central server needed
 * - Real-time peer connectivity
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { 
  WifiIcon,
  UsersIcon,
  GlobeIcon,
  ShieldCheckIcon,
  HardDriveIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react'

// Import our P2P IPFS system
import { OptimalDecentralizedAuth } from '@/lib/crypto/optimalDecentralizedAuth'

export default function P2PIPFSDemo() {
  const { toast } = useToast()
  
  // P2P system state
  const [auth, setAuth] = useState<OptimalDecentralizedAuth | null>(null)
  const [networkStatus, setNetworkStatus] = useState<any>(null)
  const [isOnline, setIsOnline] = useState(false)
  const [peers, setPeers] = useState<number>(0)
  const [knownRecords, setKnownRecords] = useState<number>(0)
  
  // Demo state
  const [chipUID, setChipUID] = useState('')
  const [pin, setPin] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [lastRegistration, setLastRegistration] = useState<any>(null)
  const [lastAuthentication, setLastAuthentication] = useState<any>(null)
  
  // Initialize P2P system (disabled in dev for performance)
  useEffect(() => {
    const initializeP2P = async () => {
      try {
        // Enable P2P IPFS in development mode (user requested it back on)
        
        // Production: Create P2P IPFS authentication system
        const p2pAuth = new OptimalDecentralizedAuth(true) // Use IPFS by default
        setAuth(p2pAuth)
        setIsOnline(true)
        
        // Start monitoring network status
        const updateStatus = () => {
          const status = p2pAuth.getNetworkStatus()
          setNetworkStatus(status)
          setPeers(status.ipfs.connectedPeers)
          setKnownRecords(status.ipfs.knownRecords)
        }
        
        updateStatus()
        const interval = setInterval(updateStatus, 3000) // Update every 3 seconds
        
        toast({
          title: "🌐 P2P Network Online",
          description: "Connected to decentralized IPFS network"
        })
        
        return () => {
          clearInterval(interval)
          p2pAuth.destroy()
        }
      } catch (error) {
        toast({
          title: "❌ P2P Initialization Failed",
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: "destructive"
        })
      }
    }
    
    initializeP2P()
  }, [toast])
  
  // Generate random chip UID for demo
  const generateChipUID = () => {
    const uid = `04:${Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join(':').toUpperCase()}`
    setChipUID(uid)
  }
  
  // Register new identity in P2P network
  const registerInP2P = async () => {
    if (!auth || !chipUID) return
    
    setIsRegistering(true)
    try {
      const pendantData = await auth.initializePendant(chipUID)
      
      setLastRegistration({
        chipUID,
        deviceID: pendantData.deviceID,
        publicKey: pendantData.publicKey.slice(0, 16) + '...',
        timestamp: new Date().toLocaleTimeString()
      })
      
      toast({
        title: "✅ Registered in IPFS!",
        description: `Identity stored in decentralized network`
      })
      
    } catch (error) {
      toast({
        title: "❌ Registration Failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    }
    setIsRegistering(false)
  }
  
  // Authenticate using P2P network
  const authenticateWithP2P = async () => {
    if (!auth || !chipUID || !pin) return
    
    setIsAuthenticating(true)
    try {
      const result = await auth.authenticate(
        { chipUID, publicKey: '', deviceID: '', authURL: '', registryHash: '' },
        pin
      )
      
      if (result.authenticated) {
        setLastAuthentication({
          chipUID,
          did: result.did,
          sessionToken: result.sessionToken?.slice(0, 20) + '...',
          timestamp: new Date().toLocaleTimeString(),
          success: true
        })
        
        toast({
          title: "🎉 P2P Authentication Success!",
          description: "Verified using decentralized IPFS network"
        })
      } else {
        setLastAuthentication({
          chipUID,
          error: result.error,
          timestamp: new Date().toLocaleTimeString(),
          success: false
        })
        
        toast({
          title: "❌ Authentication Failed",
          description: result.error || 'Unknown error',
          variant: "destructive"
        })
      }
      
    } catch (error) {
      toast({
        title: "❌ Authentication Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      })
    }
    setIsAuthenticating(false)
  }
  
  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">P2P IPFS Decentralized Demo</h1>
        <p className="text-muted-foreground">
          Live demonstration of Phase 3 architecture - no central server needed!
        </p>
      </div>

      {/* Network Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GlobeIcon className="h-5 w-5" />
            P2P Network Status
            {isOnline ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircleIcon className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {networkStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <UsersIcon className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                <div className="text-xl font-bold text-blue-800">{peers}</div>
                <div className="text-sm text-blue-600">Connected Peers</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <HardDriveIcon className="h-6 w-6 mx-auto mb-1 text-green-600" />
                <div className="text-xl font-bold text-green-800">{knownRecords}</div>
                <div className="text-sm text-green-600">Known Records</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <WifiIcon className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                <div className="text-xl font-bold text-purple-800">{networkStatus.ipfs.ipfsGateways}</div>
                <div className="text-sm text-purple-600">IPFS Gateways</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                <div className="text-xl font-bold text-orange-800">{networkStatus.cache.cachedKeys}</div>
                <div className="text-sm text-orange-600">Cached Keys</div>
              </div>
            </div>
          )}
          
          {networkStatus && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm">
                <strong>Peer ID:</strong> {networkStatus.ipfs.peerId.slice(0, 16)}...
              </div>
              <div className="text-sm">
                <strong>Mode:</strong> {networkStatus.mode}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Registration */}
        <Card>
          <CardHeader>
            <CardTitle>1. Register in P2P Network</CardTitle>
            <CardDescription>
              Store your public key in the decentralized IPFS network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="ChipUID (e.g., 04:AB:CD:EF:12:34:56)"
                value={chipUID}
                onChange={(e) => setChipUID(e.target.value)}
              />
              <Button onClick={generateChipUID} variant="outline">
                Generate
              </Button>
            </div>
            
            <Button 
              onClick={registerInP2P}
              disabled={!chipUID || isRegistering || !isOnline}
              className="w-full"
            >
              {isRegistering ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Registering in IPFS...
                </>
              ) : (
                                  'Register in P2P Network'
              )}
            </Button>
            
            {lastRegistration && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-800">✅ Last Registration</div>
                <div className="text-xs text-green-700 mt-1">
                  <div>ChipUID: {lastRegistration.chipUID}</div>
                  <div>DeviceID: {lastRegistration.deviceID}</div>
                  <div>Time: {lastRegistration.timestamp}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>2. Authenticate via P2P</CardTitle>
            <CardDescription>
              Verify identity using the decentralized network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter PIN (any 4+ digits)"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
            
            <Button 
              onClick={authenticateWithP2P}
              disabled={!chipUID || !pin || pin.length < 4 || isAuthenticating || !isOnline}
              className="w-full"
            >
              {isAuthenticating ? (
                <>
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                '🔓 Authenticate via P2P'
              )}
            </Button>
            
            {lastAuthentication && (
              <div className={`p-3 rounded-lg border ${
                lastAuthentication.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className={`text-sm font-medium ${
                  lastAuthentication.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {lastAuthentication.success ? '✅ Authentication Success' : '❌ Authentication Failed'}
                </div>
                <div className={`text-xs mt-1 ${
                  lastAuthentication.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {lastAuthentication.success ? (
                    <>
                      <div>DID: {lastAuthentication.did}</div>
                      <div>Session: {lastAuthentication.sessionToken}</div>
                    </>
                  ) : (
                    <div>Error: {lastAuthentication.error}</div>
                  )}
                  <div>Time: {lastAuthentication.timestamp}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time P2P Features */}
      <Card className="mt-6">
        <CardHeader>
                          <CardTitle>P2P Features in Action</CardTitle>
          <CardDescription>
            Open multiple browser tabs to see real-time peer discovery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <WifiIcon className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Browser-to-Browser</h3>
              <p className="text-sm text-blue-600">Direct P2P communication without servers</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <GlobeIcon className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h3 className="font-semibold text-green-800">IPFS Storage</h3>
              <p className="text-sm text-green-600">Decentralized content-addressed storage</p>
            </div>
            
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <ShieldCheckIcon className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h3 className="font-semibold text-purple-800">Offline Verification</h3>
              <p className="text-sm text-purple-600">Works without internet after initial sync</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">🧪 Try This:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Open this page in multiple browser tabs</li>
              <li>Register different chipUIDs in each tab</li>
              <li>Watch peer count increase as tabs discover each other</li>
              <li>Try authenticating with a chipUID registered in another tab</li>
              <li>Close one tab and see how the network adapts</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🔧 Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
                              <h4 className="font-semibold">P2P Discovery</h4>
              <p className="text-sm text-muted-foreground">
                Uses BroadcastChannel API for browser-to-browser communication within the same domain
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold">📦 IPFS Integration</h4>
              <p className="text-sm text-muted-foreground">
                Content-addressed storage with multiple IPFS gateways for redundancy
              </p>
            </div>
            
            <div>
                              <h4 className="font-semibold">Cryptographic Security</h4>
              <p className="text-sm text-muted-foreground">
                Ed25519 signatures with deterministic key derivation from chipUID + PIN
              </p>
            </div>
            
            <div>
                              <h4 className="font-semibold">Performance</h4>
              <p className="text-sm text-muted-foreground">
                Local caching with fallback mechanisms for maximum reliability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 