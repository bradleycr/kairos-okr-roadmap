/**
 * Art Gallery Demo Page
 * Showcases interactive art appreciation using MELD nodes and NFC pendants
 * Features both traditional gallery displays and civic portrait interactions
 */

"use client"

import { useState, useEffect } from 'react'
import { 
  Frame, 
  Palette, 
  Users, 
  Sparkles, 
  Heart, 
  Star, 
  MessageCircle,
  BookOpen,
  Volume2,
  Eye,
  MapPin,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Wand2,
  Crown,
  Camera,
  Award,
  Grid,
  ArrowRight,
  ChevronDown,
  Info,
  ExternalLink
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import ArtGalleryInterface from '@/components/ArtGalleryInterface'
import PendantSelector from '@/components/PendantSelector'
import { PendantIdentity } from '@/lib/hal/simulateTap'
import { ritualManager } from '@/lib/ritual/ritualManager'
import { Artwork, getAllArtworks } from '@/lib/gallery/artworkRegistry'
import { cn } from '@/lib/utils'

export default function ArtGalleryDemo() {
  const [selectedPendant, setSelectedPendant] = useState<PendantIdentity | null>(null)
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null)
  const [demoMode, setDemoMode] = useState<'gallery' | 'civic' | 'overview'>('overview')
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  const [showRitualConfig, setShowRitualConfig] = useState(false)

  useEffect(() => {
    // Load artworks and initialize ritual manager
    const allArtworks = getAllArtworks()
    setArtworks(allArtworks)
    
    // Initialize ritual manager
    ritualManager.initialize()
    
    // Set up gallery ritual if available
    const rituals = ritualManager.getAllRituals()
    const galleryRitual = rituals.find(r => r.id === 'art-gallery-experience')
    if (galleryRitual) {
      ritualManager.setActiveRitual(galleryRitual.id)
    }
  }, [])

  const handlePendantSelect = (pendant: PendantIdentity) => {
    setSelectedPendant(pendant)
  }

  const handleArtworkSelect = (artwork: Artwork) => {
    setActiveArtwork(artwork)
  }

  const simulateInteraction = async (interactionType: string) => {
    if (!selectedPendant || !activeArtwork) return
    
    setIsSimulating(true)
    setSimulationStep(0)
    
    // Simulate the interaction steps
    const steps = [
      'Detecting NFC pendant...',
      'Authenticating with MELD node...',
      'Verifying signature...',
      `Processing ${interactionType}...`,
      'Recording interaction...',
      'Complete!'
    ]
    
    for (let i = 0; i < steps.length; i++) {
      setTimeout(() => {
        setSimulationStep(i)
        if (i === steps.length - 1) {
          setTimeout(() => {
            setIsSimulating(false)
            setSimulationStep(0)
          }, 1000)
        }
      }, i * 800)
    }
  }

  const InteractionSimulation = () => {
    if (!isSimulating) return null
    
    const steps = [
      'Detecting NFC pendant...',
      'Authenticating with MELD node...',
      'Verifying signature...',
      'Processing interaction...',
      'Recording interaction...',
      'Complete!'
    ]
    
    return (
      <Alert className="border-primary bg-primary/5">
        <Sparkles className="h-4 w-4 animate-spin" />
        <AlertDescription className="font-medium">
          {steps[simulationStep]}
        </AlertDescription>
      </Alert>
    )
  }
  
  const OverviewSection = () => (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl">
        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
          <Frame className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-neutral-900">
          Interactive Art Gallery
        </h1>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Experience art like never before with MELD technology. Tap your NFC pendant on art frames 
          to favorite pieces, rate artworks, unlock stories, and engage with the community.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button 
            onClick={() => setDemoMode('gallery')}
            className="flex items-center gap-2"
          >
            <Palette className="w-4 h-4" />
            Explore Gallery
          </Button>
          <Button 
            variant="outline"
            onClick={() => setDemoMode('civic')}
            className="flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Civic Portraits
          </Button>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Favorite Artworks</h3>
            <p className="text-neutral-600 text-sm">
              Tap your pendant on art frames to instantly favorite pieces and build your personal collection.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Rate & Review</h3>
            <p className="text-neutral-600 text-sm">
              Share your appreciation by rating artworks and leaving voice comments for other visitors.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Unlock Stories</h3>
            <p className="text-neutral-600 text-sm">
              Discover the stories behind artworks, artist biographies, and hidden meanings.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Volume2 className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Audio Guides</h3>
            <p className="text-neutral-600 text-sm">
              Access personalized audio guides and curator insights for featured artworks.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Community Discussions</h3>
            <p className="text-neutral-600 text-sm">
              Join discussions about artworks and connect with other art enthusiasts.
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <Crown className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-lg mb-2">Civic Portraits</h3>
            <p className="text-neutral-600 text-sm">
              Interact with civic portraits that share community history and values.
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{artworks.length}</div>
              <div className="text-sm text-neutral-600">Artworks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">3</div>
              <div className="text-sm text-neutral-600">MELD Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">7</div>
              <div className="text-sm text-neutral-600">Behaviors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">∞</div>
              <div className="text-sm text-neutral-600">Possibilities</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const GallerySection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Palette className="w-6 h-6" />
            Art Gallery Experience
          </h2>
          <p className="text-neutral-600">
            Tap your pendant on art frames to interact with the collection
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setDemoMode('overview')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Overview
        </Button>
      </div>
      
      {/* Pendant Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Select Your Pendant
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PendantSelector
            selectedPendant={selectedPendant}
            onSelect={handlePendantSelect}
            showDetails={false}
          />
        </CardContent>
      </Card>
      
      {/* Active Artwork Interaction */}
      {selectedPendant && activeArtwork && (
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Frame className="w-5 h-5" />
              Interactive Art Frame: {activeArtwork.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">Artwork Details</h4>
                <p className="text-sm text-neutral-600">
                  <strong>{activeArtwork.artist.name}</strong> • {activeArtwork.year}
                </p>
                <p className="text-sm text-neutral-600">{activeArtwork.medium}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <MapPin className="w-3 h-3" />
                  {activeArtwork.gallerySection}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">Available Interactions</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateInteraction('favorite')}
                    disabled={isSimulating}
                    className="flex items-center gap-2"
                  >
                    <Heart className="w-3 h-3" />
                    Favorite
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateInteraction('rate')}
                    disabled={isSimulating}
                    className="flex items-center gap-2"
                  >
                    <Star className="w-3 h-3" />
                    Rate
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateInteraction('comment')}
                    disabled={isSimulating}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-3 h-3" />
                    Comment
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => simulateInteraction('story')}
                    disabled={isSimulating}
                    className="flex items-center gap-2"
                  >
                    <BookOpen className="w-3 h-3" />
                    Story
                  </Button>
                </div>
              </div>
            </div>
            
            <InteractionSimulation />
          </CardContent>
        </Card>
      )}
      
      {/* Gallery Interface */}
      <ArtGalleryInterface
        selectedPendant={selectedPendant?.did}
        onArtworkSelect={handleArtworkSelect}
        showInteractions={true}
      />
    </div>
  )

  const CivicSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Crown className="w-6 h-6" />
            Civic Portrait Experience
          </h2>
          <p className="text-neutral-600">
            Interactive portraits that share community history and values
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setDemoMode('overview')}
          className="flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4 rotate-180" />
          Back to Overview
        </Button>
      </div>
      
      {/* Civic Portrait Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-indigo-600" />
              The Civic Guardian
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-indigo-600">
                <Crown className="w-12 h-12" />
                <span className="text-sm font-medium">Interactive Portrait</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold">Community Historian</h3>
              <p className="text-sm text-neutral-600">
                "Welcome to our community! I'm here to share our story and values. 
                Tap your pendant to learn about our history, civic services, and cultural heritage."
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant="outline" className="text-xs">Local History</Badge>
                <Badge variant="outline" className="text-xs">Community Values</Badge>
                <Badge variant="outline" className="text-xs">Civic Services</Badge>
                <Badge variant="outline" className="text-xs">Cultural Events</Badge>
              </div>
            </div>
            
            {selectedPendant && (
              <div className="border-t pt-4">
                <Button 
                  className="w-full flex items-center gap-2"
                  onClick={() => simulateInteraction('civic_engage')}
                  disabled={isSimulating}
                >
                  <Crown className="w-4 h-4" />
                  Engage with Guardian
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>How Civic Portraits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Approach the Portrait</h4>
                  <p className="text-xs text-neutral-600">
                    Find a civic portrait in community spaces like city halls, libraries, or museums.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Tap Your Pendant</h4>
                  <p className="text-xs text-neutral-600">
                    Hold your NFC pendant near the frame to authenticate and begin the interaction.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Engage & Learn</h4>
                  <p className="text-xs text-neutral-600">
                    Ask questions, listen to stories, and learn about your community's history and values.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-sm">Share & Connect</h4>
                  <p className="text-xs text-neutral-600">
                    Join discussions with other community members and contribute your own stories.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-50 p-4 rounded-lg mt-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Privacy & Security
              </h4>
              <p className="text-xs text-neutral-600">
                All interactions are secured with Ed25519 signatures. Your private key never leaves your device, 
                and all conversations are logged with your consent for community archival purposes.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <InteractionSimulation />
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {demoMode === 'overview' && <OverviewSection />}
        {demoMode === 'gallery' && <GallerySection />}
        {demoMode === 'civic' && <CivicSection />}
      </div>
    </div>
  )
} 