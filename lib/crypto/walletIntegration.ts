/**
 * Wallet Integration System - Hybrid Authentication
 * Supports both traditional wallets (MetaMask/WalletConnect) and NFC-based Ethereum accounts
 * Inspired by Cursive Connections and CitizenWallet patterns
 */

import { ethers } from 'ethers'
import { createWalletClient, custom, type Address } from 'viem'
import { mainnet, polygon, optimism, arbitrum } from 'viem/chains'

export interface WalletAccount {
  address: Address
  type: 'metamask' | 'walletconnect' | 'nfc-ethereum' | 'injected'
  chipUID?: string // For NFC-derived accounts
  isConnected: boolean
  chainId?: number
  ensName?: string
}

export interface WalletSession {
  account: WalletAccount
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  sessionId: string
  connectedAt: number
  lastUsed: number
}

export interface NFCEthereumAccount {
  chipUID: string
  address: Address
  privateKey: string // Encrypted with PIN
  derivationPath: string
  isBackedUp: boolean
  createdAt: number
}

class WalletIntegrationManager {
  private currentSession: WalletSession | null = null
  private nfcAccounts: Map<string, NFCEthereumAccount> = new Map()
  private static instance: WalletIntegrationManager

  static getInstance(): WalletIntegrationManager {
    if (!WalletIntegrationManager.instance) {
      WalletIntegrationManager.instance = new WalletIntegrationManager()
    }
    return WalletIntegrationManager.instance
  }

  // --- Traditional Wallet Connection (MetaMask/Injected) ---
  
