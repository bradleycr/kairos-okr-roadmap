/**
 * WoF Authentication Stage
 * Handles NFC authentication for the WoF flow
 */

'use client'

import { NFCAuthFlow } from '@/app/nfc/components/NFCAuthFlow'
import { Card, CardContent } from '@/components/ui/card'

interface WoFAuthStageProps {
  verificationState: any
}

export function WoFAuthStage({ verificationState }: WoFAuthStageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/70 backdrop-blur-sm border-0 shadow-2xl">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-light text-gray-900">
                Authenticate Your Presence
              </h2>
              <p className="text-sm text-gray-600">
                Connecting your digital identity
              </p>
            </div>
            
            <NFCAuthFlow />
            
            {verificationState?.status === 'error' && (
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