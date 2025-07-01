/**
 * Wallet Flow Hook for Way of Flowers
 * Manages wallet connections and donation transactions
 */

import { useState, useCallback } from 'react'
import { walletIntegration, type WalletSession } from '@/lib/crypto/walletIntegration'

export interface WalletFlowState {
  walletSession: WalletSession | null
  walletConnected: boolean
  isConnecting: boolean
  donationAmount: string
  showHybridAuth: boolean
  transactionHash: string | null
  isTransacting: boolean
}

export function useWalletFlow() {
  const [state, setState] = useState<WalletFlowState>({
    walletSession: null,
    walletConnected: false,
    isConnecting: false,
    donationAmount: '0.01',
    showHybridAuth: false,
    transactionHash: null,
    isTransacting: false
  })

  const connectWallet = useCallback(async (method: 'metamask' | 'nfc') => {
    setState(prev => ({ ...prev, isConnecting: true }))
    
    try {
      let session: WalletSession | null = null
      
      if (method === 'metamask') {
        session = await walletIntegration.connectMetaMask()
      } else {
        // For NFC method, we'll need chipUID and PIN from the auth flow
        setState(prev => ({ ...prev, showHybridAuth: true, isConnecting: false }))
        return
      }
      
      if (session) {
        setState(prev => ({
          ...prev,
          walletSession: session,
          walletConnected: true,
          isConnecting: false
        }))
      } else {
        setState(prev => ({ ...prev, isConnecting: false }))
      }
    } catch (error) {
      console.error('Wallet connection failed:', error)
      setState(prev => ({ ...prev, isConnecting: false }))
    }
  }, [])

  const handleHybridAuth = useCallback(async (authResult: WalletSession | { type: 'nfc', chipUID: string }) => {
    setState(prev => ({ ...prev, showHybridAuth: false }))
    
    if ('account' in authResult) {
      // It's a WalletSession
      setState(prev => ({
        ...prev,
        walletSession: authResult,
        walletConnected: true
      }))
    } else {
      // It's NFC auth result - create NFC wallet
      try {
        const session = await walletIntegration.connectNFCEthereumAccount(
          authResult.chipUID,
          '1234' // Default PIN for demo
        )
        
        if (session) {
          setState(prev => ({
            ...prev,
            walletSession: session,
            walletConnected: true
          }))
        }
      } catch (error) {
        console.error('NFC wallet creation failed:', error)
      }
    }
  }, [])

  const makeDonation = useCallback(async (conservationChoice: any) => {
    if (!state.walletSession) return null

    setState(prev => ({ ...prev, isTransacting: true }))
    
    try {
      // Simple transaction simulation for now
      const txHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
      
      console.log('WoF simulated donation:', {
        choice: conservationChoice,
        amount: state.donationAmount,
        wallet: state.walletSession.account.address
      })
      
      setState(prev => ({
        ...prev,
        transactionHash: txHash,
        isTransacting: false
      }))
      
      return txHash
    } catch (error) {
      console.error('WoF donation failed:', error)
      setState(prev => ({ ...prev, isTransacting: false }))
      return null
    }
  }, [state.walletSession, state.donationAmount])

  const setDonationAmount = useCallback((amount: string) => {
    setState(prev => ({ ...prev, donationAmount: amount }))
  }, [])

  const disconnectWallet = useCallback(async () => {
    if (state.walletSession) {
      await walletIntegration.disconnect()
    }
    
    setState(prev => ({
      ...prev,
      walletSession: null,
      walletConnected: false,
      transactionHash: null
    }))
  }, [state.walletSession])

  const closeHybridAuth = useCallback(() => {
    setState(prev => ({ ...prev, showHybridAuth: false }))
  }, [])

  return {
    ...state,
    
    // Actions
    connectWallet,
    handleHybridAuth,
    makeDonation,
    setDonationAmount,
    disconnectWallet,
    closeHybridAuth
  }
} 