  async connectMetaMask(): Promise<WalletSession | null> {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not installed')
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      const chainId = Number(await window.ethereum.request({ method: 'eth_chainId' }))

      // Try to get ENS name
      let ensName: string | undefined
      try {
        ensName = await provider.lookupAddress(address) || undefined
      } catch (e) {
        // ENS lookup failed, continue without it
      }

      const walletAccount: WalletAccount = {
        address: address as Address,
        type: 'metamask',
        isConnected: true,
        chainId,
        ensName
      }

      const session: WalletSession = {
        account: walletAccount,
        provider,
        signer,
        sessionId: `metamask_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        connectedAt: Date.now(),
        lastUsed: Date.now()
      }

      this.currentSession = session
      this.saveSession()

      console.log('🦊 MetaMask connected:', address)
      return session

    } catch (error) {
      console.error('❌ MetaMask connection failed:', error)
      return null
    }
  }

  // --- NFC-Based Ethereum Account Creation (CitizenWallet Style) ---
  
  async createNFCEthereumAccount(chipUID: string, pin: string): Promise<NFCEthereumAccount | null> {
    try {
      // Derive private key from chipUID + PIN (deterministic like our DID:Key system)
      const combinedSeed = `${chipUID}_${pin}_ethereum`
      const seedHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combinedSeed))
      const privateKeyBytes = new Uint8Array(seedHash)
      
      // Create wallet from private key
      const privateKeyHex = Array.from(privateKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('')
      const wallet = new ethers.Wallet(privateKeyHex)
      const address = wallet.address

      // Encrypt private key with PIN for storage
      const encryptedPrivateKey = await this.encryptPrivateKey(wallet.privateKey, pin)

      const nfcAccount: NFCEthereumAccount = {
        chipUID,
        address: address as Address,
        privateKey: encryptedPrivateKey,
        derivationPath: `m/44'/60'/0'/0/0`, // Standard Ethereum path
        isBackedUp: false,
        createdAt: Date.now()
      }

      this.nfcAccounts.set(chipUID, nfcAccount)
      this.saveNFCAccounts()

      console.log('🏷️ NFC Ethereum account created:', address)
      return nfcAccount

    } catch (error) {
      console.error('❌ Failed to create NFC Ethereum account:', error)
      return null
    }
  }

  async connectNFCEthereumAccount(chipUID: string, pin: string): Promise<WalletSession | null> {
    try {
      let nfcAccount = this.nfcAccounts.get(chipUID)
      
      // Create account if it doesn't exist
      if (!nfcAccount) {
        nfcAccount = await this.createNFCEthereumAccount(chipUID, pin) || undefined
        if (!nfcAccount) return null
      }

      // Decrypt private key
      const privateKey = await this.decryptPrivateKey(nfcAccount.privateKey, pin)
      const wallet = new ethers.Wallet(privateKey)

      // Create provider (use default public RPC for now)
      const provider = new ethers.JsonRpcProvider('https://eth-mainnet.g.alchemy.com/v2/demo')
      const signer = wallet.connect(provider) as ethers.JsonRpcSigner

      const walletAccount: WalletAccount = {
        address: nfcAccount.address,
        type: 'nfc-ethereum',
        chipUID,
        isConnected: true,
        chainId: 1 // Mainnet
      }

      const session: WalletSession = {
        account: walletAccount,
        provider: provider as ethers.BrowserProvider,
        signer,
        sessionId: `nfc_eth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        connectedAt: Date.now(),
        lastUsed: Date.now()
      }

      this.currentSession = session
      this.saveSession()

      console.log('🏷️ NFC Ethereum account connected:', nfcAccount.address)
      return session

    } catch (error) {
      console.error('❌ Failed to connect NFC Ethereum account:', error)
      return null
    }
  }

  // --- Smart Contract Interactions ---
  
  async sendTransaction(to: Address, value: string, data?: string): Promise<string | null> {
    try {
      if (!this.currentSession?.signer) {
        throw new Error('No wallet connected')
      }

      const transaction = {
        to,
        value: ethers.parseEther(value),
        data: data || '0x'
      }

      const txResponse = await this.currentSession.signer.sendTransaction(transaction)
      await txResponse.wait()

      console.log('📤 Transaction sent:', txResponse.hash)
      return txResponse.hash

    } catch (error) {
      console.error('❌ Transaction failed:', error)
      return null
    }
  }

  async executeSmartContract(
    contractAddress: Address,
    abi: any[],
    functionName: string,
    args: any[] = [],
    value: string = '0'
  ): Promise<string | null> {
    try {
      if (!this.currentSession?.signer) {
        throw new Error('No wallet connected')
      }

      const contract = new ethers.Contract(contractAddress, abi, this.currentSession.signer)
      const txResponse = await contract[functionName](...args, {
        value: value !== '0' ? ethers.parseEther(value) : undefined
      })

      await txResponse.wait()

      console.log('📜 Smart contract executed:', txResponse.hash)
      return txResponse.hash

    } catch (error) {
      console.error('❌ Smart contract execution failed:', error)
      return null
    }
  }

  // --- Session Management ---
  
  getCurrentSession(): WalletSession | null {
    return this.currentSession
  }

  isConnected(): boolean {
    return this.currentSession?.account.isConnected || false
  }

  async disconnect(): Promise<void> {
    this.currentSession = null
    localStorage.removeItem('kairos_wallet_session')
    console.log('👋 Wallet disconnected')
  }

  // --- Storage ---
  
  private saveSession(): void {
    if (this.currentSession) {
      const sessionData = {
        account: this.currentSession.account,
        sessionId: this.currentSession.sessionId,
        connectedAt: this.currentSession.connectedAt,
        lastUsed: this.currentSession.lastUsed
      }
      localStorage.setItem('kairos_wallet_session', JSON.stringify(sessionData))
    }
  }

  private saveNFCAccounts(): void {
    const accountsData = Array.from(this.nfcAccounts.entries())
    localStorage.setItem('kairos_nfc_ethereum_accounts', JSON.stringify(accountsData))
  }

  private loadNFCAccounts(): void {
    try {
      const stored = localStorage.getItem('kairos_nfc_ethereum_accounts')
      if (stored) {
        const accountsData = JSON.parse(stored)
        this.nfcAccounts = new Map(accountsData)
      }
    } catch (error) {
      console.error('❌ Failed to load NFC accounts:', error)
    }
  }

  // --- Encryption Helpers ---
  
  private async encryptPrivateKey(privateKey: string, pin: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(privateKey)
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('kairos_nfc_ethereum'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    return JSON.stringify({
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    })
  }

  private async decryptPrivateKey(encryptedData: string, pin: string): Promise<string> {
    const { encrypted, iv } = JSON.parse(encryptedData)
    const encoder = new TextEncoder()
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('kairos_nfc_ethereum'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(encrypted)
    )

    return new TextDecoder().decode(decrypted)
  }

  // Initialize on creation
  constructor() {
    this.loadNFCAccounts()
  }
}

// Export singleton
export const walletIntegration = WalletIntegrationManager.getInstance()

// Export types
export type { 
  WalletAccount as WalletAccountType, 
  WalletSession as WalletSessionType, 
  NFCEthereumAccount as NFCEthereumAccountType 
} 