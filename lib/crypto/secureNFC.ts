/**
 * Secure NFC Architecture for Metal Pocket Watch Implementation
 * 
 * SECURITY MODEL:
 * - Master seed stays with user (never on chip)
 * - NFC chip only stores derived public key + device ID
 * - Authentication uses challenge-response with derived keys
 * - Even if chip is cloned, attacker can't access other devices
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { hkdf } from '@noble/hashes/hkdf';
import { randomBytes } from '@noble/hashes/utils';

// Enable synchronous methods
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface SecureNFCConfig {
  deviceId: string;        // Unique device identifier (stored on chip)
  publicKey: Uint8Array;   // Derived public key (stored on chip)
  chipUID: string;         // Hardware UID (read-only)
  derivationPath: string;  // Key derivation path (stored on chip)
  nfcUrl: string;         // Authentication URL template
}

export interface UserMasterKey {
  masterSeed: Uint8Array;  // 32-byte master seed (NEVER goes on chip)
  userId: string;          // User identifier
  createdAt: number;       // Key creation timestamp
}

/**
 * Generate a master seed for the user (store securely, never on NFC)
 */
export function generateMasterSeed(userId: string): UserMasterKey {
  return {
    masterSeed: ed.utils.randomPrivateKey(),
    userId,
    createdAt: Date.now()
  };
}

/**
 * Derive a device-specific keypair from master seed
 * Each device gets a unique keypair derived from the master seed
 */
export function deriveDeviceKeypair(
  masterSeed: Uint8Array, 
  deviceId: string
): { privateKey: Uint8Array; publicKey: Uint8Array; derivationPath: string } {
  
  // Create device-specific derivation path
  const derivationPath = `m/44'/9999'/0'/${deviceId}`;
  
  // Derive device private key using HKDF
  const info = new TextEncoder().encode(`KairOS-Device-${deviceId}`);
  const salt = new TextEncoder().encode('KairOS-NFC-2025');
  
  const devicePrivateKey = hkdf(sha512, masterSeed, salt, info, 32);
  
  // Generate public key from derived private key
  const devicePublicKey = ed.getPublicKey(devicePrivateKey);
  
  return {
    privateKey: devicePrivateKey,
    publicKey: devicePublicKey,
    derivationPath
  };
}

/**
 * Prepare NFC chip configuration (what gets written to the chip)
 * NOTICE: Private key is NOT included - only public key and metadata
 */
export function prepareNFCChipData(
  masterSeed: Uint8Array,
  deviceId: string,
  chipUID: string,
  baseUrl: string = 'https://kair-os.vercel.app/nfc'
): SecureNFCConfig {
  
  const { publicKey, derivationPath } = deriveDeviceKeypair(masterSeed, deviceId);
  
  // Create authentication URL with device ID
  const nfcUrl = `${baseUrl}?d=${deviceId}&c=${encodeURIComponent(chipUID)}`;
  
  return {
    deviceId,
    publicKey,
    chipUID,
    derivationPath,
    nfcUrl
  };
}

/**
 * Sign a challenge using the device's private key
 * This happens on the user's secure device, NOT on the NFC chip
 */
export async function signDeviceChallenge(
  masterSeed: Uint8Array,
  deviceId: string,
  challenge: string
): Promise<Uint8Array> {
  
  const { privateKey } = deriveDeviceKeypair(masterSeed, deviceId);
  
  const challengeBytes = new TextEncoder().encode(challenge);
  const challengeHash = sha512(challengeBytes);
  
  return await ed.signAsync(challengeHash, privateKey);
}

/**
 * Verify a device signature (used by authentication server)
 */
export async function verifyDeviceSignature(
  signature: Uint8Array,
  challenge: string,
  devicePublicKey: Uint8Array
): Promise<boolean> {
  
  try {
    const challengeBytes = new TextEncoder().encode(challenge);
    const challengeHash = sha512(challengeBytes);
    
    return await ed.verifyAsync(signature, challengeHash, devicePublicKey);
  } catch (error) {
    console.error('Device signature verification failed:', error);
    return false;
  }
}

/**
 * NFC Authentication Flow for Metal Pocket Watch
 * 
 * 1. User taps NFC chip
 * 2. Browser reads device ID + public key from chip
 * 3. Server generates challenge
 * 4. User's app signs challenge with derived private key
 * 5. Server verifies signature against device public key
 */
export interface NFCAuthenticationFlow {
  // Step 1: Read from NFC chip
  chipData: SecureNFCConfig;
  
  // Step 2: Server challenge
  challenge: string;
  timestamp: number;
  
  // Step 3: User signature (created on secure device)
  signature?: Uint8Array;
  
  // Step 4: Verification result
  verified?: boolean;
  sessionToken?: string;
}

/**
 * Create authentication challenge
 */
export function createAuthChallenge(deviceId: string, chipUID: string): string {
  const timestamp = Date.now();
  const nonce = Array.from(randomBytes(16), b => b.toString(16).padStart(2, '0')).join('');
  
  return `KairOS-Auth-${deviceId}-${chipUID}-${timestamp}-${nonce}`;
}

/**
 * EXAMPLE: Programming a metal pocket watch NFC chip
 */
export function programMetalPocketWatch(masterSeed: Uint8Array): {
  chipConfiguration: SecureNFCConfig;
  userInstructions: string[];
} {
  
  const deviceId = `pocket-watch-${Date.now()}`;
  const chipUID = '04:AB:CD:EF:12:34:56'; // Would be read from actual chip
  
  const chipConfig = prepareNFCChipData(masterSeed, deviceId, chipUID);
  
  const instructions = [
    '🔧 NFC Chip Programming Instructions:',
    '',
    '1. Write to NFC chip memory:',
    `   - Device ID: ${deviceId}`,
    `   - Public Key: ${Array.from(chipConfig.publicKey.slice(0, 8), b => b.toString(16)).join('')}...`,
    `   - NFC URL: ${chipConfig.nfcUrl}`,
    '',
    '2. Security Notes:',
    '   ✅ Private key stays with user (never on chip)',
    '   ✅ Even if chip is cloned, other devices are safe',
    '   ✅ Each device has unique derived keypair',
    '',
    '3. User keeps master seed secure:',
    '   - Store in password manager',
    '   - Backup to secure location',
    '   - Never share or transmit'
  ];
  
  return {
    chipConfiguration: chipConfig,
    userInstructions: instructions
  };
} 