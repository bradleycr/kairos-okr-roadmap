/**
 * Way of Flowers Installation
 * Interactive decision tree for environmental cause support
 * Matches the phone flow: First Interaction → Choice → Evolution
 */

"use client"

import { useState, useEffect } from 'react'
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
  Info
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import NFCAuthFlow from '@/app/nfc/components/NFCAuthFlow'
import { useNFCAuthentication } from '@/app/nfc/hooks/useNFCAuthentication'
import { useNFCParameterParser } from '@/app/nfc/hooks/useNFCParameterParser'

// Mock types for the Way of Flowers system
interface FlowerPath {
  id: string
  userId: string
  name: string
  currentStage: 'seeding' | 'sprouting' | 'blooming' | 'fruiting'
  choices: Array<{ id: string; offeringName: string; timestamp: number }>
  characteristics: { primaryColor: string }
}

interface CauseOffering {
  id: string
  name: string
  description: string
  category: string
  impactDescription: string
  primaryColor: string
  evolutionEffect: { bloomBoost: number }
}

interface UserFlowerSession {
  userId: string
  sessionId: string
  isNewUser: boolean
}

type FlowStage = 'welcome' | 'auth' | 'first-interaction' | 'choice' | 'evolution' | 'complete'

export default function WayOfFlowersInstallation() {
  const router = useRouter()
  
  // NFC Authentication
  const { verificationState, executeAuthentication, resetAuthentication } = useNFCAuthentication()
  const { nfcParams, format } = useNFCParameterParser()
  
  // Way of Flowers State
  const [currentStage, setCurrentStage] = useState<FlowStage>('welcome')
  const [userSession, setUserSession] = useState<UserFlowerSession | null>(null)
  const [userPaths, setUserPaths] = useState<FlowerPath[]>([])
  const [selectedPath, setSelectedPath] = useState<FlowerPath | null>(null)
  const [selectedOffering, setSelectedOffering] = useState<CauseOffering | null>(null)
  const [evolutionMessage, setEvolutionMessage] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentUrl, setCurrentUrl] = useState<string>('')

  // Mock cause offerings
  const availableOfferings: CauseOffering[] = [
    {
      id: 'mangrove-restoration',
      name: 'Mangrove Restoration',
      description: 'Protect coastal communities by restoring vital mangrove ecosystems',
      category: 'restoration',
      impactDescription: 'Each choice helps plant mangrove seedlings that will protect coastlines for decades',
      primaryColor: '#2D5A27',
      evolutionEffect: { bloomBoost: 15 }
    },
    {
      id: 'cover-cropping',
      name: 'Cover Cropping',
      description: 'Regenerate soil health through sustainable agricultural practices',
      category: 'regeneration',
      impactDescription: 'Your support helps farmers adopt cover crops that enrich the soil naturally',
      primaryColor: '#8B4513',
      evolutionEffect: { bloomBoost: 12 }
    },
    {
      id: 'pollinator-habitat',
      name: 'Pollinator Gardens',
      description: 'Create safe havens for bees, butterflies, and other vital pollinators',
      category: 'conservation',
      impactDescription: 'Build flower-rich habitats that support declining pollinator populations',
      primaryColor: '#FFD700',
      evolutionEffect: { bloomBoost: 20 }
    },
    {
      id: 'forest-protection',
      name: 'Forest Guardian',
      description: 'Protect ancient forests from deforestation and habitat loss',
      category: 'protection',
      impactDescription: 'Safeguard irreplaceable forest ecosystems for future generations',
      primaryColor: '#228B22',
      evolutionEffect: { bloomBoost: 18 }
    }
  ]

  // Set current URL for display
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.host)
    }
  }, [])

  // Check for NFC parameters on load
  useEffect(() => {
    if (Object.keys(nfcParams).length > 0 && currentStage === 'welcome') {
      setCurrentStage('auth')
    }
  }, [nfcParams, currentStage])

  // Handle successful authentication
  useEffect(() => {
    if (verificationState.status === 'success' && verificationState.chipAuthenticated) {
      handleAuthenticationSuccess()
    }
  }, [verificationState])

  const handleAuthenticationSuccess = async () => {
    try {
      const chipUID = nfcParams.chipUID
      if (!chipUID) return

      // Mock session creation
      const session: UserFlowerSession = {
        userId: chipUID,
        sessionId: `session_${Date.now()}`,
        isNewUser: Math.random() > 0.5 // Random for demo
      }
      setUserSession(session)
      
      // Mock existing paths
      if (!session.isNewUser) {
        const mockPaths: FlowerPath[] = [
          {
            id: 'path_1',
            userId: chipUID,
            name: 'Coastal Restoration',
            currentStage: 'blooming',
            choices: [
              { id: 'choice_1', offeringName: 'Mangrove Restoration', timestamp: Date.now() - 86400000 }
            ],
            characteristics: { primaryColor: '#2D5A27' }
          }
        ]
        setUserPaths(mockPaths)
        setSelectedPath(mockPaths[0])
      }
      
      setCurrentStage('first-interaction')
    } catch (error) {
      console.error('Failed to start flower session:', error)
    }
  }

  const handleCreateNewPath = async () => {
    if (!userSession) return
    
    setIsProcessing(true)
    try {
      // Mock new path creation
      const newPath: FlowerPath = {
        id: `path_${Date.now()}`,
        userId: userSession.userId,
        name: `Flower Path ${userPaths.length + 1}`,
        currentStage: 'seeding',
        choices: [],
        characteristics: { primaryColor: '#E8F5E8' }
      }
      setSelectedPath(newPath)
      setUserPaths([newPath, ...userPaths])
      setCurrentStage('choice')
    } catch (error) {
      console.error('Failed to create new path:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSelectExistingPath = (path: FlowerPath) => {
    setSelectedPath(path)
    setCurrentStage('choice')
  }

  const handleMakeChoice = async (offering: CauseOffering) => {
    if (!userSession || !selectedPath) return
    
    setSelectedOffering(offering)
    setIsProcessing(true)
    
    try {
      // Mock choice processing
      const newChoice = {
        id: `choice_${Date.now()}`,
        offeringName: offering.name,
        timestamp: Date.now()
      }
      
      const updatedPath = {
        ...selectedPath,
        choices: [...selectedPath.choices, newChoice],
        currentStage: 'blooming' as const,
        characteristics: { primaryColor: offering.primaryColor }
      }
      
      setSelectedPath(updatedPath)
      setEvolutionMessage(`Your flower path grows stronger through ${offering.name}. New growth appears!`)
      setCurrentStage('evolution')
      
      // Auto-complete after showing evolution
      setTimeout(() => {
        setCurrentStage('complete')
      }, 3000)
      
    } catch (error) {
      console.error('Failed to make choice:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartOver = () => {
    resetAuthentication()
    setCurrentStage('welcome')
    setUserSession(null)
    setUserPaths([])
    setSelectedPath(null)
    setSelectedOffering(null)
    setEvolutionMessage('')
  }

  const getCauseIcon = (offering: CauseOffering) => {
    const iconMap = {
      'mangrove-restoration': <Waves className="w-6 h-6" />,
      'cover-cropping': <Sprout className="w-6 h-6" />,
      'pollinator-habitat': <Bug className="w-6 h-6" />,
      'forest-protection': <TreePine className="w-6 h-6" />
    }
    return iconMap[offering.id as keyof typeof iconMap] || <Leaf className="w-6 h-6" />
  }

  const getStageProgress = () => {
    const stageMap = {
      'welcome': 0,
      'auth': 20,
      'first-interaction': 40,
      'choice': 60,
      'evolution': 80,
      'complete': 100
    }
    return stageMap[currentStage]
  }

  // Render different stages
  const WelcomeStage = () => (
    <div className="text-center space-y-8 py-12">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
          <Flower2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-neutral-900">Way of Flowers</h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Begin your journey of environmental stewardship. Each choice nurtures your digital flower and supports real-world conservation.
        </p>
        
        {/* Subdomain Status */}
        {currentUrl && (
          <Alert className="max-w-lg mx-auto border-blue-200 bg-blue-50">
            <Globe className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Installation URL:</strong> <code className="text-sm font-mono">{currentUrl}</code>
              <br />
              <span className="text-xs">This installation is running on its dedicated subdomain</span>
            </AlertDescription>
          </Alert>
        )}
      </div>
      
      <Alert className="max-w-lg mx-auto border-green-200 bg-green-50">
        <Leaf className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Tap your NFC pendant</strong> to begin your flower path journey
        </AlertDescription>
      </Alert>
      
      {/* Test NFC Parameters */}
      <div className="text-center">
        <p className="text-xs text-neutral-500 mb-2">For testing, you can simulate an NFC tap:</p>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            // Simulate NFC parameters for testing
            window.history.pushState({}, '', '?chipUID=test_chip_123&ndefData=test_data&timestamp=' + Date.now())
            window.location.reload()
          }}
          className="text-xs"
        >
          <Info className="w-3 h-3 mr-1" />
          Simulate NFC Tap (Testing)
        </Button>
      </div>
    </div>
  )

  const AuthStage = () => (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900">Connecting to Your Garden</h2>
        <p className="text-neutral-600">Authenticating your unique flower identity...</p>
      </div>
      
      <NFCAuthFlow 
        verificationState={verificationState}
        nfcParams={nfcParams}
        format={format}
      />
    </div>
  )

  const FirstInteractionStage = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <Flower2 className="w-12 h-12 mx-auto text-green-600" />
        <h2 className="text-2xl font-bold text-neutral-900">
          {userSession?.isNewUser ? "Seeding Begins" : "Welcome Back"}
        </h2>
        <p className="text-neutral-600">
          {userSession?.isNewUser 
            ? "Plant your first seed in the digital garden of conservation"
            : "Continue nurturing your environmental impact"
          }
        </p>
      </div>

      {userSession?.isNewUser ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center space-y-4">
            <Sprout className="w-12 h-12 mx-auto text-green-500" />
            <h3 className="font-bold text-lg">Start Your First Flower Path</h3>
            <p className="text-sm text-neutral-600">
              Every conservation choice helps your digital flower evolve and supports real environmental causes.
            </p>
            <Button 
              onClick={handleCreateNewPath}
              disabled={isProcessing}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Sprout className="w-4 h-4 mr-2" />}
              Plant Your Seed
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Your Flower Paths</h3>
            <div className="grid gap-4 max-w-2xl mx-auto">
              {userPaths.map((path) => (
                <Card key={path.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent 
                    className="p-4 flex items-center justify-between"
                    onClick={() => handleSelectExistingPath(path)}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: path.characteristics.primaryColor }}
                      >
                        <Flower2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{path.name}</p>
                        <p className="text-xs text-neutral-500 capitalize">
                          {path.currentStage} • {path.choices.length} choices
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-primary" />
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
              className="border-green-300 text-green-700 hover:bg-green-50"
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
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900">Choose Your Offering</h2>
        <p className="text-neutral-600">
          Select an environmental cause to support. Your choice will shape how your flower evolves.
        </p>
        
        {selectedPath && (
          <Badge className="bg-green-100 text-green-800">
            {selectedPath.name} • Stage: {selectedPath.currentStage}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {availableOfferings.map((offering) => (
          <Card 
            key={offering.id}
            className="hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-green-300"
            onClick={() => handleMakeChoice(offering)}
          >
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: offering.primaryColor }}
                >
                  {getCauseIcon(offering)}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{offering.name}</h3>
                  <Badge variant="outline" className="text-xs capitalize">
                    {offering.category}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-neutral-600">{offering.description}</p>
              <p className="text-xs text-neutral-500 italic">{offering.impactDescription}</p>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-neutral-400">
                  +{offering.evolutionEffect.bloomBoost} bloom points
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-green-600" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  const EvolutionStage = () => (
    <div className="text-center space-y-8 py-12">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Sparkles className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900">Your Flower Evolves</h2>
        <p className="text-lg text-neutral-600 max-w-xl mx-auto">
          {evolutionMessage}
        </p>
      </div>

      {selectedPath && selectedOffering && (
        <Card className="max-w-lg mx-auto">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedPath.characteristics.primaryColor }}
              >
                <Flower2 className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-6 h-6 text-neutral-400" />
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedOffering.primaryColor }}
              >
                <Flower2 className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="font-medium">Supporting: {selectedOffering.name}</p>
              <p className="text-sm text-neutral-600 capitalize">
                Stage: {selectedPath.currentStage} • {selectedPath.choices.length} choices made
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const CompleteStage = () => (
    <div className="text-center space-y-8 py-12">
      <div className="space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-neutral-900">Choice Recorded</h2>
        <p className="text-lg text-neutral-600">
          Your environmental impact is growing. Thank you for nurturing our shared future.
        </p>
      </div>

      <div className="space-y-4">
        <Button 
          onClick={handleStartOver}
          className="bg-green-600 hover:bg-green-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Start Another Journey
        </Button>
        
        <p className="text-xs text-neutral-500">
          Your choice has been logged. Future API integration will trigger real-world impact.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flower2 className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="font-bold text-lg">Way of Flowers</h1>
              <p className="text-xs text-neutral-500">Environmental Impact Journey</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Progress value={getStageProgress()} className="w-24 h-2" />
            <span className="text-xs text-neutral-500">{getStageProgress()}%</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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