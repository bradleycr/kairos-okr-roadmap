/**
 * Way of Flowers - Decision Tree System
 * Handles flower path creation, cause selection, and evolution tracking
 * Integrates with NFC authentication and prepares for ESP32/API integration
 */

export interface FlowerPath {
  id: string
  userId: string // NFC pendant DID
  name: string
  createdAt: number
  lastInteraction: number
  
  // Evolution tracking
  choices: FlowerChoice[]
  currentStage: 'seeding' | 'sprouting' | 'blooming' | 'fruiting'
  evolutionScore: number
  
  // Visual characteristics (for future NFT generation)
  characteristics: {
    primaryColor: string
    secondaryColor: string
    bloomType: 'delicate' | 'vibrant' | 'wild' | 'elegant'
    growthPattern: 'climbing' | 'spreading' | 'upright' | 'cascading'
    seasonality: 'spring' | 'summer' | 'autumn' | 'winter'
  }
}

export interface FlowerChoice {
  id: string
  timestamp: number
  offeringId: string
  offeringName: string
  causeCategory: 'restoration' | 'conservation' | 'regeneration' | 'protection'
  impactLevel: 'seed' | 'sprout' | 'bloom' | 'fruit'
  
  // For future API integration
  externalReference?: string
  webhookSent?: boolean
}

export interface CauseOffering {
  id: string
  name: string
  description: string
  category: 'restoration' | 'conservation' | 'regeneration' | 'protection'
  impactDescription: string
  
  // Visual theming
  primaryColor: string
  secondaryColor: string
  icon: string
  backgroundImage?: string
  
  // Evolution effects
  evolutionEffect: {
    colorShift: string
    bloomBoost: number
    growthDirection: 'up' | 'out' | 'deep' | 'wide'
  }
  
  // Future integration
  apiEndpoint?: string
  webhookUrl?: string
  externalPartnerId?: string
}

export interface UserFlowerSession {
  userId: string
  sessionId: string
  currentPathId?: string
  isNewUser: boolean
  lastChoiceAt?: number
  sessionStartedAt: number
}

class WayOfFlowersManager {
  private flowerPaths: Map<string, FlowerPath> = new Map()
  private activeSessions: Map<string, UserFlowerSession> = new Map()
  private causeOfferings: CauseOffering[] = []

  constructor() {
    this.loadFromStorage()
    this.initializeCauseOfferings()
  }

  // --- Session Management ---
  
