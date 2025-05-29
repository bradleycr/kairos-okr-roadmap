// --- Hardware Abstraction Layer (HAL) for KairOS ---
// This file defines interfaces for all hardware interactions, enabling seamless simulation and future ESP32 porting.
// Each interface is implemented with a simulation (browser) version by default.
// When porting, simply reimplement these interfaces for ESP32 in C++/MicroPython.

// --- Cryptography Interface ---
export interface CryptoHAL {
  generateKeyPair(): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }>
  sign(data: Uint8Array, privateKey: CryptoKey): Promise<Uint8Array>
  exportPublicKey(publicKey: CryptoKey): Promise<Uint8Array>
  verify(data: Uint8Array, signature: Uint8Array, publicKey: CryptoKey): Promise<boolean>
  exportKeyPair(keyPair: { privateKey: CryptoKey; publicKey: CryptoKey }): Promise<{ privateKey: number[]; publicKey: number[] }>
  importKeyPair(storedKeyPair: { privateKey: number[]; publicKey: number[] }): Promise<{ privateKey: CryptoKey; publicKey: CryptoKey }>
}

// --- Vibration Interface ---
export interface VibrationHAL {
  vibrate(pattern: number[] | number): void
}

// --- Display Content Types ---
export type DisplayContent =
  | { type: "text"; text: string }
  | { type: "status"; title: string; subtitle?: string }
  | { type: "icon"; iconName: string; label?: string }
  | { type: "notification"; message: string; level: "info" | "warning" | "error" }
  // Add more as needed for future extensibility

// --- Display Interface (for e-paper, etc) ---
export interface DisplayHAL {
  show(content: DisplayContent): void
  clear(): void
}

// --- NFC/BLE Interface (stubbed for now) ---
export interface CommunicationHAL {
  send(data: Uint8Array): void
  receive(): Promise<Uint8Array | null>
}

// --- Input Interface (for all user actions, wearable buttons, etc) ---
export type InputAction = "tap" | "logMoment" | "simulatePendant" | "modalAction" | string
export type InputCallback = (action: InputAction, payload?: any) => void

export interface InputHAL {
  onAction(cb: InputCallback): void
  trigger(action: InputAction, payload?: any): void
}

// --- Simulation Implementations (for browser) ---
export const SimCryptoHAL: CryptoHAL = {
  async generateKeyPair() {
    // Simulate Ed25519 with P-256 for browser
    const keyPair = await window.crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" },
      true,
      ["sign", "verify"]
    )
    return { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey }
  },
  async sign(data, privateKey) {
    const sig = await window.crypto.subtle.sign(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      privateKey,
      data
    )
    return new Uint8Array(sig)
  },
  async exportPublicKey(publicKey) {
    const raw = await window.crypto.subtle.exportKey("raw", publicKey)
    return new Uint8Array(raw)
  },
  async verify(data, signature, publicKey) {
    return await window.crypto.subtle.verify(
      { name: "ECDSA", hash: { name: "SHA-256" } },
      publicKey,
      signature,
      data
    )
  },
  async exportKeyPair(keyPair) {
    const privateKeyData = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
    const publicKeyData = await window.crypto.subtle.exportKey("spki", keyPair.publicKey)
    return {
      privateKey: Array.from(new Uint8Array(privateKeyData)),
      publicKey: Array.from(new Uint8Array(publicKeyData)),
    }
  },
  async importKeyPair(storedKeyPair) {
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      new Uint8Array(storedKeyPair.privateKey),
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["sign"],
    )
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      new Uint8Array(storedKeyPair.publicKey),
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      true,
      ["verify"],
    )
    return { privateKey, publicKey }
  },
}

export const SimVibrationHAL: VibrationHAL = {
  vibrate(pattern) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern)
    }
  },
}

export const SimDisplayHAL: DisplayHAL = {
  show(content) {
    console.log("[SIM DISPLAY]", content)
  },
  clear() {
    console.log("[SIM DISPLAY] cleared")
  },
}

export const SimCommunicationHAL: CommunicationHAL = {
  send(data) {
    // Stub: simulate sending data
    console.log(`[SIM COMM SEND]`, data)
  },
  async receive() {
    // Stub: simulate receiving data
    return null
  },
}

// --- Simulation Implementation for InputHAL ---
let inputCallback: InputCallback | null = null
export const SimInputHAL: InputHAL = {
  onAction(cb) {
    inputCallback = cb
  },
  trigger(action, payload) {
    if (inputCallback) inputCallback(action, payload)
  },
}

// --- Export a single HAL object for easy import ---
export const HAL = {
  crypto: SimCryptoHAL,
  vibration: SimVibrationHAL,
  display: SimDisplayHAL,
  communication: SimCommunicationHAL,
  input: SimInputHAL,
} 