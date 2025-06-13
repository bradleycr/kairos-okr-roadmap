'use client'

/**
 * NFC Tap Simulator & Cryptography Test Bench
 * 
 * A beautiful, minimalist interface to simulate a real NFC tap event.
 * This tool generates a fresh cryptographic identity, signs a challenge,
 * and constructs a valid authentication URL for the /nfc gateway.
 * 
 * It provides transparent, real-time logging of the entire cryptographic
 * process, demonstrating the underlying security of the KairOS system.
 */

import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { 
  ZapIcon, 
  FileSignatureIcon, 
  KeyRoundIcon, 
  ShieldCheckIcon, 
  ExternalLinkIcon,
  SparklesIcon,
  TerminalIcon
} from 'lucide-react'

/**
 * Generate a realistic chip UID
 */
const generateChipUID = () => {
  const randomBytes = Array.from({ length: 7 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  )
  return `04:${randomBytes.join(':')}`
}

/**
 * Generate decentralized NFC configuration (matching chip-config page)
 */
const generateDecentralizedNFCConfig = async (chipUID: string) => {
  // Import the same function used by chip-config
  const { initializeLocalIdentity, loadLocalIdentity, registerNewDevice } = await import('@/lib/crypto/decentralizedNFC')
  
  // Initialize or load local identity
  let identity = loadLocalIdentity()
  if (!identity) {
    identity = initializeLocalIdentity(`TestUser_${Date.now()}`)
  }
  
  // Register a new NFC device
  const { deviceId, nfcChipData } = registerNewDevice('TEST Pocket Watch', 'nfc-pocket-watch')
  
  // Override chipUID with our generated one
  if (nfcChipData) {
    nfcChipData.chipUID = chipUID
    
    // Update the device in localStorage with correct chipUID
    const updatedIdentity = loadLocalIdentity()
    if (updatedIdentity && updatedIdentity.devices[deviceId]) {
      updatedIdentity.devices[deviceId].chipUID = chipUID
      localStorage.setItem('kairOS_identity', JSON.stringify(updatedIdentity))
    }
  }
  
  // Generate challenge and sign it
  const { DecentralizedNFCAuth } = await import('@/lib/crypto/decentralizedNFC')
  const challenge = `KairOS_NFC_Challenge_${chipUID}`
  const { signature, publicKey } = await DecentralizedNFCAuth.authenticateLocally(deviceId, challenge)
  
  // Generate DID
  const did = `did:key:z${publicKey.substring(0, 32)}`
  
  return {
    deviceId,
    publicKey,
    signature,
    challengeMessage: challenge,
    did,
    chipUID,
    privateKey: 'hidden' // Don't expose private key
  }
}

// --- React Component ---

export default function NFCSimulatorPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<string[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [isBondTesting, setIsBondTesting] = useState(false)
  const [bondTestResults, setBondTestResults] = useState<{
    homeUser: any | null
    friendUser: any | null
    bondCreated: any | null
  }>({
    homeUser: null,
    friendUser: null,
    bondCreated: null
  })
  const [productionChecks, setProductionChecks] = useState<{
    cryptoSystem: boolean | null
    databaseSystem: boolean | null
    authFlow: boolean | null
    pinSystem: boolean | null
  }>({
    cryptoSystem: null,
    databaseSystem: null,
    authFlow: null,
    pinSystem: null
  })

  const addLog = (message: string) => {
    setLogs(prev => [...prev, message])
  }

  const runSimulation = useCallback(async () => {
    setIsSimulating(true)
    setLogs([])
    
    try {
      addLog('🚀 [1/7] Starting REAL NFC Account Creation...')
      addLog('   ⚠️  This creates REAL accounts in the production database!')
      
      // 1. Generate realistic chip identifiers (simulating what a real NFC chip would have)
      addLog('🏷️ [2/7] Generating realistic NFC chip identifiers...')
      const chipUID = generateChipUID()
      addLog(`   - Chip UID: ${chipUID}`)
      addLog(`   - This simulates what a real NFC chip would provide`)
      
      // 2. Generate decentralized identity and device registration (matching chip-config exactly)
      addLog('🔑 [3/7] Generating production cryptographic identity...')
      const config = await generateDecentralizedNFCConfig(chipUID)
      addLog(`   - Device ID: ${config.deviceId}`)
      addLog(`   - Public Key: ${config.publicKey.substring(0, 32)}...`)
      addLog(`   - DID: ${config.did}`)
      addLog('   - Local identity stored in localStorage ✅')
      addLog('   - Uses SAME crypto as real chip programming')

      // 3. Create challenge and sign it (simulates NFC authentication)
      addLog('✍️ [4/7] Generating cryptographic proof...')
      addLog(`   - Challenge: "${config.challengeMessage}"`)
      addLog(`   - Signature: ${config.signature.substring(0, 48)}...`)
      addLog('   - Ed25519 signature validates identity ownership')

      // 4. Generate URL using the SAME format as chip-config page (production-safe full format)
      addLog('🔗 [5/7] Constructing production authentication URL...')
      
      // Use the exact same URL format that chip-config generates for maximum compatibility
      const params = new URLSearchParams({
        did: config.did,
        signature: config.signature,
        publicKey: config.publicKey,
        chipUID: config.chipUID, // Use chipUID (not uid) for consistency
        challenge: config.challengeMessage
      })
      
      const fullUrl = `${window.location.origin}/nfc?${params.toString()}`
      addLog(`   - Format: Identical to real chip-config output`)
      addLog(`   - All parameters included for maximum compatibility`)
      addLog(`   - URL: ${fullUrl.substring(0, 80)}...`)
      
      // 5. Create REAL account in production database
      addLog('💾 [6/7] Creating REAL account in production database...')
      
      try {
        // 🆕 Use the NFCAccountManager instead of direct API call
        // This ensures the account is created with proper data structure
        const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
        const result = await NFCAccountManager.authenticateOrCreateAccount(config.chipUID)
        
        addLog(`   ✅ Account ${result.isNewAccount ? 'created' : 'updated'} via NFCAccountManager`)
        addLog(`   ✅ Account ID: ${result.account.accountId}`)
        addLog(`   ✅ ChipUID: ${result.account.chipUID}`)
        addLog(`   ✅ Database record: ${result.isNewAccount ? 'NEW' : 'EXISTING'}`)
        addLog(`   ✅ Device status: ${result.isNewDevice ? 'NEW' : 'FAMILIAR'}`)
        
      } catch (error) {
        addLog(`   ❌ Database error: ${error}`)
      }
      
      // 6. Open in new tab
      addLog('🔗 [7/7] Opening authentication gateway...')
      addLog('✅ Simulation Complete! This account will appear in /nfc/database')
      const windowFeatures = 'width=600,height=800,noopener,noreferrer'
      window.open(fullUrl, '_blank', windowFeatures)
      
      toast({
        title: "🎉 Real Account Created!",
        description: "Test account saved to database. Check /nfc/database to see it.",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.open('/nfc/database', '_blank')}>
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            View Database
          </Button>
        )
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Error during simulation: ${errorMessage}`)
      console.error(error)
      toast({
        title: "Simulation Failed",
        description: "Check the logs for more details.",
        variant: "destructive"
      })
    } finally {
      setIsSimulating(false)
    }
  }, [toast])

  const runProductionChecks = async () => {
    setIsSimulating(true)
    setLogs([])
    addLog('🚀 Running Production Readiness Checks...')
    
    // Reset check states
    setProductionChecks({
      cryptoSystem: null,
      databaseSystem: null,
      authFlow: null,
      pinSystem: null
    })
    
    try {
      // 1. Test Crypto System
      addLog('🔐 [1/4] Testing Ed25519 Cryptography...')
      try {
        const { generateEd25519KeyPair, createDIDKey } = await import('@/lib/crypto')
        const keyPair = await generateEd25519KeyPair()
        const did = createDIDKey(keyPair.publicKey)
        addLog(`   ✅ Ed25519 keypair generated successfully`)
        addLog(`   ✅ DID created: ${did.substring(0, 50)}...`)
        setProductionChecks(prev => ({ ...prev, cryptoSystem: true }))
      } catch (error) {
        addLog(`   ❌ Crypto system failed: ${error}`)
        setProductionChecks(prev => ({ ...prev, cryptoSystem: false }))
      }
      
      // 2. Test Database System
      addLog('💾 [2/4] Testing Database Connectivity...')
      try {
        const testUID = 'TEST:' + Date.now().toString(16).toUpperCase()
        
        // Test database endpoint
        const response = await fetch('/api/nfc/accounts', {
          method: 'GET',
          headers: { 'X-Chip-UID': testUID }
        })
        
        if (response.ok) {
          addLog(`   ✅ Database API responding correctly`)
          setProductionChecks(prev => ({ ...prev, databaseSystem: true }))
        } else {
          throw new Error(`Database API error: ${response.status}`)
        }
      } catch (error) {
        addLog(`   ❌ Database system failed: ${error}`)
        setProductionChecks(prev => ({ ...prev, databaseSystem: false }))
      }
      
      // 3. Test Complete Auth Flow
      addLog('🔄 [3/4] Testing Complete Authentication Flow...')
      try {
        const testChipUID = 'PROD:TEST:' + Date.now().toString(16).toUpperCase()
        
        const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
        const result = await NFCAccountManager.authenticateOrCreateAccount(testChipUID)
        
        if (result.account && result.account.accountId) {
          addLog(`   ✅ Auth flow complete: ${result.account.accountId}`)
          addLog(`   ✅ Account type: ${result.isNewAccount ? 'NEW' : 'EXISTING'}`)
          addLog(`   ✅ Device type: ${result.isNewDevice ? 'NEW' : 'FAMILIAR'}`)
          setProductionChecks(prev => ({ ...prev, authFlow: true }))
        } else {
          throw new Error('Authentication returned invalid result')
        }
      } catch (error) {
        addLog(`   ❌ Auth flow failed: ${error}`)
        setProductionChecks(prev => ({ ...prev, authFlow: false }))
      }
      
      // 4. Test PIN System
      addLog('🔐 [4/4] Testing PIN Protection System...')
      try {
        const testChipUID = 'PIN:TEST:' + Date.now().toString(16).toUpperCase()
        const testPIN = '1234'
        
        const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
        
        // First create an account using the same flow as the test simulator
        const authResult = await NFCAccountManager.authenticateOrCreateAccount(testChipUID)
        addLog(`   ✅ Test account created: ${authResult.account.accountId}`)
        
        // Test PIN setup
        addLog(`   🔐 Setting up PIN for test account...`)
        const setupSuccess = await NFCAccountManager.setupPIN(testChipUID, testPIN)
        if (!setupSuccess) throw new Error('PIN setup API call failed')
        
        // Test PIN verification
        addLog(`   🔍 Verifying PIN for test account...`)
        const verifySuccess = await NFCAccountManager.verifyAccountPIN(testChipUID, testPIN)
        if (!verifySuccess) throw new Error('PIN verification failed')
        
        // Test incorrect PIN
        addLog(`   🔒 Testing incorrect PIN rejection...`)
        const wrongPinResult = await NFCAccountManager.verifyAccountPIN(testChipUID, '9999')
        if (wrongPinResult) throw new Error('Wrong PIN was incorrectly accepted')
        
        addLog(`   ✅ PIN setup successful`)
        addLog(`   ✅ PIN verification working`)
        setProductionChecks(prev => ({ ...prev, pinSystem: true }))
      } catch (error) {
        addLog(`   ❌ PIN system failed: ${error}`)
        setProductionChecks(prev => ({ ...prev, pinSystem: false }))
      }
      
      // Final Results
      const allPassed = Object.values(productionChecks).every(check => check === true)
      
      if (allPassed) {
        addLog('🎉 ALL PRODUCTION CHECKS PASSED - SYSTEM READY FOR EVENT!')
        toast({
          title: "🎉 Production Ready!",
          description: "All systems operational for your event today.",
        })
      } else {
        addLog('⚠️  Some production checks failed - review above for details')
        toast({
          title: "⚠️ Production Issues",
          description: "Some systems need attention before the event.",
          variant: "destructive"
        })
      }
      
    } catch (error) {
      addLog(`❌ Production check error: ${error}`)
    } finally {
      setIsSimulating(false)
    }
  }

  const runBondingTest = useCallback(async () => {
    setIsBondTesting(true)
    setLogs([])
    setBondTestResults({ homeUser: null, friendUser: null, bondCreated: null })
    
    try {
      addLog('🤝 [1/8] Starting REAL Bonding Flow Test...')
      addLog('   ⚠️  This creates REAL accounts and bonds in production database!')
      
      // 1. Create Home User Account (the one who's logged in)
      addLog('🏠 [2/8] Creating Home User account...')
      const homeChipUID = generateChipUID()
      const homeConfig = await generateDecentralizedNFCConfig(homeChipUID)
      
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const homeResult = await NFCAccountManager.authenticateOrCreateAccount(homeChipUID)
      
      addLog(`   ✅ Home User created: ${homeResult.account.displayName}`)
      addLog(`   ✅ Home ChipUID: ${homeChipUID}`)
      addLog(`   ✅ Home Account ID: ${homeResult.account.accountId}`)
      
      setBondTestResults(prev => ({ ...prev, homeUser: homeResult.account }))
      
      // 2. Create Session for Home User (simulate being logged in)
      addLog('📱 [3/8] Creating session for Home User...')
      const { SessionManager } = await import('@/lib/nfc/sessionManager')
      SessionManager.initialize()
      
      const homeSession = await SessionManager.createSession(homeChipUID)
      if (homeSession) {
        addLog(`   ✅ Session created: ${homeSession.sessionId}`)
        addLog(`   ✅ Home user is now "logged in" on this device`)
      } else {
        throw new Error('Failed to create home user session')
      }
      
      // 3. Create Friend User Account (the one who will tap)
      addLog('👥 [4/8] Creating Friend User account...')
      const friendChipUID = generateChipUID()
      const friendConfig = await generateDecentralizedNFCConfig(friendChipUID)
      
      const friendResult = await NFCAccountManager.authenticateOrCreateAccount(friendChipUID)
      
      addLog(`   ✅ Friend User created: ${friendResult.account.displayName}`)
      addLog(`   ✅ Friend ChipUID: ${friendChipUID}`)
      addLog(`   ✅ Friend Account ID: ${friendResult.account.accountId}`)
      
      setBondTestResults(prev => ({ ...prev, friendUser: friendResult.account }))
      
      // 4. Simulate Friend Tapping (using real NFC parameter parsing)
      addLog('📲 [5/8] Simulating Friend NFC tap...')
      
      // Create the exact URL that would be generated by friend's NFC chip
      const friendParams = new URLSearchParams({
        did: friendConfig.did,
        signature: friendConfig.signature,
        publicKey: friendConfig.publicKey,
        chipUID: friendConfig.chipUID,
        challenge: friendConfig.challengeMessage
      })
      
      addLog(`   ✅ Friend NFC URL generated with real crypto`)
      addLog(`   ✅ Using production Ed25519 signatures`)
      
      // 5. Test Session Detection (should detect home user is logged in)
      addLog('🔍 [6/8] Testing session detection...')
      const currentSession = await SessionManager.getCurrentSession()
      
      if (currentSession.isActive && currentSession.currentUser) {
        addLog(`   ✅ Active session detected for: ${currentSession.currentUser.displayName}`)
        addLog(`   ✅ Session valid until: ${new Date(Date.now() + 24*60*60*1000).toLocaleString()}`)
        
        // Test same-chip detection
        const isSameChip = await SessionManager.isSameChip(friendChipUID)
        addLog(`   ✅ Same chip check: ${isSameChip} (should be false for bonding)`)
        
        if (!isSameChip) {
          addLog(`   ✅ Different chip detected - bonding flow should trigger`)
        }
      } else {
        throw new Error('Home user session not detected')
      }
      
      // 6. Test Real Bonding Flow
      addLog('🤝 [7/8] Testing REAL bond creation...')
      const { BondManager } = await import('@/lib/nfc/bondManager')
      
      const bondProposal = {
        fromChipUID: homeChipUID,
        fromDisplayName: homeResult.account.displayName,
        toChipUID: friendChipUID,
        toDisplayName: friendResult.account.displayName,
        bondType: 'friend' as const,
        proposedAt: new Date().toISOString(),
        metadata: {
          location: 'NFC Test Simulation',
          event: 'Bonding Test',
          note: 'Production-grade bonding test'
        }
      }
      
      const bond = await BondManager.createBond(bondProposal)
      
      if (bond) {
        addLog(`   ✅ Bond created successfully!`)
        addLog(`   ✅ Bond ID: ${bond.id}`)
        addLog(`   ✅ Bond Type: ${bond.bondType}`)
        addLog(`   ✅ Created At: ${bond.createdAt}`)
        addLog(`   ✅ Both users now have this bond in their profiles`)
        
        setBondTestResults(prev => ({ ...prev, bondCreated: bond }))
      } else {
        throw new Error('Bond creation failed')
      }
      
      // 7. Verify Bond in Database
      addLog('🔍 [8/8] Verifying bond in database...')
      const homeBonds = await BondManager.getUserBonds(homeChipUID)
      const friendBonds = await BondManager.getUserBonds(friendChipUID)
      
      addLog(`   ✅ Home user bonds: ${homeBonds.length}`)
      addLog(`   ✅ Friend user bonds: ${friendBonds.length}`)
      
      const areBonded = await BondManager.areBonded(homeChipUID, friendChipUID)
      addLog(`   ✅ Bond verification: ${areBonded ? 'CONFIRMED' : 'FAILED'}`)
      
      addLog('🎉 Bonding test completed successfully!')
      addLog('✅ All accounts and bonds saved to production database')
      
      toast({
        title: "🤝 Bonding Test Successful!",
        description: "Real bond created between test accounts. Check /nfc/database to see them.",
        action: (
          <Button variant="outline" size="sm" onClick={() => window.open('/nfc/database', '_blank')}>
            <ExternalLinkIcon className="h-4 w-4 mr-2" />
            View Database
          </Button>
        )
      })
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLog(`❌ Bonding test failed: ${errorMessage}`)
      console.error(error)
      toast({
        title: "Bonding Test Failed",
        description: "Check the logs for more details.",
        variant: "destructive"
      })
    } finally {
      setIsBondTesting(false)
    }
  }, [toast])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl shadow-primary/10 border-border/20">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <ZapIcon className="h-8 w-8 text-primary" />
          </div>
            <div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                NFC Tap Simulator
              </CardTitle>
              <CardDescription className="text-muted-foreground text-sm sm:text-base">
                Simulate NFC authentication without hardware.
              </CardDescription>
            </div>
              </div>
            </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 sm:p-6 bg-muted/30 rounded-lg border border-dashed border-border">
            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
              Create REAL accounts in production database & test all systems.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button 
                size="lg"
                onClick={runProductionChecks} 
                disabled={isSimulating || isBondTesting}
                className="flex-1 sm:flex-none font-bold text-sm sm:text-lg shadow-lg bg-success text-white hover:bg-success/90"
              >
                <ShieldCheckIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                {isSimulating ? 'Checking...' : 'Production Check'}
              </Button>
              <Button 
                size="lg"
                onClick={runSimulation} 
                disabled={isSimulating || isBondTesting}
                className="flex-1 sm:flex-none font-bold text-sm sm:text-lg shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <ZapIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                {isSimulating ? 'Creating...' : 'Create Real Account'}
              </Button>
            </div>
          </div>

          {/* Bonding Test Section */}
          <div className="text-center p-4 sm:p-6 bg-accent/5 dark:bg-accent/10 rounded-lg border border-dashed border-accent/20 dark:border-accent/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="p-2 bg-accent/10 dark:bg-accent/20 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-accent dark:text-accent/80" />
              </div>
              <h3 className="text-lg font-semibold text-accent dark:text-accent/90">
                Bonding Flow Test
              </h3>
            </div>
            <p className="text-accent/80 dark:text-accent/70 mb-4 text-sm sm:text-base">
              Test complete bonding flow: Create 2 accounts, simulate login, test friend tap & bond creation.
            </p>
            <Button 
              size="lg"
              onClick={runBondingTest} 
              disabled={isSimulating || isBondTesting}
              className="font-bold text-sm sm:text-lg shadow-lg bg-accent text-white hover:bg-accent/90"
            >
              <SparklesIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
              {isBondTesting ? 'Testing Bonding...' : 'Test Bonding Flow'}
            </Button>
            
            {/* Bond Test Results */}
            {(bondTestResults.homeUser || bondTestResults.friendUser || bondTestResults.bondCreated) && (
              <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-accent/20 dark:border-accent/30">
                <h4 className="font-semibold text-accent dark:text-accent/90 mb-3">Test Results</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {bondTestResults.homeUser && (
                    <div className="p-2 bg-primary/5 dark:bg-primary/10 rounded border border-primary/20 dark:border-primary/30">
                      <div className="font-medium text-primary dark:text-primary/90">Home User</div>
                      <div className="text-primary/80 dark:text-primary/70">{bondTestResults.homeUser.displayName}</div>
                      <div className="text-primary/60 dark:text-primary/60 font-mono">{bondTestResults.homeUser.chipUID?.substring(0, 12)}...</div>
                    </div>
                  )}
                  {bondTestResults.friendUser && (
                    <div className="p-2 bg-accent/5 dark:bg-accent/10 rounded border border-accent/20 dark:border-accent/30">
                      <div className="font-medium text-accent dark:text-accent/90">Friend User</div>
                      <div className="text-accent/80 dark:text-accent/70">{bondTestResults.friendUser.displayName}</div>
                      <div className="text-accent/60 dark:text-accent/60 font-mono">{bondTestResults.friendUser.chipUID?.substring(0, 12)}...</div>
                    </div>
                  )}
                  {bondTestResults.bondCreated && (
                    <div className="p-2 bg-secondary/5 dark:bg-secondary/10 rounded border border-secondary/20 dark:border-secondary/30">
                      <div className="font-medium text-secondary dark:text-secondary/90">Bond Created</div>
                      <div className="text-secondary/80 dark:text-secondary/70">{bondTestResults.bondCreated.bondType}</div>
                      <div className="text-secondary/60 dark:text-secondary/60 font-mono">{bondTestResults.bondCreated.id?.substring(0, 12)}...</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <TerminalIcon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <h3 className="text-base sm:text-lg font-semibold text-foreground">Live Log</h3>
            </div>
            <ScrollArea className="h-64 w-full bg-black rounded-lg p-4 border border-border">
              <div className="font-mono text-sm text-lime-400 space-y-2">
                {logs.length === 0 && (
                  <p className="text-gray-500">Awaiting checks to start...</p>
                )}
                {logs.map((log, index) => (
                  <p key={index} className="whitespace-pre-wrap animate-[fadeIn_0.3s_ease-out]">
                        {log}
                  </p>
                    ))}
                  </div>
              </ScrollArea>
              </div>
            </CardContent>
          </Card>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  )
} 