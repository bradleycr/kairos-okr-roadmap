/**
 * Installation Manager
 * Handles configuration and management of art installations
 * Provides subdomain-specific experiences and auth flows
 */

import { 
  InstallationConfig, 
  InstallationAuthFlow, 
  InstallationTheme, 
  InstallationInteraction,
  InstallationStats 
} from './types'

class InstallationManager {
  private installations: Map<string, InstallationConfig> = new Map()
  private interactions: InstallationInteraction[] = []
  private stats: Map<string, InstallationStats> = new Map()

  constructor() {
    this.loadFromStorage()
    this.initializeDefaultInstallations()
  }

  // --- Installation CRUD ---

  async createInstallation(config: Omit<InstallationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<InstallationConfig> {
    const installation: InstallationConfig = {
      ...config,
      id: `installation-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    this.installations.set(installation.id, installation)
    this.saveToStorage()
    
    return installation
  }

  async getInstallation(installationId: string): Promise<InstallationConfig | null> {
    return this.installations.get(installationId) || null
  }

  async getAllInstallations(): Promise<InstallationConfig[]> {
    return Array.from(this.installations.values())
  }

  async updateInstallation(installationId: string, updates: Partial<InstallationConfig>): Promise<boolean> {
    const installation = this.installations.get(installationId)
    if (!installation) return false

    const updated = {
      ...installation,
      ...updates,
      updatedAt: Date.now()
    }

    this.installations.set(installationId, updated)
    this.saveToStorage()
    
    return true
  }

  async deleteInstallation(installationId: string): Promise<boolean> {
    const deleted = this.installations.delete(installationId)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  // --- Custom Auth Flow Management ---

  async updateAuthFlow(installationId: string, authFlow: InstallationAuthFlow): Promise<boolean> {
    const installation = this.installations.get(installationId)
    if (!installation) return false

    installation.authFlow = authFlow
    installation.updatedAt = Date.now()
    
    this.installations.set(installationId, installation)
    this.saveToStorage()
    
    return true
  }

  async updateTheme(installationId: string, theme: InstallationTheme): Promise<boolean> {
    const installation = this.installations.get(installationId)
    if (!installation) return false

    installation.theme = theme
    installation.updatedAt = Date.now()
    
    this.installations.set(installationId, installation)
    this.saveToStorage()
    
    return true
  }

  // --- Interaction Tracking ---

  recordInteraction(interaction: Omit<InstallationInteraction, 'id' | 'timestamp'>): InstallationInteraction {
    const newInteraction: InstallationInteraction = {
      ...interaction,
      id: `interaction-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: Date.now()
    }

    this.interactions.push(newInteraction)
    this.updateStats(newInteraction)
    this.saveToStorage()
    
    return newInteraction
  }

  getInstallationInteractions(installationId: string): InstallationInteraction[] {
    return this.interactions.filter(i => i.installationId === installationId)
  }

  getUserInteractions(userId: string, installationId?: string): InstallationInteraction[] {
    return this.interactions.filter(i => 
      i.userId === userId && 
      (installationId ? i.installationId === installationId : true)
    )
  }

  // --- Analytics ---

  getInstallationStats(installationId: string): InstallationStats | null {
    return this.stats.get(installationId) || null
  }

  private updateStats(interaction: InstallationInteraction): void {
    const { installationId, userId, type } = interaction
    
    let stats = this.stats.get(installationId)
    if (!stats) {
      stats = {
        installationId,
        totalVisitors: 0,
        uniqueVisitors: 0,
        avgVisitDuration: 0,
        popularArtworks: [],
        lastUpdated: Date.now()
      }
    }

    // Update visitor counts
    if (type === 'visit') {
      stats.totalVisitors++
      
      // Check if unique visitor
      const userVisits = this.interactions.filter(i => 
        i.installationId === installationId && 
        i.userId === userId && 
        i.type === 'visit'
      )
      if (userVisits.length === 1) {
        stats.uniqueVisitors++
      }
    }

    stats.lastUpdated = Date.now()
    this.stats.set(installationId, stats)
  }

  // --- Storage Management ---

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const installationsData = localStorage.getItem('kairos-installations')
        const interactionsData = localStorage.getItem('kairos-installation-interactions')
        const statsData = localStorage.getItem('kairos-installation-stats')

        if (installationsData) {
          const installations = JSON.parse(installationsData) as InstallationConfig[]
          installations.forEach(installation => {
            this.installations.set(installation.id, installation)
          })
        }

        if (interactionsData) {
          this.interactions = JSON.parse(interactionsData)
        }

        if (statsData) {
          const statsArray = JSON.parse(statsData) as InstallationStats[]
          statsArray.forEach(stat => {
            this.stats.set(stat.installationId, stat)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load installation data from storage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const installations = Array.from(this.installations.values())
        const stats = Array.from(this.stats.values())
        
        localStorage.setItem('kairos-installations', JSON.stringify(installations))
        localStorage.setItem('kairos-installation-interactions', JSON.stringify(this.interactions))
        localStorage.setItem('kairos-installation-stats', JSON.stringify(stats))
      }
    } catch (error) {
      console.error('Failed to save installation data to storage:', error)
    }
  }

  // --- Default Installations ---

  private initializeDefaultInstallations(): void {
    // Only initialize if no installations exist
    if (this.installations.size === 0) {
      this.createSampleInstallations()
    }
  }

  private async createSampleInstallations(): Promise<void> {
    // Way of Flowers Installation - using 'way-of-flowers' as the ID for subdomain
    const wayOfFlowersInstallation = await this.createInstallation({
      name: "Way of Flowers",
      description: "An interactive journey of environmental stewardship where each choice nurtures your digital flower and supports real-world conservation",
      artist: "Environmental Collective",
      location: "Conservation Gallery, Main Hall",
      duration: "15-30 minutes",
      
      authFlow: {
        title: "Begin Your Flower Journey",
        description: "Authenticate with your NFC pendant to start your path of environmental impact",
        welcomeMessage: "Plant Your Seed of Change",
        instructions: "Tap your pendant to begin your flower path journey and make choices that matter",
        requiresNFC: true,
        requiresPIN: true,
        requiresProfile: false,
        
        onAuthSuccess: {
          showMessage: "Welcome to the Way of Flowers! Your conservation journey begins now.",
          unlockFeatures: ["flower_evolution", "cause_tracking", "impact_visualization"]
        }
      },
      
      theme: {
        primaryColor: "#22C55E",
        secondaryColor: "#16A34A", 
        accentColor: "#4ADE80",
        backgroundColor: "#F0FDF4",
        fontFamily: "Inter",
        borderRadius: "12px",
        spacing: "normal"
      },
      
      artworkIds: ["mangrove-restoration", "cover-cropping", "pollinator-habitat", "forest-protection"],
      
      features: [
        {
          id: "flower_evolution",
          name: "Flower Evolution",
          description: "Watch your digital flower evolve based on your conservation choices",
          enabled: true
        },
        {
          id: "cause_tracking", 
          name: "Impact Tracking",
          description: "Track your support across different environmental causes",
          enabled: true
        },
        {
          id: "impact_visualization",
          name: "Impact Visualization",
          description: "See how your choices contribute to real-world conservation efforts",
          enabled: true
        }
      ],
      
      allowsComments: true,
      allowsRating: true,
      allowsSharing: true,
      isActive: true
    })
    
    // Override the ID to match subdomain expectations
    wayOfFlowersInstallation.id = 'way-of-flowers'
    this.installations.set('way-of-flowers', wayOfFlowersInstallation)

    // Civic Portraits Installation
    await this.createInstallation({
      name: "Civic Portraits",
      description: "Interactive portraits of community leaders and changemakers throughout history",
      artist: "Democracy Arts Collective",
      location: "City Hall, Main Atrium",
      duration: "15-30 minutes",
      
      authFlow: {
        title: "Meet Your Community",
        description: "Connect with the voices that shaped your city through interactive portrait conversations",
        welcomeMessage: "Speak Friend and Enter",
        instructions: "Approach any portrait and tap your pendant to begin a conversation",
        requiresNFC: true,
        requiresPIN: false,
        requiresProfile: true,
        
        onAuthSuccess: {
          showMessage: "The portraits await your questions. What would you like to know?",
          unlockFeatures: ["voice_interaction", "historical_context", "community_stories"]
        }
      },
      
      theme: {
        primaryColor: "#059669",
        secondaryColor: "#10B981",
        accentColor: "#34D399", 
        backgroundColor: "#F9FAFB",
        fontFamily: "Georgia",
        borderRadius: "8px",
        spacing: "normal"
      },
      
      artworkIds: ["mayor-portrait-1", "activist-portrait-2", "educator-portrait-3"],
      
      features: [
        {
          id: "voice_interaction",
          name: "Voice Conversations",
          description: "Have spoken conversations with historical figures",
          enabled: true
        },
        {
          id: "historical_context",
          name: "Historical Context", 
          description: "Learn about the era and circumstances that shaped each leader",
          enabled: true
        },
        {
          id: "community_stories",
          name: "Community Stories",
          description: "Discover how these leaders impacted your local community",
          enabled: true
        }
      ],
      
      allowsComments: true,
      allowsRating: false,
      allowsSharing: true,
      isActive: true
    })
  }
}

// Singleton instance
export const installationManager = new InstallationManager() 