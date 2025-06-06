/**
 * Truly Decentralized NFC Authentication - Zero Database Required
 * 
 * DECENTRALIZED SECURITY MODEL:
 * ✅ Master seed stored in user's browser localStorage (or mobile app)
 * ✅ Private keys NEVER leave user's device
 * ✅ NFC chip only contains public key + device ID
 * ✅ No centralized database required
 * ✅ User controls all their keys
 * ✅ Works offline after initial setup
 */

import * as ed from '@noble/ed25519';
import { sha512 } from '@noble/hashes/sha512';
import { hkdf } from '@noble/hashes/hkdf';
import { randomBytes } from '@noble/hashes/utils';

// Enable synchronous methods
ed.etc.sha512Sync = (...m) => sha512(ed.etc.concatBytes(...m));

export interface LocalUserIdentity {
  masterSeed: string;      // Hex-encoded master seed (stored in localStorage)
  userId: string;          // User's chosen identifier
  devices: DeviceRegistry; // Registry of user's devices
  createdAt: number;
}

export interface DeviceRegistry {
  [deviceId: string]: {
    deviceId: string;
    deviceName: string;      // "Pocket Watch", "Phone", "Laptop"
    publicKey: string;       // Hex-encoded public key
    derivationPath: string;
    chipUID?: string;        // If it's an NFC device
    createdAt: number;
    lastUsed?: number;
  };
}

export interface NFCChipData {
  deviceId: string;        // Device identifier
  publicKey: string;       // Hex-encoded public key (safe to store on chip)
  chipUID: string;         // Hardware UID
  authUrl: string;         // Authentication endpoint
  // NO PRIVATE KEY - this is the key security feature
}

/**
 * Initialize user identity in browser localStorage (truly decentralized)
 */
export function initializeLocalIdentity(userId: string): LocalUserIdentity {
  const masterSeed = Array.from(ed.utils.randomPrivateKey(), b => 
    b.toString(16).padStart(2, '0')
  ).join('');
  
  const identity: LocalUserIdentity = {
    masterSeed,
    userId,
    devices: {},
    createdAt: Date.now()
  };
  
  // Store in browser localStorage (user controls this)
  localStorage.setItem('kairOS_identity', JSON.stringify(identity));
  
  return identity;
}

/**
 * Load user identity from localStorage (no database needed)
 */
export function loadLocalIdentity(): LocalUserIdentity | null {
  const stored = localStorage.getItem('kairOS_identity');
  return stored ? JSON.parse(stored) : null;
}

/**
 * Add a new device to user's local registry
 */
