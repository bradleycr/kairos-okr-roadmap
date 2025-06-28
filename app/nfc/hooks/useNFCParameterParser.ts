/**
 * useNFCParameterParser Hook
 * 
 * Intelligent URL parameter parsing for NFC authentication
 * Handles multiple formats with detailed debugging information
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import type { NFCParameters } from '../types/nfc.types'
import { NFCParameterParser } from '../utils/nfc-parameter-parser'
import { SessionManager } from '@/lib/nfc/sessionManager'
import { BondManager, type BondProposal } from '@/lib/nfc/bondManager'

export function useNFCParameterParser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [parsedParams, setParsedParams] = useState<NFCParameters>({})
  const [format, setFormat] = useState<'optimal' | 'decentralized' | 'legacy-full' | 'legacy-compressed' | 'legacy-ultra' | 'none'>('none')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(true)
  const [accountInitialized, setAccountInitialized] = useState(false)
  
  // PIN Gate State
  const [requiresPIN, setRequiresPIN] = useState(false)
  const [pinGateInfo, setPinGateInfo] = useState<{
    isNewAccount: boolean
    isNewDevice: boolean
    hasPIN: boolean
    reason?: string
    displayName?: string
  } | null>(null)

  // Enhanced Authentication State
  const [isSameChip, setIsSameChip] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [showBondDialog, setShowBondDialog] = useState(false)
  const [newUserInfo, setNewUserInfo] = useState<{
    chipUID: string
    displayName: string
  } | null>(null)
  const [shouldRedirectToProfile, setShouldRedirectToProfile] = useState(false)

  // Load current session on mount
  useEffect(() => {
    const loadCurrentSession = async () => {
      try {
        console.log('🔄 Loading current session...')
        const session = await SessionManager.getCurrentSession()
        setCurrentSession(session)
        console.log('📱 Current session loaded:', {
          isActive: session.isActive,
          hasUser: !!session.currentUser,
          chipUID: session.currentUser?.chipUID?.slice(-4) || 'none'
        })
      } catch (error) {
        console.warn('Failed to load current session:', error)
      }
    }
    
    loadCurrentSession()
  }, [])

  useEffect(() => {
    if (shouldRedirectToProfile && parsedParams.chipUID && currentSession?.currentUser?.sessionId) {
      const profileUrl = new URL('/profile', window.location.origin)
      profileUrl.searchParams.set('verified', 'true')
      profileUrl.searchParams.set('source', 'same-chip')
      profileUrl.searchParams.set('chipUID', parsedParams.chipUID)
      profileUrl.searchParams.set('session', currentSession.currentUser.sessionId)
      profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
      
      console.log('✅ Redirecting to profile now...')
      router.push(profileUrl.toString())
    }
  }, [shouldRedirectToProfile, parsedParams.chipUID, currentSession, router])

  const getDisplayNameForChip = useCallback(async (chipUID: string): Promise<string> => {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'GET',
        headers: {
          'X-Chip-UID': chipUID
        }
      })
      
      const data = await response.json()
      
      if (data.success && data.account) {
        return data.account.displayName || `User ${chipUID.slice(-4).toUpperCase()}`
      }
      
      return `User ${chipUID.slice(-4).toUpperCase()}`
    } catch (error) {
      console.error('Failed to get display name:', error)
      return `User ${chipUID.slice(-4).toUpperCase()}`
    }
  }, [])

  const checkIfChipHasAccount = useCallback(async (chipUID: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'GET',
        headers: {
          'X-Chip-UID': chipUID
        }
      })
      
      const data = await response.json()
      return data.success && data.account
    } catch (error) {
      console.error('Failed to check account:', error)
      return false
    }
  }, [])

  const checkPINRequirements = useCallback(async (chipUID: string, isDifferentChip: boolean = false) => {
    console.log(`🔐 Checking PIN requirements for chipUID: ${chipUID} (different chip: ${isDifferentChip})`)
    
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const result = await NFCAccountManager.authenticateWithPINGate(chipUID)
      
      console.log(`🔐 PIN Gate Check:`, result)
      
      if (result.requiresPIN) {
        // PIN is required
        setRequiresPIN(true)
        setPinGateInfo({
          isNewAccount: result.isNewAccount,
          isNewDevice: result.isNewDevice,
          hasPIN: result.hasPIN,
          reason: result.reason,
          displayName: await getDisplayNameForChip(chipUID)
        })
        setDebugInfo(prev => [...prev, `🔒 PIN required: ${result.reason}`])
      } else {
        // No PIN required
        if (isDifferentChip && currentSession?.isActive) {
          // Different chip, bonding flow. Check if safe to bond.
          if (result.hasPIN || result.isNewAccount) {
            // It's a new account (no PIN exists yet) or an existing account that has a PIN
            // (even if not required right now due to a session). Safe to proceed.
            console.log('🤝 Different chip, no PIN required now, but safe to bond. Showing bond dialog.')
            setDebugInfo(prev => [...prev, `🤝 Bonding allowed: hasPIN=${result.hasPIN}, isNew=${result.isNewAccount}`])
            setShowBondDialog(true)
          } else {
            // This is an existing account that does not have a PIN set up. Block bonding.
            console.log('🚫 Bonding blocked: target user has no PIN.')
            setDebugInfo(prev => [...prev, `🚫 Bonding blocked: target user ${chipUID} has no PIN.`])
            toast({
              title: "Bonding Not Allowed",
              description: "The owner of this KairOS key must set up a PIN before a bond can be created with them.",
              variant: "destructive",
            })
            // We can optionally redirect home or show another state
          }
        } else {
          // Normal flow - account is ready
          if (result.account) {
            console.log(`✅ Account access granted: ${result.account.accountId}`)
            
            // Create session for new user
            await SessionManager.createSession(chipUID)
            
            // Check if user needs ritual flow
            const shouldShowRitual = NFCAccountManager.shouldShowRitualFlow(chipUID)
            console.log(`🎭 Should show ritual flow: ${shouldShowRitual}`)
            
            // Show appropriate welcome message
            if (result.isNewAccount) {
              toast({
                title: "🎉 Welcome to KairOS",
                description: `Account created: ${result.account.displayName}`,
              })
            } else if (result.isNewDevice) {
              toast({
                title: "👋 Welcome back",
                description: `Account synced: ${result.account.displayName}`,
              })
            } else {
              toast({
                title: "🔐 Account loaded",
                description: `Welcome back, ${result.account.displayName}`,
              })
            }
            
            setAccountInitialized(true)
            setDebugInfo(prev => [...prev, `✅ Account ready: ${result.account.accountId}`])
            
            // Redirect to appropriate page based on ritual flow completion
            if (!shouldShowRitual) {
              // User has completed ritual flow - redirect to profile
              const profileUrl = new URL('/profile', window.location.origin)
              profileUrl.searchParams.set('verified', 'true')
              profileUrl.searchParams.set('source', 'returning-user')
              profileUrl.searchParams.set('chipUID', chipUID)
              profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
              
              router.push(profileUrl.toString())
            }
          }
        }
      }
      
    } catch (error) {
      console.warn('PIN gate check failed:', error)
      setDebugInfo(prev => [...prev, `⚠️ PIN gate failed: ${error}`])
      // Continue with normal flow - error handling is built into the auth system
    }
  }, [currentSession, toast, router, getDisplayNameForChip])

  const checkSessionAndAuthRequirements = useCallback(async (chipUID: string) => {
    try {
      console.log(`🔍 Checking session and auth for chipUID: ${chipUID.slice(-4)}`)
      console.log(`📱 Current session state:`, {
        isActive: currentSession?.isActive,
        hasUser: !!currentSession?.currentUser,
        currentChipUID: currentSession?.currentUser?.chipUID?.slice(-4) || 'none'
      })
      
      // Check if this is the same chip as current user
      const isSameChip = await SessionManager.isSameChip(chipUID)
      setIsSameChip(isSameChip)
      console.log(`🔍 Same chip check: ${isSameChip} (${chipUID.slice(-4)} vs ${currentSession?.currentUser?.chipUID?.slice(-4) || 'none'})`)
      
      if (isSameChip) {
        console.log('✅ Same chip detected - redirecting to profile')
        setShouldRedirectToProfile(true)
        return
      }
      
      // Different chip - check if we have an active session for bonding
      if (currentSession?.isActive) {
        console.log('🤝 Different chip + active session = BONDING MODE')
        
        // Get display name for the new user (from existing account if available)
        const displayName = await getDisplayNameForChip(chipUID)
        
        // Check if users are already bonded
        const areAlreadyBonded = await BondManager.areBonded(
          currentSession.currentUser.chipUID, 
          chipUID
        )
        
        if (areAlreadyBonded) {
          console.log('🤝 Users are already bonded')
          toast({
            title: "🤝 Already connected!",
            description: `You're already bonded with ${displayName}`,
          })
          setDebugInfo(prev => [...prev, `🤝 Already bonded with ${displayName}`])
          return
        }
        
        // Check if the tapped chip has an account (basic validation)
        const hasAccount = await checkIfChipHasAccount(chipUID)
        
        if (!hasAccount) {
          console.log('❌ Tapped chip has no account')
          toast({
            title: "⚠️ No account found",
            description: "This NFC chip doesn't have a KairOS account yet",
            variant: "destructive"
          })
          return
        }
        
        console.log('🤝 Ready to bond - showing dialog immediately')
        
        // Set up for immediate bonding
        setNewUserInfo({
          chipUID,
          displayName
        })
        
        setShowBondDialog(true)
        
        toast({
          title: "🤝 Ready to bond!",
          description: `Create a connection with ${displayName}?`,
        })
        
        setDebugInfo(prev => [...prev, `🤝 Bonding with ${displayName}`])
        return
      }
      
      // No active session - this is a new login, not bonding
      console.log('🔐 No active session - normal authentication flow')
      await checkPINRequirements(chipUID, false)
      
    } catch (error) {
      console.warn('Session check failed:', error)
      setDebugInfo(prev => [...prev, `⚠️ Session check failed: ${error}`])
      // Fallback to normal PIN gate check
      await checkPINRequirements(chipUID, false)
    }
  }, [currentSession, toast, router, checkPINRequirements, getDisplayNameForChip, checkIfChipHasAccount])

  const parseParameters = useCallback(async () => {
    setIsParsing(true)
    
    try {
      const result = NFCParameterParser.parseParameters(searchParams)
      
      setParsedParams(result.params)
      setFormat(result.format)
      setDebugInfo(result.debugInfo)
      
      // Initialize session manager
      SessionManager.initialize()
      
      // Check for active session and same-chip scenario
      if (result.params.chipUID && !accountInitialized) {
        await checkSessionAndAuthRequirements(result.params.chipUID)
      }
      
    } catch (error) {
      console.error('Parameter parsing failed:', error)
      setDebugInfo(prev => [...prev, `❌ Parsing error: ${error}`])
      setFormat('none')
      setParsedParams({})
    } finally {
      setIsParsing(false)
    }
  }, [searchParams, accountInitialized, checkSessionAndAuthRequirements])



  const handlePINSuccess = useCallback(async (account: any) => {
    console.log(`✅ PIN authentication successful: ${account.accountId}`)
    
    // Check if this was a different chip scenario (bonding)
    if (currentSession?.isActive && newUserInfo && currentSession.currentUser.chipUID !== account.chipUID) {
      // This is a BONDING scenario - DO NOT create new session
      // Keep the original user's session active for bonding
      console.log('🤝 PIN verified for different chip - KEEPING original session, showing bond dialog')
      console.log(`   Original user: ${currentSession.currentUser.chipUID}`)
      console.log(`   Bonding with: ${account.chipUID}`)
      
      setRequiresPIN(false)
      setShowBondDialog(true)
      
      toast({
        title: "🔓 Access granted",
        description: `Would you like to create a bond with ${account.displayName}?`,
      })
    } else {
      // Normal PIN authentication - session was already created in PIN entry
      // Just need to update local state and potentially redirect
      console.log('🔐 Normal PIN authentication - session already created, updating state')
      
      // Verify session exists (it should have been created in PIN entry)
      const session = await SessionManager.getCurrentSession()
      if (!session.isActive) {
        console.warn('⚠️ Expected session not found, creating new one')
        await SessionManager.createSession(account.chipUID)
      }
      
      toast({
        title: "🔓 Welcome back",
        description: `Access granted: ${account.displayName}`,
      })
      
      setRequiresPIN(false)
      setAccountInitialized(true)
      
      // For PIN success, the redirect should have already happened in PIN entry
      // This is mainly for bonding scenarios or error recovery
    }
    
    setDebugInfo(prev => [...prev, `✅ PIN auth complete: ${account.accountId}`])
  }, [toast, currentSession, newUserInfo, router])

  const handleBondCreate = useCallback(async (bondType: string, note?: string): Promise<boolean> => {
    if (!currentSession?.currentUser || !newUserInfo) {
      console.error('Missing session or new user info for bonding')
      return false
    }

    try {
      const proposal: BondProposal = {
        fromChipUID: currentSession.currentUser.chipUID,
        fromDisplayName: currentSession.currentUser.displayName,
        toChipUID: newUserInfo.chipUID,
        toDisplayName: newUserInfo.displayName,
        bondType: bondType as any,
        proposedAt: new Date().toISOString(),
        metadata: {
          note: note,
          location: 'NFC Authentication',
          event: 'Chip Tap'
        }
      }

      const bond = await BondManager.createBond(proposal)
      
      if (bond) {
        console.log('✅ Bond created successfully:', bond.id)
        
        toast({
          title: "🤝 Bond created!",
          description: `You're now connected with ${newUserInfo.displayName}`,
        })
        
        // Clear states and redirect or continue
        setShowBondDialog(false)
        setNewUserInfo(null)
        setDebugInfo(prev => [...prev, `✅ Bond created: ${bond.id}`])
        
        return true
      } else {
        console.error('Failed to create bond')
        toast({
          title: "❌ Bond creation failed",
          description: "Please try again",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Bond creation error:', error)
      toast({
        title: "❌ Bond creation failed",
        description: "Please try again",
        variant: "destructive"
      })
      return false
    }
  }, [currentSession, newUserInfo, toast, router])

  const handleBondDialogClose = useCallback(() => {
    setShowBondDialog(false)
    setNewUserInfo(null)
    // Could redirect back to home or show some other flow
  }, [])

  // This effect runs once on mount to start the process
  useEffect(() => {
    parseParameters()
  }, [parseParameters])

  const hasValidParameters = useCallback(() => {
    return Object.keys(parsedParams).length > 0 && format !== 'none'
  }, [parsedParams, format])

  const isDecentralizedFormat = useCallback(() => {
    return format === 'decentralized'
  }, [format])

  const isLegacyFormat = useCallback(() => {
    return format.startsWith('legacy')
  }, [format])

  return {
    parsedParams,
    format,
    debugInfo,
    isParsing,
    accountInitialized,
    requiresPIN,
    pinGateInfo,
    isSameChip,
    currentSession,
    showBondDialog,
    newUserInfo,
    hasValidParameters,
    isDecentralizedFormat,
    isLegacyFormat,
    handlePINSuccess,
    handleBondCreate,
    handleBondDialogClose,
    reparseParameters: parseParameters
  }
} 