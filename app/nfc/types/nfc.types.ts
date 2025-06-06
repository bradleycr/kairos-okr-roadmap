/**
 * NFC Authentication System Types
 * 
 * Clean, type-safe interfaces for decentralized NFC authentication
 * Built for Web3 edge computing and MELD ecosystem integration
 */

export interface NFCVerificationState {
  status: 'initializing' | 'verifying' | 'success' | 'failure' | 'error'
  progress: number
  currentPhase: string
  verificationTime?: number
  debugLogs: string[]
  error?: string
  
  // Authentication Results
  chipAuthenticated?: boolean
  secretValid?: boolean
  zkProofGenerated?: boolean
  momentCaptured?: boolean
  sessionToken?: string
  momentId?: string
  
  // Debug Information
  urlParameters?: Record<string, string>
  apiResponse?: any
  reconstructedParameters?: Record<string, string>
}

export interface NFCParameters {
  did?: string        // DID identifier (did:key:z...)
  signature?: string  // Ed25519 signature (hex)
  publicKey?: string  // Ed25519 public key (hex)
  chipUID?: string    // Chip UID for reference
  challenge?: string  // Challenge message that was signed
  deviceId?: string   // Decentralized device identifier
}

export interface DeviceCapabilities {
  isAndroid: boolean
  isChrome: boolean
  isIPhone: boolean
  isSafari: boolean
  canUseIntent: boolean
  supportsWebNFC: boolean
}

export interface AuthenticationResult {
  verified: boolean
  chipUID?: string
  deviceId?: string
  did?: string
  sessionToken?: string
  momentId?: string
  error?: string
}

export interface DecentralizedAuthFlow {
  deviceId: string
  challenge: string
  signature: string
  publicKey: string
  verified: boolean
}

export interface LegacyAuthFlow {
  did: string
  signature: string
  publicKey: string
  chipUID: string
  challenge?: string
  verified: boolean
} 