/**
 * WoF (Way of Flowers) Flow State Management Hook
 * Handles the core logic and state for the Way of Flowers installation
 */

import { useState, useEffect, useCallback } from 'react'
import { WayOfFlowersManager, type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'
import { useNFCAuthentication } from '@/app/nfc/hooks/useNFCAuthentication'
import { useNFCParameterParser } from '@/app/nfc/hooks/useNFCParameterParser'

export type WoFStage = 'welcome' | 'auth' | 'first-interaction' | 'choice' | 'evolution' | 'complete'

export interface UserWoFSession {
  chipUID: string
  isNewUser: boolean
  sessionStarted: string
  lastInteraction: string
  ethAddress?: string
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
}

export function useWoFFlow() {
  // Initialize manager
  const [wofManager] = useState(() => new WayOfFlowersManager())
  
  // NFC hooks
  const { verificationState } = useNFCAuthentication()
  const { parsedParams } = useNFCParameterParser()
  
  // Core state
  const [state, setState] = useState<WoFFlowState>({
    currentStage: 'welcome',
    isProcessing: false,
    isSimulationMode: false,
    userSession: null,
    userPaths: [],
    selectedPath: null,
    selectedOffering: null,
    availableOfferings: wofManager.getAllCauseOfferings()
  })

  // Initialize simulation mode if needed
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const simulate = urlParams.get('simulate')
    
    if (simulate === 'true') {
      const simulationSession: UserWoFSession = {
        chipUID: urlParams.get('chipUID') || 'simulation-chip-' + Date.now(),
        isNewUser: true,
        sessionStarted: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
      }
      
      setState(prev => ({
        ...prev,
        isSimulationMode: true,
        userSession: simulationSession,
        currentStage: 'first-interaction'
      }))
    }
  }, [])

  // Handle NFC parameter changes
  useEffect(() => {
    if (parsedParams && Object.keys(parsedParams).length > 0 && state.currentStage === 'welcome') {
      setState(prev => ({ ...prev, currentStage: 'auth' }))
    }
  }, [parsedParams, state.currentStage])

  // Handle authentication success
  useEffect(() => {
    if (verificationState.status === 'success' && state.currentStage === 'auth' && parsedParams?.chipUID) {
      handleAuthenticationSuccess()
    }
  }, [verificationState.status, state.currentStage, parsedParams?.chipUID])

  // Auto-reset after completion
  useEffect(() => {
    if (state.currentStage === 'complete') {
      const timer = setTimeout(() => {
        localStorage.removeItem('wayOfFlowers_currentUser')
        setState(prev => ({
          ...prev,
          userSession: null,
          currentStage: 'welcome',
          selectedPath: null,
          selectedOffering: null
        }))
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [state.currentStage])

  const handleAuthenticationSuccess = useCallback(async () => {
    if (!parsedParams?.chipUID) return

    try {
      const existingPaths = wofManager.getUserFlowerPaths(parsedParams.chipUID)
      const isNewUser = existingPaths.length === 0

      const newUserSession: UserWoFSession = {
        chipUID: parsedParams.chipUID,
        isNewUser,
        sessionStarted: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
      }

      localStorage.setItem('wayOfFlowers_currentUser', JSON.stringify(newUserSession))
      
      setState(prev => ({
        ...prev,
        userSession: newUserSession,
        userPaths: existingPaths,
        currentStage: 'first-interaction'
      }))
    } catch (error) {
      console.error('WoF authentication success handler failed:', error)
    }
  }, [parsedParams?.chipUID, wofManager])

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
  }, [state.userSession?.chipUID, state.selectedPath, wofManager])

  const startOver = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStage: 'welcome',
      selectedPath: null,
      selectedOffering: null,
      userSession: null
    }))
    localStorage.removeItem('wayOfFlowers_currentUser')
  }, [])

  const getStageProgress = useCallback((): number => {
    switch (state.currentStage) {
      case 'welcome': return 0
      case 'auth': return 20
      case 'first-interaction': return 40
      case 'choice': return 60
      case 'evolution': return 80
      case 'complete': return 100
      default: return 0
    }
  }, [state.currentStage])

  return {
    ...state,
    verificationState,
    parsedParams,
    
    // Actions
    createNewPath,
    selectExistingPath,
    makeChoice,
    startOver,
    getStageProgress
  }
} 