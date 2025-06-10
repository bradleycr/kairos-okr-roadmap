"use client"

// --- ZKBirthday Constellation: Galactic Mycelium Memory Network ---
// Beautiful word constellation with orbital dynamics and mycelium connections
// Real-time updates with sophisticated animations and responsive layout

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Sparkles, Users, Heart, Share2, Plus } from 'lucide-react'
import { loadGroupedWords } from '../utils'

// --- Types ---
interface WordData {
  word: string
  timestamp: number
  contributor: string
}

interface GroupedWords {
  [letter: string]: WordData[]
}

interface OrbitData {
  x: number
  y: number
  angle: number
  radius: number
  speed: number
  offset: number
}

// --- Constellation Component ---
export default function ConstellationPage() {
  const [groupedWords, setGroupedWords] = useState<GroupedWords>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [totalWords, setTotalWords] = useState(0)
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0)

  const CHARLIE_LETTERS = ['C', 'H', 'A', 'R', 'L', 'I', 'E']

  // Load words from shared API with localStorage fallback
  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session') || 'charlies-birthday-2024'
    
    const loadWords = async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      
      try {
        console.log(`🌌 CONSTELLATION: Loading words (${isRefresh ? 'refresh' : 'initial'})`)
        
        // Try to load from shared API first
        const response = await fetch(`/api/zkbirthday/words?sessionId=${sessionId}`)
        const result = await response.json()
        
        if (result.success && result.data) {
          console.log(`🌌 CONSTELLATION: API loaded ${result.data.stats.totalWords} words`)
          
          // Only update if data has actually changed
          if (result.data.stats.lastUpdate > lastUpdateTime || !isRefresh) {
            // Map API response to expected format (remove id field)
            const mappedWords: GroupedWords = {}
            CHARLIE_LETTERS.forEach(letter => {
              const apiWords = result.data.words[letter] || []
              mappedWords[letter] = apiWords.map((apiWord: any) => ({
                word: apiWord.word,
                timestamp: apiWord.timestamp,
                contributor: apiWord.contributor
              }))
            })
            
            setGroupedWords(mappedWords)
            setTotalWords(result.data.stats.totalWords)
            setLastUpdateTime(result.data.stats.lastUpdate)
            
            if (isRefresh && result.data.stats.totalWords > totalWords) {
              console.log(`🌌 CONSTELLATION: ✨ New words detected! ${result.data.stats.totalWords - totalWords} new`)
            }
          } else if (isRefresh) {
            console.log(`🌌 CONSTELLATION: No new updates, keeping current display`)
          }
          
          setIsLoading(false)
          setIsRefreshing(false)
          return
        }
      } catch (error) {
        console.warn('🌌 CONSTELLATION: API failed, falling back to localStorage:', error)
      }
      
      // Fallback to localStorage for backward compatibility (only on initial load)
      if (!isRefresh) {
        try {
          const { loadGroupedWords } = await import('../utils')
          const words = loadGroupedWords()
          setGroupedWords(words)
          
          const total = Object.values(words).reduce((acc, letterWords) => acc + letterWords.length, 0)
          setTotalWords(total)
          console.log(`🌌 CONSTELLATION: localStorage fallback loaded ${total} words`)
        } catch (error) {
          console.error('🌌 CONSTELLATION: Failed to load words from localStorage:', error)
          setGroupedWords({})
          setTotalWords(0)
        }
      }
      
      setIsLoading(false)
      setIsRefreshing(false)
    }

    // Initial load
    loadWords(false)
    
    // Auto-refresh every 8 seconds for real-time updates (less aggressive)
    const interval = setInterval(() => loadWords(true), 8000)
    return () => clearInterval(interval)
  }, [totalWords, lastUpdateTime])

  const goBack = () => {
    window.history.back()
  }

  const shareConstellation = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Charlie\'s Friendship Constellation',
          text: `Check out this beautiful constellation of friendship words created for Charlie's birthday! ${totalWords} words from friends so far. ✨`,
          url: url
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(url)
    }
  }

  // Generate word cloud positions around each letter
  const generateWordCloudPositions = (wordCount: number, letterIndex: number) => {
    const positions = []
    
    // FAIL-SAFE: Maximum words per letter to maintain visual quality
    const MAX_WORDS_PER_LETTER = 30
    const effectiveWordCount = Math.min(wordCount, MAX_WORDS_PER_LETTER)
    
    // Responsive spacing based on viewport - much more conservative
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1920
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 1080
    
    // Calculate available space per letter
    const availableWidth = Math.min(viewportWidth * 0.8 / 7, 200) // 80% width divided by 7 letters, max 200px
    const baseRadius = Math.min(availableWidth * 0.3, 60) // 30% of available space, max 60px
    
    // Mobile scaling
    const mobileScale = viewportWidth < 768 ? 0.8 : 1
    
    // FAIL-SAFE: Dynamic scaling based on word count
    const densityScale = Math.max(0.4, 1 - (effectiveWordCount / MAX_WORDS_PER_LETTER) * 0.3)
    const finalRadius = baseRadius * mobileScale * densityScale
    
    // FAIL-SAFE: Adaptive words per layer based on density
    const baseWordsPerLayer = 6
    const wordsPerLayer = effectiveWordCount > 18 ? 8 : baseWordsPerLayer // More words per layer when dense
    
    // FAIL-SAFE: Dynamic layer spacing that gets tighter with more words
    const baseSeparation = 25
    const layerSeparation = effectiveWordCount > 20 ? baseSeparation * 0.7 : baseSeparation
    
    for (let i = 0; i < effectiveWordCount; i++) {
      // Create concentric circles with adaptive spacing
      const layer = Math.floor(i / wordsPerLayer)
      const positionInLayer = i % wordsPerLayer
      const layerRadius = finalRadius + (layer * layerSeparation * mobileScale * densityScale)
      
      // Even distribution around circle
      const angle = (positionInLayer / wordsPerLayer) * Math.PI * 2 + (letterIndex * 0.1)
      
      // Calculate position with some small variation to avoid perfect grid
      const radiusVariation = layer === 0 ? 0 : (Math.random() - 0.5) * 8 * mobileScale * densityScale
      const angleVariation = (Math.random() - 0.5) * 0.2
      
      const finalAngle = angle + angleVariation
      const finalLayerRadius = layerRadius + radiusVariation
      
      const x = Math.cos(finalAngle) * finalLayerRadius
      const y = Math.sin(finalAngle) * finalLayerRadius
      
      positions.push({
        x,
        y,
        angle: finalAngle,
        radius: finalLayerRadius,
        layer,
        opacity: effectiveWordCount > 25 ? Math.max(0.6, 1 - (layer * 0.15)) : 1 // Fade outer layers when dense
      })
    }
    
    return positions
  }

  // FAIL-SAFE: Smart word selection when there are too many words
  const selectDisplayWords = (words: WordData[], maxWords: number) => {
    // Only filter if we have WAY too many words (more than 50)
    if (words.length <= 50) return words
    
    // Sort by timestamp (newest first) and take recent + some random older ones
    const sortedWords = [...words].sort((a, b) => b.timestamp - a.timestamp)
    const recentWords = sortedWords.slice(0, Math.floor(maxWords * 0.8)) // 80% recent
    const olderWords = sortedWords.slice(Math.floor(maxWords * 0.8))
    
    // Randomly select from older words to fill remaining slots
    const remainingSlots = maxWords - recentWords.length
    const selectedOlder = olderWords
      .sort(() => Math.random() - 0.5)
      .slice(0, remainingSlots)
    
    return [...recentWords, ...selectedOlder]
  }

  // Calculate mycelium connection points between letters with words
  const getMyceliumConnections = () => {
    const connections = []
    const lettersWithWords = CHARLIE_LETTERS.filter(letter => 
      groupedWords[letter] && groupedWords[letter].length > 0
    )
    
    for (let i = 0; i < lettersWithWords.length - 1; i++) {
      for (let j = i + 1; j < lettersWithWords.length; j++) {
        const letterA = lettersWithWords[i]
        const letterB = lettersWithWords[j]
        const indexA = CHARLIE_LETTERS.indexOf(letterA)
        const indexB = CHARLIE_LETTERS.indexOf(letterB)
        
        connections.push({
          from: indexA,
          to: indexB,
          strength: Math.min(groupedWords[letterA].length, groupedWords[letterB].length) / 5
        })
      }
    }
    
    return connections
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 mx-auto border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-transparent border-b-accent/20 rounded-full animate-spin animate-reverse"></div>
          </div>
          <p className="text-sm text-muted-foreground font-mono">Loading constellation...</p>
        </div>
      </div>
    )
  }

  const myceliumConnections = getMyceliumConnections()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 overflow-hidden relative">
      {/* Animated starfield background */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 100 }, (_, i) => (
          <div
            key={i}
            className="absolute w-px h-px bg-white rounded-full opacity-15 animate-twinkle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Fixed Header Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/20 via-black/10 to-transparent backdrop-blur-sm">
        <div className="safe-top">
          <div className="flex items-center justify-between p-4 sm:p-6 max-w-7xl mx-auto">
            <Button 
              variant="ghost" 
              onClick={goBack}
              className="text-white/90 hover:text-white font-mono backdrop-blur-md bg-black/30 border border-white/20 hover:bg-white/10 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">Back</span>
            </Button>

            <div className="flex items-center gap-3 sm:gap-4">
              <Badge 
                variant="secondary" 
                className="font-mono bg-primary/30 text-primary border-primary/40 backdrop-blur-md text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg"
              >
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {totalWords}
              </Badge>
              
              <Button 
                variant="outline"
                onClick={shareConstellation}
                className="border-accent/40 text-accent hover:bg-accent/20 font-mono backdrop-blur-md bg-black/30 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition-all duration-200"
              >
                <Share2 className="w-4 h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Constellation Space */}
      <div className="relative w-full h-screen flex items-center justify-center px-4 py-20 sm:py-24 md:py-16">
        
        {/* Mycelium Network Background */}
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none" 
          style={{ zIndex: 1 }}
        >
          {myceliumConnections.map((connection, index) => {
            const startX = 50 + (connection.from - 3) * 8 // Tighter spacing for mobile
            const endX = 50 + (connection.to - 3) * 8
            const startY = 50
            const endY = 50
            
            // Create flowing mycelium paths with slower animation
            const midX = (startX + endX) / 2 + (Math.sin(0.02 + index) * 2) // Very slow flow
            const midY = (startY + endY) / 2 + (Math.cos(0.015 + index) * 4) // Very slow flow
            
            return (
              <g key={index}>
                <path
                  d={`M ${startX}% ${startY}% Q ${midX}% ${midY}% ${endX}% ${endY}%`}
                  stroke="url(#myceliumGradient)"
                  strokeWidth={connection.strength * 1.5 + 0.5}
                  fill="none"
                  opacity={0.2 + connection.strength * 0.3}
                  className="animate-pulse"
                  style={{
                    animationDelay: `${index * 0.8}s`,
                    animationDuration: '4s' // Slower pulse
                  }}
                />
                
                {/* Flowing particles along connections */}
                <circle
                  r="1.5"
                  fill="#8b5cf6"
                  opacity="0.4"
                >
                  <animateMotion
                    dur="12s" // Much slower particle movement
                    repeatCount="indefinite"
                    path={`M ${startX}% ${startY}% Q ${midX}% ${midY}% ${endX}% ${endY}%`}
                    begin={`${index * 1.5}s`}
                  />
                </circle>
              </g>
            )
          })}
          
          {/* Gradient definitions */}
          <defs>
            <linearGradient id="myceliumGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.1" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Central Name Constellation */}
        <div className="relative flex flex-col items-center justify-center overflow-visible px-4" 
             style={{ zIndex: 10, maxWidth: '100vw' }}>
          
          {/* Mobile: Two rows (CHAR / LIE) */}
          <div className="block sm:hidden">
            {/* First Row: C-H-A-R */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {CHARLIE_LETTERS.slice(0, 4).map((letter, letterIndex) => {
                const letterWords = groupedWords[letter] || []
                const hasWords = letterWords.length > 0
                const wordCloudPositions = generateWordCloudPositions(letterWords.length, letterIndex)

                return (
                  <div key={letter} className="relative flex-shrink-0" 
                       style={{ 
                         width: '80px',
                         height: '80px',
                         minWidth: '80px',
                         minHeight: '80px'
                       }}>
                    {/* Central Letter Hub */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className={`
                        relative 
                        w-12 h-12 rounded-lg border-2 flex items-center justify-center
                        transition-all duration-1000 ease-out backdrop-blur-sm
                        ${hasWords 
                          ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                          : 'bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30'
                        }
                      `}>
                        <span className={`
                          text-xl font-mono font-bold transition-all duration-1000
                          ${hasWords ? 'text-white drop-shadow-lg' : 'text-slate-400'}
                        `}>
                          {letter}
                        </span>
                        
                        {/* Pulsing energy field for active letters */}
                        {hasWords && (
                          <div className="absolute inset-0 rounded-lg bg-primary/10 animate-gentle-pulse"></div>
                        )}
                      </div>
                    </div>

                    {/* Word Cloud */}
                    {(() => {
                      // FAIL-SAFE: Use smart word selection and enhanced positioning
                      const displayWords = selectDisplayWords(letterWords, 30)
                      const wordCloudPositions = generateWordCloudPositions(displayWords.length, letterIndex)
                      
                      // Dynamic font sizing based on word count
                      const baseFontSize = displayWords.length > 20 ? 'text-xs' : 
                                          displayWords.length > 15 ? 'text-xs' : 'text-xs'
                      const dynamicPadding = displayWords.length > 20 ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      
                      return displayWords.map((wordData, wordIndex) => {
                        const position = wordCloudPositions[wordIndex]
                        if (!position) return null

                        const isRecent = Date.now() - wordData.timestamp < 30000 // 30 seconds
                        const mobileScale = 0.6 // Smaller scale for mobile
                        
                        // Apply position opacity for density management
                        const finalOpacity = position.opacity || 1
                        
                        return (
                          <div 
                            key={`${wordData.word}-${wordData.timestamp}`}
                            className={`absolute ${baseFontSize} font-medium transition-all duration-500 ease-out group cursor-default z-30`}
                            style={{
                              left: `calc(50% + ${position.x * mobileScale}px)`,
                              top: `calc(50% + ${position.y * mobileScale}px)`,
                              transform: 'translate(-50%, -50%)',
                              animationDelay: `${wordIndex * 100}ms`,
                              opacity: finalOpacity
                            }}
                          >
                            <div className={`
                              ${dynamicPadding} rounded-md backdrop-blur-sm border transition-all duration-300
                              ${hasWords 
                                ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 text-white shadow-sm group-hover:shadow-md group-hover:bg-primary/30' 
                                : 'bg-slate-800/60 border-slate-600/30 text-slate-300'
                              }
                              animate-fade-slide-up
                            `}>
                              {wordData.word}
                            </div>
                            
                            {/* New word indicator */}
                            {isRecent && (
                              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-accent rounded-full animate-ping opacity-80"></div>
                            )}
                          </div>
                        )
                      })
                    })()}

                    {/* Letter word count badge */}
                    {hasWords && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-40">
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-mono bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-1 py-0"
                        >
                          {letterWords.length > 30 ? `30+` : letterWords.length}
                        </Badge>
                        {/* Overflow indicator */}
                        {letterWords.length > 30 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping opacity-60" 
                               title={`${letterWords.length - 30} more words hidden for better layout`}></div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Second Row: L-I-E */}
            <div className="flex items-center justify-center gap-2">
              {CHARLIE_LETTERS.slice(4, 7).map((letter, idx) => {
                const letterIndex = idx + 4 // Adjust index for proper positioning
                const letterWords = groupedWords[letter] || []
                const hasWords = letterWords.length > 0
                const wordCloudPositions = generateWordCloudPositions(letterWords.length, letterIndex)

                return (
                  <div key={letter} className="relative flex-shrink-0" 
                       style={{ 
                         width: '80px',
                         height: '80px',
                         minWidth: '80px',
                         minHeight: '80px'
                       }}>
                    {/* Central Letter Hub */}
                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                      <div className={`
                        relative 
                        w-12 h-12 rounded-lg border-2 flex items-center justify-center
                        transition-all duration-1000 ease-out backdrop-blur-sm
                        ${hasWords 
                          ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                          : 'bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30'
                        }
                      `}>
                        <span className={`
                          text-xl font-mono font-bold transition-all duration-1000
                          ${hasWords ? 'text-white drop-shadow-lg' : 'text-slate-400'}
                        `}>
                          {letter}
                        </span>
                        
                        {/* Pulsing energy field for active letters */}
                        {hasWords && (
                          <div className="absolute inset-0 rounded-lg bg-primary/10 animate-gentle-pulse"></div>
                        )}
                      </div>
                    </div>

                    {/* Word Cloud */}
                    {(() => {
                      // FAIL-SAFE: Use smart word selection and enhanced positioning
                      const displayWords = selectDisplayWords(letterWords, 30)
                      const wordCloudPositions = generateWordCloudPositions(displayWords.length, letterIndex)
                      
                      // Dynamic font sizing based on word count
                      const baseFontSize = displayWords.length > 20 ? 'text-xs' : 
                                          displayWords.length > 15 ? 'text-xs' : 'text-xs'
                      const dynamicPadding = displayWords.length > 20 ? 'px-1.5 py-0.5' : 'px-2 py-1'
                      
                      return displayWords.map((wordData, wordIndex) => {
                        const position = wordCloudPositions[wordIndex]
                        if (!position) return null

                        const isRecent = Date.now() - wordData.timestamp < 30000 // 30 seconds
                        const mobileScale = 0.6 // Smaller scale for mobile
                        
                        // Apply position opacity for density management
                        const finalOpacity = position.opacity || 1
                        
                        return (
                          <div 
                            key={`${wordData.word}-${wordData.timestamp}`}
                            className={`absolute ${baseFontSize} font-medium transition-all duration-500 ease-out group cursor-default z-30`}
                            style={{
                              left: `calc(50% + ${position.x * mobileScale}px)`,
                              top: `calc(50% + ${position.y * mobileScale}px)`,
                              transform: 'translate(-50%, -50%)',
                              animationDelay: `${wordIndex * 100}ms`,
                              opacity: finalOpacity
                            }}
                          >
                            <div className={`
                              ${dynamicPadding} rounded-md backdrop-blur-sm border transition-all duration-300
                              ${hasWords 
                                ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 text-white shadow-sm group-hover:shadow-md group-hover:bg-primary/30' 
                                : 'bg-slate-800/60 border-slate-600/30 text-slate-300'
                              }
                              animate-fade-slide-up
                            `}>
                              {wordData.word}
                            </div>
                            
                            {/* New word indicator */}
                            {isRecent && (
                              <div className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-accent rounded-full animate-ping opacity-80"></div>
                            )}
                          </div>
                        )
                      })
                    })()}

                    {/* Letter word count badge */}
                    {hasWords && (
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 z-40">
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-mono bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-1 py-0"
                        >
                          {letterWords.length > 30 ? `30+` : letterWords.length}
                        </Badge>
                        {/* Overflow indicator */}
                        {letterWords.length > 30 && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping opacity-60" 
                               title={`${letterWords.length - 30} more words hidden for better layout`}></div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Desktop: Single row (CHARLIE) */}
          <div className="hidden sm:flex items-center justify-center gap-2 sm:gap-4 md:gap-6 lg:gap-8">
            {CHARLIE_LETTERS.map((letter, letterIndex) => {
              const letterWords = groupedWords[letter] || []
              const hasWords = letterWords.length > 0
              const wordCloudPositions = generateWordCloudPositions(letterWords.length, letterIndex)

              return (
                <div key={letter} className="relative flex-shrink-0" 
                     style={{ 
                       width: 'clamp(100px, 12vw, 160px)',
                       height: 'clamp(100px, 12vw, 160px)',
                       minWidth: '100px',
                       minHeight: '100px'
                     }}>
                  {/* Central Letter Hub */}
                  <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className={`
                      relative 
                      w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 lg:w-20 lg:h-20
                      rounded-lg sm:rounded-xl border-2 flex items-center justify-center
                      transition-all duration-1000 ease-out backdrop-blur-sm
                      ${hasWords 
                        ? 'bg-gradient-to-br from-primary/20 to-purple-500/20 border-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                        : 'bg-gradient-to-br from-slate-800/50 to-slate-700/50 border-slate-600/30'
                      }
                    `}>
                      <span className={`
                        text-lg sm:text-xl md:text-2xl lg:text-3xl font-mono font-bold transition-all duration-1000
                        ${hasWords ? 'text-white drop-shadow-lg' : 'text-slate-400'}
                      `}>
                        {letter}
                      </span>
                      
                      {/* Pulsing energy field for active letters */}
                      {hasWords && (
                        <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-primary/10 animate-gentle-pulse"></div>
                      )}
                    </div>
                  </div>

                  {/* Word Cloud for desktop */}
                  {(() => {
                    // FAIL-SAFE: Use smart word selection and enhanced positioning
                    const displayWords = selectDisplayWords(letterWords, 30)
                    const wordCloudPositions = generateWordCloudPositions(displayWords.length, letterIndex)
                    
                    // Dynamic font sizing based on word count
                    const baseFontSize = displayWords.length > 20 ? 'text-xs' : 
                                        displayWords.length > 15 ? 'text-xs' : 'text-xs'
                    const dynamicPadding = displayWords.length > 20 ? 'px-1.5 py-0.5' : 'px-2 py-1'
                    
                    return displayWords.map((wordData, wordIndex) => {
                      const position = wordCloudPositions[wordIndex]
                      if (!position) return null

                      const isRecent = Date.now() - wordData.timestamp < 30000 // 30 seconds
                      
                      return (
                        <div 
                          key={`${wordData.word}-${wordData.timestamp}`}
                          className={`absolute ${baseFontSize} font-medium transition-all duration-500 ease-out group cursor-default z-30`}
                          style={{
                            left: `calc(50% + ${position.x}px)`,
                            top: `calc(50% + ${position.y}px)`,
                            transform: 'translate(-50%, -50%)',
                            animationDelay: `${wordIndex * 100}ms`,
                            opacity: position.opacity || 1
                          }}
                        >
                          <div className={`
                            ${dynamicPadding} rounded-lg backdrop-blur-sm border transition-all duration-300
                            ${hasWords 
                              ? 'bg-gradient-to-r from-primary/20 to-purple-500/20 border-primary/30 text-white shadow-sm group-hover:shadow-md group-hover:bg-primary/30' 
                              : 'bg-slate-800/60 border-slate-600/30 text-slate-300'
                            }
                            animate-fade-slide-up
                          `}>
                            {wordData.word}
                          </div>
                          
                          {/* Subtle connection line to center */}
                          <div 
                            className="absolute w-px bg-gradient-to-t from-primary/15 to-transparent group-hover:from-primary/30 transition-colors duration-300 hidden lg:block"
                            style={{
                              height: `${position.radius * 0.5}px`,
                              left: '50%',
                              bottom: '100%',
                              transformOrigin: 'bottom',
                              transform: `rotate(${position.angle + Math.PI}rad) translateX(-50%)`
                            }}
                          />

                          {/* New word indicator */}
                          {isRecent && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping opacity-80"></div>
                          )}
                        </div>
                      )
                    })
                  })()}

                  {/* Letter word count badge */}
                  {hasWords && (
                    <div className="absolute -bottom-2 sm:bottom-0 left-1/2 transform -translate-x-1/2 z-40">
                      <Badge 
                        variant="secondary" 
                        className="text-xs font-mono bg-primary/20 text-primary border-primary/30 backdrop-blur-md px-1.5 py-0.5"
                      >
                        {letterWords.length > 30 ? `30+` : letterWords.length}
                      </Badge>
                      {/* Overflow indicator */}
                      {letterWords.length > 30 && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-ping opacity-60" 
                             title={`${letterWords.length - 30} more words hidden for better layout`}></div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Floating Action Button for Adding Words */}
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 md:bottom-8 md:right-8 z-50">
          <Button 
            onClick={() => window.open('/zk-moments/zkbirthday/add-word', '_blank')}
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] transition-all duration-300 hover:scale-110 group"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 group-hover:rotate-90 transition-transform duration-300" />
          </Button>
        </div>

        {/* Constellation Status */}
        {totalWords === 0 ? (
          <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-1/2 transform -translate-x-1/2 text-center space-y-2 sm:space-y-4 z-40 px-4">
            <Heart className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-slate-400 opacity-50 animate-pulse" />
            <div className="space-y-2">
              <p className="text-sm sm:text-base md:text-lg text-white/80 font-sans">
                Charlie's constellation is waiting for friends to fill it with love...
              </p>
              <Button 
                onClick={() => window.open('/zk-moments/zkbirthday/add-word', '_blank')}
                className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-mono shadow-[0_0_15px_rgba(139,92,246,0.3)] text-xs sm:text-sm px-3 sm:px-4 py-2"
              >
                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                Add First Word of Friendship
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-8 sm:bottom-12 md:bottom-16 left-1/2 transform -translate-x-1/2 text-center z-40 px-4">
            <p className="text-sm sm:text-base md:text-lg text-white/60 font-mono mb-3">
              <span className="text-primary font-bold">{totalWords}</span> words of friendship dancing around Charlie's name
            </p>
            
            {/* Reset Button - Only show if there are many words */}
            {totalWords >= 5 && (
              <Button
                onClick={async () => {
                  if (confirm('🗑️ Reset the entire constellation? This will clear all words and cannot be undone!')) {
                    try {
                      const sessionId = new URLSearchParams(window.location.search).get('session') || 'charlies-birthday-2024'
                      const response = await fetch(`/api/zkbirthday/words?sessionId=${sessionId}&confirm=yes`, {
                        method: 'DELETE'
                      })
                      const result = await response.json()
                      if (result.success) {
                        // Refresh the page to show the reset
                        window.location.reload()
                      } else {
                        alert('Failed to reset constellation: ' + result.error)
                      }
                    } catch (error) {
                      alert('Error resetting constellation: ' + error.message)
                    }
                  }
                }}
                variant="outline"
                className="border-red-500/40 text-red-400 hover:bg-red-500/20 font-mono text-xs px-3 py-1 mt-2"
              >
                🗑️ Reset Constellation
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Custom CSS Animations */}
      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.1); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes fade-slide-up {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) translateY(15px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) translateY(0) scale(1);
          }
        }
        
        @keyframes gentle-glow {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(139, 92, 246, 0.2);
            transform: translate(-50%, -50%) scale(1);
          }
          50% { 
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.4);
            transform: translate(-50%, -50%) scale(1.02);
          }
        }
        
        @keyframes gentle-bounce {
          0%, 100% { transform: translate(-50%, -50%) translateY(0); }
          50% { transform: translate(-50%, -50%) translateY(-3px); }
        }
        
        @keyframes gentle-float {
          0% { 
            transform: translate(-50%, -50%) translateX(0px) translateY(0px) scale(1);
          }
          25% { 
            transform: translate(-50%, -50%) translateX(1px) translateY(-1px) scale(1.01);
          }
          50% { 
            transform: translate(-50%, -50%) translateX(0px) translateY(-2px) scale(1);
          }
          75% { 
            transform: translate(-50%, -50%) translateX(-1px) translateY(-1px) scale(0.99);
          }
          100% { 
            transform: translate(-50%, -50%) translateX(0px) translateY(0px) scale(1);
          }
        }
        
        .animate-twinkle {
          animation: twinkle ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 3s ease-in-out;
        }
        
        .animate-fade-slide-up {
          animation: fade-slide-up 1s ease-out forwards;
        }
        
        .animate-gentle-glow {
          animation: gentle-glow 2s ease-in-out infinite;
        }
        
        .animate-gentle-float {
          animation: gentle-float ease-in-out infinite;
        }
        
        .animate-reverse {
          animation-direction: reverse;
        }
        
        .animate-bounce {
          animation: gentle-bounce 2s ease-in-out infinite;
        }
        
        /* Responsive text scaling */
        @media (max-width: 640px) {
          .constellation-container {
            transform: scale(0.9);
          }
        }
        
        @media (max-width: 480px) {
          .constellation-container {
            transform: scale(0.8);
          }
        }
        
        /* Safe area padding for mobile devices */
        .safe-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
        
        /* Extra small breakpoint for very small devices */
        @media (min-width: 475px) {
          .xs\\:inline {
            display: inline;
          }
        }
        
        /* Enhanced mobile navigation */
        @media (max-width: 640px) {
          .mobile-nav-compact {
            padding: 0.75rem 1rem;
          }
        }
        
        /* Word cloud specific styles */
        .word-cloud-item {
          transition: all 0.3s ease;
        }
        
        .word-cloud-item:hover {
          z-index: 100;
        }
      `}</style>
    </div>
  )
} 