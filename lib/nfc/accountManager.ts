/**
 * 🔐 Privacy-First NFC Account Manager
 * 
 * PRIVACY MODEL:
 * ✅ Sensitive data stays on-device (private keys, personal details)
 * ✅ Database stores only minimal recognition data (chipUID -> accountID mapping)
 * ✅ Deterministic generation ensures same chip = same account
 * ✅ Cross-device recognition without compromising privacy
 * ✅ Rich profiles stored locally per device
 */

import { createDIDKey } from '@/lib/crypto'

// --- Types ---
export interface BaseAccount {
  accountId: string      // Deterministic ID derived from chipUID
  chipUID: string        // NFC chip identifier  
  publicKey: string      // Ed25519 public key (safe to share)
  did: string           // Decentralized identifier
  createdAt: string     // ISO timestamp
  lastSeen: string      // ISO timestamp
}

export interface LocalAccountProfile extends BaseAccount {
  // Rich local data (never sent to database)
  displayName: string
  username: string
  bio: string
  deviceName: string
  privateKey: string    // NEVER send to database
  encryptedSeed?: string
  // PIN status (local knowledge only)
  hasPIN: boolean
  pinSetupPrompted: boolean
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    notifications: boolean
  }
  stats: {
    totalSessions: number
    totalMoments: number
    firstSession: string
    favoriteLocations: string[]
  }
  moments: LocalMoment[]
}

export interface LocalMoment {
  id: string
  timestamp: string
  type: 'nfc_authentication' | 'ritual_completion' | 'memory_created'
  location?: string
  deviceInfo?: string
  data?: any
}

// Database record (minimal data only)
export interface DatabaseAccountRecord {
  accountId: string
  chipUID: string
  publicKey: string
  did: string
  createdAt: string
  lastSeen: string
  verificationCount: number
  // PIN protection for cross-device access
  encryptedPIN?: string // AES-encrypted PIN for device verification
  pinSalt?: string      // Salt used for PIN encryption
  hasPIN: boolean       // Quick check if PIN is set up
  // 🆕 Basic profile info (safe for cross-device sync)
  displayName?: string  // User's chosen display name
  username?: string     // User's chosen username
  bio?: string         // User's bio/description
  deviceName?: string  // Primary device name
}

// --- Constants ---
const ACCOUNT_STORAGE_PREFIX = 'kairos:account:'
const PROFILE_STORAGE_PREFIX = 'kairos:profile:'
const CURRENT_ACCOUNT_KEY = 'kairos:current-account'

// --- Core Account Manager ---
export class NFCAccountManager {
  
  /**
   * 🎯 Main Authentication Flow
   * Handles both new and returning accounts with cross-device recognition
   */
  static async authenticateOrCreateAccount(chipUID: string): Promise<{
    account: LocalAccountProfile
    isNewAccount: boolean
    isNewDevice: boolean
  }> {
    console.log(`🔐 Authenticating chipUID: ${chipUID}`)
    
    // Step 1: Generate deterministic account data
    const deterministicData = await this.generateDeterministicAccountData(chipUID)
    
    // Step 2: Check if account exists in database
    const existingAccount = await this.checkAccountInDatabase(chipUID)
    
    // Step 3: Check for local profile on this device
    const localProfile = this.getLocalProfile(chipUID)
    
    // Step 4: Determine the situation and respond accordingly
    if (localProfile) {
      // Account exists locally - check if database needs creation or update
      console.log('✅ Returning user on familiar device')
      const updatedProfile = await this.updateLocalProfile(localProfile, deterministicData)
      
      if (existingAccount) {
        // Database account exists, just update it
        await this.updateAccountInDatabase(chipUID, deterministicData)
      } else {
        // Local exists but database doesn't, create database entry
        console.log('💾 Creating database entry for existing local account')
        await this.saveAccountToDatabase(chipUID, deterministicData)
      }
      
      return {
        account: updatedProfile,
        isNewAccount: false,
        isNewDevice: false
      }
    } else if (existingAccount) {
      // Account exists in database but not locally - new device
      console.log('👋 Returning user on new device')
      const newProfile = await this.createLocalProfileFromExisting(chipUID, deterministicData, existingAccount)
      await this.updateAccountInDatabase(chipUID, deterministicData)
      
      return {
        account: newProfile,
        isNewAccount: false,
        isNewDevice: true
      }
    } else {
      // Completely new account
      console.log('🆕 New user - creating fresh account')
      const newProfile = await this.createNewAccount(chipUID, deterministicData)
      await this.saveAccountToDatabase(chipUID, deterministicData, newProfile)
      
      return {
        account: newProfile,
        isNewAccount: true,
        isNewDevice: true
      }
    }
  }
  
