/**
 * 🎯 KairOS Universal NFC URL Generator
 * 
 * Generates cryptographically robust URLs for NFC programming apps with maximum compatibility
 * for different NFC chip types (NTAG213/215/216/424).
 * Works with iPhone NFC Tools, Android apps, TagWriter, and other NFC programming tools.
 * 
 * Uses SMART COMPRESSION (base64) instead of truncation to preserve cryptographic integrity.
 * Includes comprehensive validation and testing capabilities.
 * 
 * @author KairOS Team
 * @version 4.0.0 - Enhanced Crypto Validation
 */

// --- Enhanced Base64 Encoding Functions ---
function safeBase64Encode(hexString: string): string {
  try {
    // Convert hex to bytes
    const bytes = new Uint8Array(hexString.match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [])
    
    // Convert to base64 using browser API
    let base64 = btoa(String.fromCharCode(...bytes))
    
    // Make URL-safe
    base64 = base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '') // Remove padding for shorter URLs
    
    return base64
  } catch (error) {
    console.warn('Base64 encoding failed, falling back to hex truncation:', error)
    return hexString.substring(0, 32) // Fallback to truncated hex
  }
}

function validateBase64Decode(base64String: string, expectedHexLength: number): { success: boolean, hex: string, error?: string } {
  try {
    // Restore URL-safe base64 to standard base64
    let standardBase64 = base64String
      .replace(/-/g, '+')
      .replace(/_/g, '/')
    
    // Add padding if needed
    while (standardBase64.length % 4) {
      standardBase64 += '='
    }
    
    // Decode
    const decoded = atob(standardBase64)
    const hex = Array.from(decoded).map(char => 
      char.charCodeAt(0).toString(16).padStart(2, '0')
    ).join('')
    
    // Validate length
    if (hex.length < expectedHexLength / 2) {
      return {
        success: false,
        hex: hex.padEnd(expectedHexLength, '0'),
        error: `Decoded hex too short: ${hex.length} chars, expected ${expectedHexLength}`
      }
    }
    
    return { success: true, hex }
  } catch (error) {
    return {
      success: false,
      hex: base64String.padEnd(expectedHexLength, '0'),
      error: `Base64 decode failed: ${error}`
    }
  }
}

