/**
 * Installation Management Types
 * Defines the structure for art installation configurations
 * Supports custom auth flows, theming, and experiences
 */

export interface InstallationConfig {
  id: string
  name: string
  description: string
  artist?: string
  location?: string
  duration?: string
  logo?: string
  
  // Custom auth flow configuration
  authFlow: InstallationAuthFlow
  
  // Visual theming
  theme: InstallationTheme
  
  // Art content
  artworkIds: string[]
  
  // Interactive features
  features: InstallationFeature[]
  
  // Community settings
  allowsComments: boolean
  allowsRating: boolean
  allowsSharing: boolean
  
  // Metadata
  isActive: boolean
  createdAt: number
  updatedAt: number
}

export interface InstallationAuthFlow {
  // Welcome messaging
  title?: string
  description?: string
  welcomeMessage?: string
  instructions?: string
  
  // Auth requirements
  requiresNFC: boolean
  requiresPIN: boolean
  requiresProfile: boolean
  
  // Custom flow steps
  customSteps?: AuthFlowStep[]
  
  // Success actions
  onAuthSuccess?: {
    redirectTo?: string
    showMessage?: string
    unlockFeatures?: string[]
  }
}

export interface AuthFlowStep {
  id: string
  title: string
  description: string
  type: 'nfc' | 'pin' | 'profile' | 'custom'
  required: boolean
  customComponent?: string
}

export interface InstallationTheme {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor?: string
  textColor?: string
  
  // Assets
  favicon?: string
  logo?: string
  backgroundImage?: string
  
  // Typography
  fontFamily?: string
  headingFont?: string
  
  // Layout
  borderRadius?: string
  spacing?: 'compact' | 'normal' | 'spacious'
}

export interface InstallationFeature {
  id: string
  name: string
  description: string
  icon?: string
  enabled: boolean
  config?: Record<string, any>
}

export interface InstallationInteraction {
  id: string
  installationId: string
  userId: string
  type: 'visit' | 'auth' | 'artwork_view' | 'comment' | 'rating' | 'share'
  timestamp: number
  data: Record<string, any>
  verified: boolean
}

export interface InstallationStats {
  installationId: string
  totalVisitors: number
  uniqueVisitors: number
  avgVisitDuration: number
  popularArtworks: Array<{
    artworkId: string
    interactions: number
  }>
  lastUpdated: number
} 