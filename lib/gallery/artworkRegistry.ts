/**
 * Art Gallery Registry
 * Manages artwork metadata, user interactions, and gallery experiences
 * Integrates with MELD Node authentication for secure art interactions
 */

export interface Artwork {
  id: string
  title: string
  artist: {
    name: string
    bio?: string
    birthYear?: number
    nationality?: string
    website?: string
  }
  year: number
  medium: string
  dimensions?: string
  description: string
  imageUrl?: string
  audioGuideUrl?: string
  
  // Gallery context
  gallerySection: string
  acquisitionDate?: string
  provenance?: string
  
  // Interactive features
  allowsRating: boolean
  allowsComments: boolean
  hasAudioGuide: boolean
  hasUnlockableContent: boolean
  
  // Metadata
  tags: string[]
  category: 'painting' | 'sculpture' | 'photography' | 'digital' | 'mixed_media' | 'installation'
  isOnLoan: boolean
  
  // Privacy settings
  showArtistInfo: boolean
  showAcquisitionInfo: boolean
}

export interface UserArtworkInteraction {
  id: string
  artworkId: string
  userId: string // Derived from NFC pendant DID
  pendantDID: string
  timestamp: number
  
  // Interaction types
  type: 'favorite' | 'rating' | 'comment' | 'view_info' | 'unlock_story' | 'collect_memory'
  
  // Interaction data
  rating?: number // 1-5 stars
  comment?: string
  voiceCommentUrl?: string
  memoryNote?: string
  
  // Context
  nodeId: string
  gallerySection: string
  visitDuration?: number // seconds spent viewing
  
  // Verification
  signature: string
  verified: boolean
}

export interface GalleryExperience {
  id: string
  name: string
  description: string
  curatorName?: string
  startDate: number
  endDate?: number
  
  // Featured artworks
  artworkIds: string[]
  
  // Interactive elements
  hasGuidedTour: boolean
  hasVirtualReality: boolean
  hasAugmentedReality: boolean
  
  // Community features
  allowsDiscussion: boolean
  allowsUserContent: boolean
  
  // Themes and tags
  themes: string[]
  targetAudience: string[]
}

export interface CivicPortraitConfig {
  id: string
  title: string
  description: string
  location: string
  
  // Portrait interaction
  activationPhrase?: string // Like "Speak friend and enter"
  requiresVoiceActivation: boolean
  requiresNFCAuth: boolean
  
  // Content
  portraitImageUrl: string
  portraitName: string
  portraitRole: string
  portraitEra: string
  
  // Interactive responses
  greetingMessages: string[]
  knowledgeTopics: string[]
  responseStyle: 'formal' | 'casual' | 'historical' | 'mystical'
  
  // Community features
  allowsQuestions: boolean
  allowsStorytelling: boolean
  logInteractions: boolean
}

// --- In-Memory Storage ---
let artworkRegistry: Artwork[] = []
let userInteractions: UserArtworkInteraction[] = []
let galleryExperiences: GalleryExperience[] = []
let civicPortraits: CivicPortraitConfig[] = []

// --- Storage Keys ---
const STORAGE_KEYS = {
  ARTWORKS: 'gallery_artworks',
  INTERACTIONS: 'gallery_interactions', 
  EXPERIENCES: 'gallery_experiences',
  CIVIC_PORTRAITS: 'civic_portraits'
}

// --- Load/Save Functions ---
function loadFromStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      const stored = {
        artworks: localStorage.getItem(STORAGE_KEYS.ARTWORKS),
        interactions: localStorage.getItem(STORAGE_KEYS.INTERACTIONS),
        experiences: localStorage.getItem(STORAGE_KEYS.EXPERIENCES),
        portraits: localStorage.getItem(STORAGE_KEYS.CIVIC_PORTRAITS)
      }
      
      if (stored.artworks) artworkRegistry = JSON.parse(stored.artworks)
      if (stored.interactions) userInteractions = JSON.parse(stored.interactions)
      if (stored.experiences) galleryExperiences = JSON.parse(stored.experiences)
      if (stored.portraits) civicPortraits = JSON.parse(stored.portraits)
    }
  } catch (error) {
    console.error('Failed to load gallery data from storage:', error)
  }
}

