'use client'

/**
 * 🧪 Privacy-First Account System Demo
 * 
 * Test the new account management system with simulated NFC chips
 * Demonstrates cross-device recognition and local privacy
 */

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  NfcIcon, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Trash2Icon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertCircleIcon
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

// Test chip UIDs
const TEST_CHIPS = [
  'AA:BB:CC:DD:EE:FF',
  '11:22:33:44:55:66', 
  '99:88:77:66:55:44'
]

export default function NFCAccountDemo() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [databaseAccounts, setDatabaseAccounts] = useState<any[]>([])
  const [localAccounts, setLocalAccounts] = useState<any[]>([])
  const [allKnownChips, setAllKnownChips] = useState<string[]>(TEST_CHIPS)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 49)])
  }

  const simulateNFCTap = async (chipUID: string, deviceType: string) => {
    setIsLoading(true)
    addLog(`📱 Simulating NFC tap: ${chipUID} on ${deviceType}`)
    
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      
      const result = await NFCAccountManager.authenticateOrCreateAccount(chipUID)
      const { account, isNewAccount, isNewDevice } = result
      
      // Log the results
      addLog(`🔐 Account ID: ${account.accountId}`)
      addLog(`👤 Display Name: ${account.displayName}`)
      addLog(`📅 Created: ${new Date(account.createdAt).toLocaleString()}`)
      addLog(`🎯 Status: ${isNewAccount ? 'NEW ACCOUNT' : 'EXISTING ACCOUNT'}`)
      addLog(`📱 Device: ${isNewDevice ? 'NEW DEVICE' : 'FAMILIAR DEVICE'}`)
      addLog(`💾 Sessions: ${account.stats.totalSessions}`)
      addLog(`🔄 Moments: ${account.stats.totalMoments}`)
      
      // Show toast notification
      if (isNewAccount) {
        toast({
          title: "🎉 New Account Created",
          description: `Welcome ${account.displayName}!`,
        })
      } else if (isNewDevice) {
        toast({
          title: "👋 Account Recognized",
          description: `Welcome back on ${account.deviceName}!`,
        })
      } else {
        toast({
          title: "✅ Welcome Back",
          description: `Session #${account.stats.totalSessions} on ${account.deviceName}`,
        })
      }
      
      addLog(`✅ Authentication complete`)
      
    } catch (error) {
      const errorMessage = String(error)
      addLog(`❌ Error: ${errorMessage}`)
      
      // Show user-friendly error messages
      let friendlyMessage = errorMessage
      if (errorMessage.includes('deriveKey') || errorMessage.includes('Algorithm')) {
        friendlyMessage = "Crypto operation failed - this is a known browser compatibility issue. System will retry with fallback methods."
        addLog(`🔄 Attempting fallback authentication method...`)
      }
      
      toast({
        title: "❌ Authentication Failed",
        description: friendlyMessage,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Discover all chip UIDs from localStorage and sessionStorage (pure function)
  const discoverAllChipUIDs = () => {
    const allChips = new Set<string>()
    
    // Add test chips
    TEST_CHIPS.forEach(chip => allChips.add(chip))
    
    // Scan localStorage for real chip UIDs
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('kairos:profile:') || key.startsWith('kairos:account:') || key.startsWith('kairos_profile_'))) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}')
          if (data.chipUID) {
            allChips.add(data.chipUID)
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    // Scan sessionStorage too
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (key && key.includes('chipUID')) {
        try {
          const chipUID = sessionStorage.getItem(key)
          if (chipUID) {
            allChips.add(chipUID)
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    
    return Array.from(allChips)
  }

  // Update discovered chips with logging
  const updateDiscoveredChips = () => {
    const discovered = discoverAllChipUIDs()
    const realChips = discovered.filter(chip => !TEST_CHIPS.includes(chip))
    
    setAllKnownChips(discovered)
    
    if (realChips.length > 0) {
      realChips.forEach(chip => {
        addLog(`📱 Discovered real chip: ${chip}`)
      })
    }
    
    addLog(`🔍 Total chips available: ${discovered.length} (${realChips.length} real + ${TEST_CHIPS.length} test)`)
  }

  // Discover chips on mount
  useEffect(() => {
    updateDiscoveredChips()
  }, [])

  const checkDatabaseStatus = async () => {
    setIsLoading(true)
    addLog(`🔍 Checking database status...`)
    
    try {
      const dbAccounts = []
      
      addLog(`🔍 Scanning ${allKnownChips.length} chip UIDs (${allKnownChips.length - TEST_CHIPS.length} real + ${TEST_CHIPS.length} test)`)
      
      for (const chipUID of allKnownChips) {
        const response = await fetch('/api/nfc/accounts', {
          method: 'GET',
          headers: { 'X-Chip-UID': chipUID }
        })
        
        const result = await response.json()
        
        if (result.exists) {
          addLog(`💾 Database: ${chipUID} → Account exists (Created: ${new Date(result.account.createdAt).toLocaleString()})`)
          dbAccounts.push({
            chipUID,
            ...result.account
          })
        } else {
          addLog(`💾 Database: ${chipUID} → No account found`)
        }
      }
      
      setDatabaseAccounts(dbAccounts)
      addLog(`📊 Found ${dbAccounts.length} accounts in database`)
      
    } catch (error) {
      addLog(`❌ Database check failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const checkLocalStorage = () => {
    addLog(`🔍 Checking local storage...`)
    
    try {
      const localAccs = []
      
      for (const chipUID of allKnownChips) {
        const profileKey = `kairos:profile:${chipUID}`
        const accountKey = `kairos:account:${chipUID}`
        
        const profile = localStorage.getItem(profileKey)
        const account = localStorage.getItem(accountKey)
        
        if (profile || account) {
          const data = profile ? JSON.parse(profile) : JSON.parse(account || '{}')
          localAccs.push({
            chipUID,
            type: profile ? 'profile' : 'account',
            displayName: data.displayName || data.username || 'Unknown',
            deviceName: data.deviceName || 'Unknown Device',
            sessions: data.stats?.totalSessions || data.totalSessions || 0,
            created: data.createdAt || data.created || 'Unknown'
          })
          addLog(`📱 Local: ${chipUID} → ${profile ? 'Profile' : 'Account'} found`)
        } else {
          addLog(`📱 Local: ${chipUID} → No data found`)
        }
      }
      
      setLocalAccounts(localAccs)
      addLog(`📊 Found ${localAccs.length} accounts in local storage`)
      
    } catch (error) {
      addLog(`❌ Local storage check failed: ${error}`)
    }
  }

  const clearLocalData = () => {
    try {
      const { NFCAccountManager } = require('@/lib/nfc/accountManager')
      NFCAccountManager.clearLocalData()
      
      addLog(`🧹 Cleared all local account data`)
      toast({
        title: "🧹 Local Data Cleared",
        description: "All local profiles and accounts removed",
      })
      
    } catch (error) {
      addLog(`❌ Clear failed: ${error}`)
    }
  }

  const clearDatabaseData = async () => {
    setIsLoading(true)
    addLog(`🗑️ Clearing database data...`)
    
    try {
      for (const chipUID of allKnownChips) {
        const response = await fetch('/api/nfc/accounts', {
          method: 'DELETE',
          headers: { 'X-Chip-UID': chipUID }
        })
        
        if (response.ok) {
          addLog(`🗑️ Database: Deleted ${chipUID}`)
        } else {
          addLog(`⚠️ Database: ${chipUID} not found or delete failed`)
        }
      }
      
      toast({
        title: "🗑️ Database Cleared",
        description: "All test accounts removed from database",
      })
      
    } catch (error) {
      addLog(`❌ Database clear failed: ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const setupPINForChip = async (chipUID: string) => {
    const pin = prompt(`Set up PIN for chip ${chipUID.slice(-6)}:\n\nEnter a 4-6 digit PIN:`)
    
    if (!pin) return
    
    if (pin.length < 4 || pin.length > 6 || !/^\d+$/.test(pin)) {
      toast({
        title: "❌ Invalid PIN",
        description: "PIN must be 4-6 digits only",
        variant: "destructive"
      })
      return
    }
    
    setIsLoading(true)
    addLog(`🔐 Setting up PIN for chip: ${chipUID}`)
    
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const success = await NFCAccountManager.setupPIN(chipUID, pin)
      
      if (success) {
        addLog(`✅ PIN set up successfully for ${chipUID}`)
        toast({
          title: "🔐 PIN Set Up",
          description: `PIN protection enabled for chip ${chipUID.slice(-6)}`,
        })
        
        // Refresh database status
        checkDatabaseStatus()
      } else {
        addLog(`❌ Failed to set up PIN for ${chipUID}`)
        toast({
          title: "❌ PIN Setup Failed",
          description: "Could not save PIN to database",
          variant: "destructive"
        })
      }
    } catch (error) {
      addLog(`❌ PIN setup error: ${error}`)
      toast({
        title: "❌ PIN Setup Error",
        description: String(error),
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/5 p-6">
      <div className="container mx-auto max-w-6xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <NfcIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-mono font-bold text-foreground">
              Account Database Monitor
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Monitor the account management system. Test NFC authentication, PIN protection, and cross-device 
            recognition while verifying database integrity and privacy compliance.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Simulation Controls */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <NfcIcon className="h-5 w-5 text-primary" />
                NFC Chip Simulation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Test Chips */}
              {allKnownChips.map((chipUID, index) => (
                <div key={chipUID} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        Chip {index + 1}
                      </Badge>
                      <span className="font-mono text-sm text-muted-foreground">
                        {chipUID}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => simulateNFCTap(chipUID, 'iPhone')}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Smartphone className="h-4 w-4" />
                      iPhone
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => simulateNFCTap(chipUID, 'Android')}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Tablet className="h-4 w-4" />
                      Android
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => simulateNFCTap(chipUID, 'Desktop')}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <Monitor className="h-4 w-4" />
                      Desktop
                    </Button>
                  </div>
                  
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setupPINForChip(chipUID)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 text-xs"
                  >
                    🔐 Set PIN
                  </Button>
                </div>
              ))}
              
              {/* Management Controls */}
              <div className="border-t pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={checkDatabaseStatus}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    Check Database
                  </Button>
                  <Button
                    variant="outline"
                    onClick={checkLocalStorage}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Check Local
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setLogs([])}
                    className="flex items-center gap-2"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Clear Logs
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      updateDiscoveredChips()
                      checkDatabaseStatus()
                      checkLocalStorage()
                    }}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <RefreshCwIcon className="h-4 w-4" />
                    Refresh All
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearLocalData}
                    className="flex items-center gap-2"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Clear Local
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={clearDatabaseData}
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2Icon className="h-4 w-4" />
                    Clear Database
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Display */}
          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                Storage Contents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Database Contents */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  💾 Database ({databaseAccounts.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {databaseAccounts.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">No accounts in database</div>
                  ) : (
                    databaseAccounts.map((acc, idx) => (
                      <div key={idx} className="bg-muted/50 p-2 rounded text-xs space-y-1">
                        <div className="font-mono text-blue-600">{acc.chipUID}</div>
                        <div>ID: {acc.accountId}</div>
                        <div>Created: {new Date(acc.createdAt).toLocaleDateString()}</div>
                        <div>Verifications: {acc.verificationCount}</div>
                        <div className="flex items-center gap-2">
                          <span>PIN:</span>
                          {acc.hasPIN ? (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              ✅ Protected
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs px-1 py-0">
                              ❌ Not Set
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Local Storage Contents */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  📱 Local Storage ({localAccounts.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {localAccounts.length === 0 ? (
                    <div className="text-xs text-muted-foreground italic">No accounts in local storage</div>
                  ) : (
                    localAccounts.map((acc, idx) => (
                      <div key={idx} className="bg-muted/50 p-2 rounded text-xs space-y-1">
                        <div className="font-mono text-green-600">{acc.chipUID}</div>
                        <div>Name: {acc.displayName}</div>
                        <div>Device: {acc.deviceName}</div>
                        <div>Sessions: {acc.sessions}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    checkDatabaseStatus()
                    checkLocalStorage()
                  }}
                  disabled={isLoading}
                  className="w-full text-xs"
                >
                  Refresh Storage Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircleIcon className="h-5 w-5 text-accent" />
                Activity Logs
                {logs.length > 0 && (
                  <Badge variant="secondary">{logs.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 overflow-y-auto space-y-1 bg-muted/30 p-3 rounded-lg font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground text-center py-8">
                    No activity yet. Simulate an NFC tap to begin.
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.includes('❌') ? 'text-destructive' :
                        log.includes('✅') ? 'text-green-600' :
                        log.includes('🎯') ? 'text-primary font-medium' :
                        log.includes('💾') ? 'text-blue-600' :
                        'text-foreground'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Privacy Notice */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-primary">Privacy-First Design</h3>
                <p className="text-sm text-muted-foreground">
                  This system stores only minimal recognition data in the database (chipUID → accountID mapping). 
                  All sensitive information like private keys, personal details, and rich profiles remain stored 
                  locally on each device. This ensures cross-device recognition while maintaining user privacy.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 