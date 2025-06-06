import type { Moment } from "./types"
import { HAL } from "@/lib/hardwareAbstraction"

// Simple base58 alphabet (Bitcoin/IPFS style)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

// Simple base58 encode function
function base58Encode(bytes: Uint8Array): string {
  if (bytes.length === 0) return ""

  let result = ""
  let num = BigInt(0)

  // Convert bytes to big integer
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i])
  }

  // Convert to base58
  while (num > 0) {
    const remainder = num % BigInt(58)
    result = BASE58_ALPHABET[Number(remainder)] + result
    num = num / BigInt(58)
  }

  // Handle leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = "1" + result
  }

  return result
}

// Simple base58 decode function (Bitcoin/IPFS style)
function base58Decode(str: string): Uint8Array {
  if (!str) return new Uint8Array()
  let num = BigInt(0)
  for (let i = 0; i < str.length; i++) {
    const char = str[i]
    const idx = BASE58_ALPHABET.indexOf(char)
    if (idx === -1) throw new Error(`Invalid base58 character: ${char}`)
    num = num * BigInt(58) + BigInt(idx)
  }
  // Convert big integer to bytes
  let bytes = []
  while (num > 0) {
    bytes.push(Number(num % BigInt(256)))
    num = num / BigInt(256)
  }
  // Handle leading zeros
  for (let i = 0; i < str.length && str[i] === "1"; i++) {
    bytes.push(0)
  }
  return new Uint8Array(bytes.reverse())
}

// Generate ECDSA key pair using HAL (P-256 curve in simulation)
export async function generateEd25519KeyPair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  try {
    const keyPair = await HAL.crypto.generateKeyPair()
    return keyPair
  } catch (error) {
    console.error("❌ Error generating key pair:", error)
    throw new Error("Failed to generate cryptographic keys")
  }
}

// Create a proper DID:key from public key using HAL
export async function createDIDKey(publicKey: CryptoKey): Promise<string> {
  try {
    // Export the public key to raw format using HAL
    const publicKeyBytes = await HAL.crypto.exportPublicKey(publicKey)
    // For DID:key, we'll use a simplified approach
    // In production, this would follow exact multicodec specs
    // Using 0x1200 prefix to simulate secp256r1 (P-256) multicodec
    const multicodecPrefix = new Uint8Array([0x12, 0x00])
    // Combine prefix with public key
    const multicodecKey = new Uint8Array(multicodecPrefix.length + publicKeyBytes.length)
    multicodecKey.set(multicodecPrefix)
    multicodecKey.set(publicKeyBytes, multicodecPrefix.length)
    // Encode using our base58 implementation
    const base58Key = base58Encode(multicodecKey)
    // Create the DID with 'z' prefix (base58btc multibase indicator)
    const did = `did:key:z${base58Key}`
    return did
  } catch (error) {
    console.error("❌ Error creating DID:key:", error)
    throw new Error("Failed to create DID from public key")
  }
}

// Sign a moment using HAL
export async function signMoment(privateKey: CryptoKey, moment: Omit<Moment, "signature">): Promise<string> {
  try {
    // Convert the moment object to a canonical string
    const momentString = JSON.stringify(moment, Object.keys(moment).sort())
    // Convert string to bytes
    const messageBytes = new TextEncoder().encode(momentString)
    // Sign using HAL
    const signature = await HAL.crypto.sign(messageBytes, privateKey)
    // Convert signature to base58 for storage
    const base58Signature = base58Encode(signature)
    return base58Signature
  } catch (error) {
    console.error("❌ Error signing moment:", error)
    throw new Error("Failed to sign moment")
  }
}

// Verify a moment's signature using HAL
export async function verifyMomentSignature(
  publicKey: CryptoKey,
  moment: Omit<Moment, "signature">,
  signature: string,
): Promise<boolean> {
  try {
    // Convert the moment object to a canonical string
    const momentString = JSON.stringify(moment, Object.keys(moment).sort())
    // Convert string to bytes
    const messageBytes = new TextEncoder().encode(momentString)
    // Decode base58 signature (always raw r|s, 64 bytes)
    const signatureBytes = base58Decode(signature)
    // Verify using HAL
    const valid = await HAL.crypto.verify(messageBytes, signatureBytes, publicKey)
    return valid
  } catch (error) {
    console.error("❌ Error verifying signature:", error)
    return false
  }
}

// Helper function to convert CryptoKey to storable format using HAL
export async function exportKeyPair(keyPair: { privateKey: CryptoKey; publicKey: CryptoKey }) {
  try {
    return await HAL.crypto.exportKeyPair(keyPair)
  } catch (error) {
    console.error("❌ Error exporting key pair:", error)
    throw new Error("Failed to export key pair")
  }
}

// Helper function to import stored key pair using HAL
export async function importKeyPair(storedKeyPair: { privateKey: number[]; publicKey: number[] }) {
  try {
    return await HAL.crypto.importKeyPair(storedKeyPair)
  } catch (error) {
    console.error("❌ Error importing key pair:", error)
    throw new Error("Failed to import key pair")
  }
}

export async function exportPublicKey(publicKey: CryptoKey): Promise<Uint8Array> {
  const exported = await crypto.subtle.exportKey('raw', publicKey)
  const bytes = new Uint8Array(exported)
  return bytes
}
