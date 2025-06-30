/**
 * Art Gallery Interface Component
 * Interface for managing and displaying art gallery experiences
 * Integrates with MELD nodes for interactive art appreciation
 */

"use client"

import { useState, useEffect } from 'react'
import { 
  Artwork, 
  UserArtworkInteraction,
  galleryManager,
  getAllArtworks,
  getArtworkRating,
  getUserFavorites,
  getArtworkInteractions
} from '@/lib/gallery/artworkRegistry'
import { 
  Heart, 
  Star, 
  MessageCircle, 
  BookOpen, 
  Users, 
  Sparkles, 
  Camera,
  Clock,
  MapPin,
  User,
  ChevronRight,
  Info,
  Play,
  Volume2,
  Eye,
  Award,
  Palette,
  Frame
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface ArtGalleryInterfaceProps {
  selectedPendant?: string
  onArtworkSelect?: (artwork: Artwork) => void
  showInteractions?: boolean
}

export default function ArtGalleryInterface({ 
  selectedPendant, 
  onArtworkSelect,
  showInteractions = true 
}: ArtGalleryInterfaceProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [userFavorites, setUserFavorites] = useState<string[]>([])
  const [artworkInteractions, setArtworkInteractions] = useState<Record<string, UserArtworkInteraction[]>>({})
  const [viewMode, setViewMode] = useState<'gallery' | 'details' | 'interactions'>('gallery')

  // Load data
  useEffect(() => {
    loadArtworks()
    if (selectedPendant) {
      loadUserData(selectedPendant)
    }
  }, [selectedPendant])

  const loadArtworks = () => {
    const allArtworks = getAllArtworks()
    setArtworks(allArtworks)
    
    // Load interaction data for each artwork
    const interactions: Record<string, UserArtworkInteraction[]> = {}
    allArtworks.forEach(artwork => {
      interactions[artwork.id] = getArtworkInteractions(artwork.id)
    })
    setArtworkInteractions(interactions)
  }

  const loadUserData = (pendantDID: string) => {
    const favorites = getUserFavorites(pendantDID)
    setUserFavorites(favorites)
  }

  const handleArtworkClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork)
    setViewMode('details')
    onArtworkSelect?.(artwork)
  }

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category: Artwork['category']) => {
    const icons = {
      painting: <Palette className="w-4 h-4" />,
      sculpture: <Award className="w-4 h-4" />,
      photography: <Camera className="w-4 h-4" />,
      digital: <Sparkles className="w-4 h-4" />,
      mixed_media: <Frame className="w-4 h-4" />,
      installation: <Eye className="w-4 h-4" />
    }
    return icons[category]
  }

  const ArtworkCard = ({ artwork }: { artwork: Artwork }) => {
    const rating = getArtworkRating(artwork.id)
    const interactions = artworkInteractions[artwork.id] || []
    const isFavorited = userFavorites.includes(artwork.id)
    
    return (
      <Card 
        className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-primary/50"
        onClick={() => handleArtworkClick(artwork)}
      >
        <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-neutral-50 to-neutral-100">
          {/* Artwork Image Placeholder */}
          <div className="aspect-[4/3] flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
            <div className="flex flex-col items-center gap-2 text-neutral-500">
              {getCategoryIcon(artwork.category)}
              <span className="text-xs font-medium uppercase tracking-wide">
                {artwork.medium}
              </span>
            </div>
          </div>
          
          {/* Favorite Badge */}
          {isFavorited && (
            <div className="absolute top-3 right-3 bg-pink-500 text-white p-2 rounded-full shadow-lg">
              <Heart className="w-4 h-4 fill-current" />
            </div>
          )}
          
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
              {artwork.category.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          {/* Title and Artist */}
          <div>
            <h3 className="font-bold text-lg text-neutral-900 group-hover:text-primary transition-colors">
              {artwork.title}
            </h3>
            <p className="text-neutral-600 font-medium">
              {artwork.artist.name}
              {artwork.year && ` • ${artwork.year}`}
            </p>
          </div>
          
          {/* Description */}
          <p className="text-sm text-neutral-600 line-clamp-2">
            {artwork.description}
          </p>
          
          {/* Gallery Section */}
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <MapPin className="w-3 h-3" />
            <span>{artwork.gallerySection}</span>
          </div>
          
          {/* Stats */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
            <div className="flex items-center gap-4">
              {/* Rating */}
              {rating.totalRatings > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{rating.averageRating}</span>
                  <span className="text-xs text-neutral-500">({rating.totalRatings})</span>
                </div>
              )}
              
              {/* Interactions */}
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4 text-neutral-400" />
                <span className="text-xs text-neutral-500">{interactions.length}</span>
              </div>
            </div>
            
            {/* Interactive Features */}
            <div className="flex items-center gap-1">
              {artwork.hasAudioGuide && (
                <Volume2 className="w-4 h-4 text-neutral-400" />
              )}
              {artwork.allowsComments && (
                <MessageCircle className="w-4 h-4 text-neutral-400" />
              )}
              {artwork.hasUnlockableContent && (
                <Sparkles className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const ArtworkDetails = ({ artwork }: { artwork: Artwork }) => {
    const rating = getArtworkRating(artwork.id)
    const interactions = artworkInteractions[artwork.id] || []
    const recentInteractions = interactions.slice(-5).reverse()
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setViewMode('gallery')}
            className="flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Gallery
          </Button>
          
          {showInteractions && (
            <Button
              variant="outline"
              onClick={() => setViewMode('interactions')}
              className="flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              View Interactions ({interactions.length})
            </Button>
          )}
        </div>
        
        {/* Artwork Hero */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Artwork Display */}
              <div className="aspect-[4/3] bg-gradient-to-br from-neutral-100 to-neutral-200 rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-neutral-500">
                  {getCategoryIcon(artwork.category)}
                  <span className="text-sm font-medium">{artwork.medium}</span>
                  <Badge variant="secondary">{artwork.category.replace('_', ' ')}</Badge>
                </div>
              </div>
              
              {/* Artwork Info */}
              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    {artwork.title}
                  </h1>
                  <div className="flex items-center gap-2 text-lg text-neutral-700 mb-1">
                    <User className="w-5 h-5" />
                    <span className="font-medium">{artwork.artist.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-neutral-600">
                    <span>{artwork.year}</span>
                    <span>•</span>
                    <span>{artwork.medium}</span>
                    {artwork.dimensions && (
                      <>
                        <span>•</span>
                        <span>{artwork.dimensions}</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Description */}
                <p className="text-neutral-700 leading-relaxed">
                  {artwork.description}
                </p>
                
                {/* Artist Bio */}
                {artwork.artist.bio && (
                  <div className="bg-neutral-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      About the Artist
                    </h3>
                    <p className="text-sm text-neutral-700">{artwork.artist.bio}</p>
                    {artwork.artist.birthYear && artwork.artist.nationality && (
                      <p className="text-xs text-neutral-500 mt-2">
                        Born {artwork.artist.birthYear} • {artwork.artist.nationality}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-5 h-5 text-yellow-500 fill-current" />
                    </div>
                    <div className="font-bold text-lg">{rating.averageRating || 'N/A'}</div>
                    <div className="text-xs text-neutral-500">
                      {rating.totalRatings} rating{rating.totalRatings !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Eye className="w-5 h-5 text-neutral-500" />
                    </div>
                    <div className="font-bold text-lg">{interactions.length}</div>
                    <div className="text-xs text-neutral-500">interactions</div>
                  </div>
                </div>
                
                {/* Interactive Features */}
                <div className="flex flex-wrap gap-2">
                  {artwork.hasAudioGuide && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Volume2 className="w-3 h-3" />
                      Audio Guide
                    </Badge>
                  )}
                  {artwork.allowsComments && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      Comments
                    </Badge>
                  )}
                  {artwork.hasUnlockableContent && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Unlockable Content
                    </Badge>
                  )}
                  {artwork.allowsRating && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Ratable
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Interactions */}
        {recentInteractions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Recent Interactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInteractions.map((interaction) => (
                  <div 
                    key={interaction.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {interaction.userId.slice(-2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm capitalize">
                          {interaction.type.replace('_', ' ')}
                        </div>
                        {interaction.comment && (
                          <div className="text-xs text-neutral-600 mt-1">
                            "{interaction.comment}"
                          </div>
                        )}
                        {interaction.rating && (
                          <div className="flex items-center gap-1 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i}
                                className={cn(
                                  "w-3 h-3",
                                  i < interaction.rating! 
                                    ? "text-yellow-500 fill-current" 
                                    : "text-neutral-300"
                                )}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(interaction.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const InteractionsView = () => {
    if (!selectedArtwork) return null
    
    const interactions = artworkInteractions[selectedArtwork.id] || []
    const groupedInteractions = interactions.reduce((groups, interaction) => {
      const type = interaction.type
      if (!groups[type]) groups[type] = []
      groups[type].push(interaction)
      return groups
    }, {} as Record<string, UserArtworkInteraction[]>)

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => setViewMode('details')}
            className="flex items-center gap-2"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back to Artwork
          </Button>
          <div className="text-sm text-neutral-600">
            {interactions.length} total interactions
          </div>
        </div>
        
        <div className="grid gap-6">
          {Object.entries(groupedInteractions).map(([type, typeInteractions]) => (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="capitalize flex items-center justify-between">
                  <span>{type.replace('_', ' ')} ({typeInteractions.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {typeInteractions.map((interaction) => (
                    <div 
                      key={interaction.id}
                      className="flex items-start justify-between p-3 bg-neutral-50 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {interaction.userId.slice(-2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="text-sm text-neutral-600 mb-1">
                            User {interaction.userId.slice(-8)}
                          </div>
                          {interaction.comment && (
                            <div className="text-sm text-neutral-900 mb-2">
                              "{interaction.comment}"
                            </div>
                          )}
                          {interaction.rating && (
                            <div className="flex items-center gap-1 mb-2">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={cn(
                                    "w-4 h-4",
                                    i < interaction.rating! 
                                      ? "text-yellow-500 fill-current" 
                                      : "text-neutral-300"
                                  )}
                                />
                              ))}
                              <span className="text-sm text-neutral-600 ml-1">
                                {interaction.rating}/5
                              </span>
                            </div>
                          )}
                          {interaction.memoryNote && (
                            <div className="text-sm text-neutral-700 italic">
                              Memory: "{interaction.memoryNote}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(interaction.timestamp)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (viewMode === 'details' && selectedArtwork) {
    return <ArtworkDetails artwork={selectedArtwork} />
  }
  
  if (viewMode === 'interactions' && selectedArtwork) {
    return <InteractionsView />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Art Gallery</h2>
          <p className="text-neutral-600">
            Interactive art experiences powered by MELD technology
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Frame className="w-3 h-3" />
            {artworks.length} Artworks
          </Badge>
          {selectedPendant && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {userFavorites.length} Favorites
            </Badge>
          )}
        </div>
      </div>
      
      {/* Gallery Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artworks.map((artwork) => (
          <ArtworkCard key={artwork.id} artwork={artwork} />
        ))}
      </div>
      
      {artworks.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-4 text-neutral-500">
            <Frame className="w-12 h-12" />
            <div>
              <h3 className="font-semibold text-lg text-neutral-700 mb-2">
                No Artworks Available
              </h3>
              <p className="text-sm">
                Add some artworks to create your gallery experience.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 