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
    return !!(params.deviceId && params.chipUID && params.challenge && !params.signature && !params.publicKey)
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

      // Sign challenge locally
      const { signature } = await DecentralizedNFCAuth.authenticateLocally(
        matchingDevice.deviceId,
        params.challenge!
      )

      // Verify signature locally
      const verified = await DecentralizedNFCAuth.verifyLocally(
        signature,
        params.challenge!,
        matchingDevice.device.publicKey
      )

      if (verified) {
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
      
      // Determine the message that was signed
      const messageToVerify = params.challenge || `KairOS_NFC_Challenge_${params.chipUID}`
      
      // Verify the Ed25519 signature
      const isValidSignature = await verifySignatureDecentralized(
        params.signature!,
        messageToVerify,
        params.publicKey!
      )
      
      if (isValidSignature) {
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
   * Validate authentication parameters before processing
   */
  public static validateParameters(params: NFCParameters): {
    valid: boolean
    errors: string[]
    format: 'decentralized' | 'legacy' | 'invalid'
  } {
    const errors: string[] = []

    // Check for decentralized format
    if (params.deviceId && params.chipUID && params.challenge) {
      if (!params.signature && !params.publicKey) {
        return { valid: true, errors: [], format: 'decentralized' }
      }
    }

    // Check for legacy format
    if (params.signature && params.publicKey && params.chipUID) {
      // Validate parameter formats
      if (params.signature.length < 64) {
        errors.push(`Invalid signature format: too short (${params.signature.length} chars, need 64+)`)
      }
      
      if (params.publicKey.length < 32) {
        errors.push(`Invalid public key format: too short (${params.publicKey.length} chars, need 32+)`)
      }

      if (errors.length === 0) {
        return { valid: true, errors: [], format: 'legacy' }
      }
    }

    // Neither format is valid
    if (!params.chipUID) errors.push('Missing chip UID')
    
    if (!params.deviceId && !params.did) {
      errors.push('Missing device ID or DID identifier')
    }
    
    if (!params.challenge && !params.signature) {
      errors.push('Missing challenge or signature')
    }

    return { valid: false, errors, format: 'invalid' }
  }
} 