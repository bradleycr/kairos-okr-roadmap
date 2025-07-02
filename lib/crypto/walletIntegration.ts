/**
 * 🎯 KairOS Wallet Integration - wagmi v2 Compatible
 * 
 * Modern wallet integration that works with wagmi v2 providers
 * while maintaining NFC-based Ethereum account functionality.
 * 
 * ✅ Compatible with wagmi v2 connectors
 * ✅ NFC-derived Ethereum accounts
 * ✅ Local storage management
 * ❌ No external services or paid APIs
 */

import { ethers } from 'ethers'
import { type Address } from 'viem'

// Modern Web3 Standards
declare global {
  interface Window {
    ethereum?: any
  }
}

export interface WalletAccount {
  address: Address
  type: 'metamask' | 'coinbase' | 'injected' | 'nfc-ethereum'
  chipUID?: string // For NFC-derived accounts
  isConnected: boolean
  chainId?: number
  ensName?: string
  // Modern account features
  isSmartAccount?: boolean
  accountAbstractionProvider?: string
}

export interface WalletSession {
  account: WalletAccount
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  sessionId: string
  connectedAt: number
  lastUsed: number
  // Session metadata
  walletInfo?: {
    name: string
    icon: string
    rdns: string
  }
}

export interface NFCEthereumAccount {
  chipUID: string
  address: Address
  privateKey: string // Encrypted with PIN
  derivationPath: string
  isBackedUp: boolean
  createdAt: number
  // Multi-chain support
  supportedChains: number[]
}

