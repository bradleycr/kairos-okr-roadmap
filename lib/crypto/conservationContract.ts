/**
 * Conservation Smart Contract Interface
 * Tracks environmental choices and processes real conservation donations
 * For Way of Flowers installation and future conservation projects
 */

import { Address } from 'viem'
import { walletIntegration } from './walletIntegration'

// Smart Contract ABI for Conservation Tracking
export const CONSERVATION_CONTRACT_ABI = [
  {
    "inputs": [
      {"name": "_conservationBeneficiary", "type": "address"},
      {"name": "_adminAddress", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {"name": "chipUID", "type": "string"},
      {"name": "causeCategory", "type": "uint8"},
      {"name": "impactLevel", "type": "uint8"},
      {"name": "offeringId", "type": "string"}
    ],
    "name": "recordChoice",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "chipUID", "type": "string"}
    ],
    "name": "getFlowerPath",
    "outputs": [
      {"name": "choices", "type": "uint256"},
      {"name": "totalDonated", "type": "uint256"},
      {"name": "evolutionScore", "type": "uint256"},
      {"name": "lastInteraction", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "causeCategory", "type": "uint8"}
    ],
    "name": "getCauseTotals",
    "outputs": [
      {"name": "totalChoices", "type": "uint256"},
      {"name": "totalFunding", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "chipUID", "type": "string"},
      {"indexed": true, "name": "causeCategory", "type": "uint8"},
      {"indexed": false, "name": "amount", "type": "uint256"},
      {"indexed": false, "name": "offeringId", "type": "string"}
    ],
    "name": "ConservationChoice",
    "type": "event"
  }
] as const

// Contract addresses (will be deployed)
export const CONSERVATION_CONTRACT_ADDRESSES = {
  1: '0x0000000000000000000000000000000000000000', // Mainnet (to be deployed)
  11155111: '0x0000000000000000000000000000000000000000', // Sepolia testnet (to be deployed)
  137: '0x0000000000000000000000000000000000000000', // Polygon (to be deployed)
} as const

export enum CauseCategory {
  Restoration = 0,
  Conservation = 1,
  Regeneration = 2,
  Protection = 3
}

export enum ImpactLevel {
  Seed = 0,
  Sprout = 1,
  Bloom = 2,
  Fruit = 3
}

export interface ConservationChoice {
  chipUID: string
  causeCategory: CauseCategory
  impactLevel: ImpactLevel
  offeringId: string
  donationAmount: string // in ETH
  transactionHash?: string
  timestamp: number
}

export interface FlowerPathOnChain {
  choices: number
  totalDonated: bigint
  evolutionScore: number
  lastInteraction: number
}

class ConservationContractManager {
  private static instance: ConservationContractManager

  static getInstance(): ConservationContractManager {
    if (!ConservationContractManager.instance) {
      ConservationContractManager.instance = new ConservationContractManager()
    }
    return ConservationContractManager.instance
  }

  // --- Record Environmental Choice On-Chain ---
  