export function registerNewDevice(
  deviceName: string, 
  deviceType: 'nfc-pocket-watch' | 'phone' | 'laptop' | 'esp32-transcriber'
): { deviceId: string; nfcChipData?: NFCChipData } {
  
  const identity = loadLocalIdentity();
  if (!identity) throw new Error('No local identity found');
  
  const deviceId = `${deviceType}-${Date.now()}`;
  const masterSeedBytes = new Uint8Array(
    identity.masterSeed.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  // Derive device-specific keypair
  const { publicKey, derivationPath } = deriveDeviceKeypair(masterSeedBytes, deviceId);
  const publicKeyHex = Array.from(publicKey, b => b.toString(16).padStart(2, '0')).join('');
  
  // Add to local device registry
  identity.devices[deviceId] = {
    deviceId,
    deviceName,
    publicKey: publicKeyHex,
    derivationPath,
    createdAt: Date.now()
  };
  
  // Save updated identity to localStorage
  localStorage.setItem('kairOS_identity', JSON.stringify(identity));
  
  // If it's an NFC device, prepare chip data
  let nfcChipData: NFCChipData | undefined;
  if (deviceType === 'nfc-pocket-watch') {
    const chipUID = generateChipUID(); // Would be read from actual chip
    
    nfcChipData = {
      deviceId,
      publicKey: publicKeyHex,
      chipUID,
      authUrl: `https://kair-os.vercel.app/nfc?d=${deviceId}&c=${chipUID}`
    };
    
    // Update device registry with chip UID
    identity.devices[deviceId].chipUID = chipUID;
    localStorage.setItem('kairOS_identity', JSON.stringify(identity));
  }
  
  return { deviceId, nfcChipData };
}

/**
 * Sign challenge locally (private key never leaves user's device)
 */
export async function signChallengeLocally(
  deviceId: string, 
  challenge: string
): Promise<{ signature: string; publicKey: string }> {
  
  const identity = loadLocalIdentity();
  if (!identity) throw new Error('No local identity found');
  
  const device = identity.devices[deviceId];
  if (!device) throw new Error(`Device ${deviceId} not found in local registry`);
  
  // Reconstruct private key from master seed (stays local)
  const masterSeedBytes = new Uint8Array(
    identity.masterSeed.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
  );
  
  const { privateKey } = deriveDeviceKeypair(masterSeedBytes, deviceId);
  
  // Sign challenge locally
  const challengeBytes = new TextEncoder().encode(challenge);
  const challengeHash = sha512(challengeBytes);
  const signature = await ed.signAsync(challengeHash, privateKey);
  
  return {
    signature: Array.from(signature, b => b.toString(16).padStart(2, '0')).join(''),
    publicKey: device.publicKey
  };
}

/**
 * Verify signature (can be done on any device, no private key needed)
 */
export async function verifySignatureDecentralized(
  signature: string,
  challenge: string,
  publicKey: string
): Promise<boolean> {
  
  try {
    const signatureBytes = new Uint8Array(signature.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const publicKeyBytes = new Uint8Array(publicKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    const challengeBytes = new TextEncoder().encode(challenge);
    const challengeHash = sha512(challengeBytes);
    
    return await ed.verifyAsync(signatureBytes, challengeHash, publicKeyBytes);
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Decentralized authentication flow for your use case
 */
export class DecentralizedNFCAuth {
  
  /**
   * Step 1: User taps NFC pocket watch
   * Browser reads device ID + public key from chip
   */
  static readNFCChip(nfcData: NFCChipData): { deviceId: string; publicKey: string } {
    return {
      deviceId: nfcData.deviceId,
      publicKey: nfcData.publicKey
    };
  }
  
  /**
   * Step 2: Generate challenge (can be done locally, no server needed)
   */
  static generateChallenge(deviceId: string): string {
    const timestamp = Date.now();
    const nonce = Array.from(randomBytes(16), b => b.toString(16).padStart(2, '0')).join('');
    return `KairOS-Local-${deviceId}-${timestamp}-${nonce}`;
  }
  
  /**
   * Step 3: Sign challenge with user's local private key
   */
  static async authenticateLocally(deviceId: string, challenge: string) {
    return await signChallengeLocally(deviceId, challenge);
  }
  
  /**
   * Step 4: Verify signature (can be done on ESP32 or any device)
   */
  static async verifyLocally(signature: string, challenge: string, publicKey: string) {
    return await verifySignatureDecentralized(signature, challenge, publicKey);
  }
}

/**
 * For your audio transcription use case:
 * User taps NFC -> ESP32 device authenticates -> Grants access to local transcriptions
 */
export interface AudioTranscriptionAccess {
  deviceId: string;
  userAuthenticated: boolean;
  transcriptionEndpoint?: string;  // Local device URL, not cloud
  sessionToken?: string;           // Local session, not stored anywhere
}

export function authenticateForAudioAccess(
  nfcChipData: NFCChipData
): Promise<AudioTranscriptionAccess> {
  
  return new Promise(async (resolve) => {
    try {
      // Read device info from NFC
      const { deviceId, publicKey } = DecentralizedNFCAuth.readNFCChip(nfcChipData);
      
      // Generate local challenge
      const challenge = DecentralizedNFCAuth.generateChallenge(deviceId);
      
      // Sign locally (private key never leaves user's device)
      const { signature } = await DecentralizedNFCAuth.authenticateLocally(deviceId, challenge);
      
      // Verify locally
      const verified = await DecentralizedNFCAuth.verifyLocally(signature, challenge, publicKey);
      
      if (verified) {
        // Grant access to local transcription device
        resolve({
          deviceId,
          userAuthenticated: true,
          transcriptionEndpoint: `http://192.168.1.100:8080/transcriptions`, // Local ESP32 IP
          sessionToken: `local_session_${Date.now()}`
        });
      } else {
        resolve({
          deviceId,
          userAuthenticated: false
        });
      }
      
    } catch (error) {
      resolve({
        deviceId: 'unknown',
        userAuthenticated: false
      });
    }
  });
}

// Helper functions
function deriveDeviceKeypair(
  masterSeed: Uint8Array, 
  deviceId: string
): { privateKey: Uint8Array; publicKey: Uint8Array; derivationPath: string } {
  
  const derivationPath = `m/44'/9999'/0'/${deviceId}`;
  const info = new TextEncoder().encode(`KairOS-Device-${deviceId}`);
  const salt = new TextEncoder().encode('KairOS-NFC-2025');
  
  const devicePrivateKey = hkdf(sha512, masterSeed, salt, info, 32);
  const devicePublicKey = ed.getPublicKey(devicePrivateKey);
  
  return {
    privateKey: devicePrivateKey,
    publicKey: devicePublicKey,
    derivationPath
  };
}

function generateChipUID(): string {
  return Array.from({ length: 7 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join(':').toUpperCase();
} 