function saveToStorage(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.ARTWORKS, JSON.stringify(artworkRegistry))
      localStorage.setItem(STORAGE_KEYS.INTERACTIONS, JSON.stringify(userInteractions))
      localStorage.setItem(STORAGE_KEYS.EXPERIENCES, JSON.stringify(galleryExperiences))
      localStorage.setItem(STORAGE_KEYS.CIVIC_PORTRAITS, JSON.stringify(civicPortraits))
    }
  } catch (error) {
    console.error('Failed to save gallery data to storage:', error)
  }
}

// --- Artwork Management ---
export function addArtwork(artwork: Omit<Artwork, 'id'>): Artwork {
  const newArtwork: Artwork = {
    ...artwork,
    id: `artwork-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
  
  artworkRegistry.push(newArtwork)
  saveToStorage()
  return newArtwork
}

export function getArtwork(artworkId: string): Artwork | null {
  return artworkRegistry.find(art => art.id === artworkId) || null
}

export function getAllArtworks(): Artwork[] {
  return [...artworkRegistry]
}

export function updateArtwork(artworkId: string, updates: Partial<Artwork>): boolean {
  const index = artworkRegistry.findIndex(art => art.id === artworkId)
  if (index === -1) return false
  
  artworkRegistry[index] = { ...artworkRegistry[index], ...updates }
  saveToStorage()
  return true
}

export function deleteArtwork(artworkId: string): boolean {
  const initialLength = artworkRegistry.length
  artworkRegistry = artworkRegistry.filter(art => art.id !== artworkId)
  
  if (artworkRegistry.length < initialLength) {
    saveToStorage()
    return true
  }
  return false
}

// --- User Interactions ---
export function recordInteraction(interaction: Omit<UserArtworkInteraction, 'id' | 'timestamp' | 'verified'>): UserArtworkInteraction {
  const newInteraction: UserArtworkInteraction = {
    ...interaction,
    id: `interaction-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    timestamp: Date.now(),
    verified: true // In production, verify signature
  }
  
  userInteractions.push(newInteraction)
  saveToStorage()
  return newInteraction
}

export function getUserInteractions(userId: string): UserArtworkInteraction[] {
  return userInteractions.filter(interaction => interaction.userId === userId)
}

export function getArtworkInteractions(artworkId: string): UserArtworkInteraction[] {
  return userInteractions.filter(interaction => interaction.artworkId === artworkId)
}

export function getUserFavorites(userId: string): string[] {
  return userInteractions
    .filter(interaction => interaction.userId === userId && interaction.type === 'favorite')
    .map(interaction => interaction.artworkId)
}

export function getArtworkRating(artworkId: string): { averageRating: number; totalRatings: number } {
  const ratings = userInteractions
    .filter(interaction => interaction.artworkId === artworkId && interaction.type === 'rating' && interaction.rating)
    .map(interaction => interaction.rating!)
  
  if (ratings.length === 0) {
    return { averageRating: 0, totalRatings: 0 }
  }
  
  const averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
  return { averageRating: Math.round(averageRating * 10) / 10, totalRatings: ratings.length }
}

// --- Gallery Experiences ---
export function createGalleryExperience(experience: Omit<GalleryExperience, 'id'>): GalleryExperience {
  const newExperience: GalleryExperience = {
    ...experience,
    id: `experience-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
  
  galleryExperiences.push(newExperience)
  saveToStorage()
  return newExperience
}

export function getAllGalleryExperiences(): GalleryExperience[] {
  return [...galleryExperiences]
}

export function getActiveGalleryExperiences(): GalleryExperience[] {
  const now = Date.now()
  return galleryExperiences.filter(exp => 
    exp.startDate <= now && (!exp.endDate || exp.endDate >= now)
  )
}

// --- Civic Portraits ---
export function addCivicPortrait(portrait: Omit<CivicPortraitConfig, 'id'>): CivicPortraitConfig {
  const newPortrait: CivicPortraitConfig = {
    ...portrait,
    id: `portrait-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
  }
  
  civicPortraits.push(newPortrait)
  saveToStorage()
  return newPortrait
}

