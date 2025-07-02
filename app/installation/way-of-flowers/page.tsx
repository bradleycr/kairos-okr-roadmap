/**
 * Way of Flowers Installation
 * A contemplative journey connecting intention with conservation through digital presence
 * 
 * Features clean, modular architecture with:
 * - Persistent session management (like Cursive Connections)
 * - Web NFC API integration for confirmation taps
 * - Smart contract integration for conservation tracking
 * - Integrated wallet functionality for conservation donations
 * - Smooth transitions between contemplative stages
 */

'use client'

import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Leaf, Wallet, TouchpadIcon as Tap, Users } from 'lucide-react'

// WoF Hooks
import { useWoFFlow } from './hooks/useWoFFlow'
import { useWalletFlow } from './hooks/useWalletFlow'

// WoF Stage Components
import { WoFWelcomeStage } from './components/WoFWelcomeStage'
import { WoFAuthStage } from './components/WoFAuthStage'
import { WoFInteractionStage } from './components/WoFInteractionStage'
import { WoFChoiceStage } from './components/WoFChoiceStage'
import { WoFEvolutionStage } from './components/WoFEvolutionStage'
import { WoFCompleteStage } from './components/WoFCompleteStage'

function WayOfFlowersContent() {
  const router = useRouter()
  
  // Core WoF flow state and actions
  const wofFlow = useWoFFlow()
  
  // Wallet integration state and actions
  const walletFlow = useWalletFlow()

  // Stage transition handlers
  const handleSimulateFlow = () => {
    const params = new URLSearchParams({
      simulate: 'true',
      chipUID: 'demo-chip-' + Date.now()
    })
    router.push(`?${params.toString()}`)
  }

  const handleConnectWallet = async () => {
    try {
      await walletFlow.connectWallet('metamask')
      // Refresh session to update wallet status
      await wofFlow.checkPersistentSession()
    } catch (error) {
      console.error('Wallet connection failed:', error)
    }
  }

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  const handleGoToNFCAuth = () => {
    router.push('/nfc')
  }

  const handleMakeChoice = async (offering: any) => {
    await wofFlow.makeChoice(offering)
    
    // Optional: Make donation if wallet is connected
    if (walletFlow.walletConnected && walletFlow.walletSession) {
      try {
        await walletFlow.makeDonation({
          category: offering.category,
          impact: 'medium',
          recipient: offering.externalPartnerId || 'conservation-fund'
        })
      } catch (error) {
        console.error('WoF donation failed:', error)
        // Continue with flow even if donation fails
      }
    }
  }

  // Render current WoF stage
  const renderCurrentStage = () => {
    // If we have a persistent session, skip auth and go to interaction
    if (wofFlow.persistentSession && wofFlow.currentStage === 'welcome') {
      return renderInteractionStage()
    }

    switch (wofFlow.currentStage) {
      case 'welcome':
        return renderWelcomeStage()
      
      case 'auth':
        return <WoFAuthStage verificationState={{ status: 'initializing', progress: 0, currentPhase: 'Authenticating...', debugLogs: [] }} />
      
      case 'first-interaction':
        return renderInteractionStage()
      
      case 'choice':
        if (!wofFlow.selectedPath) return null
        return (
          <WoFChoiceStage
            selectedPath={wofFlow.selectedPath}
            availableOfferings={wofFlow.availableOfferings}
            isProcessing={wofFlow.isProcessing}
            walletConnected={walletFlow.walletConnected}
            onMakeChoice={handleMakeChoice}
            onConnectWallet={handleConnectWallet}
          />
        )
      
      case 'evolution':
        if (!wofFlow.selectedPath) return null
        return (
          <WoFEvolutionStage
            selectedPath={wofFlow.selectedPath}
            selectedOffering={wofFlow.selectedOffering}
          />
        )
      
      case 'complete':
        if (!wofFlow.selectedPath) return null
        return (
          <WoFCompleteStage
            selectedPath={wofFlow.selectedPath}
            selectedOffering={wofFlow.selectedOffering}
            onStartOver={wofFlow.startOver}
          />
        )
      
      default:
        return renderWelcomeStage()
    }
  }

  const renderWelcomeStage = () => (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
            <Leaf className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-medium text-gray-900">Way of Flowers</h1>
          <p className="text-gray-600">
            A contemplative journey connecting intention with conservation
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            {wofFlow.persistentSession ? (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Welcome back,</p>
                  <p className="font-medium text-emerald-700">
                    {wofFlow.persistentSession.currentUser?.displayName}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => wofFlow.checkPersistentSession()}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Leaf className="w-4 h-4 mr-2" />
                    Continue Journey
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleGoToProfile}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </div>

                {!wofFlow.userSession?.hasWallet && (
                  <Button
                    variant="outline"
                    onClick={handleConnectWallet}
                    className="w-full"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet for Donations
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  To begin your journey, please authenticate with your KairOS key
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleGoToNFCAuth}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Tap className="w-4 h-4 mr-2" />
                    Authenticate with NFC
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleSimulateFlow}
                    className="w-full"
                  >
                    Demo Experience
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderInteractionStage = () => (
    <WoFInteractionStage
      userPaths={wofFlow.userPaths}
      isNewUser={wofFlow.userSession?.isNewUser ?? true}
      isProcessing={wofFlow.isProcessing}
      onCreateNewPath={wofFlow.createNewPath}
      onSelectExistingPath={wofFlow.selectExistingPath}
    />
  )

  return (
    <>
      {/* Progress Indicator - only show during active WoF flow */}
      {wofFlow.currentStage !== 'welcome' && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-md mx-auto p-4">
            <Progress
              value={wofFlow.getStageProgress()}
              className="h-2"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Way of Flowers</span>
              <span>{Math.round(wofFlow.getStageProgress())}%</span>
            </div>
            
            {/* NFC Confirmation Indicator */}
            {wofFlow.isNFCListening && (
              <div className="mt-2 text-xs text-emerald-600 text-center animate-pulse">
                🔊 Listening for NFC confirmation tap...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main WoF Content */}
      <main className="relative">
        {renderCurrentStage()}
      </main>

      {/* Wallet Integration Dialog */}
      {walletFlow.showHybridAuth && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4">Connect Wallet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose how to connect your wallet for donations
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => walletFlow.handleHybridAuth({ type: 'nfc', chipUID: wofFlow.userSession?.chipUID || '' })}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
              >
                Use NFC Wallet
              </button>
              <button
                onClick={walletFlow.closeHybridAuth}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function WayOfFlowersInstallation() {
  return <WayOfFlowersContent />;
}
