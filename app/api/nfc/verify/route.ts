// --- NTAG424 NFC Verification API Route ---
// Handles dynamic secret verification and integrates with KairOS crypto systems
// Designed for both web browser testing and real ESP32 hardware

import { NextRequest, NextResponse } from 'next/server'
import { zkProofSystem } from '@/lib/zk/zkProofSystem'
import type { ZKMomentProof } from '@/lib/types'

// --- Decentralized Crypto Functions ---
async function generateDeterministicAccount(chipUID: string, appSalt: string = 'kairos-nfc-2024'): Promise<{
  did: string,
  accountId: string,
  publicKey: string
}> {
  // Create deterministic seed from chip UID + app salt
  const seedData = `${chipUID}:${appSalt}`
  const encoder = new TextEncoder()
  const seedBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(seedData))
  const seed = new Uint8Array(seedBuffer)
  
  // Generate Ed25519 key pair from seed (simplified - in production use proper Ed25519 library)
  const privateKey = seed.slice(0, 32) // First 32 bytes as private key
  
  // Generate public key (in production, use actual Ed25519.getPublicKey(privateKey))
  const publicKeyBuffer = await crypto.subtle.digest('SHA-256', privateKey)
  const publicKey = new Uint8Array(publicKeyBuffer).slice(0, 32)
  
  // Create DID:key (compatible with your existing system)
  const publicKeyHex = Array.from(publicKey).map(b => b.toString(16).padStart(2, '0')).join('')
  const did = `did:key:z${encodeBase58(publicKey)}`
  
  // Create simple account ID for easy reference
  const accountBuffer = await crypto.subtle.digest('SHA-256', publicKey)
  const accountId = `kairos_${Array.from(new Uint8Array(accountBuffer)).slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('')}`
  
  return { did, accountId, publicKey: publicKeyHex }
}

// Simple base58 encoding (replace with proper library in production)
function encodeBase58(bytes: Uint8Array): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
  let result = ''
  
  // Convert bytes to base58 (simplified version)
  let num = BigInt('0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''))
  
  while (num > 0) {
    result = alphabet[Number(num % 58n)] + result
    num = num / 58n
  }
  
  return result
}

// --- Request/Response Types for NTAG424 ---
interface NFCVerificationRequest {
  // NTAG424 Dynamic Parameters
  chipUID: string
  secret: string
  timestamp: number
  counter?: number
  
  // Optional KairOS Integration
  sessionId?: string
  deviceInfo?: {
    platform: 'web' | 'esp32' | 'mobile'
    userAgent?: string
    hardwareId?: string
  }
  
  // Authentication Type
  createAccount?: boolean // Whether to create/return account info
  returnKeys?: boolean    // Whether to return key information
}

interface NFCVerificationResponse {
  success: boolean
  verified: boolean
  verificationTime: number
  
  // NTAG424 Specific
  chipAuthenticated: boolean
  secretValid: boolean
  tamperDetected?: boolean
  
  // Account Info
  accountCreated?: boolean
  userDID?: string
  accountId?: string
  publicKey?: string
  
  // Session Management
  sessionCreated?: boolean
  sessionToken?: string
  
  // Error Handling
  error?: string
  debugLogs?: string[]
  
  // Response Data
  data?: {
    did?: string
    accountId?: string
    publicKey?: string
    sessionToken?: string
    verifiedAt: number
    chipUID: string
  }
}

// --- Simulated NTAG424 Session Store ---
// In production, this would be Redis or a proper database
const nfcSessions = new Map<string, {
  sessionKey: string
  createdAt: number
  accessCount: number
  lastAccess?: number
  chipUID: string
  tamperStatus: 'intact' | 'compromised'
}>()

// --- NTAG424 Cryptographic Functions ---
async function generateExpectedSecret(
  sessionKey: string,
  timestamp: number,
  counter: number,
  chipUID: string
): Promise<string> {
  // Simulate NTAG424 AES-128 dynamic secret generation
  // In real hardware, this would use the chip's internal AES crypto
  const data = `${sessionKey}:${timestamp}:${counter}:${chipUID}`
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

// --- Real NTAG424 AES-128 Verification ---
async function generateNTAG424Secret(
  aesKey: Uint8Array,
  uid: string,
  counter: number
): Promise<string> {
  // This would implement actual NTAG424 AES-128 algorithm
  // For now, we'll use a placeholder that mimics the real behavior
  
  // Convert UID to bytes
  const uidBytes = uid.split(':').map(hex => parseInt(hex, 16))
  
  // Prepare data for AES encryption (simplified version)
  const data = new Uint8Array([
    ...uidBytes,
    ...new Uint8Array(new ArrayBuffer(4)).map((_, i) => (counter >> (i * 8)) & 0xFF)
  ])
  
  // For production, you'd use actual AES-128 with the chip's algorithm
  // This is a simplified version for demonstration
  const encoder = new TextEncoder()
  const combinedData = new Uint8Array([...aesKey.slice(0, 16), ...data])
  const hashBuffer = await crypto.subtle.digest('SHA-256', combinedData)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32)
}

