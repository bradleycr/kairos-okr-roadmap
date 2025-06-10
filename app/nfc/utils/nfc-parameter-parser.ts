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
    format: 'decentralized' | 'legacy-full' | 'legacy-compressed' | 'legacy-ultra' | 'none'
    debugInfo: string[]
  } {
    const debugInfo: string[] = []
    const allParams: Record<string, string> = {}
    
    // Extract all parameters for debugging
    searchParams.forEach((value, key) => {
      allParams[key] = value
    })
    debugInfo.push(`Raw URL params: ${JSON.stringify(allParams)}`)

    // Strategy 1: Decentralized NFC format (d=deviceId, c=chipUID)
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

    // Strategy 2: Legacy full format (did, signature, publicKey, uid/chipUID)
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

    // Strategy 3: Legacy compressed format (c, s, p/k)
    const compressedUID = searchParams.get('c')
    const compressedSig = searchParams.get('s')
    const compressedKey = searchParams.get('p') || searchParams.get('k') // Support both p and k
    
    if (compressedUID && compressedSig && compressedKey) {
      debugInfo.push('✅ Legacy compressed format detected')
      
      try {
        const reconstructed = this.reconstructCompressedParams(
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
        debugInfo.push(`❌ Failed to reconstruct compressed params: ${error}`)
      }
    }

    // Strategy 4: Ultra-compressed format (u, s, k) with base64 decoding
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
   * Reconstruct parameters from compressed format
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
    
    // Ensure minimum lengths and proper padding
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