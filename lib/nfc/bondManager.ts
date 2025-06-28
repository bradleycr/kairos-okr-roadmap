/**
 * 🤝 Bond Manager
 * 
 * Handles bonding between different NFC chip users
 * Simple and reliable bond creation without fake ZK proofs
 */

import type { UserBond } from '@/app/api/nfc/bonds/route'

export interface BondProposal {
  fromChipUID: string
  fromDisplayName: string
  toChipUID: string
  toDisplayName: string
  bondType: 'friend'
  proposedAt: string
  metadata?: {
    location?: string
    event?: string
    note?: string
  }
}

/**
 * Bond Manager Class
 */
export class BondManager {
  
  /**
   * Create a bond between two users
   */
  static async createBond(proposal: BondProposal): Promise<UserBond | null> {
    try {
      console.log('🤝 Creating bond...')
      
      const response = await fetch('/api/nfc/bonds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fromChipUID: proposal.fromChipUID,
          toChipUID: proposal.toChipUID,
          fromDisplayName: proposal.fromDisplayName,
          toDisplayName: proposal.toDisplayName,
          bondType: proposal.bondType,
          metadata: {
            ...proposal.metadata,
            ritualCompleted: true,
            bondingProtocol: 'simple-v1'
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success && data.bond) {
        console.log('✅ Bond created successfully:', data.bond.id)
        return data.bond
      }
      
      console.error('❌ Failed to create bond:', data.error)
      return null
    } catch (error) {
      console.error('Failed to create bond:', error)
      return null
    }
  }
  
  /**
   * Get all bonds for a user
   */
  static async getUserBonds(chipUID: string): Promise<UserBond[]> {
    try {
      const response = await fetch('/api/nfc/bonds', {
        method: 'GET',
        headers: {
          'X-Chip-UID': chipUID
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        return data.bonds || []
      }
      
      return []
    } catch (error) {
      console.error('Failed to get user bonds:', error)
      return []
    }
  }
  
  /**
   * Check if two users are already bonded
   */
  static async areBonded(chipUID1: string, chipUID2: string): Promise<boolean> {
    try {
      const bonds = await this.getUserBonds(chipUID1)
      return bonds.some(bond => 
        (bond.fromChipUID === chipUID2 || bond.toChipUID === chipUID2) && bond.isActive
      )
    } catch (error) {
      console.error('Failed to check bond status:', error)
      return false
    }
  }
  
  /**
   * Get bond display name for UI
   */
  static getBondDisplayName(bond: UserBond, currentUserChipUID: string): string {
    return bond.fromChipUID === currentUserChipUID 
      ? bond.toDisplayName 
      : bond.fromDisplayName
  }
  
  /**
   * Get bond type emoji
   */
  static getBondTypeEmoji(bondType: string): string {
    return '🤝'  // Simple - always connection emoji
  }
  
  /**
   * Format bonds for profile display
   */
  static formatBondsForProfile(bonds: UserBond[], currentUserChipUID: string): Array<{
    id: string
    name: string
    type: string
    emoji: string
    duration: string
    lastInteraction: string
  }> {
    return bonds
      .filter(bond => bond.isActive)
      .map(bond => ({
        id: bond.id,
        name: this.getBondDisplayName(bond, currentUserChipUID),
        type: bond.bondType,
        emoji: this.getBondTypeEmoji(bond.bondType),
        duration: this.getBondDuration(bond.createdAt),
        lastInteraction: this.getBondDuration(bond.lastInteraction)
      }))
      .sort((a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime())
  }
  
  /**
   * Get formatted bond duration
   */
  private static getBondDuration(createdAt: string): string {
    const created = new Date(createdAt)
    const now = new Date()
    const diff = now.getTime() - created.getTime()
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return days === 1 ? '1 day ago' : `${days} days ago`
    } else if (hours > 0) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`
    } else if (minutes > 0) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`
    } else {
      return 'Just now'
    }
  }
} 