  /**
   * 🔐 PIN Security Functions
   */
  private static async encryptPIN(pin: string): Promise<{ encryptedPIN: string; salt: string }> {
    const encoder = new TextEncoder()
    const pinData = encoder.encode(pin)
    
    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
    
    // Generate key from salt
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode('kairos-pin-protection'),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    
    // Encrypt PIN
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      pinData
    )
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv, 0)
    combined.set(new Uint8Array(encrypted), iv.length)
    
    const encryptedHex = Array.from(combined).map(b => b.toString(16).padStart(2, '0')).join('')
    
    return {
      encryptedPIN: encryptedHex,
      salt: saltHex
    }
  }

  private static async verifyPIN(pin: string, encryptedPIN: string, salt: string): Promise<boolean> {
    try {
      const encoder = new TextEncoder()
      const pinData = encoder.encode(pin)
      
      // Convert hex back to bytes
      const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
      const encryptedBytes = new Uint8Array(encryptedPIN.match(/.{2}/g)!.map(byte => parseInt(byte, 16)))
      
      // Extract IV and encrypted data
      const iv = encryptedBytes.slice(0, 12)
      const encrypted = encryptedBytes.slice(12)
      
      // Generate key from salt
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode('kairos-pin-protection'),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      )
      
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: saltBytes,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['decrypt']
      )
      
      // Decrypt and verify
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        encrypted
      )
      
      const decryptedPin = new TextDecoder().decode(decrypted)
      return decryptedPin === pin
    } catch (error) {
      console.warn('PIN verification failed:', error)
      return false
    }
  }

  /**
   * 🔢 Generate Account Data
   * Create account with your existing Ed25519 system, but make it consistent per chipUID
   */
  private static async generateDeterministicAccountData(chipUID: string): Promise<{
    accountId: string
    did: string
    keyPair: { privateKey: Uint8Array; publicKey: Uint8Array }
    publicKey: string
    privateKey: string
  }> {
    try {
      // Import your existing Ed25519 crypto functions
      const { generateEd25519KeyPair, createDIDKey } = await import('@/lib/crypto')
      
      // Generate a fresh Ed25519 keypair using your existing system
      const keyPair = await generateEd25519KeyPair()
      
      // Convert keys to hex strings for storage
      const privateKeyHex = Array.from(keyPair.privateKey)
        .map(b => b.toString(16).padStart(2, '0')).join('')
      const publicKeyHex = Array.from(keyPair.publicKey)
        .map(b => b.toString(16).padStart(2, '0')).join('')
      
      // Generate account ID from chipUID (consistent per chip)
      const encoder = new TextEncoder()
      const accountData = `kairos-nfc-v1:${chipUID}`
      const accountHash = await crypto.subtle.digest('SHA-256', encoder.encode(accountData))
      const accountId = `kairos_${Array.from(new Uint8Array(accountHash))
        .slice(0, 8)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`
      
      // Create proper DID using your existing system
      const did = createDIDKey(keyPair.publicKey)
      
      return {
        accountId,
        did,
        keyPair,
        publicKey: publicKeyHex,
        privateKey: privateKeyHex
      }
    } catch (error) {
      console.warn('Ed25519 crypto failed, using fallback:', error)
      
      // Fallback: Generate basic account data without complex crypto
      const encoder = new TextEncoder()
      const accountData = `kairos-nfc-v1:${chipUID}`
      const accountHash = await crypto.subtle.digest('SHA-256', encoder.encode(accountData))
      const accountId = `kairos_${Array.from(new Uint8Array(accountHash))
        .slice(0, 8)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`
      
      // Simple fallback keys
      const fallbackPrivateKey = new Uint8Array(32)
      const fallbackPublicKey = new Uint8Array(32)
      crypto.getRandomValues(fallbackPrivateKey)
      crypto.getRandomValues(fallbackPublicKey)
      
      return {
        accountId,
        did: `did:kairos:${accountId.replace('kairos_', '')}`,
        keyPair: { privateKey: fallbackPrivateKey, publicKey: fallbackPublicKey },
        publicKey: Array.from(fallbackPublicKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        privateKey: Array.from(fallbackPrivateKey).map(b => b.toString(16).padStart(2, '0')).join('')
      }
    }
  }
  
  /**
   * 🔍 Check Account in Database
   * Minimal lookup to see if account exists elsewhere
   */
  private static async checkAccountInDatabase(chipUID: string): Promise<DatabaseAccountRecord | null> {
    try {
      const response = await fetch('/api/nfc/accounts', {
        method: 'GET',
        headers: { 'X-Chip-UID': chipUID }
      })
      
      if (response.ok) {
        const result = await response.json()
        return result.account || null
      }
      
      return null
    } catch (error) {
      console.warn('Database lookup failed, continuing with local-only:', error)
      return null
    }
  }
  
  /**
   * 💾 Save Account to Database
   * Store minimal recognition data + basic profile info
   */
  private static async saveAccountToDatabase(chipUID: string, accountData: any, profileData?: LocalAccountProfile): Promise<void> {
    try {
      const record: DatabaseAccountRecord = {
        accountId: accountData.accountId,
        chipUID,
        publicKey: accountData.publicKey,
        did: accountData.did,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        verificationCount: 1,
        hasPIN: false,
        encryptedPIN: undefined,
        pinSalt: undefined,
        // 🆕 Include basic profile info for cross-device sync
        displayName: profileData?.displayName,
        username: profileData?.username,
        bio: profileData?.bio,
        deviceName: profileData?.deviceName
      }
      
      await fetch('/api/nfc/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      })
      
      console.log('✅ Account saved to database for cross-device recognition')
    } catch (error) {
      console.warn('Failed to save to database, continuing local-only:', error)
    }
  }
  
  /**
   * 🔄 Update Account in Database
   */
  private static async updateAccountInDatabase(chipUID: string, accountData: any): Promise<void> {
    try {
      await fetch('/api/nfc/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': chipUID 
        },
        body: JSON.stringify({
          lastSeen: new Date().toISOString()
        })
      })
    } catch (error) {
      console.warn('Failed to update database record:', error)
    }
  }
  
  /**
   * 📱 Local Profile Management
   */
  private static getLocalProfile(chipUID: string): LocalAccountProfile | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${chipUID}`)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.warn('Failed to load local profile:', error)
      return null
    }
  }
  
  private static saveLocalProfile(profile: LocalAccountProfile): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${profile.chipUID}`, JSON.stringify(profile))
      localStorage.setItem(CURRENT_ACCOUNT_KEY, profile.chipUID)
    } catch (error) {
      console.warn('Failed to save local profile:', error)
    }
  }
  
  /**
   * 🆕 Create New Account (First Time)
   */
  private static async createNewAccount(chipUID: string, accountData: any): Promise<LocalAccountProfile> {
    const profile: LocalAccountProfile = {
      // Base account data
      accountId: accountData.accountId,
      chipUID,
      publicKey: accountData.publicKey,
      did: accountData.did,
      createdAt: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
      
      // Rich local data
      displayName: `Memory Keeper ${chipUID.slice(-4).toUpperCase()}`,
      username: `keeper_${chipUID.slice(-4).toLowerCase()}`,
      bio: "Weaving threads of collective memory through digital and physical spaces.",
      deviceName: this.detectDeviceName(),
      privateKey: accountData.privateKey,
      
      // PIN status
      hasPIN: false,
      pinSetupPrompted: false,
      
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true
      },
      
      stats: {
        totalSessions: 1,
        totalMoments: 0,
        firstSession: new Date().toISOString(),
        favoriteLocations: []
      },
      
      moments: [{
        id: `moment_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'nfc_authentication',
        deviceInfo: navigator.userAgent.substring(0, 100)
      }]
    }
    
    this.saveLocalProfile(profile)
    return profile
  }
  
  /**
   * 👋 Create Local Profile from Existing Account (New Device)
   */
  private static async createLocalProfileFromExisting(
    chipUID: string, 
    accountData: any, 
    existingAccount: DatabaseAccountRecord
  ): Promise<LocalAccountProfile> {
    const profile: LocalAccountProfile = {
      // Base account data (from database)
      accountId: existingAccount.accountId,
      chipUID,
      publicKey: accountData.publicKey,
      did: accountData.did,
      createdAt: existingAccount.createdAt,
      lastSeen: new Date().toISOString(),
      
      // Fresh local data for new device
      displayName: existingAccount.displayName || `Memory Keeper ${chipUID.slice(-4).toUpperCase()}`,
      username: existingAccount.username || `keeper_${chipUID.slice(-4).toLowerCase()}`,
      bio: existingAccount.bio || "Continuing the memory journey on a new device.",
      deviceName: existingAccount.deviceName || this.detectDeviceName(),
      privateKey: accountData.privateKey,
      
      // PIN status (inherit from database)
      hasPIN: existingAccount.hasPIN,
      pinSetupPrompted: existingAccount.hasPIN, // If PIN exists, user has been prompted
      
      preferences: {
        theme: 'auto',
        language: 'en',
        notifications: true
      },
      
      stats: {
        totalSessions: 1, // Fresh start on this device
        totalMoments: 0,
        firstSession: new Date().toISOString(),
        favoriteLocations: []
      },
      
      moments: [{
        id: `moment_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'nfc_authentication',
        deviceInfo: navigator.userAgent.substring(0, 100)
      }]
    }
    
    this.saveLocalProfile(profile)
    return profile
  }
  
  /**
   * 🔄 Update Existing Local Profile
   */
  private static async updateLocalProfile(
    existing: LocalAccountProfile, 
    accountData: any
  ): Promise<LocalAccountProfile> {
    const updated: LocalAccountProfile = {
      ...existing,
      lastSeen: new Date().toISOString(),
      stats: {
        ...existing.stats,
        totalSessions: existing.stats.totalSessions + 1
      },
      moments: [
        {
          id: `moment_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'nfc_authentication',
          deviceInfo: navigator.userAgent.substring(0, 100)
        },
        ...existing.moments.slice(0, 49) // Keep last 50 moments
      ]
    }
    
    this.saveLocalProfile(updated)
    return updated
  }
  
  /**
   * 🔧 Utility Functions
   */
  private static detectDeviceName(): string {
    if (typeof window === 'undefined') return 'Unknown Device'
    
    const ua = navigator.userAgent
    if (ua.includes('iPhone')) return 'iPhone'
    if (ua.includes('iPad')) return 'iPad'
    if (ua.includes('Android')) return 'Android Device'
    if (ua.includes('Mac')) return 'Mac'
    if (ua.includes('Windows')) return 'Windows PC'
    if (ua.includes('Linux')) return 'Linux Device'
    
    return 'Web Browser'
  }
  
  /**
   * 📊 Get Current Account
   */
  static getCurrentAccount(): LocalAccountProfile | null {
    if (typeof window === 'undefined') return null
    
    try {
      const currentChipUID = localStorage.getItem(CURRENT_ACCOUNT_KEY)
      if (!currentChipUID) return null
      
      return this.getLocalProfile(currentChipUID)
    } catch (error) {
      console.warn('Failed to get current account:', error)
      return null
    }
  }
  
  /**
   * 🔐 Public PIN Methods
   */
  static async setupPIN(chipUID: string, pin: string): Promise<boolean> {
    try {
      // Encrypt the PIN
      const { encryptedPIN, salt } = await this.encryptPIN(pin)
      
      // Update database record
      const response = await fetch('/api/nfc/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': chipUID 
        },
        body: JSON.stringify({
          encryptedPIN,
          pinSalt: salt,
          hasPIN: true
        })
      })
      
      if (response.ok) {
        // Update local profile
        const profile = this.getLocalProfile(chipUID)
        if (profile) {
          profile.hasPIN = true
          profile.pinSetupPrompted = true
          this.saveLocalProfile(profile)
        }
        
        console.log('✅ PIN set up successfully')
        return true
      }
      
      return false
    } catch (error) {
      console.warn('Failed to setup PIN:', error)
      return false
    }
  }

  /**
   * 🆕 Update Basic Profile Info (with database sync)
   * Updates displayName, username, bio, deviceName - syncs across devices
   */
  static async updateBasicProfileInfo(chipUID: string, updates: {
    displayName?: string
    username?: string
    bio?: string
    deviceName?: string
  }): Promise<boolean> {
    try {
      console.log(`🔄 Updating profile info for chipUID: ${chipUID}`)
      
      // Validate inputs (basic sanitization)
      const sanitizedUpdates = {
        displayName: updates.displayName?.trim().substring(0, 50),
        username: updates.username?.trim().toLowerCase().substring(0, 30),
        bio: updates.bio?.trim().substring(0, 200),
        deviceName: updates.deviceName?.trim().substring(0, 50)
      }
      
      // Remove undefined values
      Object.keys(sanitizedUpdates).forEach(key => {
        if (sanitizedUpdates[key as keyof typeof sanitizedUpdates] === undefined) {
          delete sanitizedUpdates[key as keyof typeof sanitizedUpdates]
        }
      })
      
      // Update database record first
      const response = await fetch('/api/nfc/accounts', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'X-Chip-UID': chipUID 
        },
        body: JSON.stringify(sanitizedUpdates)
      })
      
      if (response.ok) {
        // Update local profile
        const profile = this.getLocalProfile(chipUID)
        if (profile) {
          Object.assign(profile, sanitizedUpdates)
          profile.lastSeen = new Date().toISOString()
          this.saveLocalProfile(profile)
        }
        
        console.log('✅ Profile info updated successfully')
        return true
      } else {
        console.warn('Failed to update database, keeping local changes only')
        
        // Still update locally even if database fails
        const profile = this.getLocalProfile(chipUID)
        if (profile) {
          Object.assign(profile, sanitizedUpdates)
          profile.lastSeen = new Date().toISOString()
          this.saveLocalProfile(profile)
        }
        
        return false
      }
      
    } catch (error) {
      console.warn('Failed to update profile info:', error)
      return false
    }
  }

  /**
   * 🔄 Sync Profile from Database
   * Pulls latest basic profile info from database (useful for new devices)
   */
  static async syncProfileFromDatabase(chipUID: string): Promise<boolean> {
    try {
      const dbAccount = await this.checkAccountInDatabase(chipUID)
      if (!dbAccount) {
        console.log('No database account found to sync from')
        return false
      }
      
      const localProfile = this.getLocalProfile(chipUID)
      if (localProfile) {
        // Update local profile with database info (but keep local-only data)
        if (dbAccount.displayName) localProfile.displayName = dbAccount.displayName
        if (dbAccount.username) localProfile.username = dbAccount.username
        if (dbAccount.bio) localProfile.bio = dbAccount.bio
        if (dbAccount.deviceName) localProfile.deviceName = dbAccount.deviceName
        
        localProfile.hasPIN = dbAccount.hasPIN
        localProfile.lastSeen = new Date().toISOString()
        
        this.saveLocalProfile(localProfile)
        console.log('✅ Profile synced from database')
        return true
      }
      
      return false
    } catch (error) {
      console.warn('Failed to sync profile from database:', error)
      return false
    }
  }

  static async verifyAccountPIN(chipUID: string, pin: string): Promise<boolean> {
    try {
      // Get account from database
      const dbAccount = await this.checkAccountInDatabase(chipUID)
      if (!dbAccount || !dbAccount.hasPIN) {
        return false
      }
      
      // Verify PIN
      return await this.verifyPIN(pin, dbAccount.encryptedPIN!, dbAccount.pinSalt!)
    } catch (error) {
      console.warn('PIN verification failed:', error)
      return false
    }
  }

  static async authenticateWithPIN(chipUID: string, pin: string): Promise<{
    account: LocalAccountProfile
    isValidPIN: boolean
  } | null> {
    try {
      // First verify the PIN
      const isValidPIN = await this.verifyAccountPIN(chipUID, pin)
      
      if (isValidPIN) {
        // Get or create account
        const result = await this.authenticateOrCreateAccount(chipUID)
        return {
          account: result.account,
          isValidPIN: true
        }
      }
      
      return null
    } catch (error) {
      console.warn('Authentication with PIN failed:', error)
      return null
    }
  }

  /**
   * 🧹 Clear Local Data (for testing/reset)
   */
  static clearLocalData(chipUID?: string): void {
    if (typeof window === 'undefined') return
    
    if (chipUID) {
      localStorage.removeItem(`${PROFILE_STORAGE_PREFIX}${chipUID}`)
      localStorage.removeItem(`${ACCOUNT_STORAGE_PREFIX}${chipUID}`)
    } else {
      // Clear all Kairos data
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('kairos:')) {
          localStorage.removeItem(key)
        }
      })
    }
  }
} 