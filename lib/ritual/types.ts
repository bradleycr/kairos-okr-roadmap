// --- Ritual Experience Builder Types ---
// Defines ritual configurations for MELD Node behavior assignment
// ESP32-ready: Export as Arduino-compatible C++ templates

/**
 * Available behaviors that can be assigned to MELD nodes
 */
export type NodeBehavior = 
  | 'save_moment'     // Default: Save a cryptographic moment
  | 'send_tip'        // Send a tip/token to performer
  | 'vote_option_a'   // Vote for option A in a poll
  | 'vote_option_b'   // Vote for option B in a poll  
  | 'unlock_content'  // Unlock special content/area
  | 'trigger_light'   // Trigger audio pattern (no LEDs)
  | 'play_sound'      // Play audio feedback
  | 'increment_counter' // Simple counter increment
  | 'favorite_artwork' // Mark artwork as favorite (gallery mode)
  | 'rate_artwork'    // Rate artwork 1-5 stars (gallery mode)
  | 'leave_comment'   // Leave a voice comment about artwork
  | 'view_artist_info' // Display artist information and bio
  | 'join_discussion' // Join community discussion about artwork
  | 'unlock_story'    // Unlock the story behind the artwork
  | 'collect_memory'  // Create a personalized memory of the artwork
  | 'custom'          // Custom logic defined in logic field

/**
 * Configuration for a single node in a ritual
 */
export interface RitualNodeConfig {
  nodeId: string           // References MELD_NODES[].id
  label: string           // Human-readable label (e.g. "DJ Tip Jar")
  behavior: NodeBehavior  // Assigned behavior
  logic?: string          // Optional conditional logic (JS/DSL)
  parameters?: {          // Behavior-specific parameters
    tipAmount?: number    // For send_tip behavior
    soundFile?: string    // For play_sound behavior
    lightPattern?: string // For trigger_light behavior
    voteOption?: string   // For voting behaviors
    
    // Art Gallery specific parameters
    artworkId?: string    // Unique artwork identifier
    artworkTitle?: string // Title of the artwork
    artistName?: string   // Name of the artist
    artworkYear?: number  // Year created
    artworkMedium?: string // Medium (oil on canvas, sculpture, etc.)
    artworkDescription?: string // Description of the artwork
    artworkImageUrl?: string // URL to artwork image
    gallerySection?: string // Gallery section/room
    audioGuideUrl?: string // URL to audio guide
    maxRating?: number    // Maximum rating (default 5)
    requireComment?: boolean // Whether comment is required
    
    [key: string]: any    // Extensible parameters
  }
}

/**
 * Complete ritual definition
 */
export interface Ritual {
  id: string
  name: string
  description?: string
  createdAt: number
  version: string
  nodes: RitualNodeConfig[]
  metadata?: {
    author?: string
    tags?: string[]
    eventName?: string
    deploymentNotes?: string
  }
}

/**
 * Runtime ritual execution state
 */
export interface RitualExecution {
  ritualId: string
  nodeId: string
  pendantId: string
  behavior: NodeBehavior
  timestamp: number
  result: 'success' | 'failure' | 'pending'
  data?: any              // Result data specific to behavior
  error?: string          // Error message if failed
}

/**
 * ESP32 sketch generation configuration
 */
export interface SketchGenerationConfig {
  ritualId: string
  includeLibraries: string[]    // Required Arduino libraries
  nfcLibrary: 'MFRC522' | 'PN532' // NFC reader library choice
  debugMode: boolean            // Include serial debug output
  customHeaders?: string[]      // Additional header includes
}

/**
 * Generated ESP32 sketch output
 */
export interface GeneratedSketch {
  fileName: string
  content: string
  dependencies: string[]        // Required libraries
  pinConfiguration: {          // Pin assignments
    nfc: Record<string, number>
    buzzer?: number
  }
  instructions: string[]       // Setup instructions
} 