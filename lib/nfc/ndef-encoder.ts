/**
 * 🏷️ NFC NDEF Record Encoder for KairOS
 * 
 * Follows NFC Forum standards for maximum compatibility with:
 * - NFC Tools, TagWriter, NFC TagInfo apps
 * - Android/iOS NFC APIs
 * - Different tag types (NTAG213/215/216/424, Mifare, etc.)
 * - Industry-standard NDEF formatting
 * 
 * @author KairOS Team
 * @version 2.0.0
 */

// --- NDEF Record Structure ---
export interface NDEFRecord {
  tnf: number        // Type Name Format (3 bits)
  type: Uint8Array   // Record Type
  id?: Uint8Array    // Record ID (optional)
  payload: Uint8Array // Record Payload
}

export interface NDEFMessage {
  records: NDEFRecord[]
}

// --- NDEF Type Name Formats ---
export const TNF = {
  EMPTY: 0x00,           // Empty record
  WELL_KNOWN: 0x01,      // Well-known type (RTD)
  MIME_MEDIA: 0x02,      // MIME media type
  ABSOLUTE_URI: 0x03,    // Absolute URI
  EXTERNAL: 0x04,        // External type
  UNKNOWN: 0x05,         // Unknown type
  UNCHANGED: 0x06,       // Unchanged (chunked payload)
  RESERVED: 0x07         // Reserved
} as const

// --- Well-Known Record Types ---
export const RTD = {
  TEXT: new TextEncoder().encode('T'),           // Text record
  URI: new TextEncoder().encode('U'),            // URI record
  SMART_POSTER: new TextEncoder().encode('Sp'),  // Smart Poster
  HANDOVER_SELECT: new TextEncoder().encode('Hs'), // Handover Select
  HANDOVER_CARRIER: new TextEncoder().encode('Hc'), // Handover Carrier
  ALTERNATIVE_CARRIER: new TextEncoder().encode('ac') // Alternative Carrier
} as const

// --- URI Prefixes (for compression) ---
const URI_PREFIXES = [
  '',                    // 0x00 - No prefix
  'http://www.',        // 0x01
  'https://www.',       // 0x02
  'http://',            // 0x03
  'https://',           // 0x04
  'tel:',               // 0x05
  'mailto:',            // 0x06
  'ftp://anonymous:anonymous@', // 0x07
  'ftp://ftp.',         // 0x08
  'ftps://',            // 0x09
  'sftp://',            // 0x0A
  'smb://',             // 0x0B
  'nfs://',             // 0x0C
  'ftp://',             // 0x0D
  'dav://',             // 0x0E
  'news:',              // 0x0F
  'telnet://',          // 0x10
  'imap:',              // 0x11
  'rtsp://',            // 0x12
  'urn:',               // 0x13
  'pop:',               // 0x14
  'sip:',               // 0x15
  'sips:',              // 0x16
  'tftp:',              // 0x17
  'btspp://',           // 0x18
  'btl2cap://',         // 0x19
  'btgoep://',          // 0x1A
  'tcpobex://',         // 0x1B
  'irdaobex://',        // 0x1C
  'file://',            // 0x1D
  'urn:epc:id:',        // 0x1E
  'urn:epc:tag:',       // 0x1F
  'urn:epc:pat:',       // 0x20
  'urn:epc:raw:',       // 0x21
  'urn:epc:',           // 0x22
  'urn:nfc:'            // 0x23
]

/**
 * 🎯 Creates optimized NDEF URI record for KairOS authentication
 */
export function createKairOSNDEFRecord(
  chipUID: string,
  signature: string,
  publicKey: string,
  baseUrl: string = 'https://kair.sh',
  compressionLevel: 'ultra' | 'standard' | 'full' = 'ultra'
): { record: NDEFRecord; urlLength: number; compressionRatio: number } {
  
  let url: string
  let originalUrl: string
  
  // Create different URL formats based on compression level
  switch (compressionLevel) {
    case 'ultra':
      // Ultra-compressed: base32 + short IDs
      const compactId = generateCompactId(chipUID, signature)
      url = `${baseUrl}/n/${compactId}`
      originalUrl = `${baseUrl}/nfc?did=did:key:z${publicKey.substring(0, 32)}&signature=${signature}&publicKey=${publicKey}&uid=${chipUID}`
      break
      
    case 'standard':
      // Standard compression: short parameter names
      url = `${baseUrl}/nfc?c=${encodeChipUID(chipUID)}&s=${signature.substring(0, 32)}&p=${publicKey.substring(0, 32)}`
      originalUrl = `${baseUrl}/nfc?did=did:key:z${publicKey.substring(0, 32)}&signature=${signature}&publicKey=${publicKey}&uid=${chipUID}`
      break
      
    case 'full':
      // Full parameters (for debugging)
      url = `${baseUrl}/nfc?did=did:key:z${publicKey.substring(0, 32)}&signature=${signature}&publicKey=${publicKey}&uid=${chipUID}`
      originalUrl = url
      break
  }
  
  // Find best URI prefix for compression
  const { prefixCode, compressedUrl } = compressUrl(url)
  
  // Create URI record payload
  const payload = new Uint8Array([prefixCode, ...new TextEncoder().encode(compressedUrl)])
  
  const record: NDEFRecord = {
    tnf: TNF.WELL_KNOWN,
    type: RTD.URI,
    payload
  }
  
  return {
    record,
    urlLength: url.length,
    compressionRatio: originalUrl.length / url.length
  }
}

