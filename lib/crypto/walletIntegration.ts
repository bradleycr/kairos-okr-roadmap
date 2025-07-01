/**
 * Wallet Integration System - Web3 2025 Best Practices
 * Supports EIP-6963 wallet discovery, MetaMask SDK, and NFC-based Ethereum accounts
 * Updated for 2025 standards: Account abstraction ready, multi-chain support
 */

import { ethers } from 'ethers'
import { createWalletClient, custom, type Address } from 'viem'
import { mainnet, polygon, optimism, arbitrum, base } from 'viem/chains'

// Web3 2025 Standards
declare global {
  interface Window {
    ethereum?: any
  }
}

export interface WalletAccount {
  address: Address
  type: 'metamask' | 'walletconnect' | 'nfc-ethereum' | 'injected'
  chipUID?: string // For NFC-derived accounts
  isConnected: boolean
  chainId?: number
  ensName?: string
  // Web3 2025: Account abstraction support
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
  // Web3 2025: Enhanced session metadata
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
  // Web3 2025: Multi-chain support
  supportedChains: number[]
}

// EIP-6963 Wallet Discovery Support
interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: any
}

class WalletIntegrationManager {
  private currentSession: WalletSession | null = null
  private nfcAccounts: Map<string, NFCEthereumAccount> = new Map()
  private static instance: WalletIntegrationManager
  private discoveredWallets: Map<string, EIP6963ProviderDetail> = new Map()

  static getInstance(): WalletIntegrationManager {
    if (!WalletIntegrationManager.instance) {
      WalletIntegrationManager.instance = new WalletIntegrationManager()
    }
    return WalletIntegrationManager.instance
  }

  constructor() {
    this.loadNFCAccounts()
    this.initializeEIP6963Discovery()
  }

  // --- EIP-6963 Wallet Discovery (Web3 2025 Standard) ---
  
  private initializeEIP6963Discovery(): void {
    if (typeof window === 'undefined') return

    // Listen for wallet announcements
    window.addEventListener('eip6963:announceProvider', (event: any) => {
      const detail = event.detail as EIP6963ProviderDetail
      this.discoveredWallets.set(detail.info.uuid, detail)
      console.log('🔍 Discovered wallet:', detail.info.name)
    })

    // Request wallet announcements
    window.dispatchEvent(new Event('eip6963:requestProvider'))
  }

  getDiscoveredWallets(): EIP6963ProviderDetail[] {
    return Array.from(this.discoveredWallets.values())
  }

  // --- Enhanced MetaMask Connection (Web3 2025) ---
  
