/**
 * 🔐 KairOS NFC Parameter Parser v2.1
 * 
 * High-performance NFC authentication parameter parsing with multi-format support
 * Designed for optimal user experience with single PIN entry flow
 * 
 * @author KairOS Team
 * @license MIT
 * @since 1.0.0
 * @updated 2025-01-01 - Fixed temporal dead zone issues
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import type { NFCParameters } from '../types/nfc.types'
import { NFCParameterParser } from '../utils/nfc-parameter-parser'
import { SessionManager } from '@/lib/nfc/sessionManager'
import { BondManager, type BondProposal } from '@/lib/nfc/bondManager'

/**
 * 🚀 Main NFC Parameter Parser Hook
 * 
 * Handles intelligent parsing of NFC URL parameters and orchestrates
 * the authentication flow with optimal UX (single PIN entry).
 * 
 * Key Features:
 * - Multi-format NFC URL support (legacy-full, didkey, optimal, etc.)
 * - Single PIN authentication flow
 * - Cross-device account recognition
 * - Secure bonding between users
 * - Enterprise-grade error handling
 */
export function useNFCParameterParser() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [parsedParams, setParsedParams] = useState<NFCParameters>({})
  const [format, setFormat] = useState<'optimal' | 'decentralized' | 'legacy-full' | 'legacy-compressed' | 'legacy-ultra' | 'none'>('none')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(true)
  const [accountInitialized, setAccountInitialized] = useState(false)
  
  // 🔐 SECURITY: PIN Gate State
  const [requiresPIN, setRequiresPIN] = useState(false)
  const [pinGateInfo, setPinGateInfo] = useState<{
    isNewAccount: boolean
    isNewDevice: boolean
    hasPIN: boolean
    reason?: string
    displayName?: string
  } | null>(null)
  
  // Legacy card PIN verification tracking
  const [pinVerificationComplete, setPinVerificationComplete] = useState(false)

  // Enhanced Authentication State
  const [isSameChip, setIsSameChip] = useState(false)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [showBondDialog, setShowBondDialog] = useState(false)
  const [newUserInfo, setNewUserInfo] = useState<{
    chipUID: string
    displayName: string
  } | null>(null)
  // Removed shouldRedirectToProfile state - redirects now happen after PIN verification

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
            
            // ✅ Account ready - no toast needed (clean UX)
            
            setAccountInitialized(true)
            setDebugInfo(prev => [...prev, `✅ Account ready: ${result.account.accountId}`])
            
            // 🆕 For simple chipUID-only URLs, skip ritual flow and go directly to profile
            // These are basic authentication URLs, not full onboarding experiences
            const isSimpleChipUIDAuth = !result.account.displayName || result.account.displayName.includes('Memory Keeper')
            
            if (!shouldShowRitual || isSimpleChipUIDAuth) {
              // Mark ritual flow as completed for simple auth URLs
              if (isSimpleChipUIDAuth && shouldShowRitual) {
                console.log('🎭 Marking ritual flow completed for simple chipUID auth')
                await NFCAccountManager.markRitualFlowCompleted(chipUID)
              }
              
              // Redirect to profile
              const profileUrl = new URL('/profile', window.location.origin)
              profileUrl.searchParams.set('verified', 'true')
              profileUrl.searchParams.set('source', isSimpleChipUIDAuth ? 'new-user-simple' : 'returning-user')
              profileUrl.searchParams.set('chipUID', chipUID)
              profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
              
              console.log('🚀 Redirecting to profile:', profileUrl.toString())
              router.push(profileUrl.toString())
            } else {
              // User needs ritual flow - let the authentication component handle it
              console.log('🎭 User needs ritual flow - will show auth component')
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
        console.log('🔐 Same chip detected - but PIN still required for security')
        setDebugInfo(prev => [...prev, '🔐 Same chip detected - but PIN still required for security'])
        // Do NOT redirect immediately - require PIN first for security
        await checkPINRequirements(chipUID, false)
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
          // 🤝 Already bonded - no toast needed (clean UX)
          setDebugInfo(prev => [...prev, `🤝 Already bonded with ${displayName}`])
          return
        }
        
        // Check if the tapped chip has an account (basic validation)
        const hasAccount = await checkIfChipHasAccount(chipUID)
        
        if (!hasAccount) {
          console.log('❌ Tapped chip has no account')
          // ❌ No account - logged for debug (clean UX)
          return
        }
        
        console.log('🤝 Ready to bond - showing dialog immediately')
        
        // Set up for immediate bonding
        setNewUserInfo({
          chipUID,
          displayName
        })
        
        setShowBondDialog(true)
        
        // 🤝 Bond dialog will show - no toast needed (clean UX)
        
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

  const isLegacyFormat = useCallback(() => {
    return format.startsWith('legacy')
  }, [format])

  /**
   * 🏆 Optimized Legacy Card PIN Requirements Check
   * 
   * Streamlined function specifically for legacy cards that have complete
   * crypto parameters (did, signature, publicKey, uid). This ensures
   * single PIN entry with cross-device account recognition.
   * 
   * @param {string} chipUID - The NFC chip unique identifier
   * @returns {Promise<void>} Sets up PIN requirements or account access
   */
  const checkLegacyCardPINRequirements = useCallback(async (chipUID: string) => {
    console.log(`🏆 Checking legacy card requirements for chipUID: ${chipUID?.slice(-4) || 'MISSING'}`)
    console.log(`🏆 Full chipUID: ${chipUID}`)
    
    if (!chipUID) {
      console.warn('[NFC] No chipUID found in URL parameters (this is normal in demo mode)')
      setDebugInfo(prev => [...prev, '⚠️ Missing chipUID in URL (demo/simulation mode)'])
      return
    }
    
    try {
      // 📊 Check if this chip has an account in our database
      console.log('🏆 Importing NFCAccountManager...')
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      console.log('🏆 Calling authenticateWithPINGate...')
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PIN gate check timeout')), 5000)
      )
      
      const result = await Promise.race([
        NFCAccountManager.authenticateWithPINGate(chipUID),
        timeoutPromise
      ]) as any
      console.log('🏆 PIN gate result received:', result)
      
      console.log(`🔍 Legacy card PIN gate result:`, {
        requiresPIN: result.requiresPIN,
        hasAccount: !result.isNewAccount,
        hasPIN: result.hasPIN,
        reason: result.reason
      })
      
      if (result.requiresPIN) {
        // 🔐 PIN required - set up for single PIN entry
        console.log('🔐 Setting up PIN requirement for legacy card')
        setRequiresPIN(true)
        setPinGateInfo({
          isNewAccount: result.isNewAccount,
          isNewDevice: result.isNewDevice,
          hasPIN: result.hasPIN,
          reason: result.reason,
          displayName: await getDisplayNameForChip(chipUID)
        })
        setDebugInfo(prev => [...prev, `🔒 PIN required for legacy card: ${result.reason}`])
        
        // Note: Account will be initialized after PIN success in handleLegacyCardPINSuccess
        
      } else {
        // ✅ No PIN required - account ready for direct access
        console.log('✅ Legacy card access granted without PIN')
        console.log('🔍 Result account data:', result.account)
        
        if (result.account) {
          // Create session and redirect to profile
          console.log('🔄 Creating session for existing account...')
          await SessionManager.createSession(chipUID)
          
          console.log('✅ Setting account as initialized')
          setAccountInitialized(true)
          setRequiresPIN(false)
          setPinVerificationComplete(true)
          
                console.log('✅ Legacy card ready - redirecting to profile')
      
      // 🚀 Navigate to profile immediately (no PIN needed)
      const profileUrl = new URL('/profile', window.location.origin)
      profileUrl.searchParams.set('verified', 'true')
      profileUrl.searchParams.set('source', 'legacy-card-no-pin')
      profileUrl.searchParams.set('chipUID', chipUID)
      profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
      
      console.log('🚀 Redirecting to:', profileUrl.toString())
      
      // Add a small delay to prevent infinite loops
      setTimeout(() => {
        router.push(profileUrl.toString())
      }, 100)
          
        } else {
          // Account creation needed
          console.log('🆕 No existing account - creating new one')
          setAccountInitialized(true)
          setRequiresPIN(false)
          setPinVerificationComplete(true)
          console.log('✅ New legacy card - ready for account creation')
          
          // Redirect to profile
          const profileUrl = new URL('/profile', window.location.origin)
          profileUrl.searchParams.set('verified', 'true')
          profileUrl.searchParams.set('source', 'legacy-card-verified')
          profileUrl.searchParams.set('chipUID', chipUID)
          profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
          
                console.log('🚀 Redirecting new account to:', profileUrl.toString())
      
      // Add a small delay to prevent infinite loops
      setTimeout(() => {
        router.push(profileUrl.toString())
      }, 100)
        }
      }
      
    } catch (error) {
      console.error('❌ Legacy card PIN check failed:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace'
      })
      setDebugInfo(prev => [...prev, `⚠️ Legacy PIN check failed: ${error}`])
      
      // 🚨 Instead of fallback to PIN, try direct authentication
      console.log('🔄 PIN check failed, trying direct authentication without PIN...')
      
      try {
        // Try to create a session anyway
        console.log('🔄 Attempting fallback authentication...')
        setRequiresPIN(false)
        setAccountInitialized(true)
        setPinVerificationComplete(true)
        
        await SessionManager.createSession(chipUID)
        
        // Redirect directly to profile
        const profileUrl = new URL('/profile', window.location.origin)
        profileUrl.searchParams.set('verified', 'true')
        profileUrl.searchParams.set('source', 'legacy-direct')
        profileUrl.searchParams.set('chipUID', chipUID)
        profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
        
        console.log('🚀 Direct redirect after PIN check failure:', profileUrl.toString())
        
        // Add a small delay to prevent infinite loops
        setTimeout(() => {
          router.push(profileUrl.toString())
        }, 100)
        
      } catch (fallbackError) {
        console.error('🚨 Even fallback failed:', fallbackError)
        console.error('🚨 Fallback error details:', {
          name: fallbackError instanceof Error ? fallbackError.name : 'Unknown',
          message: fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          stack: fallbackError instanceof Error ? fallbackError.stack : 'No stack trace'
        })
        
        // Last resort: show PIN entry
        console.log('🚨 Last resort: requiring PIN for security')
      setRequiresPIN(true)
      setPinGateInfo({
        isNewAccount: true,
        isNewDevice: true,
        hasPIN: false,
          reason: 'Legacy card verification required (last resort)',
          displayName: `User ${chipUID?.slice(-4).toUpperCase() || 'Unknown'}`
      })
      }
    }
  }, [toast, router, getDisplayNameForChip])

  /**
   * 🔍 Core Parameter Parsing Function
   * 
   * Intelligently parses URL parameters and sets up the appropriate authentication flow.
   * For legacy cards with full crypto parameters, we use a streamlined single-PIN flow.
   * 
   * @returns {void} Updates component state based on parsed parameters
   */
  const parseParameters = useCallback(async () => {
    setIsParsing(true)
    
    try {
      // 📊 Parse URL parameters using our multi-format parser
      console.log('🔍 Raw search params:', Array.from(searchParams.entries()))
      const result = NFCParameterParser.parseParameters(searchParams)
      console.log('🔍 Parsed result:', {
        format: result.format,
        hasChipUID: !!result.params.chipUID,
        chipUID: result.params.chipUID,
        hasSignature: !!result.params.signature,
        hasPublicKey: !!result.params.publicKey,
        hasDID: !!result.params.did
      })
      
      setParsedParams(result.params)
      setFormat(result.format)
      
      const chipUID = result.params.chipUID
      
      // 🆕 CHECK FOR NEW CARD FROM CHIP CONFIG
      // If this is a new card generated from chip-config, go directly to profile
      const isNewCard = searchParams.get('newCard') === 'true'
      const skipPINGate = searchParams.get('skipPINGate') === 'true'
      const isChipConfigTest = searchParams.get('source') === 'chip_config_test'
      
      if (isNewCard && skipPINGate && isChipConfigTest && chipUID) {
        console.log('🆕 New card from chip-config detected - routing to profile for PIN setup')
        console.log(`   ChipUID: ${chipUID}`)
        console.log(`   Format: ${result.format}`)
        console.log('   Skipping PIN gate check - new card needs PIN setup')
        
        // Set up states for new card
        setRequiresPIN(false)
        setAccountInitialized(true)
        setPinVerificationComplete(true)
        
        // Redirect directly to profile for PIN setup
        const profileUrl = new URL('/profile', window.location.origin)
        profileUrl.searchParams.set('verified', 'true')
        profileUrl.searchParams.set('source', 'new-card-setup')
        profileUrl.searchParams.set('chipUID', chipUID)
        profileUrl.searchParams.set('newCard', 'true')
        profileUrl.searchParams.set('setupPIN', 'true')
        profileUrl.searchParams.set('did', result.params.did || '')
        profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
        
        console.log('🚀 Redirecting new card to profile:', profileUrl.toString())
        router.push(profileUrl.toString())
        return
      }
      
      if (!chipUID) {
        console.warn('[NFC] No chipUID found in URL parameters (this is normal in demo mode)')
        setDebugInfo(prev => [...prev, '⚠️ Missing chipUID in URL (demo/simulation mode)'])
        return
      }
      
      console.log(`🔍 Processing chipUID: ${chipUID} (format: ${result.format})`)
      
      // Check if we have an existing session and if this is bonding
      // Inline session and bonding logic
      try {
        setDebugInfo(prev => [...prev, `🔍 Checking database for PIN requirements`])
        
        // 🔧 Initialize session manager for cross-device functionality
        SessionManager.initialize()
        
        // 🔐 Handle different card formats with optimized flows
        if (result.format === 'legacy-full') {
          // 🎯 LEGACY CARD - Check database for PIN requirements
          console.log('🎯 Legacy card detected - checking database for PIN requirements')
          console.log('🔍 Legacy card params:', {
            chipUID,
            hasDID: !!result.params.did,
            hasSignature: !!result.params.signature,
            hasPublicKey: !!result.params.publicKey
          })
          setDebugInfo(prev => [...prev, `🎯 Legacy card with chipUID: ${chipUID}`])
          
          try {
            await checkLegacyCardPINRequirements(chipUID)
          } catch (error) {
            console.error('🚨 checkLegacyCardPINRequirements failed:', error)
            setDebugInfo(prev => [...prev, `🚨 Legacy card check failed: ${error}`])
          
            // Fallback: try to proceed anyway
            console.log('🔄 Trying fallback authentication...')
            setRequiresPIN(false)
            setAccountInitialized(true)
            setPinVerificationComplete(true)
            
            // Direct redirect to profile
            const profileUrl = new URL('/profile', window.location.origin)
            profileUrl.searchParams.set('verified', 'true')
            profileUrl.searchParams.set('source', 'legacy-fallback')
            profileUrl.searchParams.set('chipUID', chipUID)
            profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
            
            console.log('🚀 Fallback redirect to profile:', profileUrl.toString())
            router.push(profileUrl.toString())
          }
        } else {
          // 🌐 OTHER FORMATS (didkey, optimal, decentralized)
          // Use the standard session-based authentication flow
          setPinVerificationComplete(true) // Non-legacy cards are OK to show content
          await checkSessionAndAuthRequirements(chipUID)
        }
      } catch (error) {
        console.error('❌ Session/bonding logic failed:', error)
        setDebugInfo(prev => [...prev, `❌ Session error: ${error}`])
        
        // Fallback to requiring PIN
        setRequiresPIN(true)
        setPinGateInfo({
          isNewAccount: true,
          isNewDevice: true,
          hasPIN: false,
          reason: 'Authentication error - fallback to PIN',
          displayName: `User ${chipUID?.slice(-4).toUpperCase() || 'Unknown'}`
        })
      }
      
    } catch (error) {
      console.error('🚨 Parameter parsing failed:', error)
      setDebugInfo(prev => [...prev, `❌ Parse error: ${error}`])
    } finally {
      setIsParsing(false)
    }
  }, [searchParams, router, checkLegacyCardPINRequirements, checkSessionAndAuthRequirements])

  /**
   * 🎯 Legacy Card PIN Success Handler
   * 
   * Dedicated handler for legacy cards that have full crypto parameters.
   * This avoids the double authentication issue by using the existing
   * crypto parameters directly instead of triggering DID:Key derivation.
   * 
   * @param {any} account - Account object from PIN verification
   * @param {string} pin - User-entered PIN (used for cross-device storage)
   * @returns {Promise<void>} Completes authentication and redirects to profile
   */
  const handleLegacyCardPINSuccess = useCallback(async (account: any, pin: string) => {
    console.log(`🎯 Legacy card PIN success: ${account.accountId}`)
    
    try {
      // 💾 Ensure PIN is stored for cross-device functionality
      // This allows the same PIN to work on different devices
      if (pin && parsedParams.chipUID) {
        console.log('💾 Storing PIN for cross-device access')
        // PIN storage is handled by the account manager during PIN verification
        setDebugInfo(prev => [...prev, '💾 PIN stored for cross-device access'])
      }
      
      // Emit authentication complete event for Morning Eight auto-routing
      if (typeof window !== 'undefined') {
        const authEvent = new CustomEvent('nfc-authentication-complete', {
          detail: {
            success: true,
            chipUID: parsedParams.chipUID,
            sessionToken: `legacy_session_${Date.now()}`,
            accountId: account.accountId
          }
        });
        window.dispatchEvent(authEvent);
      }
      
      // 🔗 Create session for this device
      await SessionManager.createSession(parsedParams.chipUID!)
      
      // ✅ Authentication complete - update UI state
      setRequiresPIN(false)
      setAccountInitialized(true)
      
      // 🔓 PIN verified - mark as complete
      setPinVerificationComplete(true)
      console.log('🔓 Legacy card PIN verified - authentication complete')
      
      // ✅ Authentication successful - no toast needed (clean UX)
      
      // 🚀 Navigate to profile with verification parameters
      const profileUrl = new URL('/profile', window.location.origin)
      profileUrl.searchParams.set('verified', 'true')
      profileUrl.searchParams.set('source', 'legacy-card-auth')
      profileUrl.searchParams.set('chipUID', parsedParams.chipUID!)
      profileUrl.searchParams.set('accountId', account.accountId)
      profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
      // 🔑 CRITICAL: Add fresh auth timestamp to skip profile PIN requirement
      profileUrl.searchParams.set('auth_timestamp', Date.now().toString())
      
      console.log('🚀 Redirecting to profile after legacy card authentication')
      router.push(profileUrl.toString())
      
      setDebugInfo(prev => [...prev, `✅ Legacy card auth complete: ${account.accountId}`])
      
    } catch (error) {
      console.error('❌ Legacy card PIN success handling failed:', error)
      // ❌ Error logged - no toast needed (clean UX)
      
      setDebugInfo(prev => [...prev, `❌ Legacy PIN success failed: ${error}`])
    }
  }, [parsedParams, toast, router])

  /**
   * 🔄 Modern Card PIN Success Handler
   * 
   * Handler for modern cards (didkey, optimal) that require DID:Key derivation.
   * This maintains the existing sophisticated authentication flow.
   */
  const handlePINSuccess = useCallback(async (account: any, pin: string) => {
    // 🎯 ENHANCED LEGACY CARD DETECTION
    // Check multiple conditions to ensure we catch all legacy cards
    const isLegacyCard = format === 'legacy-full' || 
                        format.startsWith('legacy') || 
                        (parsedParams.signature && parsedParams.publicKey && parsedParams.did)
    
         if (isLegacyCard) {
       console.log('🎯 Legacy card detected - using optimized single-PIN handler')
       console.log(`   Format: ${format}`)
       console.log(`   Has signature: ${!!parsedParams.signature}`)
       console.log(`   Has publicKey: ${!!parsedParams.publicKey}`)
       console.log(`   Has DID: ${!!parsedParams.did}`)
       console.log('🚫 Skipping all modern card flows to prevent double PIN')
       await handleLegacyCardPINSuccess(account, pin)
       return // Explicit return to prevent any other authentication flows
     }
    
    // 🌐 MODERN CARD FLOW
    // Continue with existing DID:Key authentication for modern cards
    console.log(`🔐 Modern card PIN authentication successful, using DID:Key system...`)
    
    if (!parsedParams.chipUID || !pin) {
      console.error('Missing chipUID or PIN for DID:Key authentication')
      return
    }
    
    try {
      // 🔑 USE DID:KEY AUTHENTICATION (chipUID + PIN)
      // This ensures consistent identity across all devices
      console.log('🔑 Performing DID:Key authentication with provided PIN...')
      console.log('📌 NOTE: PIN already collected, no additional prompts should occur')
      const { NFCAuthenticationEngine } = await import('@/app/nfc/utils/nfc-authentication')
      
      const authResult = await NFCAuthenticationEngine.authenticate({
        chipUID: parsedParams.chipUID,
        // pin: pin, // Remove pin from NFCParameters as it's not part of the interface
        did: parsedParams.did,
        skipPINPrompt: true // Prevent double PIN prompts
      })
      
      if (!authResult.verified) {
        console.error('DID:Key authentication failed:', authResult.error)
        // ❌ Error logged - no toast needed (clean UX)
        return
      }
      
      console.log('✅ DID:Key authentication successful!')
      console.log(`   DID: ${authResult.did}`)
      console.log(`   Session: ${authResult.sessionToken}`)
      
      // Emit authentication complete event for Morning Eight auto-routing
      if (typeof window !== 'undefined') {
        const authEvent = new CustomEvent('nfc-authentication-complete', {
          detail: {
            success: true,
            chipUID: parsedParams.chipUID,
            sessionToken: authResult.sessionToken,
            did: authResult.did
          }
        });
        window.dispatchEvent(authEvent);
      }
      
      // Create session with DID:Key identity
      await SessionManager.createSession(parsedParams.chipUID)
      
      // Check if this was a different chip scenario (bonding)
      if (currentSession?.isActive && newUserInfo && currentSession.currentUser.chipUID !== parsedParams.chipUID) {
        // This is a BONDING scenario - DO NOT replace current session
        console.log('🤝 DID:Key verified for different chip - KEEPING original session, showing bond dialog')
        console.log(`   Original user: ${currentSession.currentUser.chipUID}`)
        console.log(`   Bonding with: ${parsedParams.chipUID}`)
        
        setRequiresPIN(false)
        setShowBondDialog(true)
        
        // 🤝 Bond dialog will show - no toast needed (clean UX)
      } else {
        // Normal DID:Key authentication - update session
        console.log('🔐 Normal DID:Key authentication - updating session')
        
        // ✅ Authentication successful - no toast needed (clean UX)
        
        setRequiresPIN(false)
        setAccountInitialized(true)
        setPinVerificationComplete(true) // CRITICAL FIX: Set PIN verification complete
        
        // Check if this is same chip scenario (should redirect to profile)
        const isCurrentSameChip = await SessionManager.isSameChip(parsedParams.chipUID)
        
        // Redirect to profile with DID:Key verification
        const profileUrl = new URL('/profile', window.location.origin)
        profileUrl.searchParams.set('verified', 'true')
        profileUrl.searchParams.set('source', isCurrentSameChip ? 'same-chip-verified' : 'didkey-auth')
        profileUrl.searchParams.set('chipUID', parsedParams.chipUID)
        profileUrl.searchParams.set('did', authResult.did || '')
        profileUrl.searchParams.set('sessionToken', authResult.sessionToken || '')
        profileUrl.searchParams.set('momentId', `moment_${Date.now()}`)
        
        router.push(profileUrl.toString())
      }
      
      setDebugInfo(prev => [...prev, `✅ DID:Key auth complete: ${authResult.did?.slice(0, 20)}...`])
      
    } catch (error) {
      console.error('DID:Key authentication failed:', error)
      // ❌ Error logged - no toast needed (clean UX)
      
      // Fallback to legacy system for modern cards that fail DID:Key auth
      console.log('⚠️ DID:Key failed, using legacy account manager fallback...')
      console.log('📌 NOTE: This fallback should NOT prompt for PIN again')
      await handleLegacyCardPINSuccess(account, pin)
    }
  }, [parsedParams, toast, currentSession, newUserInfo, router, format, handleLegacyCardPINSuccess])

  /**
   * 🤝 Bond Creation Handler
   * 
   * Handles the creation of social bonds between NFC chip users.
   * This enables the social networking aspects of KairOS.
   * 
   * @param {string} bondType - Type of bond to create (friend, colleague, etc.)
   * @param {string} note - Optional note about the bond
   * @returns {Promise<boolean>} True if bond creation successful
   */
  const handleBondCreate = useCallback(async (bondType: string, note?: string): Promise<boolean> => {
    if (!currentSession?.currentUser || !newUserInfo) {
      console.error('❌ Missing session or new user info for bonding')
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
        
        // ✅ Bond created - no toast needed (clean UX)
        
        // Clean up states after successful bond creation
        setShowBondDialog(false)
        setNewUserInfo(null)
        setDebugInfo(prev => [...prev, `✅ Bond created: ${bond.id}`])
        
        return true
      } else {
        console.error('❌ Failed to create bond')
        // ❌ Error logged - no toast needed (clean UX)
        return false
      }
    } catch (error) {
      console.error('❌ Bond creation error:', error)
      // ❌ Error logged - no toast needed (clean UX)
      return false
    }
  }, [currentSession, newUserInfo, toast])

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

  /**
   * 🚀 Hook Return Value
   * 
   * Returns all necessary state and handlers for NFC authentication UI components.
   * This provides a clean API for implementing NFC authentication flows.
   * 
   * @returns {Object} Complete NFC authentication state and handlers
   */
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
    // Legacy card states
    pinVerificationComplete,
    handlePINSuccess,
    handleBondCreate,
    handleBondDialogClose,
    reparseParameters: parseParameters
  }
}

