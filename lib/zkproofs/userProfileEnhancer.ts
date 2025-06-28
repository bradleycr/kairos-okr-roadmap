// User Profile Enhancement with ZK Proof Participation
// Shows privacy-preserving insights about user's ZK proof activity

export interface ZKProofParticipation {
  // Public participation metrics (privacy-safe)
  totalProofsGenerated: number
  proofsLast30Days: number
  firstProofDate: string
  lastProofDate: string
  
  // Proof type distribution
  proofTypeBreakdown: {
    bonding: number
    moment_count: number
    presence: number
  }
  
  // Network participation (privacy-preserving)
  estimatedNetworkSize: number      // Based on proof hashes, not actual connections
  socialActivityLevel: 'low' | 'medium' | 'high'
  
  // Geographic activity (city-level only)
  activeRegions: string[]           // Cities where proofs were generated
  
  // Technology usage
  preferredDeviceType: string       // Most common device type
  averageProvingTime: number        // Performance metric
  
  // Privacy metrics
  privacyScore: number              // How well user maintains privacy (0-1)
  authenticityScore: number         // How often proofs verify successfully (0-1)
  
  // Achievements (gamification while preserving privacy)
  achievements: ZKAchievement[]
}

export interface ZKAchievement {
  id: string
  name: string
  description: string
  unlockedAt: string
  category: 'privacy' | 'social' | 'technical' | 'civic'
  icon: string
}

export interface UserZKProfile {
  userId: string                    // Hashed user identifier
  displayName: string
  participation: ZKProofParticipation
  privacySettings: {
    showNetworkSize: boolean
    showRegions: boolean
    showAchievements: boolean
    showTechnicalMetrics: boolean
  }
}

export class ZKUserProfileEnhancer {
  
  /**
   * Generate privacy-preserving profile insights from ZK proof participation
   */
  async generateUserProfile(userProofHashes: string[]): Promise<ZKProofParticipation> {
    // Fetch user's proof metadata (public data only)
    const proofMetadata = await this.fetchUserProofMetadata(userProofHashes)
    
    // Calculate participation metrics
    const totalProofsGenerated = proofMetadata.length
    const proofsLast30Days = proofMetadata.filter(
      p => Date.now() - p.timestamp < 30 * 24 * 60 * 60 * 1000
    ).length
    
    const timestamps = proofMetadata.map(p => p.timestamp).sort()
    const firstProofDate = timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : ''
    const lastProofDate = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString() : ''
    
    // Proof type breakdown
    const proofTypeBreakdown = {
      bonding: proofMetadata.filter(p => p.proofType === 'bonding').length,
      moment_count: proofMetadata.filter(p => p.proofType === 'moment_count').length,
      presence: proofMetadata.filter(p => p.proofType === 'presence').length
    }
    
    // Network participation (estimated from proof patterns)
    const bondingProofs = proofMetadata.filter(p => p.proofType === 'bonding')
    const uniqueBondHashes = new Set(bondingProofs.map(p => p.publicSignals.bondHash).filter(Boolean))
    const estimatedNetworkSize = uniqueBondHashes.size * 2 // Each bond involves 2 people
    
    // Social activity level
    const socialActivityLevel = this.calculateSocialActivityLevel(proofsLast30Days)
    
    // Geographic activity (city-level aggregation)
    const activeRegions = [...new Set(
      proofMetadata.map(p => p.analytics.geographicRegion).filter(Boolean)
    )].slice(0, 5) // Limit to top 5 regions
    
    // Technology usage
    const deviceTypes = proofMetadata.map(p => p.analytics.deviceType)
    const preferredDeviceType = this.getMostCommon(deviceTypes) || 'unknown'
    const averageProvingTime = proofMetadata.reduce((sum, p) => sum + p.technical.provingTime, 0) / proofMetadata.length || 0
    
    // Privacy and authenticity scores
    const privacyScore = proofMetadata.filter(p => p.research.demonstrates_privacy_preservation).length / proofMetadata.length || 0
    const authenticityScore = proofMetadata.filter(p => p.verificationStatus === 'verified').length / proofMetadata.length || 0
    
    // Generate achievements
    const achievements = this.generateAchievements(proofMetadata, {
      totalProofs: totalProofsGenerated,
      networkSize: estimatedNetworkSize,
      privacyScore,
      authenticityScore,
      deviceTypes: [...new Set(deviceTypes)],
      regions: activeRegions
    })
    
    return {
      totalProofsGenerated,
      proofsLast30Days,
      firstProofDate,
      lastProofDate,
      proofTypeBreakdown,
      estimatedNetworkSize,
      socialActivityLevel,
      activeRegions,
      preferredDeviceType,
      averageProvingTime,
      privacyScore,
      authenticityScore,
      achievements
    }
  }
  
