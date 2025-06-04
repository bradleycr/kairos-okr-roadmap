"use client"

// --- React Hook for ZK Proof Generation ---
// Beautiful, client-side integration with the ZK proof system
import { useState, useCallback } from 'react'
import { zkProofSystem } from '@/lib/zk/zkProofSystem'
import type { ZKMoment, ZKMomentProof, ZKSession, ZKCircuitConfig, ProofGenerationResult } from '@/lib/zk/zkProofSystem'

/**
 * Elegant React hook for zero-knowledge proof generation
 * Provides stateful interaction with the ZK proof system
 */
export function useZKProofSystem() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastProof, setLastProof] = useState<ZKMomentProof | null>(null)

  const generateProof = useCallback(async (
    moments: ZKMoment[],
    threshold: number,
    userPublicKey: Uint8Array
  ): Promise<ProofGenerationResult> => {
    setIsGenerating(true)
    try {
      const result = await zkProofSystem.generateMomentCountProof(moments, threshold, userPublicKey)
      if (result.success && result.proof) {
        setLastProof(result.proof)
      }
      return result
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const verifyProof = useCallback(async (proof: ZKMomentProof): Promise<boolean> => {
    return await zkProofSystem.verifyMomentCountProof(proof)
  }, [])

  const generateSessionProofs = useCallback(async (
    session: ZKSession,
    thresholds: number[],
    userPublicKey: Uint8Array
  ) => {
    setIsGenerating(true)
    try {
      return await zkProofSystem.generateSessionProofs(session, thresholds, userPublicKey)
    } finally {
      setIsGenerating(false)
    }
  }, [])

  return {
    isGenerating,
    lastProof,
    generateProof,
    verifyProof,
    generateSessionProofs,
    getRecommendedThresholds: (count: number) => zkProofSystem.getRecommendedThresholds(count),
    getConfig: () => zkProofSystem.getConfig(),
    updateConfig: (config: Partial<ZKCircuitConfig>) => zkProofSystem.updateConfig(config)
  }
} 