  async recordConservationChoice(choice: ConservationChoice): Promise<string | null> {
    try {
      const session = walletIntegration.getCurrentSession()
      if (!session) {
        throw new Error('No wallet connected')
      }

      const contractAddress = this.getContractAddress(session.account.chainId || 1)
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Conservation contract not deployed on this network')
      }

      // Record choice and send donation
      const transactionHash = await walletIntegration.executeSmartContract(
        contractAddress,
        CONSERVATION_CONTRACT_ABI,
        'recordChoice',
        [choice.chipUID, choice.causeCategory, choice.impactLevel, choice.offeringId],
        choice.donationAmount
      )

      if (transactionHash) {
        choice.transactionHash = transactionHash
        choice.timestamp = Date.now()
        
        // Store locally for offline access
        this.storeChoiceLocally(choice)
        
        console.log('🌱 Conservation choice recorded on-chain:', transactionHash)
      }

      return transactionHash

    } catch (error) {
      console.error('❌ Failed to record conservation choice:', error)
      return null
    }
  }

  // --- Query On-Chain Data ---
  
  async getFlowerPathOnChain(chipUID: string): Promise<FlowerPathOnChain | null> {
    try {
      const session = walletIntegration.getCurrentSession()
      if (!session) {
        console.log('ℹ️ No wallet connected, cannot query on-chain data')
        return null
      }

      const contractAddress = this.getContractAddress(session.account.chainId || 1)
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        console.log('ℹ️ Contract not deployed, using local data')
        return null
      }

      // Query contract (this would need a read-only provider setup)
      // For now, return null to fall back to local data
      return null

    } catch (error) {
      console.error('❌ Failed to query on-chain flower path:', error)
      return null
    }
  }

  async getCauseTotalsOnChain(causeCategory: CauseCategory): Promise<{ choices: number, funding: bigint } | null> {
    try {
      const session = walletIntegration.getCurrentSession()
      if (!session) return null

      const contractAddress = this.getContractAddress(session.account.chainId || 1)
      if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
        return null
      }

      // Query contract for cause totals
      // Implementation would go here when contract is deployed
      return null

    } catch (error) {
      console.error('❌ Failed to query cause totals:', error)
      return null
    }
  }

  // --- Suggested Donation Amounts ---
  
  getSuggestedDonationAmount(impactLevel: ImpactLevel): string {
    const amounts = {
      [ImpactLevel.Seed]: '0.01',    // $30-40 USD at current ETH prices
      [ImpactLevel.Sprout]: '0.02',  // $60-80 USD
      [ImpactLevel.Bloom]: '0.05',   // $150-200 USD  
      [ImpactLevel.Fruit]: '0.1'     // $300-400 USD
    }
    return amounts[impactLevel]
  }

  getDonationDescription(impactLevel: ImpactLevel, causeCategory: CauseCategory): string {
    const descriptions = {
      [CauseCategory.Restoration]: {
        [ImpactLevel.Seed]: 'Plants 5 mangrove seedlings',
        [ImpactLevel.Sprout]: 'Restores 0.1 hectare of wetland',
        [ImpactLevel.Bloom]: 'Funds 1 month of restoration work',
        [ImpactLevel.Fruit]: 'Sponsors a complete restoration site'
      },
      [CauseCategory.Conservation]: {
        [ImpactLevel.Seed]: 'Protects 1 sq meter of habitat',
        [ImpactLevel.Sprout]: 'Funds 1 week of ranger patrol',
        [ImpactLevel.Bloom]: 'Supports anti-poaching operations',
        [ImpactLevel.Fruit]: 'Establishes new protected area'
      },
      [CauseCategory.Regeneration]: {
        [ImpactLevel.Seed]: 'Supports 1 farmer with cover crops',
        [ImpactLevel.Sprout]: 'Regenerates 1 acre of soil',
        [ImpactLevel.Bloom]: 'Funds regenerative farming training',
        [ImpactLevel.Fruit]: 'Transforms entire farm operation'
      },
      [CauseCategory.Protection]: {
        [ImpactLevel.Seed]: 'Plants 10 native trees',
        [ImpactLevel.Sprout]: 'Protects 1 hectare of forest',
        [ImpactLevel.Bloom]: 'Funds forest monitoring system',
        [ImpactLevel.Fruit]: 'Establishes new forest reserve'
      }
    }

    return descriptions[causeCategory][impactLevel]
  }

  // --- Helper Methods ---
  
  private getContractAddress(chainId: number): Address | null {
    return CONSERVATION_CONTRACT_ADDRESSES[chainId as keyof typeof CONSERVATION_CONTRACT_ADDRESSES] as Address || null
  }

  private storeChoiceLocally(choice: ConservationChoice): void {
    try {
      const stored = localStorage.getItem('kairos_conservation_choices')
      const choices: ConservationChoice[] = stored ? JSON.parse(stored) : []
      choices.push(choice)
      localStorage.setItem('kairos_conservation_choices', JSON.stringify(choices))
    } catch (error) {
      console.error('❌ Failed to store choice locally:', error)
    }
  }

  getLocalChoices(chipUID?: string): ConservationChoice[] {
    try {
      const stored = localStorage.getItem('kairos_conservation_choices')
      const choices: ConservationChoice[] = stored ? JSON.parse(stored) : []
      return chipUID ? choices.filter(c => c.chipUID === chipUID) : choices
    } catch (error) {
      console.error('❌ Failed to get local choices:', error)
      return []
    }
  }

  // --- Conservation Impact Calculator ---
  
  calculateTotalImpact(choices: ConservationChoice[]): {
    totalDonated: string
    impactsByCategory: Record<CauseCategory, { count: number, donated: string }>
    conservationScore: number
  } {
    let totalDonated = 0
    const impactsByCategory = {
      [CauseCategory.Restoration]: { count: 0, donated: '0' },
      [CauseCategory.Conservation]: { count: 0, donated: '0' },
      [CauseCategory.Regeneration]: { count: 0, donated: '0' },
      [CauseCategory.Protection]: { count: 0, donated: '0' }
    }

    choices.forEach(choice => {
      const amount = parseFloat(choice.donationAmount)
      totalDonated += amount
      impactsByCategory[choice.causeCategory].count++
      impactsByCategory[choice.causeCategory].donated = 
        (parseFloat(impactsByCategory[choice.causeCategory].donated) + amount).toString()
    })

    // Calculate conservation score (weighted by impact level and diversity)
    const diversityBonus = Object.values(impactsByCategory).filter(cat => cat.count > 0).length * 10
    const impactBonus = choices.reduce((sum, choice) => sum + (choice.impactLevel + 1) * 25, 0)
    const conservationScore = diversityBonus + impactBonus

    return {
      totalDonated: totalDonated.toString(),
      impactsByCategory,
      conservationScore
    }
  }
}

// Export singleton
export const conservationContract = ConservationContractManager.getInstance()

// Export types and enums
export type { ConservationChoice, FlowerPathOnChain } 