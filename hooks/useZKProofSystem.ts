"use client"

// --- React Hook for ZK Proof Generation ---
// Client-side integration with the ZK proof system
import { useState, useCallback, useRef } from 'react'
import { ZKProofSystem } from '@/lib/zk/zkProofSystem'
import type { ZKMoment, ZKMomentProof, ZKSession, ProofGenerationResult } from '@/lib/types'
import type { ZKCircuitConfig } from '@/lib/zk/zkProofSystem'

/**
 * React hook for zero-knowledge proof generation
 * Provides stateful interaction with the ZK proof system
 */
export function useZKProofSystem() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [lastProof, setLastProof] = useState<ZKMomentProof | null>(null)
  const zkSystemRef = useRef(new ZKProofSystem())

  const generateProof = useCallback(async (
    moments: ZKMoment[],
    threshold: number,
    userPublicKey: Uint8Array
  ): Promise<ProofGenerationResult> => {
    setIsGenerating(true)
    try {
      const result = await zkSystemRef.current.generateMomentCountProof(moments, threshold, userPublicKey)
      if (result.success && result.proof) {
        setLastProof(result.proof)
      }
      return result
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const verifyProof = useCallback(async (proof: ZKMomentProof): Promise<boolean> => {
    return await zkSystemRef.current.verifyMomentCountProof(proof)
  }, [])

  const generateSessionProofs = useCallback(async (
    session: ZKSession,
    thresholds: number[],
    userPublicKey: Uint8Array
  ) => {
    setIsGenerating(true)
    try {
      return await zkSystemRef.current.generateSessionProofs(session, thresholds, userPublicKey)
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
    getRecommendedThresholds: (count: number) => zkSystemRef.current.getRecommendedThresholds(count),
    getConfig: () => zkSystemRef.current.getConfig(),
    updateConfig: (config: Partial<ZKCircuitConfig>) => zkSystemRef.current.updateConfig(config)
  }
} 