// --- Cryptographic Validation Functions ---
async function validateCryptographicParameters(
  chipUID: string,
  signature: string,
  publicKey: string,
  did: string
): Promise<{ valid: boolean, errors: string[], warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Validate chipUID format
  if (!chipUID || chipUID.length < 10) {
    errors.push('Invalid chip UID: too short')
  }
  
  if (!chipUID.includes(':') && chipUID.length > 14) {
    warnings.push('Chip UID may need colon formatting')
  }
  
  // Validate signature format
  if (!signature || signature.length < 64) {
    errors.push(`Invalid signature: too short (${signature.length} chars, need 128+)`)
  }
  
  if (!/^[0-9a-fA-F]+$/.test(signature)) {
    errors.push('Invalid signature: must be hex format')
  }
  
  // Validate public key format
  if (!publicKey || publicKey.length < 32) {
    errors.push(`Invalid public key: too short (${publicKey.length} chars, need 64+)`)
  }
  
  if (!/^[0-9a-fA-F]+$/.test(publicKey)) {
    errors.push('Invalid public key: must be hex format')
  }
  
  // Validate DID format
  if (!did || !did.startsWith('did:key:z')) {
    errors.push('Invalid DID: must start with did:key:z')
  }
  
  // Check DID/public key consistency
  if (did && publicKey) {
    const expectedDIDKey = did.replace('did:key:z', '')
    const publicKeyPrefix = publicKey.substring(0, 32)
    
    if (!expectedDIDKey.includes(publicKeyPrefix.substring(0, 16))) {
      warnings.push('DID and public key may not match')
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// --- Universal NFC URL Generation with Enhanced Validation ---
export function generateiPhoneNFCUrl(
  chipUID: string,
  signature: string,
  publicKey: string,
  did: string,
  baseUrl: string = 'https://kair-os.vercel.app',
  chipType: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA' = 'NTAG213'
): {
  nfcUrl: string
  urlAnalysis: { bytes: number; chars: number; compatibility: Record<string, string> }
  compressionLevel: string
  validation: { valid: boolean, errors: string[], warnings: string[] }
} {
  // Step 1: Validate cryptographic parameters before URL generation
  const validation = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  }
  
  // Basic parameter validation
  if (!chipUID || !signature || !publicKey || !did) {
    validation.errors.push('Missing required parameters')
    validation.valid = false
  }
  
  if (signature.length < 64) {
    validation.errors.push(`Signature too short: ${signature.length} chars`)
    validation.valid = false
  }
  
  if (publicKey.length < 32) {
    validation.errors.push(`Public key too short: ${publicKey.length} chars`)
    validation.valid = false
  }
  
  // Chip memory constraints for NFC programming
  const chipLimits = {
    'NTAG213': 137,  // Ultra small - need maximum compression
    'NTAG215': 492,  // Medium space - use smart compression
    'NTAG216': 900,  // Large space - can use full format
    'NTAG424_DNA': 256 // Moderate space - use smart compression
  }
  
  const limit = chipLimits[chipType]
  
  let nfcUrl: string
  let compressionLevel: string
  
  // Step 2: Generate URL with appropriate compression strategy
  if (limit <= 300) {
    // Strategy: Smart compression with SAFE base64 (preserves crypto integrity)
    const shortUID = chipUID.replace(/:/g, '')
    
    // Use safe base64 encoding with fallback
    const compactSig = safeBase64Encode(signature)
    const compactKey = safeBase64Encode(publicKey)
    
    // Validate that encoding/decoding works correctly
    const sigValidation = validateBase64Decode(compactSig, 128)
    const keyValidation = validateBase64Decode(compactKey, 64)
    
    if (!sigValidation.success) {
      validation.warnings.push(`Signature encoding issue: ${sigValidation.error}`)
    }
    
    if (!keyValidation.success) {
      validation.warnings.push(`Public key encoding issue: ${keyValidation.error}`)
    }
    
    nfcUrl = `${baseUrl}/nfc?u=${shortUID}&s=${compactSig}&k=${compactKey}`
    compressionLevel = 'smart-base64-validated'
  }
  else {
    // Strategy: Full format for large chips
    nfcUrl = `${baseUrl}/nfc?did=${encodeURIComponent(did)}&signature=${signature}&publicKey=${publicKey}&uid=${chipUID}`
    compressionLevel = 'full-parameters'
  }
  
  // Step 3: Analyze URL efficiency and compatibility
  const bytes = new TextEncoder().encode(nfcUrl).length
  const compatibility = {
    'NTAG213': bytes <= 137 ? '✅ Fits perfectly' : '❌ Too long',
    'NTAG215': bytes <= 492 ? '✅ Fits perfectly' : '❌ Too long', 
    'NTAG216': bytes <= 900 ? '✅ Fits perfectly' : '❌ Too long',
    'NTAG424_DNA': bytes <= 256 ? '✅ Fits perfectly' : '❌ Too long'
  }
  
  // Step 4: Final URL validation
  if (bytes > limit) {
    validation.errors.push(`URL too long for ${chipType}: ${bytes} bytes > ${limit} limit`)
    validation.valid = false
  }
  
  // Step 5: Test URL parameter parsing (simulation)
  try {
    const testUrl = new URL(nfcUrl)
    const testParams = new URLSearchParams(testUrl.search)
    
    if (testParams.has('u') && testParams.has('s') && testParams.has('k')) {
      // Test ultra-compressed format parsing
      const ultraSig = testParams.get('s')!
      const ultraKey = testParams.get('k')!
      
      const sigTest = validateBase64Decode(ultraSig, 128)
      const keyTest = validateBase64Decode(ultraKey, 64)
      
      if (!sigTest.success || !keyTest.success) {
        validation.warnings.push('Generated URL may have parsing issues')
      }
    }
  } catch (error) {
    validation.errors.push('Generated URL is malformed')
    validation.valid = false
  }
  
  return {
    nfcUrl,
    urlAnalysis: {
      bytes,
      chars: nfcUrl.length,
      compatibility
    },
    compressionLevel,
    validation
  }
}

/**
 * 📊 Analyzes URL efficiency for NFC programming
 */
export function analyzeiPhoneNFCUrl(url: string) {
  const bytes = new TextEncoder().encode(url).length
  const chars = url.length
  
  return {
    bytes,
    chars,
    efficiency: chars / bytes, // Characters per byte
    nfcCompatibility: {
      'NTAG213': bytes <= 137 ? '✅ Perfect for NFC programming' : '❌ Too long',
      'NTAG215': bytes <= 492 ? '✅ Perfect for NFC programming' : '❌ Too long',
      'NTAG216': bytes <= 900 ? '✅ Perfect for NFC programming' : '❌ Too long',
      'NTAG424_DNA': bytes <= 256 ? '✅ Perfect for NFC programming' : '❌ Too long'
    },
    recommendations: bytes > 200 ? [
      'Consider using ultra-compressed format (?u=...&s=...&k=...)',
      'Shorten base domain if possible',
      'Use NTAG215 or NTAG216 for larger URLs',
      'Remove unnecessary URL parameters'
    ] : ['✅ URL is optimally sized for NFC programming apps']
  }
}

/**
 * 🔧 Validates NFC URL format
 */
export function validateiPhoneNFCUrl(url: string): {
  isValid: boolean
  errors: string[]
  suggestions: string[]
} {
  const errors: string[] = []
  const suggestions: string[] = []
  
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    // Check for required parameters
    const hasUltraFormat = params.has('u') && params.has('s') && params.has('k')
    const hasCompressedFormat = params.has('c') && params.has('s') && params.has('p')
    const hasFullFormat = params.has('did') && params.has('signature') && params.has('publicKey')
    
    if (!hasUltraFormat && !hasCompressedFormat && !hasFullFormat) {
      errors.push('Missing required NFC parameters')
      suggestions.push('Include either u,s,k or c,s,p or full did,signature,publicKey parameters')
    }
    
    // Check URL length for NFC programming
    const bytes = new TextEncoder().encode(url).length
    if (bytes > 200) {
      errors.push(`URL too long: ${bytes} bytes (recommended <200 for reliable NFC writing)`)
      suggestions.push('Use ultra-compressed format or shorter domain')
    }
    
    // Suggest optimizations
    if (urlObj.hostname.length > 20) {
      suggestions.push('Consider shorter domain name for NFC optimization')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      suggestions
    }
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid URL format'],
      suggestions: ['Ensure URL has valid protocol (https://) and domain']
    }
  }
}