  async connectMetaMask(): Promise<WalletSession | null> {
    try {
      // First try EIP-6963 discovery for MetaMask
      const metamaskWallet = Array.from(this.discoveredWallets.values())
        .find(wallet => wallet.info.rdns === 'io.metamask')

      let provider: any
      let walletInfo: any = undefined

      if (metamaskWallet) {
        console.log('🦊 Using EIP-6963 discovered MetaMask')
        provider = metamaskWallet.provider
        walletInfo = metamaskWallet.info
      } else if (window.ethereum?.isMetaMask) {
        console.log('🦊 Using legacy window.ethereum MetaMask')
        provider = window.ethereum
      } else {
        throw new Error('MetaMask not found. Please install MetaMask browser extension.')
      }

      // Request account access with modern error handling
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      }).catch((error: any) => {
        if (error.code === 4001) {
          throw new Error('User rejected the connection request')
        } else if (error.code === -32002) {
          throw new Error('Connection request already pending')
        }
        throw error
      })

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found')
      }

      const ethersProvider = new ethers.BrowserProvider(provider)
      const signer = await ethersProvider.getSigner()
      const address = await signer.getAddress()
      const chainId = Number(await provider.request({ method: 'eth_chainId' }))

      // Enhanced ENS resolution with error handling
      let ensName: string | undefined
      try {
        if (chainId === 1) { // Only on mainnet
          ensName = await ethersProvider.lookupAddress(address) || undefined
        }
      } catch (e) {
        console.log('ENS lookup skipped or failed')
      }

      // Check for account abstraction support (Web3 2025)
      let isSmartAccount = false
      let accountAbstractionProvider = undefined
      try {
        const code = await ethersProvider.getCode(address)
        isSmartAccount = code !== '0x'
        if (isSmartAccount) {
          console.log('🔮 Smart account detected')
        }
      } catch (e) {
        console.log('Smart account check failed')
      }

      const walletAccount: WalletAccount = {
        address: address as Address,
        type: 'metamask',
        isConnected: true,
        chainId,
        ensName,
        isSmartAccount,
        accountAbstractionProvider
      }

      const session: WalletSession = {
        account: walletAccount,
        provider: ethersProvider,
        signer,
        sessionId: `metamask_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        connectedAt: Date.now(),
        lastUsed: Date.now(),
        walletInfo
      }

      this.currentSession = session
      this.saveSession()

      console.log('🦊 MetaMask connected (Web3 2025):', address)
      return session

    } catch (error) {
      console.error('❌ MetaMask connection failed:', error)
      throw error
    }
  }

  // --- Enhanced NFC-Based Ethereum Account Creation (Web3 2025) ---
  
  async createNFCEthereumAccount(chipUID: string, pin: string): Promise<NFCEthereumAccount | null> {
    try {
      // Enhanced deterministic key derivation with better entropy
      const combinedSeed = `KairOS-Ethereum-v2:${chipUID}:${pin}`
      const seedHash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(combinedSeed))
      
      // Additional entropy round for enhanced security
      const secondHash = await crypto.subtle.digest('SHA-256', new Uint8Array(seedHash))
      const privateKeyBytes = new Uint8Array(secondHash)
      
      // Create wallet from private key
      const privateKeyHex = Array.from(privateKeyBytes, byte => byte.toString(16).padStart(2, '0')).join('')
      const wallet = new ethers.Wallet(privateKeyHex)
      const address = wallet.address

      // Encrypt private key with enhanced PIN protection
      const encryptedPrivateKey = await this.encryptPrivateKey(wallet.privateKey, pin)

      // Web3 2025: Multi-chain support
      const supportedChains = [
        1,    // Ethereum Mainnet
        137,  // Polygon
        10,   // Optimism
        42161, // Arbitrum
        8453   // Base
      ]

      const nfcAccount: NFCEthereumAccount = {
        chipUID,
        address: address as Address,
        privateKey: encryptedPrivateKey,
        derivationPath: `m/44'/60'/0'/0/0`, // Standard Ethereum path
        isBackedUp: false,
        createdAt: Date.now(),
        supportedChains
      }

      this.nfcAccounts.set(chipUID, nfcAccount)
      this.saveNFCAccounts()

      console.log('🏷️ NFC Ethereum account created (Web3 2025):', address)
      console.log('🌐 Supported chains:', supportedChains.length)
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

      // Web3 2025: Enhanced RPC provider selection
      const providers = [
        'https://eth-mainnet.g.alchemy.com/v2/demo',
        'https://cloudflare-eth.com',
        'https://ethereum.publicnode.com'
      ]
      
      // Try providers in order until one works
      let provider: ethers.JsonRpcProvider | null = null
      for (const rpcUrl of providers) {
        try {
          const testProvider = new ethers.JsonRpcProvider(rpcUrl)
          await testProvider.getBlockNumber() // Test connection
          provider = testProvider
          break
        } catch (e) {
          console.log(`RPC ${rpcUrl} failed, trying next...`)
        }
      }

      if (!provider) {
        throw new Error('All RPC providers failed')
      }

      const signer = wallet.connect(provider)

      // Check for smart account features
      let isSmartAccount = false
      try {
        const code = await provider.getCode(nfcAccount.address)
        isSmartAccount = code !== '0x'
      } catch (e) {
        console.log('Smart account check failed')
      }

      const walletAccount: WalletAccount = {
        address: nfcAccount.address,
        type: 'nfc-ethereum',
        chipUID,
        isConnected: true,
        chainId: 1, // Mainnet
        isSmartAccount
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

      console.log('🏷️ NFC Ethereum account connected (Web3 2025):', nfcAccount.address)
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

  // --- Enhanced Encryption (Web3 2025 Security Standards) ---
  
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
    
    // Enhanced PBKDF2 parameters (Web3 2025 standards)
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 600000, // Increased from 100000 for 2025 security
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
}

// Export singleton
export const walletIntegration = WalletIntegrationManager.getInstance()

// Export types
export type { 
  WalletAccount as WalletAccountType, 
  WalletSession as WalletSessionType, 
  NFCEthereumAccount as NFCEthereumAccountType 
} 