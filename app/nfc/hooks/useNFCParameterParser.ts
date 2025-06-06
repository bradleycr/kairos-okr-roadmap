/**
 * useNFCParameterParser Hook
 * 
 * Intelligent URL parameter parsing for NFC authentication
 * Handles multiple formats with detailed debugging information
 */

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import type { NFCParameters } from '../types/nfc.types'
import { NFCParameterParser } from '../utils/nfc-parameter-parser'

export function useNFCParameterParser() {
  const searchParams = useSearchParams()
  const [parsedParams, setParsedParams] = useState<NFCParameters>({})
  const [format, setFormat] = useState<'decentralized' | 'legacy-full' | 'legacy-compressed' | 'legacy-ultra' | 'none'>('none')
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [isParsing, setIsParsing] = useState(true)

  const parseParameters = useCallback(() => {
    setIsParsing(true)
    
    try {
      const result = NFCParameterParser.parseParameters(searchParams)
      
      setParsedParams(result.params)
      setFormat(result.format)
      setDebugInfo(result.debugInfo)
      
    } catch (error) {
      console.error('Parameter parsing failed:', error)
      setDebugInfo(prev => [...prev, `❌ Parsing error: ${error}`])
      setFormat('none')
      setParsedParams({})
    } finally {
      setIsParsing(false)
    }
  }, [searchParams])

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
    hasValidParameters,
    isDecentralizedFormat,
    isLegacyFormat,
    reparseParameters: parseParameters
  }
} 