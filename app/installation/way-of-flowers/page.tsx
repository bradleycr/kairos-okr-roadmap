/**
 * Way of Flowers Installation
 * Interactive decision tree for environmental cause support
 * Matches the phone flow: First Interaction → Choice → Evolution
 */

"use client"

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Flower2, 
  TreePine, 
  Sparkles, 
  ArrowRight,
  Leaf,
  Waves,
  Bug,
  Shield,
  Sprout,
  Check,
  RefreshCw,
  Globe,
  Info,
  Wheat
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { NFCAuthFlow } from '@/app/nfc/components/NFCAuthFlow'
import { useNFCAuthentication } from '@/app/nfc/hooks/useNFCAuthentication'
import { useNFCParameterParser } from '@/app/nfc/hooks/useNFCParameterParser'
import { WayOfFlowersManager, type FlowerPath, type CauseOffering } from '@/lib/installation/wayOfFlowers'

// Session type for the component
interface UserFlowerSession {
  chipUID: string
  isNewUser: boolean
  sessionStarted: string
  lastInteraction: string
}

type FlowStage = 'welcome' | 'auth' | 'first-interaction' | 'choice' | 'evolution' | 'complete'

function WayOfFlowersContent() {
  const router = useRouter()
  
  // NFC Authentication
  const { verificationState, executeAuthentication, resetAuthentication } = useNFCAuthentication()
  const { parsedParams, format } = useNFCParameterParser()
  
  // Way of Flowers State
  const [currentStage, setCurrentStage] = useState<FlowStage>('welcome')
  const [userSession, setUserSession] = useState<UserFlowerSession | null>(null)
  const [userPaths, setUserPaths] = useState<FlowerPath[]>([])
  const [selectedPath, setSelectedPath] = useState<FlowerPath | null>(null)
  const [selectedOffering, setSelectedOffering] = useState<CauseOffering | null>(null)
  const [evolutionMessage, setEvolutionMessage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  
  // Initialize WayOfFlowersManager
  const [flowerManager] = useState(() => new WayOfFlowersManager())
  
  // Get available cause offerings from the manager
  const availableOfferings = flowerManager.getAllCauseOfferings()

  // Set current URL for display
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.host)
    }
  }, [])

  // Check for NFC parameters on load
  useEffect(() => {
    if (parsedParams && Object.keys(parsedParams).length > 0 && currentStage === 'welcome') {
      setCurrentStage('auth')
    }
  }, [parsedParams, currentStage])

  // Auto-logout after completion
  useEffect(() => {
    if (currentStage === 'complete') {
      const timer = setTimeout(() => {
        console.log('🚪 Auto-logout after journey completion')
        localStorage.removeItem('wayOfFlowers_currentUser')
        setUserSession(null)
        setCurrentStage('welcome')
      }, 10000) // 10 seconds
      return () => clearTimeout(timer)
    }
  }, [currentStage])

  // Load user data and check for existing session
  const loadUserData = async () => {
    try {
      if (!parsedParams?.chipUID) return

      // Load existing user session
      const existingUser = localStorage.getItem('wayOfFlowers_currentUser')
      if (existingUser) {
        const userData = JSON.parse(existingUser)
        if (userData.chipUID === parsedParams.chipUID) {
          setUserSession(userData)
          console.log('🌸 Loaded existing user session:', userData.chipUID?.slice(-4))
        }
      }

      // Load user paths
      const paths = flowerManager.getUserFlowerPaths(parsedParams.chipUID)
      setUserPaths(paths)
      console.log('📊 Loaded user paths:', paths.length)
    } catch (error) {
      console.error('❌ Error loading user data:', error)
    }
  }

  // Handle authentication success and user data loading
  const handleAuthenticationSuccess = async () => {
    try {
      if (!parsedParams?.chipUID) return

      console.log('🌸 Authentication successful, loading user data...')
      
      // Check if this is a new user
      const existingPaths = flowerManager.getUserFlowerPaths(parsedParams.chipUID)
      const isNewUser = existingPaths.length === 0

      // Create user session
      const newUserSession = {
        chipUID: parsedParams.chipUID,
        isNewUser,
        sessionStarted: new Date().toISOString(),
        lastInteraction: new Date().toISOString()
      }

      localStorage.setItem('wayOfFlowers_currentUser', JSON.stringify(newUserSession))
      setUserSession(newUserSession)
      setUserPaths(existingPaths)

      console.log('🌱 User session created:', { 
        chipUID: parsedParams.chipUID?.slice(-4), 
        isNewUser, 
        existingPaths: existingPaths.length 
      })

      // Move to first interaction stage
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

  // Load user data when component mounts and when parsedParams change
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
      console.log('🌱 Creating new flower path...')
      
      // Create new path using WayOfFlowersManager
      const newPath = await flowerManager.createNewFlowerPath(
        userSession.chipUID, 
        'New Garden Path'
      )
      
      setSelectedPath(newPath)
      setUserPaths(prev => [...prev, newPath])
      setCurrentStage('choice')
      console.log('✅ New flower path created:', newPath.id)
    } catch (error) {
      console.error('❌ Error creating new path:', error)
      alert('Failed to create new flower path. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Select existing flower path
  const handleSelectExistingPath = async (path: FlowerPath) => {
    try {
      console.log('🌸 Selecting existing path:', path.name)
      setSelectedPath(path)
      setCurrentStage('choice')
    } catch (error) {
      console.error('❌ Error selecting path:', error)
      alert('Failed to select flower path. Please try again.')
    }
  }

  // Make environmental choice
  const handleMakeChoice = async (offering: CauseOffering) => {
    try {
      if (!selectedPath || !userSession?.chipUID) return
      
      setIsProcessing(true)
      setSelectedOffering(offering)
      console.log('🌍 Making environmental choice:', offering.name)
      
             // Record choice using WayOfFlowersManager
       const result = await flowerManager.makeChoice(
         userSession.chipUID,
         selectedPath.id,
         offering.id
       )
       
       // Update local state with the evolved path
       setSelectedPath(result.updatedPath)
       setUserPaths(prev => prev.map(p => p.id === result.updatedPath.id ? result.updatedPath : p))
       
       // Set evolution message from result
       setEvolutionMessage(result.evolutionMessage)
       
       setCurrentStage('evolution')
       console.log('✅ Choice recorded successfully')
       
       // Auto-advance to complete after 3 seconds
       setTimeout(() => {
         setCurrentStage('complete')
       }, 3000)
    } catch (error) {
      console.error('❌ Error making choice:', error)
      alert('Failed to record your choice. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Start over / reset
  const handleStartOver = () => {
    try {
      console.log('🔄 Starting new journey...')
      setSelectedPath(null)
      setSelectedOffering(null)
      setEvolutionMessage('')
      setCurrentStage('first-interaction')
    } catch (error) {
      console.error('❌ Error starting over:', error)
    }
  }

  // Get progress percentage based on current stage
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
      'Mangrove Restoration': <Waves className="w-5 h-5 sm:w-6 sm:h-6" />,
      'Regenerative Cover Cropping': <Wheat className="w-5 h-5 sm:w-6 sm:h-6" />,
      'Pollinator Gardens': <Bug className="w-5 h-5 sm:w-6 sm:h-6" />,
      'Forest Protection': <TreePine className="w-5 h-5 sm:w-6 sm:h-6" />
    }
    return iconMap[offering.name as keyof typeof iconMap] || <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
  }

  // Render different stages
  const WelcomeStage = () => (
    <div className="text-center space-y-6 sm:space-y-8 py-8 sm:py-12 px-4">
      <div className="space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Flower2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 leading-tight">Way of Flowers</h1>
        <p className="text-base sm:text-lg md:text-xl text-neutral-600 max-w-xl mx-auto leading-relaxed px-2">
          Begin your journey of environmental stewardship. Each choice nurtures your digital flower and supports real-world conservation.
        </p>
        
        {/* Subdomain Status */}
        {currentUrl && (
          <Alert className="max-w-sm sm:max-w-lg mx-auto border-blue-200 bg-blue-50">
            <Globe className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <AlertDescription className="text-blue-800 text-sm">
              <strong>Installation URL:</strong> 
              <br className="sm:hidden" />
              <code className="text-xs sm:text-sm font-mono break-all">{currentUrl}</code>
              <br />
              <span className="text-xs">Running on dedicated subdomain</span>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Alert className="max-w-sm sm:max-w-lg mx-auto border-green-200 bg-green-50">
        <Leaf className="h-4 w-4 text-green-600 flex-shrink-0" />
        <AlertDescription className="text-green-800 text-sm sm:text-base">
          <strong>Tap your NFC pendant</strong> to begin your flower path journey
        </AlertDescription>
      </Alert>
      
      {/* Test NFC Parameters */}
      <div className="text-center space-y-2">
        <p className="text-xs text-neutral-500">For testing, you can simulate an NFC tap:</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Simulate NFC parameters for testing
            window.history.pushState({}, '', '?chipUID=test_chip_123&ndefData=test_data&timestamp=' + Date.now())
            window.location.reload()
          }}
          className="text-xs px-3 py-2"
        >
          <Info className="w-3 h-3 mr-1" />
          Simulate NFC Tap
        </Button>
      </div>
    </div>
  )

  const AuthStage = () => (
    <div className="space-y-4 sm:space-y-6 px-4">
      <div className="text-center space-y-2 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Connecting to Your Garden</h2>
        <p className="text-sm sm:text-base text-neutral-600">Authenticating your unique flower identity...</p>
      </div>
      
      {parsedParams && (
        <NFCAuthFlow 
          verificationState={verificationState}
          nfcParams={parsedParams}
          format={format}
        />
      )}
    </div>
  )

  const FirstInteractionStage = () => (
    <div className="space-y-6 sm:space-y-8 px-4">
      <div className="text-center space-y-3 sm:space-y-4">
        <Flower2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-green-600" />
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">
          {userSession?.isNewUser ? "Seeding Begins" : "Welcome Back"}
        </h2>
        <p className="text-sm sm:text-base text-neutral-600 px-2">
          {userSession?.isNewUser 
            ? "Plant your first seed in the digital garden of conservation"
            : "Continue nurturing your environmental impact"
          }
        </p>
      </div>

      {userSession?.isNewUser ? (
        <Card className="max-w-sm mx-auto">
          <CardContent className="p-4 sm:p-6 text-center space-y-4">
            <Sprout className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-green-500" />
            <h3 className="font-bold text-base sm:text-lg">Start Your First Flower Path</h3>
            <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
              Every conservation choice helps your digital flower evolve and supports real environmental causes.
            </p>
            <Button 
              onClick={handleCreateNewPath}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700 text-sm sm:text-base py-2 sm:py-3"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
              Plant Your Seed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-center">Your Flower Paths</h3>
            <div className="grid gap-3 max-w-xl mx-auto">
              {userPaths.map((path) => (
                <Card key={path.id} className="hover:shadow-md transition-all cursor-pointer group touch-manipulation">
                  <CardContent 
                    className="p-3 sm:p-4 flex items-center justify-between min-h-[60px]"
                    onClick={() => handleSelectExistingPath(path)}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div 
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: path.characteristics.primaryColor }}
                      >
                        <Flower2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">{path.name}</p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {path.currentStage} • {path.choices.length} choices
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary flex-shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center">
            <Button 
              variant="outline"
              onClick={handleCreateNewPath}
              disabled={isProcessing}
              className="border-green-300 text-green-700 hover:bg-green-50 text-sm px-4 py-2"
            >
              <Sprout className="w-4 h-4 mr-2" />
              Start New Flower Path
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const ChoiceStage = () => (
    <div className="space-y-6 sm:space-y-8 px-4">
      <div className="text-center space-y-3 sm:space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Choose Your Offering</h2>
        <p className="text-sm sm:text-base text-neutral-600 px-2">
          Select an environmental cause to support. Your choice will shape how your flower evolves.
        </p>
        
        {selectedPath && (
          <Badge className="bg-green-100 text-green-800 text-xs sm:text-sm px-2 py-1">
            {selectedPath.name} • Stage: {selectedPath.currentStage}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-lg mx-auto">
        {availableOfferings.map((offering) => (
          <Card 
            key={offering.id}
            className="hover:shadow-md transition-all cursor-pointer group border-2 hover:border-green-300 touch-manipulation"
            onClick={() => handleMakeChoice(offering)}
          >
            <CardContent className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: offering.primaryColor }}
                >
                  {getCauseIcon(offering)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-base sm:text-lg leading-tight">{offering.name}</h3>
                  <Badge variant="outline" className="text-xs capitalize mt-1">
                    {offering.category}
                  </Badge>
                </div>
              </div>
              
              <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">{offering.description}</p>
              <p className="text-xs text-neutral-500 italic leading-relaxed">{offering.impactDescription}</p>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-neutral-400">
                  +{offering.evolutionEffect.bloomBoost} bloom points
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-green-600 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const EvolutionStage = () => (
    <div className="text-center space-y-6 sm:space-y-8 py-8 sm:py-12 px-4">
      <div className="space-y-3 sm:space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">Your Flower Evolves</h2>
        <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-lg mx-auto leading-relaxed px-2">
          {evolutionMessage}
        </p>
      </div>

      {selectedPath && selectedOffering && (
        <Card className="max-w-sm sm:max-w-lg mx-auto">
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-center gap-3 sm:gap-4">
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedPath.characteristics.primaryColor }}
              >
                <Flower2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400" />
              <div 
                className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedOffering.primaryColor }}
              >
                <Flower2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            
            <div className="text-center space-y-1">
              <p className="font-medium text-sm sm:text-base">Supporting: {selectedOffering.name}</p>
              <p className="text-xs sm:text-sm text-neutral-600 capitalize">
                Stage: {selectedPath.currentStage} • {selectedPath.choices.length} choices made
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const CompleteStage = () => (
    <div className="text-center space-y-6 sm:space-y-8 py-8 sm:py-12 px-4">
      <div className="space-y-3 sm:space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900">Choice Recorded</h2>
        <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-lg mx-auto leading-relaxed px-2">
          Your environmental impact is growing. Thank you for nurturing our shared future.
        </p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <Button 
          onClick={handleStartOver}
          className="bg-green-600 hover:bg-green-700 text-sm sm:text-base px-6 py-3 touch-manipulation"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Start Another Journey
        </Button>
        
        <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
          Your choice has been logged. Future API integration will trigger real-world impact.
        </p>
      </div>
    </div>
  )

  // Main layout with mobile-first responsive design
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 overflow-x-hidden">
      {/* Mobile-First Header */}
      <div className="border-b bg-white/90 backdrop-blur-sm sticky top-0 z-40 safe-area-top">
        <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <Flower2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
            <div className="min-w-0">
              <h1 className="font-bold text-sm sm:text-lg truncate">Way of Flowers</h1>
              <p className="text-xs text-neutral-500 hidden sm:block">Environmental Impact Journey</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <Progress value={getStageProgress()} className="w-16 sm:w-24 h-1.5 sm:h-2" />
            <span className="text-xs text-neutral-500 min-w-[30px] text-right">{getStageProgress()}%</span>
          </div>
        </div>
      </div>

      {/* Mobile-Optimized Main Content */}
      <div className="pb-safe-area-bottom">
        <div className="max-w-4xl mx-auto min-h-[calc(100vh-80px)]">
          {currentStage === 'welcome' && <WelcomeStage />}
          {currentStage === 'auth' && <AuthStage />}
          {currentStage === 'first-interaction' && <FirstInteractionStage />}
          {currentStage === 'choice' && <ChoiceStage />}
          {currentStage === 'evolution' && <EvolutionStage />}
          {currentStage === 'complete' && <CompleteStage />}
        </div>
      </div>
    </div>
  )
}

export default function WayOfFlowersInstallation() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Flower2 className="w-12 h-12 mx-auto text-green-600 animate-pulse" />
        <p className="text-green-600 font-mono">Loading Way of Flowers...</p>
      </div>
    </div>}>
      <WayOfFlowersContent />
    </Suspense>
  )
} 