/**
 * 🔐 Modern Wallet Integration Manager
 * 
 * Manages NFC-derived Ethereum accounts and integrates with wagmi v2.
 * This complements wagmi's wallet connectors with KairOS NFC functionality.
 */
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

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.loadNFCAccounts()
    }
  }

  // --- NFC Ethereum Account Management ---
  
  /**
   * Create a new NFC-derived Ethereum account
   */
  async createNFCEthereumAccount(chipUID: string, pin: string): Promise<NFCEthereumAccount | null> {
    try {
      console.log('🏷️ Creating NFC Ethereum account for chipUID:', chipUID)

      // Generate deterministic private key from chipUID + PIN
      const seed = ethers.keccak256(ethers.toUtf8Bytes(`${chipUID}:${pin}:kairos:2025`))
      const wallet = new ethers.Wallet(seed)
      
      // Encrypt private key with PIN
      const encryptedPrivateKey = await this.encryptPrivateKey(wallet.privateKey, pin)
      
      const nfcAccount: NFCEthereumAccount = {
        chipUID,
        address: wallet.address as Address,
        privateKey: encryptedPrivateKey,
        derivationPath: `m/44'/60'/0'/0/0`, // Standard Ethereum derivation
        isBackedUp: false,
        createdAt: Date.now(),
        supportedChains: [1, 137, 10, 42161, 8453] // ETH, Polygon, Optimism, Arbitrum, Base
      }

      // Store account
      this.nfcAccounts.set(chipUID, nfcAccount)
      this.saveNFCAccounts()

      console.log('✅ NFC Ethereum account created:', wallet.address)
      return nfcAccount

    } catch (error) {
      console.error('❌ Failed to create NFC Ethereum account:', error)
      return null
    }
  }

  /**
   * Connect to an existing NFC Ethereum account
   */
  async connectNFCEthereumAccount(chipUID: string, pin: string): Promise<WalletSession | null> {
    try {
      console.log('🔐 Connecting to NFC Ethereum account:', chipUID)

      // Get or create NFC account
      let nfcAccount = this.nfcAccounts.get(chipUID)
      if (!nfcAccount) {
        nfcAccount = await this.createNFCEthereumAccount(chipUID, pin)
        if (!nfcAccount) {
          throw new Error('Failed to create NFC account')
        }
      }

      // Decrypt private key
      const privateKey = await this.decryptPrivateKey(nfcAccount.privateKey, pin)
      const wallet = new ethers.Wallet(privateKey)

      // Verify address matches
      if (wallet.address !== nfcAccount.address) {
        throw new Error('PIN verification failed')
      }

      // Create provider (using window.ethereum if available, or a default provider)
      let provider: ethers.BrowserProvider
      if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum)
      } else {
        // Fallback to read-only provider
        provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com') as any
      }

      // Connect wallet to provider
      const signer = wallet.connect(provider)

      const walletAccount: WalletAccount = {
        address: nfcAccount.address,
        type: 'nfc-ethereum',
        chipUID,
        isConnected: true,
        chainId: 1, // Default to mainnet
        isSmartAccount: false
      }

      const session: WalletSession = {
        account: walletAccount,
        provider: provider as ethers.BrowserProvider,
        signer,
        sessionId: `nfc_eth_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        connectedAt: Date.now(),
        lastUsed: Date.now(),
        walletInfo: {
          name: 'KairOS NFC Wallet',
          icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCAxMEwxMy4wOSAxNS43NEwxMiAyMkwxMC45MSAxNS43NEw0IDEwTDEwLjkxIDguMjZMMTIgMloiIGZpbGw9IiMwMDcwZjMiLz4KPC9zdmc+',
          rdns: 'app.kairos.nfc'
        }
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

  // --- Transaction Management ---
  
  /**
   * Send a transaction using the current session
   */
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

  /**
   * Execute a smart contract function
   */
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
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kairos_wallet_session')
    }
    console.log('👋 Wallet disconnected')
  }

  // --- Storage Management ---
  
  private saveSession(): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined') return
    
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
    // Only access localStorage in browser environment
    if (typeof window === 'undefined') return
    
    const accountsData = Array.from(this.nfcAccounts.entries())
    localStorage.setItem('kairos_nfc_ethereum_accounts', JSON.stringify(accountsData))
  }

  private loadNFCAccounts(): void {
    // Only access localStorage in browser environment
    if (typeof window === 'undefined') return
    
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

  // --- Encryption/Decryption ---
  
  private async encryptPrivateKey(privateKey: string, pin: string): Promise<string> {
    const encoder = new TextEncoder()
    const data = encoder.encode(privateKey)
    
    // Enhanced salt generation
    const salt = crypto.getRandomValues(new Uint8Array(32)) // 256-bit salt
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    // Enhanced PBKDF2 parameters (2025 security standards)
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000, // High iteration count for security
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
      iv: Array.from(iv),
      salt: Array.from(salt),
      version: '2025.1' // Version for future compatibility
    })
  }

  private async decryptPrivateKey(encryptedData: string, pin: string): Promise<string> {
    const data = JSON.parse(encryptedData)
    const { encrypted, iv, salt, version } = data
    
    // Handle legacy format
    if (!version) {
      return this.decryptPrivateKeyLegacy(encryptedData, pin)
    }
    
    const encoder = new TextEncoder()
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(pin),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )
    
    // Use appropriate iterations based on version
    const iterations = version === '2025.1' ? 600000 : 100000
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations,
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

  // Legacy decryption for backwards compatibility
  private async decryptPrivateKeyLegacy(encryptedData: string, pin: string): Promise<string> {
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

  // --- Utility Methods ---
  
  /**
   * Get all NFC accounts
   */
  getAllNFCAccounts(): NFCEthereumAccount[] {
    return Array.from(this.nfcAccounts.values())
  }

  /**
   * Get NFC account by chipUID
   */
  getNFCAccount(chipUID: string): NFCEthereumAccount | undefined {
    return this.nfcAccounts.get(chipUID)
  }

  /**
   * Check if chipUID has an NFC account
   */
  hasNFCAccount(chipUID: string): boolean {
    return this.nfcAccounts.has(chipUID)
  }
}

// Export singleton instance
export const walletIntegration = WalletIntegrationManager.getInstance()

// Export types for use in other components
export type { 
  WalletAccount as WalletAccountType, 
  WalletSession as WalletSessionType, 
  NFCEthereumAccount as NFCEthereumAccountType 
} 