/**
 * 🏗️ Creates complete NDEF message with multiple records for redundancy
 */
export function createKairOSNDEFMessage(
  chipUID: string,
  signature: string,
  publicKey: string,
  baseUrl: string = 'https://kair.sh',
  options: {
    includeText?: boolean
    includeBackup?: boolean
    chipType?: 'NTAG213' | 'NTAG215' | 'NTAG216' | 'NTAG424_DNA'
  } = {}
): { message: NDEFMessage; totalSize: number; efficiency: string } {
  
  const records: NDEFRecord[] = []
  
  // Primary URI record (ultra-compressed)
  const { record: primaryRecord } = createKairOSNDEFRecord(chipUID, signature, publicKey, baseUrl, 'ultra')
  records.push(primaryRecord)
  
  // Optional: Add text record for human readability
  if (options.includeText) {
    const textRecord = createTextRecord('KairOS NFC Authentication - Tap to verify identity', 'en')
    records.push(textRecord)
  }
  
  // Optional: Add backup URL record (standard compression) for fallback
  if (options.includeBackup) {
    const { record: backupRecord } = createKairOSNDEFRecord(chipUID, signature, publicKey, baseUrl, 'standard')
    records.push(backupRecord)
  }
  
  const message: NDEFMessage = { records }
  const totalSize = calculateNDEFSize(message)
  
  // Determine efficiency based on chip type
  const chipLimits = {
    'NTAG213': 137,   // bytes usable
    'NTAG215': 492,   // bytes usable
    'NTAG216': 900,   // bytes usable
    'NTAG424_DNA': 256 // bytes usable
  }
  
  const chipType = options.chipType || 'NTAG213'
  const limit = chipLimits[chipType]
  const efficiency = `${Math.round((totalSize / limit) * 100)}%`
  
  return { message, totalSize, efficiency }
}

/**
 * 📦 Encodes NDEF message to binary format for NFC programming
 */
export function encodeNDEFMessage(message: NDEFMessage): Uint8Array {
  if (message.records.length === 0) {
    return new Uint8Array([0xD0, 0x00, 0x00]) // Empty NDEF message
  }
  
  const chunks: Uint8Array[] = []
  
  message.records.forEach((record, index) => {
    const isFirst = index === 0
    const isLast = index === message.records.length - 1
    
    const recordBytes = encodeNDEFRecord(record, isFirst, isLast)
    chunks.push(recordBytes)
  })
  
  // Combine all chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
  const result = new Uint8Array(totalLength)
  
  let offset = 0
  chunks.forEach(chunk => {
    result.set(chunk, offset)
    offset += chunk.length
  })
  
  return result
}

/**
 * 🔧 Encodes a single NDEF record
 */
function encodeNDEFRecord(record: NDEFRecord, isFirst: boolean, isLast: boolean): Uint8Array {
  const chunks: number[] = []
  
  // Header byte
  let header = record.tnf & 0x07 // TNF (3 bits)
  if (isFirst) header |= 0x80    // MB (Message Begin)
  if (isLast) header |= 0x40     // ME (Message End)
  if (record.id && record.id.length > 0) header |= 0x08 // IL (ID Length)
  if (record.payload.length < 256) header |= 0x10 // SR (Short Record)
  
  chunks.push(header)
  
  // Type length
  chunks.push(record.type.length)
  
  // Payload length
  if (record.payload.length < 256) {
    chunks.push(record.payload.length) // Short record
  } else {
    // Long record (4 bytes, big-endian)
    chunks.push((record.payload.length >> 24) & 0xFF)
    chunks.push((record.payload.length >> 16) & 0xFF)
    chunks.push((record.payload.length >> 8) & 0xFF)
    chunks.push(record.payload.length & 0xFF)
  }
  
  // ID length (if present)
  if (record.id && record.id.length > 0) {
    chunks.push(record.id.length)
  }
  
  // Type
  chunks.push(...Array.from(record.type))
  
  // ID (if present)
  if (record.id && record.id.length > 0) {
    chunks.push(...Array.from(record.id))
  }
  
  // Payload
  chunks.push(...Array.from(record.payload))
  
  return new Uint8Array(chunks)
}

/**
 * 📝 Creates a text record
 */
function createTextRecord(text: string, languageCode: string = 'en'): NDEFRecord {
  const langBytes = new TextEncoder().encode(languageCode)
  const textBytes = new TextEncoder().encode(text)
  
  const payload = new Uint8Array([langBytes.length, ...langBytes, ...textBytes])
  
  return {
    tnf: TNF.WELL_KNOWN,
    type: RTD.TEXT,
    payload
  }
}