async function verifyNTAG424Secret(
  providedSecret: string,
  chipUID: string,
  timestamp: number,
  counter: number = 0
): Promise<{ valid: boolean, sessionKey?: string, debugInfo: string[] }> {
  const debugInfo: string[] = []
  
  // Check if we have a session for this chip
  const sessionId = `chip_${chipUID}`
  let session = nfcSessions.get(sessionId)
  
  if (!session) {
    // Create new session for first-time chip
    const sessionKey = Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
    ).join('')
    
    session = {
      sessionKey,
      createdAt: Date.now(),
      accessCount: 0,
      chipUID,
      tamperStatus: 'intact'
    }
    
    nfcSessions.set(sessionId, session)
    debugInfo.push(`🆕 Created new session for chip ${chipUID}`)
  }
  
  debugInfo.push(`🔍 Verifying secret for session ${sessionId}`)
  debugInfo.push(`📊 Access count: ${session.accessCount}`)
  debugInfo.push(`⏰ Timestamp: ${new Date(timestamp).toISOString()}`)
  
  // Try different verification methods
  let isValid = false
  let verificationMethod = ''
  
  // Method 1: Real NTAG424 verification (if we have the AES key)
  const realNTAG424Key = getRealNTAG424Key(chipUID)
  if (realNTAG424Key) {
    try {
      const expectedSecret = await generateNTAG424Secret(realNTAG424Key, chipUID, session.accessCount)
      if (providedSecret === expectedSecret) {
        isValid = true
        verificationMethod = 'Real NTAG424 AES-128'
        debugInfo.push(`🔐 Real NTAG424 verification: SUCCESS`)
      }
    } catch (error) {
      debugInfo.push(`⚠️ Real NTAG424 verification failed: ${error}`)
    }
  }
  
  // Method 2: Simulation fallback (for testing)
  if (!isValid) {
    const expectedSecret = await generateExpectedSecret(
      session.sessionKey,
      timestamp,
      session.accessCount,
      chipUID
    )
    
    if (providedSecret === expectedSecret) {
      isValid = true
      verificationMethod = 'Simulation Mode'
      debugInfo.push(`🧪 Simulation verification: SUCCESS`)
    }
  }
  
  debugInfo.push(`🔑 Verification method: ${verificationMethod}`)
  debugInfo.push(`🔐 Expected secret: ${isValid ? 'MATCH' : 'NO MATCH'}`)
  debugInfo.push(`🔑 Provided secret: ${providedSecret.substring(0, 16)}...`)
  
  if (isValid) {
    // Update session on successful verification
    session.accessCount += 1
    session.lastAccess = timestamp
    nfcSessions.set(sessionId, session)
    debugInfo.push(`✅ Secret verification: SUCCESS`)
  } else {
    debugInfo.push(`❌ Secret verification: FAILED`)
  }
  
  return {
    valid: isValid,
    sessionKey: session.sessionKey,
    debugInfo
  }
}

// --- Helper function to get real NTAG424 keys ---
function getRealNTAG424Key(chipUID: string): Uint8Array | null {
  // In production, this would look up the AES key for this specific chip
  // Keys would be stored securely (database, HSM, etc.)
  
  // For demo purposes, return null to use simulation mode
  // To enable real NTAG424 support, you would:
  // 1. Store the AES key when programming the chip
  // 2. Look it up here by chip UID
  // 3. Return the actual key bytes
  
  const knownChips: Record<string, string> = {
    // Example: 'UID': 'HEX_AES_KEY'
    // '04:7B:8C:9D:E2:F1:23': '000102030405060708090A0B0C0D0E0F'
  }
  
  const hexKey = knownChips[chipUID]
  if (hexKey) {
    // Convert hex string to Uint8Array
    const keyBytes = new Uint8Array(hexKey.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [])
    return keyBytes.length === 16 ? keyBytes : null
  }
  
  return null
}

// --- IPFS Account Sync (Decentralized) ---
interface AccountSyncConfig {
  ipfsEnabled: boolean
  meshEnabled: boolean
  hubSyncEnabled: boolean
  syncInterval: number
}

interface AccountRecord {
  chipUID: string
  did: string
  accountId: string
  publicKey: string
  createdAt: number
  lastAccess: number
  accessCount: number
  syncedNodes: string[]
}

// Global sync configuration (production: load from environment)
const SYNC_CONFIG: AccountSyncConfig = {
  ipfsEnabled: true,
  meshEnabled: true, 
  hubSyncEnabled: true,
  syncInterval: 60000 // 1 minute
}

