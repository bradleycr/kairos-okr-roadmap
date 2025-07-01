/**
 * Wallet Flow Hook for Way of Flowers
 * Manages wallet connections and donation transactions
 */

import { useState, useCallback, useEffect } from 'react'
import { walletIntegration, type WalletSession } from '@/lib/crypto/walletIntegration'

// Extend window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      isMetaMask?: boolean
    }
  }
}

export interface WalletFlowState {
  walletSession: WalletSession | null
  walletConnected: boolean
  isConnecting: boolean
  donationAmount: string
  showHybridAuth: boolean
  transactionHash: string | null
  isTransacting: boolean
  connectionError: string | null
  lastAttempt: number | null
  lastSuccessfulConnection: number | null
  lastFailedConnection: number | null
}

export function useWalletFlow() {
  const [state, setState] = useState<WalletFlowState>({
    walletSession: null,
    walletConnected: false,
    isConnecting: false,
    donationAmount: '0.01',
    showHybridAuth: false,
    transactionHash: null,
    isTransacting: false,
    connectionError: null,
    lastAttempt: null,
    lastSuccessfulConnection: null,
    lastFailedConnection: null
  })

  const connectWallet = useCallback(async (method: 'metamask' | 'nfc', retryCount = 0) => {
    const MAX_RETRIES = 3;
    
    try {
      setState(prev => ({ 
        ...prev, 
        isConnecting: true, 
        connectionError: null,
        lastAttempt: Date.now()
      }));
      
      let session: WalletSession | null = null;
      
      if (method === 'metamask') {
        // Enhanced MetaMask detection and connection
        if (!window.ethereum) {
          throw new Error('MetaMask not detected. Please install MetaMask to continue.');
        }
        
        // Check if MetaMask is unlocked
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length === 0) {
          // Request account access
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        }
        
        session = await walletIntegration.connectMetaMask();
      } else {
        // NFC wallet connection with enhanced error handling
        setState(prev => ({ ...prev, showHybridAuth: true, isConnecting: false }));
        return;
      }
      
      if (session) {
        // Persist connection state with expiration
        const persistData = {
          session,
          timestamp: Date.now(),
          expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        localStorage.setItem('wof-wallet-session', JSON.stringify(persistData));
        
        setState(prev => ({
          ...prev,
          walletSession: session,
          walletConnected: true,
          isConnecting: false,
          connectionError: null,
          lastSuccessfulConnection: Date.now()
        }));
        
        // Emit success event for other components
        window.dispatchEvent(new CustomEvent('wallet-connected', { 
          detail: { session, method } 
        }));
        
        console.log('✅ Wallet connected successfully:', session.account.address);
      } else {
        throw new Error('Failed to establish wallet connection');
      }
      
    } catch (error: any) {
      console.error(`Wallet connection attempt ${retryCount + 1} failed:`, error);
      
      if (retryCount < MAX_RETRIES && !error.message.includes('User rejected') && !error.message.includes('User denied')) {
        // Auto-retry with exponential backoff (only for technical failures)
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`🔄 Retrying wallet connection in ${delay}ms...`);
        
        setTimeout(() => {
          connectWallet(method, retryCount + 1);
        }, delay);
      } else {
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          connectionError: error.message || 'Connection failed. Please try again.',
          lastFailedConnection: Date.now()
        }));
        
        // Emit error event for other components
        window.dispatchEvent(new CustomEvent('wallet-connection-failed', { 
          detail: { error, method, retryCount } 
        }));
      }
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
    
    // Clear persisted connection state
    localStorage.removeItem('wof-wallet-session');
    
    setState(prev => ({
      ...prev,
      walletSession: null,
      walletConnected: false,
      transactionHash: null,
      connectionError: null
    }))
    
    // Emit disconnect event
    window.dispatchEvent(new CustomEvent('wallet-disconnected'))
  }, [state.walletSession])

  const closeHybridAuth = useCallback(() => {
    setState(prev => ({ ...prev, showHybridAuth: false }))
  }, [])

  // Auto-restore wallet connection on mount
  useEffect(() => {
    const restoreWalletConnection = async () => {
      try {
        const stored = localStorage.getItem('wof-wallet-session')
        if (!stored) return

        const persistData = JSON.parse(stored)
        
        // Check if session hasn't expired
        if (Date.now() > persistData.expiresAt) {
          localStorage.removeItem('wof-wallet-session')
          return
        }

        // Try to verify the connection is still valid
        const currentSession = walletIntegration.getCurrentSession()
        if (currentSession && currentSession.account.address === persistData.session.account.address) {
          setState(prev => ({
            ...prev,
            walletSession: currentSession,
            walletConnected: true,
            lastSuccessfulConnection: persistData.timestamp
          }))
          
          console.log('✅ Wallet session restored:', currentSession.account.address)
        }
      } catch (error) {
        console.warn('Failed to restore wallet session:', error)
        localStorage.removeItem('wof-wallet-session')
      }
    }

    restoreWalletConnection()
  }, [])

  return {
    ...state,
    connectWallet,
    handleHybridAuth,
    makeDonation,
    setDonationAmount,
    disconnectWallet,
    closeHybridAuth
  }
} 