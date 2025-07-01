"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Flower2, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Sprout, 
  RefreshCw,
  Waves,
  TreePine,
  Bug,
  Leaf,
  Wheat,
  Smartphone
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { NFCAuthFlow } from '@/app/nfc/components/NFCAuthFlow'
import { useNFCAuthentication } from '@/app/nfc/hooks/useNFCAuthentication'
import { useNFCParameterParser } from '@/app/nfc/hooks/useNFCParameterParser'
import { WayOfFlowersManager, type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'
import { HybridAuthDialog } from '@/components/ui/hybrid-auth-dialog'
import { walletIntegration, type WalletSession } from '@/lib/crypto/walletIntegration'
import { conservationContract, type ConservationChoice, CauseCategory, ImpactLevel } from '@/lib/crypto/conservationContract'

interface UserFlowerSession {
  chipUID: string
  isNewUser: boolean
  sessionStarted: string
  lastInteraction: string
  walletSession?: WalletSession | null
  ethAddress?: string
}

type FlowStage = 'welcome' | 'auth' | 'first-interaction' | 'choice' | 'evolution' | 'complete'

function WayOfFlowersContent() {
  const router = useRouter()
  
  // NFC Authentication
  const { verificationState } = useNFCAuthentication()
  const { parsedParams, format } = useNFCParameterParser()
  
  // Component state
  const [currentStage, setCurrentStage] = useState<FlowStage>('welcome')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSimulationMode, setIsSimulationMode] = useState(false)
  const [isTestMode, setIsTestMode] = useState(false)
  
  // User session and flower data
  const [userSession, setUserSession] = useState<UserFlowerSession | null>(null)
  const [userPaths, setUserPaths] = useState<FlowerPath[]>([])
  const [selectedPath, setSelectedPath] = useState<FlowerPath | null>(null)
  const [selectedOffering, setSelectedOffering] = useState<CauseOffering | null>(null)
  
  // Wallet integration state
  const [showHybridAuth, setShowHybridAuth] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [donationAmount, setDonationAmount] = useState<string>('0.01')
  
  // Initialize WayOfFlowersManager
  const [flowerManager] = useState(() => new WayOfFlowersManager())
  
  // Get available cause offerings
  const availableOfferings = flowerManager.getAllCauseOfferings()

  // Check for URL parameters on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const simulate = urlParams.get('simulate')
    const test = urlParams.get('test')
    
    if (simulate === 'true') {
      setIsSimulationMode(true)
      // Skip authentication in simulation mode
      const simulationSession = {
        chipUID: urlParams.get('chipUID') || 'simulation-chip-' + Date.now(),
        isNewUser: true,
        sessionStarted: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
      }
      setUserSession(simulationSession)
      setCurrentStage('first-interaction')
      return
    }
    
    if (test === 'true') {
      setIsTestMode(true)
    }
    
    // Handle normal NFC parameters
    if (parsedParams && Object.keys(parsedParams).length > 0 && currentStage === 'welcome') {
      setCurrentStage('auth')
    }
  }, [parsedParams, currentStage])

  // Auto-logout after completion
  useEffect(() => {
    if (currentStage === 'complete') {
      const timer = setTimeout(() => {
        localStorage.removeItem('wayOfFlowers_currentUser')
        setUserSession(null)
        setCurrentStage('welcome')
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [currentStage])

  // Load user data
  const loadUserData = async () => {
    try {
      if (!parsedParams?.chipUID) return

      const existingUser = localStorage.getItem('wayOfFlowers_currentUser')
      if (existingUser) {
        const userData = JSON.parse(existingUser)
        if (userData.chipUID === parsedParams.chipUID) {
          setUserSession(userData)
        }
      }

      const paths = flowerManager.getUserFlowerPaths(parsedParams.chipUID)
      setUserPaths(paths)
    } catch (error) {
      console.error('❌ Error loading user data:', error)
    }
  }

  // Handle authentication success
  const handleAuthenticationSuccess = async () => {
    try {
      if (!parsedParams?.chipUID) return

      const existingPaths = flowerManager.getUserFlowerPaths(parsedParams.chipUID)
      const isNewUser = existingPaths.length === 0

      const newUserSession = {
        chipUID: parsedParams.chipUID,
        isNewUser,
        sessionStarted: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
      }

      localStorage.setItem('wayOfFlowers_currentUser', JSON.stringify(newUserSession))
      setUserSession(newUserSession)
      setUserPaths(existingPaths)

      setCurrentStage('first-interaction')
    } catch (error) {
      console.error('❌ Error handling authentication success:', error)
    }
  }

  // Call authentication success when verification succeeds
  useEffect(() => {
    if (verificationState.status === 'success' && currentStage === 'auth' && parsedParams?.chipUID) {
      handleAuthenticationSuccess()
    }
  }, [verificationState.status, currentStage, parsedParams?.chipUID])

  // Load user data when parsedParams change
  useEffect(() => {
    if (parsedParams?.chipUID) {
      loadUserData()
    }
  }, [parsedParams?.chipUID])

  // Create new flower path
  const handleCreateNewPath = async () => {
    try {
      if (!userSession?.chipUID) return
      
      setIsProcessing(true)
      
      const newPath = await flowerManager.createNewFlowerPath(
        userSession.chipUID, 
        'Garden Path'
      )
      
      setSelectedPath(newPath)
      setUserPaths(prev => [...prev, newPath])
      setCurrentStage('choice')
    } catch (error) {
      console.error('❌ Error creating new path:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Select existing flower path
  const handleSelectExistingPath = async (path: FlowerPath) => {
    try {
      setSelectedPath(path)
      setCurrentStage('choice')
    } catch (error) {
      console.error('❌ Error selecting path:', error)
    }
  }

  // Handle hybrid authentication success
  const handleHybridAuthSuccess = async (authResult: WalletSession | { type: 'nfc', chipUID: string }) => {
    try {
      if ('type' in authResult && authResult.type === 'nfc') {
        // NFC authentication - continue with existing flow
        const existingUser = localStorage.getItem('wayOfFlowers_currentUser')
        if (existingUser) {
          const userData = JSON.parse(existingUser)
          if (userData.chipUID === authResult.chipUID) {
            setUserSession({
              ...userData,
              walletSession: null
            })
          }
        }
        
        const paths = flowerManager.getUserFlowerPaths(authResult.chipUID)
        setUserPaths(paths)
        setCurrentStage('first-interaction')
      } else {
        // Wallet authentication - create NFC-Ethereum bridge
        const session = authResult as WalletSession
        setWalletConnected(true)
        
        // Create bridged session
        const bridgedSession: UserFlowerSession = {
          chipUID: `wallet_${session.account.address}`,
          isNewUser: true,
          sessionStarted: new Date().toISOString(),
          lastInteraction: new Date().toISOString(),
          walletSession: session,
          ethAddress: session.account.address
        }
        
        setUserSession(bridgedSession)
        localStorage.setItem('wayOfFlowers_currentUser', JSON.stringify(bridgedSession))
        setCurrentStage('first-interaction')
      }
    } catch (error) {
      console.error('❌ Error handling hybrid auth success:', error)
    }
  }

  // Make environmental choice (enhanced with blockchain support)
  const handleMakeChoice = async (offering: CauseOffering) => {
    try {
      if (!selectedPath || !userSession?.chipUID) return
      
      setIsProcessing(true)
      setSelectedOffering(offering)
      
      // Determine donation amount based on impact level
      const impactLevel = Math.min(selectedPath.choices.length, 3) as ImpactLevel
      const suggestedAmount = conservationContract.getSuggestedDonationAmount(impactLevel)
      setDonationAmount(suggestedAmount)
      
      // Record choice locally first
      const result = await flowerManager.makeChoice(
        userSession.chipUID,
        selectedPath.id,
        offering.id
      )
      
      setSelectedPath(result.updatedPath)
      setUserPaths(prev => prev.map(p => p.id === result.updatedPath.id ? result.updatedPath : p))
      
      // If wallet is connected, also record on blockchain
      if (userSession.walletSession && walletConnected) {
        const causeMap = {
          'restoration': CauseCategory.Restoration,
          'conservation': CauseCategory.Conservation,  
          'regeneration': CauseCategory.Regeneration,
          'protection': CauseCategory.Protection
        }
        
        const conservationChoice: ConservationChoice = {
          chipUID: userSession.chipUID,
          causeCategory: causeMap[offering.category],
          impactLevel: impactLevel,
          offeringId: offering.id,
          donationAmount: donationAmount,
          timestamp: Date.now()
        }
        
        console.log('💚 Recording conservation choice on blockchain:', conservationChoice)
        
        // Attempt blockchain transaction (non-blocking)
        conservationContract.recordConservationChoice(conservationChoice)
          .then(txHash => {
            if (txHash) {
              console.log('✅ Blockchain transaction successful:', txHash)
            }
          })
          .catch(error => {
            console.error('❌ Blockchain transaction failed:', error)
            // Continue with local flow even if blockchain fails
          })
      }
      
      setCurrentStage('evolution')
      
      setTimeout(() => {
        setCurrentStage('complete')
      }, 2500)
        
    } catch (error) {
      console.error('❌ Error making choice:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Start over
  const handleStartOver = () => {
    setSelectedPath(null)
    setSelectedOffering(null)
    setCurrentStage('first-interaction')
  }

  // Get progress percentage
  const getStageProgress = (): number => {
    const stageMap = {
      'welcome': 0,
      'auth': 20,
      'first-interaction': 40,
      'choice': 60,
      'evolution': 80,
      'complete': 100
    }
    return stageMap[currentStage] || 0
  }

  // Get icon for cause offering
  const getCauseIcon = (offering: CauseOffering) => {
    const iconMap = {
      'Mangrove Restoration': <Waves className="w-8 h-8" />,
      'Regenerative Cover Cropping': <Wheat className="w-8 h-8" />,
      'Pollinator Gardens': <Bug className="w-8 h-8" />,
      'Forest Protection': <TreePine className="w-8 h-8" />
    }
    return iconMap[offering.name as keyof typeof iconMap] || <Leaf className="w-8 h-8" />
  }

  // Welcome Stage - Minimal and Visual
  const WelcomeStage = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <Flower2 className="w-12 h-12 text-green-600" />
      </div>
      
      <h1 className="text-3xl font-light text-neutral-900 mb-8">Way of Flowers</h1>
      
      <p className="text-neutral-500 text-lg font-light mb-8">
        Environmental stewardship through choice
      </p>

      <Button
        onClick={() => setShowHybridAuth(true)}
        className="bg-green-600 hover:bg-green-700 rounded-full px-8 py-6 text-lg font-light mb-6"
      >
        Begin Journey
      </Button>
      
      <p className="text-xs text-neutral-400 mb-4">
        Choose your authentication method to start
      </p>

      {/* Development/Testing Controls */}
      <div className="mt-8 space-y-2">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            // Generate realistic test parameters
            const testChipUID = `04:${Array.from({length: 6}, () => 
              Math.floor(Math.random() * 256).toString(16).padStart(2, '0').toUpperCase()
            ).join(':')}`
            
            const testUrl = `?chipUID=${encodeURIComponent(testChipUID)}&pin=1234&test=true&timestamp=${Date.now()}`
            window.history.pushState({}, '', testUrl)
            window.location.reload()
          }}
          className="text-xs text-neutral-400 hover:text-green-600"
        >
          🧪 Test with NFC Auth
        </Button>
        
        <br />
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            const simulationUrl = `?simulate=true&chipUID=demo-chip-${Date.now()}`
            window.history.pushState({}, '', simulationUrl)
            window.location.reload()
          }}
          className="text-xs text-neutral-400 hover:text-blue-600"
        >
          🎭 Demo Mode (Skip Auth)
        </Button>
      </div>

      {/* Status indicators for testing */}
      {(isTestMode || isSimulationMode) && (
        <div className="mt-6 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
          <span className="text-xs text-yellow-700 dark:text-yellow-300">
            {isSimulationMode ? "🎭 Demo Mode" : isTestMode ? "🧪 Test Mode" : ""}
          </span>
        </div>
      )}
    </div>
  )

  // Auth Stage - Minimal
  const AuthStage = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6">
      <div className="w-20 h-20 border-2 border-green-300 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <Sparkles className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-light text-neutral-900 mb-8">Connecting</h2>
      
      {parsedParams && (
        <div className="w-full max-w-sm">
          <NFCAuthFlow 
            verificationState={verificationState}
            nfcParams={parsedParams}
            format={format}
          />
        </div>
      )}
    </div>
  )

  // First Interaction - Minimal
  const FirstInteractionStage = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
        <Sprout className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-light text-neutral-900 mb-8">
        {userSession?.isNewUser ? "Plant your seed" : "Welcome back"}
      </h2>
      
      {userSession?.isNewUser ? (
        <Button 
          onClick={handleCreateNewPath}
          disabled={isProcessing}
          className="bg-green-600 hover:bg-green-700 rounded-full px-8 py-6 text-lg font-light"
        >
          {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Begin"}
        </Button>
      ) : (
        <div className="space-y-4 w-full max-w-xs">
          {userPaths.slice(0, 2).map((path) => (
            <Button
              key={path.id}
              variant="outline"
              onClick={() => handleSelectExistingPath(path)}
              className="w-full py-4 rounded-xl border-green-200 hover:bg-green-50"
            >
              <div 
                className="w-6 h-6 rounded-full mr-3"
                style={{ backgroundColor: path.characteristics.primaryColor }}
              />
              <span className="font-light truncate">{path.name}</span>
            </Button>
          ))}
          
          <Button 
            variant="ghost"
            onClick={handleCreateNewPath}
            disabled={isProcessing}
            className="w-full py-4 text-green-600 font-light"
          >
            Start new path
          </Button>
        </div>
      )}
    </div>
  )

  // Choice Stage - Visual Grid
  const ChoiceStage = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6">
      <h2 className="text-xl font-light text-neutral-900 mb-8 text-center">Choose your path</h2>
      
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {availableOfferings.map((offering) => (
          <Card 
            key={offering.id}
            className="cursor-pointer transition-all hover:scale-105 border-0 shadow-lg"
            onClick={() => handleMakeChoice(offering)}
            style={{ backgroundColor: `${offering.primaryColor}10` }}
          >
            <CardContent className="p-6 text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: offering.primaryColor }}
              >
                <div className="text-white">
                  {getCauseIcon(offering)}
                </div>
              </div>
              <h3 className="font-light text-sm text-neutral-800 leading-tight">
                {offering.name}
              </h3>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  // Evolution Stage - Animated
  const EvolutionStage = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
      <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <Sparkles className="w-12 h-12 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-light text-neutral-900 mb-6">Blooming</h2>
      
      {selectedPath && selectedOffering && (
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: selectedPath.characteristics.primaryColor }}
          >
            <Flower2 className="w-6 h-6 text-white" />
          </div>
          <ArrowRight className="w-6 h-6 text-neutral-400" />
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: selectedOffering.primaryColor }}
          >
            <Flower2 className="w-6 h-6 text-white" />
          </div>
        </div>
      )}
      
      <p className="text-neutral-500 font-light">{selectedOffering?.name}</p>
    </div>
  )

  // Complete Stage - Simple
  const CompleteStage = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center">
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-light text-neutral-900 mb-4">Complete</h2>
      <p className="text-neutral-500 font-light mb-8">Impact recorded</p>
      
      <Button 
        onClick={handleStartOver}
        variant="ghost"
        className="text-green-600 font-light"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Start again
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Ultra-minimal header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
            <Flower2 className="w-4 h-4 text-green-600" />
          </div>
          {/* Mode indicator */}
          {isSimulationMode && (
            <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <span className="text-xs text-blue-700 dark:text-blue-300">Demo</span>
            </div>
          )}
          {isTestMode && !isSimulationMode && (
            <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
              <span className="text-xs text-yellow-700 dark:text-yellow-300">Test</span>
            </div>
          )}
        </div>
        <Progress value={getStageProgress()} className="w-16 h-1" />
      </div>

      {/* Stage content */}
      <div className="pt-8">
        {currentStage === 'welcome' && <WelcomeStage />}
        {currentStage === 'auth' && <AuthStage />}
        {currentStage === 'first-interaction' && <FirstInteractionStage />}
        {currentStage === 'choice' && <ChoiceStage />}
        {currentStage === 'evolution' && <EvolutionStage />}
        {currentStage === 'complete' && <CompleteStage />}
      </div>

      {/* Hybrid Authentication Dialog */}
      <HybridAuthDialog
        isOpen={showHybridAuth}
        onOpenChange={setShowHybridAuth}
        onSuccess={handleHybridAuthSuccess}
        title="Join Way of Flowers"
        description="Choose your path to environmental stewardship"
        requireDonation={true}
        allowNFCOnly={true}
      />
    </div>
  )
}

export default function WayOfFlowersInstallation() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Flower2 className="w-12 h-12 mx-auto text-green-600 animate-pulse" />
          <p className="text-green-600 font-light">Loading...</p>
        </div>
      </div>
    }>
      <WayOfFlowersContent />
    </Suspense>
  )
}