/**
 * 🗜️ Compresses URL using NDEF URI prefixes
 */
function compressUrl(url: string): { prefixCode: number; compressedUrl: string } {
  // Find the longest matching prefix
  let bestPrefixCode = 0
  let bestPrefix = ''
  
  for (let i = 1; i < URI_PREFIXES.length; i++) {
    const prefix = URI_PREFIXES[i]
    if (url.startsWith(prefix) && prefix.length > bestPrefix.length) {
      bestPrefixCode = i
      bestPrefix = prefix
    }
  }
  
  const compressedUrl = url.substring(bestPrefix.length)
  return { prefixCode: bestPrefixCode, compressedUrl }
}

/**
 * 🏷️ Generates compact ID for ultra-short URLs
 */
function generateCompactId(chipUID: string, signature: string): string {
  // Create deterministic but unique ID
  const data = chipUID + signature.substring(0, 16)
  const hash = Array.from(new TextEncoder().encode(data))
    .reduce((acc, byte) => ((acc << 5) - acc + byte) & 0xFFFFFF, 0)
  
  return hash.toString(36).toUpperCase().substring(0, 8)
}

/**
 * 🔗 Encodes chip UID for URL parameters
 */
function encodeChipUID(chipUID: string): string {
  return chipUID.replace(/:/g, '').substring(0, 12)
}

/**
 * 📊 Calculates total NDEF message size
 */
function calculateNDEFSize(message: NDEFMessage): number {
  const encoded = encodeNDEFMessage(message)
  return encoded.length
}

/**
 * 🎯 Tag-specific optimization recommendations
 */
export function getTagOptimizations(chipType: string) {
  const recommendations = {
    'NTAG213': {
      maxSize: 137,
      recommended: 'ultra',
      features: ['Basic URL', 'Single record'],
      limitations: ['Very limited space', 'No backup records']
    },
    'NTAG215': {
      maxSize: 492,
      recommended: 'standard',
      features: ['Primary + backup URL', 'Text record', 'Multiple records'],
      limitations: ['Standard amiibo tags']
    },
    'NTAG216': {
      maxSize: 900,
      recommended: 'full',
      features: ['Full URLs', 'Multiple records', 'Rich metadata'],
      limitations: ['Larger/more expensive']
    },
    'NTAG424_DNA': {
      maxSize: 256,
      recommended: 'standard',
      features: ['Secure authentication', 'Dynamic data', 'Tamper detection'],
      limitations: ['More expensive', 'Complex programming']
    }
  }
  
  return recommendations[chipType] || recommendations['NTAG213']
}

/**
 * 🔍 Validates NDEF message for tag compatibility
 */
export function validateNDEFForTag(
  message: NDEFMessage, 
  chipType: string
): { isValid: boolean; warnings: string[]; suggestions: string[] } {
  const warnings: string[] = []
  const suggestions: string[] = []
  
  const totalSize = calculateNDEFSize(message)
  const tagInfo = getTagOptimizations(chipType)
  
  if (totalSize > tagInfo.maxSize) {
    warnings.push(`NDEF size (${totalSize} bytes) exceeds ${chipType} capacity (${tagInfo.maxSize} bytes)`)
    suggestions.push('Use ultra compression or reduce records')
  }
  
  if (totalSize > tagInfo.maxSize * 0.9) {
    warnings.push(`NDEF size (${totalSize} bytes) uses >90% of tag capacity`)
    suggestions.push('Consider leaving space for future updates')
  }
  
  if (message.records.length > 3 && chipType === 'NTAG213') {
    warnings.push('Multiple records may not fit on NTAG213')
    suggestions.push('Use single URI record for NTAG213')
  }
  
  return {
    isValid: totalSize <= tagInfo.maxSize,
    warnings,
    suggestions
  }
}

/**
 * 📱 Generates programming instructions for popular NFC apps
 */
export function generateProgrammingInstructions(
  ndefBytes: Uint8Array,
  chipType: string
): {
  nfcTools: string[]
  tagWriter: string[]
  hexData: string
  size: number
} {
  const hexData = Array.from(ndefBytes)
    .map(byte => byte.toString(16).padStart(2, '0').toUpperCase())
    .join('')
  
  const nfcTools = [
    '1. Open "NFC Tools" app on your phone',
    '2. Tap "Write" tab at the bottom',
    '3. Select "Add a record" → "Data" → "Hex data"',
    `4. Paste: ${hexData}`,
    '5. Tap "Write" and hold tag to phone',
    '6. Wait for success confirmation'
  ]
  
  const tagWriter = [
    '1. Open "TagWriter by NXP" app',
    '2. Tap "Write tags"',
    '3. Select "New dataset"',
    '4. Choose "Custom data" → "NDEF message"',
    `5. Enter hex data: ${hexData}`,
    '6. Tap "Write" and place tag near phone',
    '7. Confirm write operation'
  ]
  
  return {
    nfcTools,
    tagWriter,
    hexData,
    size: ndefBytes.length
  }
} 