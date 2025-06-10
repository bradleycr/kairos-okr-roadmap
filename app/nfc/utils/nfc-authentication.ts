/**
 * NFC Authentication Engine
 * 
 * High-performance cryptographic authentication for decentralized NFC systems
 * Supports both legacy signatures and modern decentralized identity flows
 */

import type { NFCParameters, AuthenticationResult, DecentralizedAuthFlow, LegacyAuthFlow } from '../types/nfc.types'

export class NFCAuthenticationEngine {
  /**
   * Execute comprehensive NFC authentication flow
   */
  public static async authenticate(params: NFCParameters): Promise<AuthenticationResult> {
    // Determine authentication strategy based on available parameters
    if (this.isDecentralizedAuth(params)) {
      return this.executeDecentralizedAuth(params)
    } else if (this.isLegacyAuth(params)) {
      return this.executeLegacyAuth(params)
    } else {
      return {
        verified: false,
        error: 'Invalid or incomplete authentication parameters'
      }
    }
  }

  /**
   * Check if parameters indicate decentralized authentication
   */
  private static isDecentralizedAuth(params: NFCParameters): boolean {
    return !!(params.deviceId && params.chipUID)
  }

  /**
   * Check if parameters indicate legacy authentication
   */
  private static isLegacyAuth(params: NFCParameters): boolean {
    return !!(params.signature && params.publicKey && params.chipUID)
  }

  /**
   * Execute decentralized authentication flow
   * Uses local identity and device-specific private keys
   */
  private static async executeDecentralizedAuth(params: NFCParameters): Promise<AuthenticationResult> {
    try {
      // Import decentralized authentication functions
      const { loadLocalIdentity, DecentralizedNFCAuth } = await import('@/lib/crypto/decentralizedNFC')
      
      // Check for local identity
      const identity = loadLocalIdentity()
      if (!identity) {
        return {
          verified: false,
          error: 'No local identity found. Please initialize your identity first.'
        }
      }

      // Find matching device by chip UID
      let matchingDevice = null
      for (const [deviceId, device] of Object.entries(identity.devices)) {
        if (device.chipUID === params.chipUID) {
          matchingDevice = { deviceId, device }
          break
        }
      }

      if (!matchingDevice) {
        return {
          verified: false,
          error: 'Device not found in local registry. Please register this device first.'
        }
      }

      // Use consistent challenge format - if challenge provided, use it; otherwise generate standard format
      const challenge = params.challenge || `KairOS_NFC_Challenge_${params.chipUID}`

      // Sign challenge locally
      const { signature } = await DecentralizedNFCAuth.authenticateLocally(
        matchingDevice.deviceId,
        challenge
      )

      // Verify signature locally
      const verified = await DecentralizedNFCAuth.verifyLocally(
        signature,
        challenge,
        matchingDevice.device.publicKey
      )

      if (verified) {
        // 🆕 Create or update account in database
        await this.ensureAccountExists(params.chipUID!)
        
        return {
          verified: true,
          chipUID: params.chipUID,
          deviceId: matchingDevice.deviceId,
          sessionToken: `local_session_${Date.now()}`,
          momentId: `moment_${Date.now()}`
        }
      } else {
        return {
          verified: false,
          error: 'Local signature verification failed'
        }
      }

    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Decentralized authentication error'
      }
    }
  }

  /**
   * Execute legacy authentication flow
   * Uses provided signature and public key for verification
   */
  private static async executeLegacyAuth(params: NFCParameters): Promise<AuthenticationResult> {
    try {
      // Import legacy verification function
      const { verifySignatureDecentralized } = await import('@/lib/crypto/decentralizedNFC')
      
      // Determine the message that was signed - use provided challenge or generate standard format
      const messageToVerify = params.challenge || `KairOS_NFC_Challenge_${params.chipUID}`
      
      // Verify the Ed25519 signature
      const isValidSignature = await verifySignatureDecentralized(
        params.signature!,
        messageToVerify,
        params.publicKey!
      )
      
      if (isValidSignature) {
        // 🆕 Create or update account in database
        await this.ensureAccountExists(params.chipUID!, {
          publicKey: params.publicKey!,
          did: params.did
        })
        
        return {
          verified: true,
          chipUID: params.chipUID,
          did: params.did,
          sessionToken: `session_${Date.now()}`,
          momentId: `moment_${Date.now()}`
        }
      } else {
        return {
          verified: false,
          error: 'Invalid Ed25519 signature'
        }
      }
      
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Legacy verification error'
      }
    }
  }

  /**
   * 🆕 Ensure Account Exists in Database
   * Creates or updates account record when authentication succeeds
   */
  private static async ensureAccountExists(chipUID: string, authData?: { publicKey: string; did?: string }): Promise<void> {
    try {
      console.log(`🔐 Ensuring account exists for chipUID: ${chipUID}`)
      
      // Use the NFCAccountManager to handle account creation/update
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      
      // This will create the account in the database if it doesn't exist,
      // or update it if it does exist
      const result = await NFCAccountManager.authenticateOrCreateAccount(chipUID)
      
      console.log(`✅ Account ensured: ${result.isNewAccount ? 'Created' : 'Updated'} account for chipUID: ${chipUID}`)
      
      // If this is legacy auth and we have explicit auth data, ensure it matches
      if (authData && result.account.publicKey !== authData.publicKey) {
        console.warn('⚠️ Public key mismatch between auth params and stored account')
        // Could potentially update the account with the new key, but that's a security decision
      }
      
    } catch (error) {
      console.error('❌ Failed to ensure account exists:', error)
      // Don't throw - authentication succeeded, database failure shouldn't break auth
    }
  }

  /**
   * Validate authentication parameters
   */
  public static validateParameters(params: NFCParameters): {
    valid: boolean
    errors: string[]
    format: 'decentralized' | 'legacy' | 'invalid'
  } {
    const errors: string[] = []
    
    // Check for decentralized format
    if (params.deviceId && params.chipUID) {
      if (!params.deviceId.trim()) {
        errors.push('Device ID cannot be empty')
      }
      if (!params.chipUID.trim()) {
        errors.push('Chip UID cannot be empty')
      }
      
      return {
        valid: errors.length === 0,
        errors,
        format: 'decentralized'
      }
    }
    
    // Check for legacy format
    if (params.signature && params.publicKey && params.chipUID) {
      if (params.signature.length < 64) {
        errors.push('Signature too short')
      }
      if (params.publicKey.length < 32) {
        errors.push('Public key too short')
      }
      if (!params.chipUID.trim()) {
        errors.push('Chip UID cannot be empty')
      }
      
      return {
        valid: errors.length === 0,
        errors,
        format: 'legacy'
      }
    }
    
    // Invalid format
    errors.push('Missing required parameters for any supported format')
    return {
      valid: false,
      errors,
      format: 'invalid'
    }
  }
} 