  async startFlowerSession(userId: string, chipUID: string): Promise<UserFlowerSession> {
    // Check if user has existing paths
    const existingPaths = this.getUserFlowerPaths(userId)
    const isNewUser = existingPaths.length === 0
    
    const session: UserFlowerSession = {
      userId,
      sessionId: `flower_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      currentPathId: existingPaths.length > 0 ? existingPaths[existingPaths.length - 1].id : undefined,
      isNewUser,
      sessionStartedAt: Date.now()
    }
    
    this.activeSessions.set(userId, session)
    this.saveToStorage()
    
    return session
  }

  getActiveSession(userId: string): UserFlowerSession | null {
    return this.activeSessions.get(userId) || null
  }

  // --- Flower Path Management ---
  
  async createNewFlowerPath(userId: string, pathName?: string): Promise<FlowerPath> {
    const userPaths = this.getUserFlowerPaths(userId)
    const pathNumber = userPaths.length + 1
    
    const newPath: FlowerPath = {
      id: `path_${userId}_${Date.now()}`,
      userId,
      name: pathName || `Flower Path ${pathNumber}`,
      createdAt: Date.now(),
      lastInteraction: Date.now(),
      choices: [],
      currentStage: 'seeding',
      evolutionScore: 0,
      characteristics: this.generateInitialCharacteristics()
    }
    
    this.flowerPaths.set(newPath.id, newPath)
    
    // Update active session
    const session = this.activeSessions.get(userId)
    if (session) {
      session.currentPathId = newPath.id
      session.isNewUser = false
    }
    
    this.saveToStorage()
    return newPath
  }

  getUserFlowerPaths(userId: string): FlowerPath[] {
    return Array.from(this.flowerPaths.values())
      .filter(path => path.userId === userId)
      .sort((a, b) => b.lastInteraction - a.lastInteraction)
  }

  getFlowerPath(pathId: string): FlowerPath | null {
    return this.flowerPaths.get(pathId) || null
  }

  // --- Choice Making & Evolution ---
  
  async makeChoice(userId: string, pathId: string, offeringId: string): Promise<{ 
    choice: FlowerChoice, 
    updatedPath: FlowerPath,
    evolutionMessage: string 
  }> {
    const path = this.flowerPaths.get(pathId)
    const offering = this.causeOfferings.find(o => o.id === offeringId)
    
    if (!path || !offering) {
      throw new Error('Path or offering not found')
    }
    
    // Create the choice
    const choice: FlowerChoice = {
      id: `choice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      offeringId: offering.id,
      offeringName: offering.name,
      causeCategory: offering.category,
      impactLevel: this.calculateImpactLevel(path.choices.length)
    }
    
    // Update path
    path.choices.push(choice)
    path.lastInteraction = Date.now()
    path.evolutionScore += offering.evolutionEffect.bloomBoost
    
    // Evolve characteristics
    this.evolvePathCharacteristics(path, offering)
    
    // Update stage
    path.currentStage = this.calculateCurrentStage(path.evolutionScore, path.choices.length)
    
    this.flowerPaths.set(pathId, path)
    
    // Update session with last choice
    const session = this.activeSessions.get(userId)
    if (session) {
      session.lastChoiceAt = Date.now()
    }
    
    this.saveToStorage()
    
    // Generate evolution message
    const evolutionMessage = this.generateEvolutionMessage(path, offering)
    
    // TODO: Future webhook integration
    // await this.sendChoiceWebhook(choice, path, offering)
    
    return { choice, updatedPath: path, evolutionMessage }
  }

  // --- Cause Offerings ---
  
  getAllCauseOfferings(): CauseOffering[] {
    return [...this.causeOfferings]
  }

  getCauseOfferingsByCategory(category: CauseOffering['category']): CauseOffering[] {
    return this.causeOfferings.filter(offering => offering.category === category)
  }

  // --- Helper Methods ---
  
  private generateInitialCharacteristics(): FlowerPath['characteristics'] {
    const colors = ['#E8F5E8', '#F0F8FF', '#FFF8DC', '#F5F5DC']
    const bloomTypes: FlowerPath['characteristics']['bloomType'][] = ['delicate', 'vibrant', 'wild', 'elegant']
    const growthPatterns: FlowerPath['characteristics']['growthPattern'][] = ['climbing', 'spreading', 'upright', 'cascading']
    const seasons: FlowerPath['characteristics']['seasonality'][] = ['spring', 'summer', 'autumn', 'winter']
    
    return {
      primaryColor: colors[Math.floor(Math.random() * colors.length)],
      secondaryColor: colors[Math.floor(Math.random() * colors.length)],
      bloomType: bloomTypes[Math.floor(Math.random() * bloomTypes.length)],
      growthPattern: growthPatterns[Math.floor(Math.random() * growthPatterns.length)],
      seasonality: seasons[Math.floor(Math.random() * seasons.length)]
    }
  }

  private evolvePathCharacteristics(path: FlowerPath, offering: CauseOffering): void {
    // Apply offering's evolution effects
    if (offering.evolutionEffect.colorShift) {
      path.characteristics.primaryColor = offering.primaryColor
    }
    
    // Growth direction affects growth pattern
    const directionMap = {
      'up': 'upright' as const,
      'out': 'spreading' as const, 
      'deep': 'climbing' as const,
      'wide': 'cascading' as const
    }
    
    if (offering.evolutionEffect.growthDirection) {
      path.characteristics.growthPattern = directionMap[offering.evolutionEffect.growthDirection]
    }
  }

  private calculateImpactLevel(choiceCount: number): FlowerChoice['impactLevel'] {
    if (choiceCount === 0) return 'seed'
    if (choiceCount < 3) return 'sprout'
    if (choiceCount < 6) return 'bloom'
    return 'fruit'
  }