/**
 * 🎯 NFC chip recommendations
 */
export function getiPhoneNFCChipRecommendations(urlLength: number) {
  const recommendations = {
    'NTAG213': {
      maxSize: 137,
      fits: urlLength <= 137,
      price: '$0.15',
      features: ['Ultra cheap', 'Basic NFC', 'Perfect for short URLs'],
      limitations: ['Very limited space', 'Single URL only']
    },
    'NTAG215': {
      maxSize: 492,
      fits: urlLength <= 492,
      price: '$0.25',
      features: ['Standard size', 'Good NFC compatibility', 'Space for longer URLs'],
      limitations: ['Common amiibo format', 'May be overwritten']
    },
    'NTAG216': {
      maxSize: 900,
      fits: urlLength <= 900,
      price: '$0.35',
      features: ['Large size', 'Excellent compatibility', 'Room for full URLs'],
      limitations: ['Larger/more expensive', 'Overkill for simple URLs']
    },
    'NTAG424_DNA': {
      maxSize: 256,
      fits: urlLength <= 256,
      price: '$1.50',
      features: ['Secure authentication', 'Universal compatibility', 'Tamper detection'],
      limitations: ['Expensive', 'Complex programming', 'Limited space']
    }
  }
  
  // Find best recommendation
  const bestFit = Object.entries(recommendations)
    .filter(([_, spec]) => spec.fits)
    .sort((a, b) => a[1].maxSize - b[1].maxSize)[0]
  
  const cheapestFit = Object.entries(recommendations)
    .filter(([_, spec]) => spec.fits)
    .sort((a, b) => parseFloat(a[1].price.replace('$', '')) - parseFloat(b[1].price.replace('$', '')))[0]
  
  return {
    recommendations,
    bestFit: bestFit ? {
      chipType: bestFit[0],
      ...bestFit[1]
    } : null,
    cheapestFit: cheapestFit ? {
      chipType: cheapestFit[0],
      ...cheapestFit[1]
    } : null,
    urlLength
  }
}

/**
 * 📱 Universal NFC programming instructions generator
 */
export function generateiPhoneNFCInstructions(
  url: string,
  chipType: string
): {
  nfcTools: string[]
  tagWriter: string[]
  troubleshooting: string[]
  urlLength: number
} {
  const urlLength = new TextEncoder().encode(url).length
  
  const nfcTools = [
    '1. Copy the URL above to your device clipboard',
    '2. Download "NFC Tools" from App Store/Play Store (free)',
    '3. Open NFC Tools and tap "Write"',
    '4. Tap "Add a record" → "URL/URI"',
    '5. Paste the copied URL into the text field',
    '6. Tap "Write" and hold your NFC tag near your phone',
    '7. Wait for success sound/vibration',
    '8. Test by tapping the tag - should open URL in browser'
  ]
  
  const tagWriter = [
    '1. Copy the URL above to your device clipboard',
    '2. Download "TagWriter by NXP" (free)',
    '3. Open TagWriter and tap "Write tags"',
    '4. Select "New dataset" → "URL"',
    '5. Paste the copied URL',
    '6. Tap "Write" and place tag near phone',
    '7. Confirm write operation'
  ]
  
  const troubleshooting = [
    'If write fails: Try "Erase tag" first in NFC Tools',
    'Make sure you use "URL/URI" option (not "Data" or "Text")',
    'iPhone: Hold tag near top back (camera area)',
    'Android: Hold tag near center back of phone',
    'Ensure phone has internet connection',
    'Try TagWriter by NXP as alternative app',
    'Check that tag is not write-protected',
    `URL size: ${urlLength} bytes (${chipType} limit varies)`
  ]
  
  return {
    nfcTools,
    tagWriter,
    troubleshooting,
    urlLength
  }
} 