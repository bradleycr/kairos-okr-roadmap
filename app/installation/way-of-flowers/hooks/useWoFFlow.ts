/**
 * WoF (Way of Flowers) Flow State Management Hook
 * Handles the core logic and state for the Way of Flowers installation
 * 
 * New Flow:
 * A. Someone logs in on tap (persistent session like Cursive Connections)
 * B. Confirmation taps trigger Web NFC API for both Android and iPhone
 * C. Checks smart contract for interactions (CitizenWallet style)
 */

import { useState, useEffect, useCallback } from 'react'
import { WayOfFlowersManager, type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'
import { SessionManager } from '@/lib/nfc/sessionManager'
import { walletIntegration } from '@/lib/crypto/walletIntegration'

export type WoFStage = 'welcome' | 'auth' | 'first-interaction' | 'choice' | 'evolution' | 'complete'

export interface UserWoFSession {
  chipUID: string
  isNewUser: boolean
  sessionStarted: string
  lastInteraction: string
  ethAddress?: string
  hasWallet: boolean
}

export interface WoFFlowState {
  currentStage: WoFStage
  isProcessing: boolean
  isSimulationMode: boolean
  userSession: UserWoFSession | null
  userPaths: FlowerPath[]
  selectedPath: FlowerPath | null
  selectedOffering: CauseOffering | null
  availableOfferings: CauseOffering[]
  persistentSession: any | null
  needsNFCConfirmation: boolean
  isNFCListening: boolean
}

export function useWoFFlow() {
  // Initialize manager
  const [wofManager] = useState(() => new WayOfFlowersManager())
  
  // Core state
  const [state, setState] = useState<WoFFlowState>({
    currentStage: 'welcome',
    isProcessing: false,
    isSimulationMode: false,
    userSession: null,
    userPaths: [],
    selectedPath: null,
    selectedOffering: null,
    availableOfferings: wofManager.getAllCauseOfferings(),
    persistentSession: null,
    needsNFCConfirmation: false,
    isNFCListening: false
  })

  // Check for existing persistent session on mount (like Cursive Connections)
  useEffect(() => {
    checkPersistentSession()
  }, [])

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
          hasWallet: false
        }

        // Check if user has wallet
        const walletSession = walletIntegration.getCurrentSession()
        if (walletSession) {
          wofSession.ethAddress = walletSession.account.address
          wofSession.hasWallet = true
        }

        // Load user's existing paths
        const existingPaths = wofManager.getUserFlowerPaths(currentSession.currentUser.chipUID)
        
        setState(prev => ({
          ...prev,
          persistentSession: currentSession,
          userSession: wofSession,
          userPaths: existingPaths,
          currentStage: existingPaths.length > 0 ? 'choice' : 'first-interaction'
        }))
      }
    } catch (error) {
      console.error('Failed to check persistent session:', error)
    }
  }, [wofManager])

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
        hasWallet: false
      }
      
      setState(prev => ({
        ...prev,
        isSimulationMode: true,
        userSession: simulationSession,
        currentStage: 'first-interaction'
      }))
    }
  }, [])

  // Trigger NFC confirmation when needed (Web NFC API)
  const requestNFCConfirmation = useCallback(async () => {
    if (!('NDEFReader' in window)) {
      console.warn('Web NFC not supported on this device')
      return false
    }

    setState(prev => ({ ...prev, needsNFCConfirmation: true, isNFCListening: true }))

    try {
      const ndef = new (window as any).NDEFReader()
      
      // Request permission and start listening
      await ndef.scan()
      console.log('🔊 NFC listening started for confirmation...')
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          setState(prev => ({ ...prev, isNFCListening: false, needsNFCConfirmation: false }))
          resolve(false)
        }, 10000) // 10 second timeout

        ndef.addEventListener('reading', (event: any) => {
          console.log('✅ NFC confirmation received')
          clearTimeout(timeout)
          setState(prev => ({ ...prev, isNFCListening: false, needsNFCConfirmation: false }))
          resolve(true)
        })
      })
    } catch (error) {
      console.error('NFC confirmation failed:', error)
      setState(prev => ({ ...prev, isNFCListening: false, needsNFCConfirmation: false }))
      return false
    }
  }, [])

  // Check smart contract for interactions (CitizenWallet style)
  const checkSmartContractInteractions = useCallback(async (ethAddress: string) => {
    try {
      console.log('🔗 Checking smart contract interactions for:', ethAddress)
      
      // Use the conservation contract to check real interactions
      const { ConservationContract } = await import('@/lib/crypto/conservationContract')
      const conservationContract = ConservationContract.getInstance()
      const interactions = await conservationContract.getConservationInteractions(ethAddress as any)
      const metrics = await conservationContract.getConservationMetrics(ethAddress as any)
      
      console.log('📊 Conservation metrics:', metrics)
      console.log('🔗 Recent interactions:', interactions)
      
      return { interactions, metrics }
    } catch (error) {
      console.error('Smart contract check failed:', error)
      return { interactions: [], metrics: null }
    }
  }, [])

  const createNewPath = useCallback(async () => {
    if (!state.userSession?.chipUID) return

    setState(prev => ({ ...prev, isProcessing: true }))
    
    try {
      const newPath = await wofManager.createNewFlowerPath(
        state.userSession.chipUID, 
        'Garden Path'
      )
      
      setState(prev => ({
        ...prev,
        selectedPath: newPath,
        userPaths: [...prev.userPaths, newPath],
        currentStage: 'choice',
        isProcessing: false
      }))
    } catch (error) {
      console.error('WoF failed to create new path:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [state.userSession?.chipUID, wofManager])

  const selectExistingPath = useCallback((path: FlowerPath) => {
    setState(prev => ({
      ...prev,
      selectedPath: path,
      currentStage: 'choice'
    }))
  }, [])

  const makeChoice = useCallback(async (offering: CauseOffering) => {
    if (!state.userSession?.chipUID || !state.selectedPath) return

    setState(prev => ({ ...prev, isProcessing: true, selectedOffering: offering }))
    
    try {
      // Request NFC confirmation if available
      const confirmed = await requestNFCConfirmation()
      
      if (!confirmed && !state.isSimulationMode) {
        console.log('⚠️ NFC confirmation not received, continuing anyway...')
      }

      // Check smart contract interactions if wallet is connected
      if (state.userSession.hasWallet && state.userSession.ethAddress) {
        await checkSmartContractInteractions(state.userSession.ethAddress)
      }

      const result = await wofManager.makeChoice(
        state.userSession.chipUID,
        state.selectedPath.id,
        offering.id
      )
      
      setState(prev => ({
        ...prev,
        selectedPath: result.updatedPath,
        currentStage: 'evolution',
        isProcessing: false
      }))
      
      // Auto-advance to complete after showing evolution
      setTimeout(() => {
        setState(prev => ({ ...prev, currentStage: 'complete' }))
      }, 3000)
      
    } catch (error) {
      console.error('WoF failed to make choice:', error)
      setState(prev => ({ ...prev, isProcessing: false }))
    }
  }, [state.userSession, state.selectedPath, state.isSimulationMode, wofManager, requestNFCConfirmation, checkSmartContractInteractions])

  const startOver = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStage: 'welcome',
      selectedPath: null,
      selectedOffering: null,
      userSession: null,
      persistentSession: null
    }))
  }, [])

  const getStageProgress = useCallback(() => {
    const stageMap = {
      'welcome': 0,
      'auth': 20,
      'first-interaction': 40,
      'choice': 60,
      'evolution': 80,
      'complete': 100
    }
    return stageMap[state.currentStage] || 0
  }, [state.currentStage])

  // Auto-reset after completion
  useEffect(() => {
    if (state.currentStage === 'complete') {
      const timer = setTimeout(() => {
        // Don't clear persistent session, just reset WoF state
        setState(prev => ({
          ...prev,
          currentStage: state.persistentSession ? 'first-interaction' : 'welcome',
          selectedPath: null,
          selectedOffering: null,
          userSession: state.persistentSession ? prev.userSession : null
        }))
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [state.currentStage, state.persistentSession])

  return {
    ...state,
    createNewPath,
    selectExistingPath,
    makeChoice,
    startOver,
    getStageProgress,
    checkPersistentSession,
    requestNFCConfirmation,
    checkSmartContractInteractions
  }
} 