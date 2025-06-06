/**
 * useNFCAuthentication Hook
 * 
 * Professional React hook for managing NFC authentication state
 * Provides clean separation of concerns and reusable authentication logic
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import type { NFCVerificationState, NFCParameters, AuthenticationResult } from '../types/nfc.types'
import { NFCAuthenticationEngine } from '../utils/nfc-authentication'

export function useNFCAuthentication() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [verificationState, setVerificationState] = useState<NFCVerificationState>({
    status: 'initializing',
    progress: 0,
    currentPhase: 'Initializing secure authentication...',
    debugLogs: []
  })

  const addDebugLog = useCallback((message: string) => {
    setVerificationState(prev => ({
      ...prev,
      debugLogs: [...prev.debugLogs, `${new Date().toLocaleTimeString()}: ${message}`]
    }))
  }, [])

  const executeAuthentication = useCallback(async (params: NFCParameters) => {
    setVerificationState(prev => ({
      ...prev,
      status: 'verifying',
      progress: 0,
      currentPhase: 'Starting authentication...',
      error: undefined
    }))

    try {
      // Validate parameters first
      const validation = NFCAuthenticationEngine.validateParameters(params)
      if (!validation.valid) {
        throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`)
      }

      addDebugLog(`✅ Parameters validated - Format: ${validation.format}`)
      
      // Execute authentication flow based on format
      if (validation.format === 'decentralized') {
        await executeDecentralizedFlow(params)
      } else if (validation.format === 'legacy') {
        await executeLegacyFlow(params)
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Authentication failed'
      
      setVerificationState(prev => ({
        ...prev,
        status: 'failure',
        error: errorMessage,
        currentPhase: 'Authentication failed'
      }))
      
      addDebugLog(`❌ Authentication failed: ${errorMessage}`)
      
      toast({
        title: "Authentication Failed",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }, [addDebugLog, toast, router])

  const executeDecentralizedFlow = useCallback(async (params: NFCParameters) => {
    addDebugLog('🔄 Starting decentralized authentication flow')
    
    setVerificationState(prev => ({
      ...prev,
      progress: 25,
      currentPhase: 'Loading local identity...'
    }))
    
    await new Promise(resolve => setTimeout(resolve, 400))
    
    setVerificationState(prev => ({
      ...prev,
      progress: 50,
      currentPhase: 'Verifying device registration...'
    }))
    
    await new Promise(resolve => setTimeout(resolve, 400))
    
    setVerificationState(prev => ({
      ...prev,
      progress: 75,
      currentPhase: 'Signing challenge locally...'
    }))
    
    const result = await NFCAuthenticationEngine.authenticate(params)
    
    if (result.verified) {
      setVerificationState(prev => ({
        ...prev,
        progress: 100,
        status: 'success',
        currentPhase: 'Decentralized authentication successful!',
        chipAuthenticated: true,
        secretValid: true,
        sessionToken: result.sessionToken,
        momentId: result.momentId,
        verificationTime: Date.now()
      }))
      
      addDebugLog('✅ Decentralized authentication completed successfully')
      
      toast({
        title: "🚀 Authentication Successful!",
        description: "Your decentralized identity has been verified",
      })
      
      // Redirect after delay
      setTimeout(() => {
        router.push(`/profile?authenticated=true&source=nfc`)
      }, 1500)
      
    } else {
      throw new Error(result.error || 'Decentralized authentication failed')
    }
  }, [addDebugLog, toast, router])

  const executeLegacyFlow = useCallback(async (params: NFCParameters) => {
    addDebugLog('🔄 Starting legacy authentication flow')
    
    setVerificationState(prev => ({
      ...prev,
      progress: 20,
      currentPhase: 'Reading legacy NFC credentials...'
    }))
    
    await new Promise(resolve => setTimeout(resolve, 600))
    
    setVerificationState(prev => ({
      ...prev,
      progress: 40,
      currentPhase: 'Validating cryptographic parameters...'
    }))
    
    await new Promise(resolve => setTimeout(resolve, 400))
    
    setVerificationState(prev => ({
      ...prev,
      progress: 70,
      currentPhase: 'Verifying Ed25519 signature...'
    }))
    
    const result = await NFCAuthenticationEngine.authenticate(params)
    
    if (result.verified) {
      setVerificationState(prev => ({
        ...prev,
        progress: 100,
        status: 'success',
        currentPhase: 'Legacy authentication successful!',
        chipAuthenticated: true,
        secretValid: true,
        zkProofGenerated: true,
        sessionToken: result.sessionToken,
        momentId: result.momentId,
        verificationTime: Date.now()
      }))
      
      addDebugLog('✅ Legacy authentication completed successfully')
      
      toast({
        title: "🎉 Authentication Successful!",
        description: "Your cryptographic credentials have been verified",
      })
      
      // Redirect after delay
      setTimeout(() => {
        router.push(`/profile?authenticated=true&source=nfc`)
      }, 1500)
      
    } else {
      throw new Error(result.error || 'Legacy authentication failed')
    }
  }, [addDebugLog, toast, router])

  const resetAuthentication = useCallback(() => {
    setVerificationState({
      status: 'initializing',
      progress: 0,
      currentPhase: 'Ready for authentication...',
      debugLogs: []
    })
  }, [])

  return {
    verificationState,
    executeAuthentication,
    resetAuthentication,
    addDebugLog
  }
} 