  private calculateCurrentStage(evolutionScore: number, choiceCount: number): FlowerPath['currentStage'] {
    if (choiceCount === 0) return 'seeding'
    if (evolutionScore < 50) return 'sprouting'
    if (evolutionScore < 100) return 'blooming'
    return 'fruiting'
  }

  private generateEvolutionMessage(path: FlowerPath, offering: CauseOffering): string {
    const messages = {
      seeding: `Your seed has been planted with ${offering.name}. The journey begins...`,
      sprouting: `Your flower path grows stronger through ${offering.name}. New growth appears!`,
      blooming: `Beautiful blooms emerge from your support of ${offering.name}. Your impact flourishes!`,
      fruiting: `Your dedication to ${offering.name} bears fruit. Your garden inspires others!`
    }
    
    return messages[path.currentStage]
  }

  // --- Storage ---
  
  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const pathsData = localStorage.getItem('way-of-flowers-paths')
        const sessionsData = localStorage.getItem('way-of-flowers-sessions')
        
        if (pathsData) {
          const paths = JSON.parse(pathsData) as FlowerPath[]
          paths.forEach(path => this.flowerPaths.set(path.id, path))
        }
        
        if (sessionsData) {
          const sessions = JSON.parse(sessionsData) as Record<string, UserFlowerSession>
          Object.entries(sessions).forEach(([userId, session]) => {
            this.activeSessions.set(userId, session)
          })
        }
      }
    } catch (error) {
      console.error('Failed to load Way of Flowers data:', error)
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const paths = Array.from(this.flowerPaths.values())
        const sessions = Object.fromEntries(this.activeSessions.entries())
        
        localStorage.setItem('way-of-flowers-paths', JSON.stringify(paths))
        localStorage.setItem('way-of-flowers-sessions', JSON.stringify(sessions))
      }
    } catch (error) {
      console.error('Failed to save Way of Flowers data:', error)
    }
  }

  // --- Initialize Cause Offerings ---
  
  private initializeCauseOfferings(): void {
    this.causeOfferings = [
      {
        id: 'mangrove-restoration',
        name: 'Mangrove Restoration',
        description: 'Protect coastal communities by restoring vital mangrove ecosystems',
        category: 'restoration',
        impactDescription: 'Each choice helps plant mangrove seedlings that will protect coastlines for decades',
        primaryColor: '#2D5A27',
        secondaryColor: '#4A7C59',
        icon: '🌊',
        evolutionEffect: {
          colorShift: '#2D5A27',
          bloomBoost: 15,
          growthDirection: 'deep'
        }
      },
      {
        id: 'cover-cropping',
        name: 'Cover Cropping',
        description: 'Regenerate soil health through sustainable agricultural practices',
        category: 'regeneration', 
        impactDescription: 'Your support helps farmers adopt cover crops that enrich the soil naturally',
        primaryColor: '#8B4513',
        secondaryColor: '#A0522D',
        icon: '🌱',
        evolutionEffect: {
          colorShift: '#8B4513',
          bloomBoost: 12,
          growthDirection: 'wide'
        }
      },
      {
        id: 'pollinator-habitat',
        name: 'Pollinator Gardens',
        description: 'Create safe havens for bees, butterflies, and other vital pollinators',
        category: 'conservation',
        impactDescription: 'Build flower-rich habitats that support declining pollinator populations',
        primaryColor: '#FFD700',
        secondaryColor: '#FFA500',
        icon: '🐝',
        evolutionEffect: {
          colorShift: '#FFD700',
          bloomBoost: 20,
          growthDirection: 'out'
        }
      },
      {
        id: 'forest-protection',
        name: 'Forest Guardian',
        description: 'Protect ancient forests from deforestation and habitat loss',
        category: 'protection',
        impactDescription: 'Safeguard irreplaceable forest ecosystems for future generations',
        primaryColor: '#228B22',
        secondaryColor: '#32CD32',
        icon: '🌲',
        evolutionEffect: {
          colorShift: '#228B22',
          bloomBoost: 18,
          growthDirection: 'up'
        }
      }
    ]
  }
}

// Export both the class and singleton instance
export { WayOfFlowersManager }

// Singleton instance
export const wayOfFlowersManager = new WayOfFlowersManager() 