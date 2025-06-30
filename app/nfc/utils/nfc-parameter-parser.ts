/**
 * NFC Parameter Parser
 * 
 * Enterprise-grade URL parameter parsing for multiple NFC formats
 * Supports legacy compressed formats and new decentralized architecture
 */

import type { NFCParameters } from '../types/nfc.types'

export class NFCParameterParser {
  /**
   * Parse NFC parameters from URL search params
   * Supports multiple formats with graceful fallbacks
   */
  public static parseParameters(searchParams: URLSearchParams): {
    params: NFCParameters
    format: 'didkey' | 'optimal' | 'decentralized' | 'legacy-full' | 'legacy-compressed' | 'legacy-ultra' | 'none'
    debugInfo: string[]
  } {
    const debugInfo: string[] = []
    const allParams: Record<string, string> = {}
    
    // Extract all parameters for debugging
    searchParams.forEach((value, key) => {
      allParams[key] = value
    })
    debugInfo.push(`Raw URL params: ${JSON.stringify(allParams)}`)

    // Strategy 1: DID:Key format (did + optional chipUID) - RECOMMENDED
    // BUT: Only if it's NOT a legacy-full format (which also has did but includes signature/publicKey)
    const didParam = searchParams.get('did')
    const didChipUID = searchParams.get('chipUID') || searchParams.get('chip') || searchParams.get('c') || searchParams.get('uid')
    const hasSignature = searchParams.get('signature')
    const hasPublicKey = searchParams.get('publicKey')
    
    if (didParam && didParam.startsWith('did:key:') && !hasSignature && !hasPublicKey) {
      debugInfo.push('🎯 DID:Key format detected (RECOMMENDED)')
      debugInfo.push(`DID: ${didParam}`)
      debugInfo.push(`Chip UID: ${didChipUID || 'not provided'}`)
      debugInfo.push(`Authentication: 100% offline, PIN required`)
      
      return {
        params: {
          did: didParam,
          chipUID: didChipUID ? decodeURIComponent(didChipUID) : undefined,
          // PIN will be collected via UI
          challenge: `KairOS_DIDKey_${Date.now()}`
        },
        format: 'didkey' as any,
        debugInfo
      }
    }

    // Strategy 2: Optimal P2P IPFS format (chipUID only) - LEGACY
    const onlyChipUID = searchParams.get('chipUID') || searchParams.get('chip') || searchParams.get('c')
    const hasOnlyChipUID = onlyChipUID && 
      !searchParams.get('d') && // No deviceId (decentralized format)
      !searchParams.get('signature') && // No signature (legacy format)
      !searchParams.get('publicKey') && // No publicKey (legacy format)
      !searchParams.get('s') && // No compressed signature
      !searchParams.get('p') && // No compressed public key
      !searchParams.get('k') // No legacy compressed key
    
    if (hasOnlyChipUID) {
      debugInfo.push('🌐 Optimal P2P IPFS format detected (chipUID only)')
      debugInfo.push(`Chip UID: ${onlyChipUID}`)
      debugInfo.push(`Will require PIN authentication`)
      
      return {
        params: {
          chipUID: decodeURIComponent(onlyChipUID),
          // PIN will be collected via UI
          challenge: `KairOS_Optimal_${onlyChipUID}_${Date.now()}`
        },
        format: 'optimal',
        debugInfo
      }
    }

    // Strategy 3: Decentralized NFC format (d=deviceId, c=chipUID)
    const deviceId = searchParams.get('d')
    const chipUID = searchParams.get('c')
    
    if (deviceId && chipUID) {
      debugInfo.push('✅ Decentralized NFC format detected')
      debugInfo.push(`Device ID: ${deviceId}`)
      debugInfo.push(`Chip UID: ${chipUID}`)
      
      return {
        params: {
          deviceId,
          chipUID: decodeURIComponent(chipUID),
          challenge: `KairOS-Local-${deviceId}-${Date.now()}`
        },
        format: 'decentralized',
        debugInfo
      }
    }

    // Strategy 4: Legacy full format (did, signature, publicKey, uid/chipUID)
    const fullDID = searchParams.get('did')
    const fullSig = searchParams.get('signature') 
    const fullKey = searchParams.get('publicKey')
    const fullUID = searchParams.get('uid') || searchParams.get('chipUID') // Support both uid and chipUID
    
    if (fullDID && fullSig && fullKey && fullUID) {
      debugInfo.push('✅ Legacy full format detected')
      debugInfo.push(`Using chipUID from: ${searchParams.get('uid') ? 'uid' : 'chipUID'} parameter`)
      
      return {
        params: {
          did: fullDID,
          signature: fullSig,
          publicKey: fullKey,
          chipUID: fullUID,
          challenge: searchParams.get('challenge') || undefined
        },
        format: 'legacy-full',
        debugInfo
      }
    }

    // Strategy 5: Safe compressed format (c, s, p) - minimal compression preserving crypto integrity
    const compressedUID = searchParams.get('c')
    const compressedSig = searchParams.get('s')
    const compressedKey = searchParams.get('p')
    
    if (compressedUID && compressedSig && compressedKey) {
      debugInfo.push('✅ Safe compressed format detected (minimal compression)')
      
      try {
        // For the new safe compression, data is not base64 encoded - it's full hex
        const reconstructed = this.reconstructSafeCompressedParams(
          compressedUID, 
          compressedSig, 
          compressedKey
        )
        
        debugInfo.push(`Reconstructed: chipUID=${reconstructed.chipUID}`)
        debugInfo.push(`Signature length: ${reconstructed.signature?.length || 0}`)
        debugInfo.push(`Public key length: ${reconstructed.publicKey?.length || 0}`)
        
        return {
          params: reconstructed,
          format: 'legacy-compressed',
          debugInfo
        }
      } catch (error) {
        debugInfo.push(`❌ Failed to reconstruct safe compressed params: ${error}`)
      }
    }

    // Strategy 5b: Legacy compressed format (c, s, k) - for backward compatibility
    const legacyCompressedKey = searchParams.get('k')
    
    if (compressedUID && compressedSig && legacyCompressedKey) {
      debugInfo.push('⚠️ Legacy compressed format detected (may have crypto issues)')
      
      try {
        const reconstructed = this.reconstructCompressedParams(
          compressedUID, 
          compressedSig, 
          legacyCompressedKey
        )
        
        debugInfo.push(`Legacy reconstructed: chipUID=${reconstructed.chipUID}`)
        debugInfo.push(`Signature length: ${reconstructed.signature?.length || 0}`)
        debugInfo.push(`Public key length: ${reconstructed.publicKey?.length || 0}`)
        debugInfo.push(`⚠️ Warning: This format may fail authentication due to crypto truncation`)
        
        return {
          params: reconstructed,
          format: 'legacy-compressed',
          debugInfo
        }
      } catch (error) {
        debugInfo.push(`❌ Failed to reconstruct legacy compressed params: ${error}`)
      }
    }

    // Strategy 6: Ultra-compressed format (u, s, k) with base64 decoding
    const ultraUID = searchParams.get('u')
    const ultraSig = searchParams.get('s')
    const ultraKey = searchParams.get('k')
    
    if (ultraUID && ultraSig && ultraKey) {
      debugInfo.push('✅ Ultra-compressed format detected')
      
      try {
        const reconstructed = this.reconstructUltraCompressedParams(
          ultraUID,
          ultraSig,
          ultraKey
        )
        
        debugInfo.push(`Reconstructed from ultra-compressed format`)
        
        return {
          params: reconstructed,
          format: 'legacy-ultra',
          debugInfo
        }
      } catch (error) {
        debugInfo.push(`❌ Failed to reconstruct ultra-compressed params: ${error}`)
      }
    }

    // No valid parameters found
    debugInfo.push('❌ No valid NFC parameters found in URL')
    
    return {
      params: {},
      format: 'none',
      debugInfo
    }
  }

