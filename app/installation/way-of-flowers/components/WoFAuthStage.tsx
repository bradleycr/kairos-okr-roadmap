/**
 * WoF Authentication Stage
 * Handles NFC authentication for the WoF flow
 */

'use client'

import { NFCAuthFlow } from '@/app/nfc/components/NFCAuthFlow'
import { Card, CardContent } from '@/components/ui/card'
import type { NFCVerificationState, NFCParameters } from '@/app/nfc/types/nfc.types'
import { useNFCAuthentication } from '@/app/nfc/hooks/useNFCAuthentication'
import { useNFCParameterParser } from '@/app/nfc/hooks/useNFCParameterParser'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface WoFAuthStageProps {
  verificationState: NFCVerificationState
  nfcParams?: NFCParameters
  format?: string
}

export function WoFAuthStage({ verificationState: parentVerificationState }: WoFAuthStageProps) {
  const { verificationState, nfcParams, format, executeAuthentication } = useNFCAuthentication()
  const { parsedParams } = useNFCParameterParser()
  const router = useRouter()

  // Automatically trigger authentication if params are present and status is initializing
  useEffect(() => {
    if (
      (nfcParams?.chipUID || parsedParams?.chipUID) &&
      (verificationState?.status === 'initializing' || !verificationState?.status)
    ) {
      executeAuthentication(nfcParams?.chipUID ? nfcParams : parsedParams)
    }
  }, [nfcParams, parsedParams, verificationState?.status, executeAuthentication])

  // If no chipUID, show demo/simulation prompt
  const noChipUID = !(nfcParams?.chipUID || parsedParams?.chipUID)
  if (noChipUID) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center pt-24 pb-8 px-4">
        <Card className="w-full max-w-md mx-auto bg-card border border-border shadow-md rounded-xl">
          <CardContent className="p-6 text-center space-y-6">
            <h2 className="text-xl font-light text-foreground">No NFC Chip Detected</h2>
            <p className="text-sm text-muted-foreground">
              For demo purposes, you can simulate an NFC tap to experience the flow.
            </p>
            <Button
              className="w-full mt-4"
              onClick={() => {
                const params = new URLSearchParams({
                  simulate: 'true',
                  chipUID: 'demo-chip-' + Date.now()
                })
                router.push(`?${params.toString()}`)
              }}
            >
              Start Demo Mode
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background flex items-start justify-center pt-24 pb-8 px-4">
      <Card className="w-full max-w-md mx-auto bg-card border border-border shadow-md rounded-xl">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-light text-foreground">
                Authenticate Your Presence
              </h2>
              <p className="text-sm text-muted-foreground">
                Connecting your digital identity
              </p>
            </div>
            <NFCAuthFlow
              verificationState={verificationState || parentVerificationState}
              nfcParams={nfcParams || parsedParams || {}}
              format={format || 'decentralized'}
            />
            {(verificationState?.status === 'error' || parentVerificationState?.status === 'error') && (
              <div className="text-center">
                <p className="text-sm text-red-600">
                  Authentication failed. Please try again.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 