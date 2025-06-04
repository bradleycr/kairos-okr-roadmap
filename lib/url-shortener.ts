/**
 * 🎯 KairOS Universal NFC URL Generator
 * 
 * Generates optimized URLs for NFC programming apps with maximum compatibility
 * for different NFC chip types (NTAG213/215/216/424).
 * Works with iPhone NFC Tools, Android apps, TagWriter, and other NFC programming tools.
 * 
 * @author KairOS Team
 * @version 2.0.0
 */

// --- Universal NFC URL Generation ---
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
} {
  // Chip memory constraints for NFC programming
  const chipLimits = {
    'NTAG213': 137,   // Very limited - need ultra compression
    'NTAG215': 492,   // Good space - can use standard format
    'NTAG216': 900,   // Lots of space - can use full format
    'NTAG424_DNA': 256 // Moderate space - use compressed format
  }
  
  const limit = chipLimits[chipType]
  
  let nfcUrl: string
  let compressionLevel: string
  
  // Strategy 1: Ultra-compressed for small chips (NTAG213)
  if (limit <= 150) {
    // Use minimal parameters - perfect for all NFC Tools
    const shortUID = chipUID.replace(/:/g, '').substring(0, 8)
    const shortSig = signature.substring(0, 16)
    const shortKey = publicKey.substring(0, 16)
    nfcUrl = `${baseUrl}/nfc?u=${shortUID}&s=${shortSig}&k=${shortKey}`
    compressionLevel = 'ultra'
  }
  // Strategy 2: Standard compression for medium chips
  else if (limit <= 300) {
    const compactUID = chipUID.replace(/:/g, '').substring(0, 12)
    const compactSig = signature.substring(0, 24)
    const compactKey = publicKey.substring(0, 24)
    nfcUrl = `${baseUrl}/nfc?c=${compactUID}&s=${compactSig}&p=${compactKey}`
    compressionLevel = 'standard'
  }
  // Strategy 3: Full format for large chips
  else {
    nfcUrl = `${baseUrl}/nfc?did=${encodeURIComponent(did)}&signature=${signature}&publicKey=${publicKey}&uid=${chipUID}`
    compressionLevel = 'full'
  }
  
  // Analyze URL efficiency for NFC programming
  const bytes = new TextEncoder().encode(nfcUrl).length
  const compatibility = {
    'NTAG213': bytes <= 137 ? '✅ Fits perfectly' : '❌ Too long',
    'NTAG215': bytes <= 492 ? '✅ Fits perfectly' : '❌ Too long', 
    'NTAG216': bytes <= 900 ? '✅ Fits perfectly' : '❌ Too long',
    'NTAG424_DNA': bytes <= 256 ? '✅ Fits perfectly' : '❌ Too long'
  }
  
  return {
    nfcUrl,
    urlAnalysis: {
      bytes,
      chars: nfcUrl.length,
      compatibility
    },
    compressionLevel
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