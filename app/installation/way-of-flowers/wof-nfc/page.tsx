/**
 * Way of Flowers NFC Handler
 * Handles NFC taps that should redirect to the WoF installation
 * Integrates with the standard NFC authentication flow
 */

'use client'

import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useNFCParameterParser } from '../../nfc/hooks/useNFCParameterParser'
import { useNFCAuthentication } from '../../nfc/hooks/useNFCAuthentication'
import { NFCAuthFlow } from '../../nfc/components/NFCAuthFlow'
import PINEntry from '@/components/ui/pin-entry'
import { NfcIcon, Flower } from 'lucide-react'

function WoFNFCContent() {
  const router = useRouter()
  
  // Use the same NFC parameter parsing logic
  const { 
    parsedParams, 
    format, 
    hasValidParameters,
    accountInitialized,
    requiresPIN,
    pinGateInfo,
    pinVerificationComplete,
    handlePINSuccess
  } = useNFCParameterParser()

  // Handle authentication flow
  const { 
    verificationState, 
    executeAuthentication 
  } = useNFCAuthentication()

  // Auto-start authentication when valid parameters are detected and no PIN required
  useEffect(() => {
    if (hasValidParameters() && !requiresPIN && accountInitialized && verificationState.status === 'initializing') {
      console.log('🌸 Auto-starting WoF authentication')
      executeAuthentication(parsedParams)
    }
  }, [hasValidParameters, requiresPIN, accountInitialized, parsedParams, verificationState.status, executeAuthentication])

  // Redirect to WoF installation after successful authentication
  useEffect(() => {
    if (verificationState.status === 'success' && parsedParams.chipUID) {
      console.log('🌸 WoF authentication successful, redirecting to installation')
      
      // Redirect to WoF installation with authentication parameters
      const wofUrl = new URL('/installation/way-of-flowers', window.location.origin)
      wofUrl.searchParams.set('authenticated', 'true')
      wofUrl.searchParams.set('source', 'nfc-tap')
      wofUrl.searchParams.set('chipUID', parsedParams.chipUID)
      wofUrl.searchParams.set('timestamp', Date.now().toString())
      
      router.push(wofUrl.toString())
    }
  }, [verificationState.status, parsedParams.chipUID, router])

  // Custom PIN success handler that maintains WoF context
  const handleWoFPINSuccess = (chipUID: string) => {
    console.log('🌸 WoF PIN verification successful')
    handlePINSuccess(chipUID)
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative overflow-hidden touch-none" style={{ position: 'fixed', top: 0, left: 0 }}>
      
      {/* Way of Flowers Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 via-blue-100/30 to-purple-100/30 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.08)_0%,transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_70%,rgba(59,130,246,0.08)_0%,transparent_50%)]"></div>
      </div>
      
      <div className="h-full w-full flex flex-col px-4 relative z-10" style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' 
      }}>
        
        {/* Header */}
        <div className="text-center pt-16 sm:pt-20 md:pt-24 pb-6 sm:pb-8 flex-shrink-0">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="relative p-3 rounded-full bg-green-100 border border-green-200">
              <Flower className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 relative z-10 animate-pulse" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-light tracking-wider text-gray-800">
              Way of Flowers
            </h1>
            <p className="text-sm text-gray-600">
              A contemplative journey connecting intention with conservation
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center min-h-0 pb-8">
          {hasValidParameters() ? (
            <>
              {requiresPIN ? (
                /* PIN REQUIRED: Show PIN entry form with WoF styling */
                <div className="w-full max-w-md">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Flower className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      Connect to Your Garden
                    </h2>
                    <p className="text-sm text-gray-600">
                      Enter your PIN to access the Way of Flowers
                    </p>
                  </div>
                  
                  <PINEntry
                    chipUID={parsedParams.chipUID!}
                    isNewDevice={pinGateInfo?.isNewDevice}
                    displayName={pinGateInfo?.displayName}
                    onSuccess={handleWoFPINSuccess}
                  />
                </div>
              ) : accountInitialized && pinVerificationComplete ? (
                /* AUTHENTICATED: Show auth flow with WoF branding */
                <div className="w-full max-w-md">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Flower className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      Connecting to Your Garden
                    </h2>
                    <p className="text-sm text-gray-600">
                      Preparing your conservation journey...
                    </p>
                  </div>
                  
                  <NFCAuthFlow 
                    verificationState={verificationState}
                    nfcParams={parsedParams}
                    format={format}
                  />
                </div>
              ) : (
                /* LOADING: Show processing state */
                <div className="text-center space-y-4">
                  <div className="relative p-3 rounded-full bg-green-100 border border-green-200 mx-auto">
                    <Flower className="h-8 w-8 text-green-600 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-2">
                      Awakening Your Garden
                    </h2>
                    <p className="text-sm text-gray-600">
                      {parsedParams.chipUID ? 
                        `Connecting to seed ${parsedParams.chipUID.slice(-4)}...` : 
                        'Preparing your conservation space...'
                      }
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* NO PARAMETERS: Show error state */
            <div className="text-center space-y-4">
              <div className="relative p-3 rounded-full bg-red-100 border border-red-200 mx-auto">
                <NfcIcon className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-2">
                  No Seed Detected
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  This URL requires a valid KairOS seed to access the Way of Flowers.
                </p>
                <button
                  onClick={() => router.push('/installation/way-of-flowers')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Visit Way of Flowers
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function WoFNFCHandler() {
  return (
    <Suspense fallback={null}>
      <WoFNFCContent />
    </Suspense>
  )
} 