  /**
   * Fetch proof metadata for user (public data only)
   */
  private async fetchUserProofMetadata(proofHashes: string[]) {
    // In production, this would query the ZK proof archive
    // For now, return mock data
    return proofHashes.map((hash, i) => ({
      proofId: hash,
      proofType: ['bonding', 'moment_count', 'presence'][i % 3] as any,
      timestamp: Date.now() - (i * 24 * 60 * 60 * 1000),
      verificationStatus: 'verified' as any,
      publicSignals: {
        bondHash: `bond_${hash.slice(0, 8)}`
      },
      analytics: {
        geographicRegion: ['San Francisco, CA', 'New York, NY', 'Austin, TX'][i % 3],
        deviceType: ['mobile', 'wearable', 'embedded'][i % 3]
      },
      technical: {
        provingTime: 1000 + Math.random() * 500
      },
      research: {
        demonstrates_privacy_preservation: true,
        shows_authentic_human_interaction: true
      }
    }))
  }
  
  /**
   * Calculate social activity level based on recent proof count
   */
  private calculateSocialActivityLevel(proofsLast30Days: number): 'low' | 'medium' | 'high' {
    if (proofsLast30Days >= 20) return 'high'
    if (proofsLast30Days >= 5) return 'medium'
    return 'low'
  }
  
  /**
   * Get most common item in array
   */
  private getMostCommon<T>(arr: T[]): T | null {
    if (arr.length === 0) return null
    
    const counts = arr.reduce((acc, item) => {
      acc[item as any] = (acc[item as any] || 0) + 1
      return acc
    }, {} as Record<any, number>)
    
    return Object.entries(counts).reduce((a, b) => counts[a[0]] > counts[b[0]] ? a : b)[0] as T
  }
  
  /**
   * Generate privacy-preserving achievements
   */
  private generateAchievements(proofMetadata: any[], stats: any): ZKAchievement[] {
    const achievements: ZKAchievement[] = []
    
    // Privacy achievements
    if (stats.privacyScore >= 0.95) {
      achievements.push({
        id: 'privacy_guardian',
        name: 'Privacy Guardian',
        description: 'Maintained 95%+ privacy preservation rate',
        unlockedAt: new Date().toISOString(),
        category: 'privacy',
        icon: '🛡️'
      })
    }
    
    // Social achievements
    if (stats.networkSize >= 10) {
      achievements.push({
        id: 'social_connector',
        name: 'Social Connector',
        description: 'Connected with 10+ unique participants',
        unlockedAt: new Date().toISOString(),
        category: 'social',
        icon: '🤝'
      })
    }
    
    // Technical achievements
    if (stats.deviceTypes.length >= 3) {
      achievements.push({
        id: 'multi_device_user',
        name: 'Multi-Device User',
        description: 'Generated proofs on 3+ device types',
        unlockedAt: new Date().toISOString(),
        category: 'technical',
        icon: '📱'
      })
    }
    
    // Civic achievements
    if (stats.totalProofs >= 100) {
      achievements.push({
        id: 'civic_pioneer',
        name: 'Civic Pioneer',
        description: 'Generated 100+ zero-knowledge proofs',
        unlockedAt: new Date().toISOString(),
        category: 'civic',
        icon: '🏛️'
      })
    }
    
    // Geographic achievements
    if (stats.regions.length >= 5) {
      achievements.push({
        id: 'digital_nomad',
        name: 'Digital Nomad',
        description: 'Active in 5+ geographic regions',
        unlockedAt: new Date().toISOString(),
        category: 'social',
        icon: '🌍'
      })
    }
    
    return achievements
  }
  
  /**
   * Generate Congress presentation summary for a user profile
   */
  generateCongressSummary(profile: ZKProofParticipation): string {
    const summary = [
      `User Profile Summary (Privacy-Preserving):`,
      `• Total ZK Proofs Generated: ${profile.totalProofsGenerated}`,
      `• Privacy Preservation Rate: ${(profile.privacyScore * 100).toFixed(1)}%`,
      `• Authenticity Verification Rate: ${(profile.authenticityScore * 100).toFixed(1)}%`,
      `• Estimated Network Connections: ${profile.estimatedNetworkSize}`,
      `• Active Geographic Regions: ${profile.activeRegions.length}`,
      `• Social Activity Level: ${profile.socialActivityLevel}`,
      `• Achievements Unlocked: ${profile.achievements.length}`,
      ``,
      `Privacy Note: This summary contains only aggregate statistics and public proof metadata.`,
      `No private information (chip IDs, signatures, precise locations) is included.`
    ]
    
    return summary.join('\n')
  }
}

// Export singleton instance
export const zkUserProfileEnhancer = new ZKUserProfileEnhancer() 