  /**
   * Reconstruct parameters from safe compressed format (new approach)
   * This method preserves full cryptographic data integrity
   */
  private static reconstructSafeCompressedParams(
    compressedUID: string,
    signature: string,
    publicKey: string
  ): NFCParameters {
    // Reconstruct chip UID with proper formatting
    const chipUID = compressedUID.includes(':') 
      ? compressedUID 
      : `04:${compressedUID.match(/.{2}/g)?.join(':') || compressedUID}`
    
    // Validate crypto parameters - NO PADDING for safety
    if (signature.length < 128) {
      throw new Error(`Signature too short: ${signature.length} chars, need 128+ for Ed25519`)
    }
    
    if (publicKey.length < 64) {
      throw new Error(`Public key too short: ${publicKey.length} chars, need 64+ for Ed25519`)
    }
    
    if (!/^[0-9a-fA-F]+$/.test(signature)) {
      throw new Error('Signature must be hex format')
    }
    
    if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
      throw new Error('Public key must be hex format')
    }
    
    // Generate DID from public key
    const did = `did:key:z${publicKey.substring(0, 32)}`
    
    return {
      chipUID,
      signature,
      publicKey,
      did,
      challenge: `KairOS_NFC_Challenge_${chipUID}`
    }
  }

  /**
   * Reconstruct parameters from legacy compressed format (backward compatibility)
   * This method may introduce padding which can break authentication
   */
  private static reconstructCompressedParams(
    compressedUID: string,
    compressedSig: string,
    compressedKey: string
  ): NFCParameters {
    // Reconstruct chip UID
    const chipUID = compressedUID.includes(':') 
      ? compressedUID 
      : `04:${compressedUID.match(/.{2}/g)?.join(':') || compressedUID}`
    
    // Legacy behavior - pad if needed (WARNING: this may break authentication)
    const signature = compressedSig.length >= 64 
      ? compressedSig 
      : compressedSig.padEnd(128, '0')
    
    const publicKey = compressedKey.length >= 32 
      ? compressedKey 
      : compressedKey.padEnd(64, '0')
    
    // Generate DID from public key
    const did = `did:key:z${publicKey.substring(0, 32)}`
    
    return {
      chipUID,
      signature,
      publicKey,
      did,
      challenge: `KairOS_NFC_Challenge_${chipUID}`
    }
  }

  /**
   * Reconstruct parameters from ultra-compressed format with base64 support
   */
  private static reconstructUltraCompressedParams(
    ultraUID: string,
    ultraSig: string,
    ultraKey: string
  ): NFCParameters {
    // Reconstruct chip UID
    const chipUID = ultraUID.includes(':') 
      ? ultraUID 
      : `04:${ultraUID.match(/.{2}/g)?.join(':') || ultraUID}`
    
    let signature = ultraSig
    let publicKey = ultraKey
    
    // Try base64 decoding for signature if it looks like base64
    if (ultraSig.length < 100 && /^[A-Za-z0-9\-_+/=]+$/.test(ultraSig)) {
      try {
        const decoded = atob(ultraSig.replace(/-/g, '+').replace(/_/g, '/'))
        signature = Array.from(decoded).map(char => 
          char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join('')
      } catch {
        // Fallback to hex padding
        signature = ultraSig.padEnd(128, '0')
      }
    } else {
      signature = ultraSig.padEnd(128, '0')
    }
    
    // Try base64 decoding for public key
    if (ultraKey.length < 50 && /^[A-Za-z0-9\-_+/=]+$/.test(ultraKey)) {
      try {
        const decoded = atob(ultraKey.replace(/-/g, '+').replace(/_/g, '/'))
        publicKey = Array.from(decoded).map(char => 
          char.charCodeAt(0).toString(16).padStart(2, '0')
        ).join('')
      } catch {
        publicKey = ultraKey.padEnd(64, '0')
      }
    } else {
      publicKey = ultraKey.padEnd(64, '0')
    }
    
    // Generate DID with validation
    const did = publicKey.length >= 32 
      ? `did:key:z${publicKey.substring(0, 32)}` 
      : `did:key:z${publicKey.padEnd(32, '0')}`
    
    return {
      chipUID,
      signature,
      publicKey,
      did,
      challenge: `KairOS_NFC_Challenge_${chipUID}`
    }
  }
} 