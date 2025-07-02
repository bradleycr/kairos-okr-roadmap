/**
 * WoF (Way of Flowers) Flow State Management Hook
 * Handles the core logic and state for the Way of Flowers installation
 * 
 * New Flow matches beautiful screenshots:
 * 1. TAP TO START - Initial NFC tap screen
 * 2. CONNECT SEED - NFC connection/authentication  
 * 3. BLOOMING INITIATION - Welcome back with ecosystem choice
 * 4. ECOSYSTEM CHOICES - Tree/nature selection
 * 5. WALLET INTEGRATION - Address lookup and completion
 */

import { useState, useEffect, useCallback } from 'react'
import { WayOfFlowersManager, type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'
import { SessionManager } from '@/lib/nfc/sessionManager'
import { walletIntegration } from '@/lib/crypto/walletIntegration'
import { useAccount } from 'wagmi'

export type WoFStage = 
  | 'tap-to-start' 
  | 'connect-seed' 
  | 'blooming-initiation' 
  | 'ecosystem-choices' 
  | 'wallet-integration' 
  | 'complete'

export interface UserWoFSession {
  chipUID: string
  isNewUser: boolean
  sessionStarted: string
  lastInteraction: string
  ethAddress?: string
  hasWallet: boolean
  displayName?: string
  interactionCount?: number
}

export interface WoFFlowState {
  currentStage: WoFStage
  isProcessing: boolean
  isSimulationMode: boolean
  userSession: UserWoFSession | null
  userPaths: FlowerPath[]
  selectedPath: FlowerPath | null
  selectedOffering: CauseOffering | null
  selectedEcosystem: string | null
  availableOfferings: CauseOffering[]
  persistentSession: any | null
  needsNFCConfirmation: boolean
  isNFCListening: boolean
  isConnecting: boolean
  connectionError: string | null
}

export function useWoFFlow() {
  // Initialize manager
  const [wofManager] = useState(() => new WayOfFlowersManager())
  
  // Wagmi wallet integration
  const { address, isConnected } = useAccount()
  
  // Core state
  const [state, setState] = useState<WoFFlowState>({
    currentStage: 'tap-to-start',
    isProcessing: false,
    isSimulationMode: false,
    userSession: null,
    userPaths: [],
    selectedPath: null,
    selectedOffering: null,
    selectedEcosystem: null,
    availableOfferings: wofManager.getAllCauseOfferings(),
    persistentSession: null,
    needsNFCConfirmation: false,
    isNFCListening: false,
    isConnecting: false,
    connectionError: null
  })

  // Check for existing persistent session on mount
  useEffect(() => {
    checkPersistentSession()
  }, [])

  // Update wallet status when wagmi connection changes
  useEffect(() => {
    if (state.userSession && address) {
      setState(prev => ({
        ...prev,
        userSession: {
          ...prev.userSession!,
          ethAddress: address,
          hasWallet: isConnected
        }
      }))
    }
  }, [address, isConnected, state.userSession])

  const checkPersistentSession = useCallback(async () => {
    try {
      const currentSession = await SessionManager.getCurrentSession()
      
      if (currentSession.isActive && currentSession.currentUser) {
        console.log('🔄 Found persistent session for:', currentSession.currentUser.displayName)
        
        // Create WoF session from persistent KairOS session
        const wofSession: UserWoFSession = {
          chipUID: currentSession.currentUser.chipUID,
          isNewUser: false,
          sessionStarted: currentSession.currentUser.lastAuthenticated,
          lastInteraction: new Date().toISOString(),
          hasWallet: isConnected,
          displayName: currentSession.currentUser.displayName,
          interactionCount: 17 // Could be fetched from blockchain
        }

        // Check if user has wallet
        if (address) {
          wofSession.ethAddress = address
          wofSession.hasWallet = true
        }

        // Load user's existing paths
        const existingPaths = wofManager.getUserFlowerPaths(currentSession.currentUser.chipUID)
        
        setState(prev => ({
          ...prev,
          persistentSession: currentSession,
          userSession: wofSession,
          userPaths: existingPaths,
          currentStage: existingPaths.length > 0 ? 'blooming-initiation' : 'connect-seed'
        }))
      }
    } catch (error) {
      console.error('Failed to check persistent session:', error)
    }
  }, [wofManager, address, isConnected])

  // Initialize simulation mode if needed
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const simulate = urlParams.get('simulate')
    
    if (simulate === 'true') {
      const simulationSession: UserWoFSession = {
        chipUID: urlParams.get('chipUID') || 'simulation-chip-' + Date.now(),
        isNewUser: true,
        sessionStarted: new Date().toISOString(),
        lastInteraction: new Date().toISOString(),
        hasWallet: isConnected,
        displayName: 'Demo User',
        interactionCount: 5
      }
      
      setState(prev => ({
        ...prev,
        isSimulationMode: true,
        userSession: simulationSession,
        currentStage: 'connect-seed'
      }))
    }
  }, [isConnected])

  // Handle NFC tap detection
  const handleNFCTap = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, connectionError: null }))
    
    try {
      // Simulate NFC connection
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check for existing session or create new one
      await checkPersistentSession()
      
      // If no session exists, move to blooming initiation
      setState(prev => ({
        ...prev,
        isConnecting: false,
        currentStage: prev.persistentSession ? 'blooming-initiation' : 'blooming-initiation'
      }))
      
    } catch (error) {
      console.error('NFC connection failed:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        connectionError: 'Failed to connect. Please try again.'
      }))
    }
  }, [checkPersistentSession])

  // Handle ecosystem selection
  const handleEcosystemChoice = useCallback(async (ecosystem: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedEcosystem: ecosystem,
      isProcessing: true 
    }))
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentStage: 'ecosystem-choices'
      }))
      
    } catch (error) {
      console.error('Ecosystem choice failed:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [])

  // Handle ecosystem selection (final choice)
  const handleEcosystemSelect = useCallback(async (ecosystem: string) => {
    setState(prev => ({ 
      ...prev, 
      selectedEcosystem: ecosystem,
      isProcessing: true 
    }))
    
    try {
      // Create new path if needed
      if (!state.selectedPath && state.userSession?.chipUID) {
        const newPath = await wofManager.createNewFlowerPath(
          state.userSession.chipUID, 
          `${ecosystem} Path`
        )
        
        setState(prev => ({
          ...prev,
          selectedPath: newPath,
          userPaths: [...prev.userPaths, newPath]
        }))
      }
      
      // Move to wallet integration
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentStage: 'wallet-integration'
      }))
      
    } catch (error) {
      console.error('Ecosystem selection failed:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [state.selectedPath, state.userSession?.chipUID, wofManager])

  // Handle wallet connection
  const handleConnectWallet = useCallback(async () => {
    try {
      // Wallet connection is handled by wagmi
      // This just updates our local state
      setState(prev => ({
        ...prev,
        userSession: prev.userSession ? {
          ...prev.userSession,
          hasWallet: true,
          ethAddress: address
        } : null
      }))
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }, [address])

  // Handle flow completion
  const handleComplete = useCallback(async () => {
    setState(prev => ({ ...prev, isProcessing: true }))
    
    try {
      // Simulate completion processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        currentStage: 'complete'
      }))
      
    } catch (error) {
      console.error('Flow completion failed:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [])

  // Start over
  const startOver = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStage: 'tap-to-start',
      selectedPath: null,
      selectedOffering: null,
      selectedEcosystem: null,
      isProcessing: false,
      connectionError: null
    }))
  }, [])

  return {
    // State
    ...state,
    
    // Actions
    handleNFCTap,
    handleEcosystemChoice,
    handleEcosystemSelect,
    handleConnectWallet,
    handleComplete,
    startOver,
    checkPersistentSession,
    
    // Computed values
    canProceed: state.userSession !== null,
    hasWallet: state.userSession?.hasWallet || isConnected,
    walletAddress: state.userSession?.ethAddress || address
  }
} 