/**
 * useNFCParameterParser Hook
 * 
 * Intelligent URL parameter parsing for NFC authentication
 * Handles multiple formats with detailed debugging information
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import type { NFCParameters } from '../types/nfc.types'
import { NFCParameterParser } from '../utils/nfc-parameter-parser'

export function useNFCParameterParser() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [parsedParams, setParsedParams] = useState<NFCParameters>({})
  const [format, setFormat] = useState<'decentralized' | 'legacy-full' | 'legacy-compressed' | 'legacy-ultra' | 'none'>('none')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(true)
  const [accountInitialized, setAccountInitialized] = useState(false)

  const parseParameters = useCallback(async () => {
    setIsParsing(true)
    
    try {
      const result = NFCParameterParser.parseParameters(searchParams)
      
      setParsedParams(result.params)
      setFormat(result.format)
      setDebugInfo(result.debugInfo)
      
      // Initialize account if we have a chipUID
      if (result.params.chipUID && !accountInitialized) {
        await initializeAccount(result.params.chipUID)
      }
      
    } catch (error) {
      console.error('Parameter parsing failed:', error)
      setDebugInfo(prev => [...prev, `❌ Parsing error: ${error}`])
      setFormat('none')
      setParsedParams({})
    } finally {
      setIsParsing(false)
    }
  }, [searchParams, accountInitialized])

  const initializeAccount = useCallback(async (chipUID: string) => {
    try {
      const { NFCAccountManager } = await import('@/lib/nfc/accountManager')
      const result = await NFCAccountManager.authenticateOrCreateAccount(chipUID)
      const { account, isNewAccount, isNewDevice } = result
      
      console.log(`🔐 Account initialized: ${account.accountId}`)
      console.log(`📱 Status: ${isNewAccount ? 'New account' : 'Existing account'}, ${isNewDevice ? 'New device' : 'Familiar device'}`)
      
      // Show appropriate welcome message
      if (isNewAccount) {
        toast({
          title: "🎉 Welcome to KairOS",
          description: `Account created: ${account.displayName}`,
        })
      } else if (isNewDevice) {
        toast({
          title: "👋 Welcome back on new device",
          description: `Account recognized: ${account.displayName}`,
        })
      } else {
        toast({
          title: "🔐 Account loaded",
          description: `Welcome back, ${account.displayName}`,
        })
      }
      
      setAccountInitialized(true)
      setDebugInfo(prev => [...prev, `✅ Account initialized: ${account.accountId}`])
      
    } catch (error) {
      console.warn('Account initialization failed:', error)
      setDebugInfo(prev => [...prev, `⚠️ Account init failed: ${error}`])
      // Continue with normal flow - error handling is built into the auth system
    }
  }, [toast])

  useEffect(() => {
    parseParameters()
  }, [parseParameters])

  const hasValidParameters = useCallback(() => {
    return format !== 'none' && Object.keys(parsedParams).length > 0
  }, [format, parsedParams])

  const isDecentralizedFormat = useCallback(() => {
    return format === 'decentralized'
  }, [format])

  const isLegacyFormat = useCallback(() => {
    return format.startsWith('legacy')
  }, [format])

  return {
    parsedParams,
    format,
    debugInfo,
    isParsing,
    accountInitialized,
    hasValidParameters,
    isDecentralizedFormat,
    isLegacyFormat,
    reparseParameters: parseParameters
  }
} 