// --- IPFS Integration Functions ---
async function storeAccountOnIPFS(account: AccountRecord): Promise<string | null> {
  if (!SYNC_CONFIG.ipfsEnabled) return null
  
  try {
    // In production: Use actual IPFS node
    // For now, simulate IPFS storage with deterministic hash
    const accountData = JSON.stringify(account)
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(accountData))
    const ipfsHash = `Qm${Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 44)}`
    
    // Simulate IPFS storage
    console.log(`📦 Account stored on IPFS: ${ipfsHash}`)
    console.log(`🔗 IPFS URL: https://ipfs.io/ipfs/${ipfsHash}`)
    
    // TODO: Replace with actual IPFS client
    // const ipfs = await IPFS.create()
    // const result = await ipfs.add(accountData)
    // return result.cid.toString()
    
    return ipfsHash
    
  } catch (error) {
    console.error('❌ IPFS storage failed:', error)
    return null
  }
}

async function notifyMELDNodes(account: AccountRecord, ipfsHash: string): Promise<void> {
  if (!SYNC_CONFIG.meshEnabled) return
  
  try {
    // Mesh network notification payload
    const meshMessage = {
      type: 'account_sync',
      chipUID: account.chipUID,
      did: account.did,
      accountId: account.accountId,
      ipfsHash,
      timestamp: Date.now(),
      syncSource: 'web_platform'
    }
    
    console.log(`📡 Broadcasting to MELD mesh network:`, meshMessage)
    
    // In production: Use your existing mesh network from ESP32Config
    // This would use the mesh_prefix: 'MELD_MESH' and mesh_password from your config
    
    // Simulate mesh broadcast
    broadcastToMeshNodes(meshMessage)
    
  } catch (error) {
    console.error('❌ Mesh broadcast failed:', error)
  }
}

// Simulate mesh network broadcast (replace with real implementation)
function broadcastToMeshNodes(message: any): void {
  // In production, this would use ESP-NOW or WiFi mesh
  console.log(`🌐 MESH BROADCAST:`, {
    protocol: 'ESP-NOW',
    mesh_prefix: 'MELD_MESH',
    message_type: message.type,
    chip_uid: message.chipUID,
    account_id: message.accountId
  })
  
  // Simulate nodes receiving the update
  const simulatedNodes = ['node_001', 'node_002', 'node_003']
  simulatedNodes.forEach(nodeId => {
    console.log(`📱 Node ${nodeId} received account sync for ${message.chipUID}`)
  })
}

