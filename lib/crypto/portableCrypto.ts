// portableCrypto.ts
// All cryptographic and moment-logging logic for KairOS simulation and embedded migration
// NOTE: This file is designed for maximum portability. Annotated for future ESP32 (C++) migration.

import type { Moment } from "../types"
import { HAL } from "@/lib/hardwareAbstraction"

// --- CONFIG ---
export const IS_SIMULATION_MODE = true // Set to false for hardware mode

// --- CRYPTOGRAPHY ---

/**
 * Generate a new DID keypair (Ed25519 simulated with P-256 for browser compatibility)
 * @returns {Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }>}
 * @note This logic will later run on XIAO ESP32S3 Sense in C++ using ed25519_dalek or similar lib
 */
export async function createDIDKeypair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }> {
  // Use HAL for cross-platform key generation
  return await HAL.crypto.generateKeyPair()
}

/**
 * Create a DID string from a public key
 * @note This logic will later run in C++ on ESP32
 */
export async function createDID(publicKey: CryptoKey): Promise<string> {
  // Use HAL for cross-platform public key export
  const bytes = await HAL.crypto.exportPublicKey(publicKey)
  const prefix = new Uint8Array([0x12, 0x00])
  const multicodec = new Uint8Array(prefix.length + bytes.length)
  multicodec.set(prefix)
  multicodec.set(bytes, prefix.length)
  const base58 = base58Encode(multicodec)
  return `did:key:z${base58}`
}

/**
 * Sign a moment object
 * @note This logic will later run in C++ on ESP32
 */
export async function signMoment(privateKey: CryptoKey, moment: Omit<Moment, "signature">): Promise<string> {
  const msg = JSON.stringify(moment, Object.keys(moment).sort())
  const bytes = new TextEncoder().encode(msg)
  // Use HAL for cross-platform signing
  const sig = await HAL.crypto.sign(bytes, privateKey)
  return base58Encode(sig)
}

// --- MOMENT LOGGING ---

/**
 * Create a new DID and log a moment
 * @returns {Promise<{ did: string; keyPair: { privateKey: CryptoKey; publicKey: CryptoKey }; moment: Moment }>}
 * @note This logic will later run on XIAO ESP32S3 Sense in C++
 */
export async function createDIDAndLogMoment(issuerKeyPair: { privateKey: CryptoKey; publicKey: CryptoKey }, issuerDID: string): Promise<{ did: string; keyPair: { privateKey: CryptoKey; publicKey: CryptoKey }; moment: Moment }> {
  // Generate new user keypair
  const userKeyPair = await createDIDKeypair()
  const userDID = await createDID(userKeyPair.publicKey)
  const timestamp = new Date().toISOString()
  const momentObj = {
    subject: userDID,
    issuer: issuerDID,
    timestamp,
    description: "Moment logged via KairOS",
  }
  const signature = await signMoment(issuerKeyPair.privateKey, momentObj)
  const moment: Moment = { ...momentObj, signature }
  return { did: userDID, keyPair: userKeyPair, moment }
}

/**
 * Log a moment for an existing DID
 * @note This logic will later run on XIAO ESP32S3 Sense in C++
 */
export async function logMoment(issuerKeyPair: { privateKey: CryptoKey; publicKey: CryptoKey }, issuerDID: string, userDID: string): Promise<Moment> {
  const timestamp = new Date().toISOString()
  const momentObj = {
    subject: userDID,
    issuer: issuerDID,
    timestamp,
    description: "Moment logged via KairOS",
  }
  const signature = await signMoment(issuerKeyPair.privateKey, momentObj)
  return { ...momentObj, signature }
}

// --- BASE58 (portable, for C++ port) ---
// NOTE: This will be ported to C++ for ESP32
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
function base58Encode(bytes: Uint8Array): string {
  let num = BigInt(0)
  for (let i = 0; i < bytes.length; i++) {
    num = num * BigInt(256) + BigInt(bytes[i])
  }
  let result = ""
  while (num > 0) {
    const remainder = num % BigInt(58)
    result = BASE58_ALPHABET[Number(remainder)] + result
    num = num / BigInt(58)
  }
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    result = "1" + result
  }
  return result
}

// --- FUTURE HOOKS ---

/**
 * Placeholder for sending moment data to Raspberry Pi over serial/BLE
 * @note To be implemented on ESP32
 */
export function sendToRaspberryPi(moment: Moment) {
  // TODO: replace this with serial/BLE send on ESP32
}

/**
 * Placeholder for receiving NFC tag data from a real NFC module
 * @note To be implemented on ESP32
 */
export function receiveNFCData() {
  // TODO: replace this with NFC read logic on ESP32
} 