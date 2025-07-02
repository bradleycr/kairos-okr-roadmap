/**
 * Way of Flowers Installation
 * A contemplative journey connecting intention with conservation through digital presence
 * 
 * Redesigned to match beautiful minimal screenshots:
 * - Clean, minimal mobile-first design
 * - NFC-first authentication flow
 * - Integrated wallet functionality
 * - Smooth stage transitions
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle, Home } from 'lucide-react'

// WoF Hooks
import { useWoFFlow } from './hooks/useWoFFlow'
import { useWalletFlow } from './hooks/useWalletFlow'

// New WoF Stage Components (matching screenshots)
import { WoFTapToStartStage } from './components/WoFTapToStartStage'
import { WoFConnectSeedStage } from './components/WoFConnectSeedStage'
import { WoFBloomingInitiationStage } from './components/WoFBloomingInitiationStage'
import { WoFEcosystemChoicesStage } from './components/WoFEcosystemChoicesStage'
import { WoFWalletIntegrationStage } from './components/WoFWalletIntegrationStage'

// Legacy components for fallback
import { WoFCompleteStage } from './components/WoFCompleteStage'

function WayOfFlowersContent() {
  const router = useRouter()
  
  // Core WoF flow state and actions
  const wofFlow = useWoFFlow()
  
  // Wallet integration state and actions
  const walletFlow = useWalletFlow()

  // Check for NFC authentication parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authenticated = urlParams.get('authenticated')
    const source = urlParams.get('source')
    const chipUID = urlParams.get('chipUID')
    
    if (authenticated === 'true' && source === 'nfc-tap' && chipUID) {
      console.log('🌸 WoF: Received NFC authentication, proceeding to connect-seed stage')
      
      // Simulate the NFC connection since we're already authenticated
      wofFlow.handleNFCTap()
      
      // Clean up URL parameters
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('authenticated')
      cleanUrl.searchParams.delete('source')
      cleanUrl.searchParams.delete('chipUID')
      cleanUrl.searchParams.delete('timestamp')
      
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [wofFlow])

  // Navigation helpers
  const handleGoHome = () => {
    router.push('/')
  }

  const handleGoToProfile = () => {
    router.push('/profile')
  }

  // Render current WoF stage based on new flow
  const renderCurrentStage = () => {
    switch (wofFlow.currentStage) {
      case 'tap-to-start':
        return (
          <WoFTapToStartStage
            onTapDetected={wofFlow.handleNFCTap}
            isListening={wofFlow.isNFCListening}
          />
        )
      
      case 'connect-seed':
        return (
          <WoFConnectSeedStage
            onConnected={() => wofFlow.handleEcosystemChoice('connected')}
            isConnecting={wofFlow.isConnecting}
          />
        )
      
      case 'blooming-initiation':
        return (
          <WoFBloomingInitiationStage
            onEcosystemChoice={wofFlow.handleEcosystemChoice}
            userDisplayName={wofFlow.userSession?.displayName || 'NewAccount'}
            supportedEcosystems={['Barbados', 'France', 'India', 'Sierra Leone', 'Costa Rica']}
          />
        )
      
      case 'ecosystem-choices':
        return (
          <WoFEcosystemChoicesStage
            onEcosystemSelect={wofFlow.handleEcosystemSelect}
            isLoading={wofFlow.isProcessing}
          />
        )
      
      case 'wallet-integration':
        return (
          <WoFWalletIntegrationStage
            onComplete={wofFlow.handleComplete}
            userAddress={wofFlow.walletAddress}
            interactionCount={wofFlow.userSession?.interactionCount || 17}
            hasWallet={wofFlow.hasWallet}
            onConnectWallet={wofFlow.handleConnectWallet}
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
        return renderErrorState()
    }
  }

  // Error state fallback
  const renderErrorState = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <h2 className="text-lg font-medium text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-600 mt-2">
              {wofFlow.connectionError || 'An unexpected error occurred'}
            </p>
          </div>
          <div className="space-y-2">
            <Button 
              onClick={wofFlow.startOver}
              className="w-full"
            >
              Start Over
            </Button>
            <Button 
              variant="outline"
              onClick={handleGoHome}
              className="w-full"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Development debug panel (only in dev mode)
  const renderDebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null
    
    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-3 rounded-lg text-xs font-mono max-w-xs">
        <div className="space-y-1">
          <div>Stage: {wofFlow.currentStage}</div>
          <div>Processing: {wofFlow.isProcessing ? 'Yes' : 'No'}</div>
          <div>User: {wofFlow.userSession?.displayName || 'None'}</div>
          <div>Wallet: {wofFlow.hasWallet ? 'Connected' : 'Not connected'}</div>
          <div>Ecosystem: {wofFlow.selectedEcosystem || 'None'}</div>
        </div>
        <div className="mt-2 pt-2 border-t border-white/20">
          <Button 
            size="sm" 
            variant="outline"
            onClick={wofFlow.startOver}
            className="text-xs h-6"
          >
            Reset
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {renderCurrentStage()}
      {renderDebugPanel()}
    </div>
  )
}

export default function WayOfFlowersInstallation() {
  return (
    <div className="min-h-screen">
      <WayOfFlowersContent />
    </div>
  )
}