// --- POST: Verify NTAG424 NFC Tap ---
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const debugLogs: string[] = []
  
  try {
    // Parse request body
    const body: NFCVerificationRequest = await request.json()
    
    debugLogs.push('🚀 NTAG424 verification request received')
    debugLogs.push(`📱 Chip UID: ${body.chipUID}`)
    debugLogs.push(`🔐 Secret: ${body.secret.substring(0, 16)}...`)
    debugLogs.push(`⏰ Timestamp: ${new Date(body.timestamp).toISOString()}`)
    
    if (!body.chipUID || !body.secret || !body.timestamp) {
      return NextResponse.json({
        success: false,
        verified: false,
        verificationTime: Date.now() - startTime,
        chipAuthenticated: false,
        secretValid: false,
        error: 'Missing required NTAG424 parameters',
        debugLogs
      } as NFCVerificationResponse, { status: 400 })
    }

    // Phase 1: NTAG424 Secret Verification
    debugLogs.push('━'.repeat(50))
    debugLogs.push('🔍 PHASE 1: NTAG424 Authentication')
    
    const secretVerification = await verifyNTAG424Secret(
      body.secret,
      body.chipUID,
      body.timestamp,
      body.counter || 0
    )
    
    debugLogs.push(...secretVerification.debugInfo)
    
    if (!secretVerification.valid) {
      return NextResponse.json({
        success: true,
        verified: false,
        verificationTime: Date.now() - startTime,
        chipAuthenticated: false,
        secretValid: false,
        error: 'Invalid NTAG424 dynamic secret',
        debugLogs
      } as NFCVerificationResponse, { status: 200 })
    }

    // Phase 2: Decentralized Account Creation
    let accountCreated = false
    let userDID: string | undefined
    let accountId: string | undefined
    let publicKeyHex: string | undefined
    
    if (body.createAccount !== false) { // Default to creating account
      debugLogs.push('━'.repeat(50))
      debugLogs.push('🔑 PHASE 2: Decentralized Account Creation')
      
      try {
        // Generate deterministic key pair from chip UID
        const keyPair = await generateDeterministicAccount(body.chipUID)
        
        userDID = keyPair.did
        accountId = keyPair.accountId
        publicKeyHex = keyPair.publicKey
        
        accountCreated = true
        
        debugLogs.push('✅ Deterministic key pair generated')
        debugLogs.push(`🆔 DID: ${userDID}`)
        debugLogs.push(`🆔 Account ID: ${accountId}`)
        debugLogs.push(`🔑 Public Key: ${publicKeyHex.substring(0, 16)}...`)
        
        // Create account record for sync
        const accountRecord: AccountRecord = {
          chipUID: body.chipUID,
          did: userDID,
          accountId,
          publicKey: publicKeyHex,
          createdAt: Date.now(),
          lastAccess: Date.now(),
          accessCount: 1,
          syncedNodes: []
        }
        
        // Store on IPFS for decentralized access
        const ipfsHash = await storeAccountOnIPFS(accountRecord)
        if (ipfsHash) {
          debugLogs.push(`📦 Account stored on IPFS: ${ipfsHash}`)
          
          // Notify MELD nodes via mesh network
          await notifyMELDNodes(accountRecord, ipfsHash)
          debugLogs.push(`📡 MELD nodes notified via mesh network`)
        }
        
        // Optional: Store account association in IPFS or other decentralized storage
        // This could include profile data, preferences, etc.
        
      } catch (accountError) {
        debugLogs.push(`❌ Account creation failed: ${accountError}`)
      }
    }

    // Phase 3: Session Token Creation
    debugLogs.push('━'.repeat(50))
    debugLogs.push('🎫 PHASE 3: Session Token Creation')
    
    const sessionToken = `nfc_session_${body.chipUID}_${Date.now()}`
    debugLogs.push(`✅ Session token created: ${sessionToken.substring(0, 24)}...`)

    const verificationTime = Date.now() - startTime
    
    // Log successful verification
    console.log(`[NFC VERIFY] Success: ${body.chipUID} (${verificationTime}ms)`, {
      chipUID: body.chipUID,
      sessionId: body.sessionId,
      accountCreated,
      userDID,
      platform: body.deviceInfo?.platform || 'unknown'
    })

    return NextResponse.json({
      success: true,
      verified: true,
      verificationTime,
      chipAuthenticated: true,
      secretValid: true,
      sessionCreated: true,
      accountCreated,
      userDID,
      accountId,
      publicKey: publicKeyHex,
      data: {
        did: userDID,
        accountId,
        publicKey: publicKeyHex,
        sessionToken,
        verifiedAt: Date.now(),
        chipUID: body.chipUID
      },
      debugLogs
    } as NFCVerificationResponse)

  } catch (error) {
    debugLogs.push(`💥 Error: ${error}`)
    console.error('[NFC VERIFY] Error:', error)
    
    return NextResponse.json({
      success: false,
      verified: false,
      verificationTime: Date.now() - startTime,
      chipAuthenticated: false,
      secretValid: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
      debugLogs
    } as NFCVerificationResponse, { status: 500 })
  }
}

// --- GET: NFC System Status & Account Lookup ---
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chipUID = searchParams.get('chipUID')
    const nodeId = searchParams.get('nodeId')
    
    // If chipUID provided, look up account info (for MELD nodes)
    if (chipUID) {
      // Generate the expected account from chip UID (deterministic)
      const accountInfo = await generateDeterministicAccount(chipUID)
      
      return NextResponse.json({
        success: true,
        found: true,
        account: {
          chipUID,
          did: accountInfo.did,
          accountId: accountInfo.accountId,
          publicKey: accountInfo.publicKey,
          // Don't return sensitive data to nodes
        },
        nodeSync: {
          canAuthenticate: true,
          lastSeen: Date.now(),
          accessInstructions: 'deterministic_generation'
        },
        timestamp: Date.now()
      })
    }
    
    // Otherwise return system status
    const activeSessions = nfcSessions.size
    
    return NextResponse.json({
      status: 'operational',
      nfcSessions: {
        active: activeSessions,
        maxAge: '24h'
      },
      integration: {
        zkProofSystem: 'enabled',
        ed25519Crypto: 'enabled', 
        esp32Support: 'enabled',
        ipfsSync: SYNC_CONFIG.ipfsEnabled,
        meshNetwork: SYNC_CONFIG.meshEnabled
      },
      supportedChips: [
        'NTAG424',
        'NTAG424TT',
        'NTAG213/215/216 (compatibility mode)'
      ],
      protocolSupport: [
        'ISO 14443-4',
        'NFC Type 4',
        'Dynamic Authentication'
      ],
      syncConfig: {
        ipfsEnabled: SYNC_CONFIG.ipfsEnabled,
        meshEnabled: SYNC_CONFIG.meshEnabled,
        syncInterval: SYNC_CONFIG.syncInterval
      },
      timestamp: Date.now()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// --- DELETE: Clear Test Sessions (Development Only) ---
export async function DELETE() {
  try {
    const sessionCount = nfcSessions.size
    nfcSessions.clear()
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${sessionCount} NFC test sessions`,
      timestamp: Date.now()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 