export function getCivicPortrait(portraitId: string): CivicPortraitConfig | null {
  return civicPortraits.find(portrait => portrait.id === portraitId) || null
}

export function getAllCivicPortraits(): CivicPortraitConfig[] {
  return [...civicPortraits]
}

// --- Sample Data ---
export function initializeGalleryWithSampleData(): void {
  loadFromStorage()
  
  // Only add sample data if storage is empty
  if (artworkRegistry.length === 0) {
    const sampleArtworks: Omit<Artwork, 'id'>[] = [
      {
        title: "The Persistence of Memory",
        artist: {
          name: "Salvador Dalí",
          bio: "Spanish surrealist artist known for his technical skill and striking imagery.",
          birthYear: 1904,
          nationality: "Spanish"
        },
        year: 1931,
        medium: "Oil on canvas",
        dimensions: "24 cm × 33 cm",
        description: "Famous surrealist painting featuring melting clocks in a dreamscape.",
        gallerySection: "Surrealism Wing",
        allowsRating: true,
        allowsComments: true,
        hasAudioGuide: true,
        hasUnlockableContent: true,
        tags: ["surrealism", "time", "dreams", "clocks"],
        category: "painting",
        isOnLoan: false,
        showArtistInfo: true,
        showAcquisitionInfo: true
      },
      {
        title: "Digital Confluence",
        artist: {
          name: "Alex Chen",
          bio: "Contemporary digital artist exploring the intersection of technology and humanity.",
          birthYear: 1985,
          nationality: "Canadian"
        },
        year: 2023,
        medium: "Digital installation with LED displays",
        dimensions: "3m × 2m × 1m",
        description: "Interactive digital installation that responds to viewer presence and movement.",
        gallerySection: "Contemporary Digital",
        allowsRating: true,
        allowsComments: true,
        hasAudioGuide: false,
        hasUnlockableContent: true,
        tags: ["digital", "interactive", "technology", "contemporary"],
        category: "digital",
        isOnLoan: false,
        showArtistInfo: true,
        showAcquisitionInfo: false
      }
    ]
    
    sampleArtworks.forEach(artwork => addArtwork(artwork))
    
    // Add sample civic portrait
    const samplePortrait: Omit<CivicPortraitConfig, 'id'> = {
      title: "The Civic Guardian",
      description: "An interactive portrait that shares the history and values of our community.",
      location: "City Hall Lobby",
      activationPhrase: "Tell me about our community",
      requiresVoiceActivation: false,
      requiresNFCAuth: true,
      portraitImageUrl: "/images/civic-guardian.jpg",
      portraitName: "The Civic Guardian",
      portraitRole: "Community Historian",
      portraitEra: "Present Day",
      greetingMessages: [
        "Welcome to our community! I'm here to share our story.",
        "Greetings, citizen. What would you like to know about our city?",
        "Hello there! I hold the memories of our community's journey."
      ],
      knowledgeTopics: ["local history", "community values", "civic services", "cultural events"],
      responseStyle: "formal",
      allowsQuestions: true,
      allowsStorytelling: true,
      logInteractions: true
    }
    
    addCivicPortrait(samplePortrait)
  }
}

// --- Initialize on module load ---
initializeGalleryWithSampleData()

// --- Export manager object ---
export const galleryManager = {
  // Artworks
  addArtwork,
  getArtwork,
  getAllArtworks,
  updateArtwork,
  deleteArtwork,
  
  // Interactions
  recordInteraction,
  getUserInteractions,
  getArtworkInteractions,
  getUserFavorites,
  getArtworkRating,
  
  // Experiences
  createGalleryExperience,
  getAllGalleryExperiences,
  getActiveGalleryExperiences,
  
  // Civic Portraits
  addCivicPortrait,
  getCivicPortrait,
  getAllCivicPortraits,
  
  // Utilities
  initializeGalleryWithSampleData
} 