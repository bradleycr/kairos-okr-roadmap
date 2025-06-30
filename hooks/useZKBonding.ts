// --- React Hook for ZK Bonding System ---
// Integration of cryptographic social bonding with KairOS

import { useState, useCallback, useRef } from 'react'
import { ZKBondingSystem, type ZKBondSignature, type ZKRitualBond, type PrivateSetIntersection } from '@/lib/zk/zkBondingSystem'
import type { UserBond } from '@/app/api/nfc/bonds/route'
import { useToast } from '@/components/ui/use-toast'

/**
 * React hook for zero-knowledge social bonding
 * Provides stateful interaction with cryptographic bonding protocols
 */
export function useZKBonding() {
  const [isGeneratingProof, setIsGeneratingProof] = useState(false)
  const [lastRitualBond, setLastRitualBond] = useState<ZKRitualBond | null>(null)
  const [lastPSIResult, setLastPSIResult] = useState<PrivateSetIntersection | null>(null)
  const { toast } = useToast()
  
  const zkBondingRef = useRef(new ZKBondingSystem())

  /**
   * Create a cryptographic signature for bonding ritual
   */
  const generateBondSignature = useCallback(async (
    chipUID: string,
    privateKey: Uint8Array,
    publicKey: Uint8Array,
    bondNonce?: string
  ): Promise<ZKBondSignature | null> => {
    try {
      setIsGeneratingProof(true)
      
      const signature = await zkBondingRef.current.generateBondSignature(
        chipUID,
        privateKey,
        publicKey,
        bondNonce
      )
      
      toast({
        title: "🔐 Bond Signature Created",
        description: "Cryptographic signature ready for ritual bonding",
      })
      
      return signature
    } catch (error) {
      console.error('Bond signature generation failed:', error)
      toast({
        title: "❌ Signature Failed",
        description: "Could not create bond signature",
        variant: "destructive"
      })
      return null
    } finally {
      setIsGeneratingProof(false)
    }
  }, [toast])

  /**
   * Create a ZK ritual bond between multiple participants
   */
  const createZKRitualBond = useCallback(async (
    signatures: ZKBondSignature[],
    ritualType: 'meeting' | 'collaboration' | 'celebration' | 'ceremony',
    metadata?: {
      location?: string
      description?: string
      duration?: number
    }
  ): Promise<ZKRitualBond | null> => {
    try {
      setIsGeneratingProof(true)
      
      const result = await zkBondingRef.current.createZKRitualBond(
        signatures,
        ritualType,
        metadata
      )
      
      if (result.success && result.bond) {
        setLastRitualBond(result.bond)
        
        toast({
          title: "🎭 Ritual Bond Created",
          description: `${signatures.length} participants bonded through ${ritualType}`,
        })
        
        return result.bond
      } else {
        toast({
          title: "❌ Ritual Bond Failed",
          description: result.error || "Could not create ritual bond",
          variant: "destructive"
        })
        return null
      }
    } catch (error) {
      console.error('ZK ritual bond creation failed:', error)
      toast({
        title: "❌ Bonding Error",
        description: "Cryptographic bonding failed",
        variant: "destructive"
      })
      return null
    } finally {
      setIsGeneratingProof(false)
    }
  }, [toast])

  /**
   * Compute private set intersection with another user
   */
  const computePSI = useCallback(async (
    myBonds: UserBond[],
    theirBondsCommitment: string,
    myPrivateKey: Uint8Array
  ): Promise<PrivateSetIntersection | null> => {
    try {
      setIsGeneratingProof(true)
      
      const psiResult = await zkBondingRef.current.computePrivateSetIntersection(
        myBonds,
        theirBondsCommitment,
        myPrivateKey
      )
      
      setLastPSIResult(psiResult)
      
      toast({
        title: "🤝 Common Bonds Found",
        description: `You have ${psiResult.intersectionSize} bonds in common`,
      })
      
      return psiResult
    } catch (error) {
      console.error('PSI computation failed:', error)
      toast({
        title: "❌ PSI Failed",
        description: "Could not compute common bonds",
        variant: "destructive"
      })
      return null
    } finally {
      setIsGeneratingProof(false)
    }
  }, [toast])

  /**
   * Generate social proof about bond graph properties
   */
  const generateSocialProof = useCallback(async (
    bonds: UserBond[],
    proofType: 'bond_count' | 'diversity_score' | 'influence_metric',
    threshold: number
  ): Promise<{ proof: string; verified: boolean } | null> => {
    try {
      setIsGeneratingProof(true)
      
      const proofResult = await zkBondingRef.current.generateSocialProof(
        bonds,
        proofType,
        threshold
      )
      
      const proofTypeNames = {
        bond_count: 'Bond Count',
        diversity_score: 'Social Diversity',
        influence_metric: 'Influence Score'
      }
      
      toast({
        title: proofResult.verified ? "✅ Proof Generated" : "❌ Proof Failed",
        description: `${proofTypeNames[proofType]} proof: ${proofResult.verified ? 'Verified' : 'Unverified'}`,
        variant: proofResult.verified ? "default" : "destructive"
      })
      
      return proofResult
    } catch (error) {
      console.error('Social proof generation failed:', error)
      toast({
        title: "❌ Proof Failed",
        description: "Could not generate social proof",
        variant: "destructive"
      })
      return null
    } finally {
      setIsGeneratingProof(false)
    }
  }, [toast])

  /**
   * Create a ZK-enabled ritual moment
   */
  const createRitualBondMoment = useCallback(async (
    participants: ZKBondSignature[],
    ritualType: string,
    location?: string
  ): Promise<{ moment: any; bonds: ZKRitualBond[] } | null> => {
    try {
      setIsGeneratingProof(true)
      
      const result = await zkBondingRef.current.createRitualBondMoment(
        participants,
        ritualType,
        location
      )
      
      if (result.bonds.length > 0) {
        setLastRitualBond(result.bonds[0])
      }
      
      toast({
        title: "🎭 Ritual Moment Created",
        description: `ZK-proven ritual with ${participants.length} participants`,
      })
      
      return result
    } catch (error) {
      console.error('Ritual bond moment creation failed:', error)
      toast({
        title: "❌ Ritual Failed",
        description: "Could not create ritual moment",
        variant: "destructive"
      })
      return null
    } finally {
      setIsGeneratingProof(false)
    }
  }, [toast])

  return {
    // State
    isGeneratingProof,
    lastRitualBond,
    lastPSIResult,
    
    // Actions
    generateBondSignature,
    createZKRitualBond,
    computePSI,
    generateSocialProof,
    createRitualBondMoment,
    
    // Utilities
    clearLastBond: () => setLastRitualBond(null),
    clearLastPSI: () => setLastPSIResult(null)
  }
} 