/**
 * Way of Flowers Installation
 * A contemplative journey connecting intention with conservation through digital presence
 * 
 * Features clean, modular architecture with:
 * - Separated WoF stage components for clear visual hierarchy
 * - Custom hooks for state management and side effects
 * - Integrated wallet functionality for conservation donations
 * - Smooth transitions between contemplative stages
 */

'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { HybridAuthDialog } from '@/components/ui/hybrid-auth-dialog'

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

  const handleConnectWallet = () => {
    walletFlow.connectWallet('metamask')
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
    switch (wofFlow.currentStage) {
      case 'welcome':
        return <WoFWelcomeStage onSimulateFlow={handleSimulateFlow} />
      
      case 'auth':
        return <WoFAuthStage verificationState={wofFlow.verificationState} />
      
      case 'first-interaction':
        return (
          <WoFInteractionStage
            userPaths={wofFlow.userPaths}
            isNewUser={wofFlow.userSession?.isNewUser ?? true}
            isProcessing={wofFlow.isProcessing}
            onCreateNewPath={wofFlow.createNewPath}
            onSelectExistingPath={wofFlow.selectExistingPath}
          />
        )
      
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
        return <WoFWelcomeStage onSimulateFlow={handleSimulateFlow} />
    }
  }

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

// Main exported WoF component with error boundary
export default function WayOfFlowersInstallation() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
          <div className="animate-pulse text-emerald-600">
            Loading WoF contemplative space...
          </div>
        </div>
      }
    >
      <WayOfFlowersContent />
    </Suspense>
  )
}
