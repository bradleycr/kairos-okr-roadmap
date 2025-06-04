// --- Enhanced Types for KairOS ZK Moment System ---
// Modular type definitions ready for ESP32 porting

// --- Original Moment Type (Legacy) ---
export interface Moment {
  subject: string
  issuer: string
  timestamp: string
  description: string
  signature: string
}

// --- Enhanced ZK Moment Types ---

/**
 * A ZK-enabled moment with privacy-preserving properties
 * @note ESP32: Same structure, store in EEPROM/Flash
 */
export interface ZKMoment {
  momentId: string           // Unique identifier for the moment type/location
  timestamp: number          // Unix timestamp (ESP32: use RTC)
  hash: Uint8Array          // SHA256(momentId + timestamp + nonce)
  signature: Uint8Array     // Ed25519 signature of the hash
  nonce: Uint8Array         // Random nonce for privacy
  metadata?: {              // Optional metadata (not included in proofs)
    location?: string
    eventName?: string
    description?: string
  }
}

/**
 * Moment installation/tap point definition
 * @note ESP32: Store in program memory or config
 */
export interface MomentInstallation {
  id: string                // Unique installation ID
  name: string             // Human-readable name
  location: string         // Physical location
  category: 'art' | 'music' | 'food' | 'social' | 'experience' | 'other'
  isActive: boolean        // Whether this installation is currently active
  tapCount?: number        // Optional: how many times it's been tapped
}

/**
 * ZK Proof for moment count verification
 * @note ESP32: Generate proofs on-device or via companion app
 */
export interface ZKMomentProof {
  proof: string            // Serialized ZK proof (base64 or hex)
  publicSignals: string[]  // Public inputs to the circuit
  threshold: number        // Minimum count being proven
  actualCount: number      // Actual count (for verification, not in real proof)
  timestamp: number        // When proof was generated
  verifierKey: string      // Verification key for the circuit
}

/**
 * Session data for a user's event experience
 * @note ESP32: Store in RAM during session, persist key moments
 */
export interface ZKSession {
  sessionId: string
  userDID: string
  startTime: number
  endTime?: number
  moments: ZKMoment[]
  totalMoments: number
  uniqueInstallations: string[]  // List of unique installation IDs visited
  proofs: ZKMomentProof[]       // Generated proofs for this session
}

/**
 * Event configuration for ZK moment collection
 * @note ESP32: Load from config file or API
 */
export interface EventConfig {
  eventId: string
  name: string
  startTime: number
  endTime: number
  installations: MomentInstallation[]
  zkCircuitConfig: {
    maxMoments: number      // Maximum moments supported by circuit
    minProofThreshold: number // Minimum count for meaningful proofs
    circuitWasm: string     // Path to circuit WASM file
    circuitZkey: string     // Path to circuit proving key
    verificationKey: string // Verification key for proofs
  }
}

// --- Utility Types ---

/**
 * Result type for async operations
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

/**
 * Moment tap result
 */
export interface MomentTapResult {
  success: boolean
  moment?: ZKMoment
  error?: string
  isNewInstallation: boolean
  totalMomentsInSession: number
}

/**
 * Proof generation result
 */
export interface ProofGenerationResult {
  success: boolean
  proof?: ZKMomentProof
  error?: string
  timeToGenerate?: number  // Milliseconds
}

// --- Export all types for easy importing ---
// Note: Individual exports above are sufficient
