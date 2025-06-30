"use client"

// --- ZKBirthday: Ritual Memory Constellation ---
// Beautiful interface for creating poetic word constellations around a name
// Cross-platform design ready for NFC companion integration

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Heart, Sparkles, Users, Star, Link, Share2, ArrowRight, Copy, QrCode, Smartphone } from 'lucide-react'

// --- Main ZKBirthday Component ---
export default function ZKBirthdayPage() {
  const [currentStats, setCurrentStats] = useState({
    totalWords: 0,
    lettersCompleted: 0,
    contributors: 0
  })
  const [copySuccess, setCopySuccess] = useState(false)
  const [showQRCode, setShowQRCode] = useState(false)

  const CHARLIE_LETTERS = ['C', 'H', 'A', 'R', 'L', 'I', 'E']
  const addWordUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/zk-moments/zkbirthday/quick-add`
    : ''

  // Simple URL for easy typing
  const simpleUrl = typeof window !== 'undefined'
    ? `${window.location.hostname}/zk-moments/zkbirthday/quick-add`
    : 'localhost:3000/zk-moments/zkbirthday/quick-add'

  // QR Code data URL (using a simple QR API)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(addWordUrl)}&bgcolor=ffffff&color=8b5cf6&margin=15&format=png`

  // Load current stats from shared API with localStorage fallback
  useEffect(() => {
    const updateStats = async () => {
      try {
        // Try to load from shared API first
        const response = await fetch('/api/zkbirthday/words?sessionId=charlies-birthday-2024')
        const result = await response.json()
        
        if (result.success && result.data) {
          setCurrentStats({
            totalWords: result.data.stats.totalWords,
            lettersCompleted: result.data.stats.lettersCompleted,
            contributors: result.data.stats.contributors
          })
          return
        }
      } catch (error) {
        console.warn('Failed to load stats from API, falling back to localStorage:', error)
      }
      
      // Fallback to localStorage
      if (typeof window === 'undefined') return

      const storedWords = localStorage.getItem('zkCharlieWords')
      const words = storedWords ? JSON.parse(storedWords) : []
      
      const uniqueContributors = new Set(words.map((w: any) => w.contributor || 'anonymous')).size
      const lettersWithWords = new Set(words.map((w: any) => w.letter)).size

      setCurrentStats({
        totalWords: words.length,
        lettersCompleted: lettersWithWords,
        contributors: uniqueContributors
      })
    }

    updateStats()
    
    // Update stats every 10 seconds when page is visible
    const interval = setInterval(updateStats, 10000)
    return () => clearInterval(interval)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(addWordUrl)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = addWordUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ZKBirthday: Charlie\'s Memory Constellation',
          text: 'Help create a beautiful word constellation for Charlie\'s birthday!',
          url: addWordUrl
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      copyToClipboard()
    }
  }

  const handleEventReset = async () => {
    const confirmReset = window.confirm(
      '🚨 BIRTHDAY PARTY RESET 🚨\n\nThis will permanently delete ALL words from Charlie\'s constellation.\n\nCurrent words: ' + currentStats.totalWords + '\nContributors: ' + currentStats.contributors + '\n\nOnly use this if something went wrong.\n\nAre you sure?'
    )
    
    if (!confirmReset) return
    
    const doubleConfirm = window.confirm(
      'FINAL CONFIRMATION!\n\nDelete all ' + currentStats.totalWords + ' words and reset Charlie\'s birthday constellation?\n\nThis CANNOT be undone!'
    )
    
    if (!doubleConfirm) return
    
    try {
      console.log('🚨 MANUAL RESET: Clearing all words for charlies-birthday-2024')
      
      const response = await fetch('/api/zkbirthday/words?sessionId=charlies-birthday-2024&confirm=yes', {
        method: 'DELETE'
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('✅ Birthday constellation reset complete!\n\nThe constellation is now empty and ready for fresh contributions.')
        console.log('✅ Reset successful:', result)
        
        // Clear localStorage as well
        localStorage.removeItem('zkCharlieWords')
        localStorage.removeItem('zkCharlieLastIndex')
        localStorage.removeItem('zkBirthdayContributor')
        localStorage.removeItem('zkBirthdayLastLetter')
        
        // Refresh the page to show empty state
        window.location.reload()
      } else {
        alert('❌ Reset failed: ' + result.error)
        console.error('❌ Reset failed:', result)
      }
    } catch (error) {
      console.error('❌ Reset network error:', error)
      alert('❌ Network error during reset. Please try again or check your internet connection.')
    }
  }

  // Debug helper for party troubleshooting
  const handleDebugInfo = () => {
    const debugInfo = {
      sessionId: 'charlies-birthday-2024',
      currentStats,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    console.log('🔍 DEBUG INFO:', debugInfo)
    
    navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = JSON.stringify(debugInfo, null, 2)
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    })
    
    alert('🔍 Debug info copied to clipboard!\n\nShare this with support if you need help.')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Elegant Header */}
      <div className="container mx-auto px-6 py-8 sm:px-8 sm:py-12 max-w-4xl">
        <div className="text-center space-y-6 mb-12">
          {/* Brand Integration */}
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-mono font-bold text-foreground">
              ZK<span className="text-primary">Birthday</span>
            </h1>
          </div>

          {/* Ritual Description */}
          <div className="space-y-4">
            <h2 className="text-xl sm:text-2xl font-sans text-muted-foreground">
              A Ritual Memory Constellation
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto">
              Create a beautiful word constellation around <strong className="text-primary font-mono">CHARLIE</strong>'s name. 
              Each friend contributes one word, building a poetic visual representation of memories and associations.
            </p>
          </div>

          {/* Letter Preview */}
          <div className="flex justify-center items-center space-x-2 sm:space-x-4 my-8">
            {CHARLIE_LETTERS.map((letter, index) => (
              <div 
                key={letter}
                className="relative"
                style={{
                  animationDelay: `${index * 100}ms`
                }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center animate-fade-slide-up">
                  <span className="text-lg sm:text-xl font-mono font-bold text-primary">
                    {letter}
                  </span>
                </div>
                {/* Subtle constellation effect */}
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full opacity-60 animate-gentle-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Simple URL Card */}
          <Card className="border border-border shadow-minimal bg-card/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="font-mono text-primary flex items-center justify-center gap-2">
                <Link className="w-5 h-5" />
                Easy Entry URL
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              {/* Large, Clear URL Display */}
              <div className="bg-muted/30 rounded-lg p-4 border border-primary/20">
                <div className="text-lg sm:text-xl font-mono text-primary break-all">
                  {simpleUrl}
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Share this URL or type it directly in your browser
              </p>
              
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => window.open(addWordUrl, '_blank')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Add Word
                </Button>
                <Button 
                  variant="outline"
                  onClick={copyToClipboard}
                  className="border-primary/30 text-primary hover:bg-primary/5 font-mono"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copySuccess ? 'Copied!' : 'Copy URL'}
                </Button>
              </div>
              
              <Button 
                variant="ghost"
                onClick={handleShare}
                className="text-accent hover:text-accent hover:bg-accent/5 font-mono"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Link
              </Button>
            </CardContent>
          </Card>

          {/* QR Code Sharing Section */}
          <Card className="border-accent/20 bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-white flex items-center justify-center gap-2">
                <QrCode className="w-5 h-5 text-accent" />
                Share with Party Guests
              </CardTitle>
              <p className="text-center text-sm text-white/70">
                Let everyone contribute to Charlie's constellation!
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showQRCode ? (
                <div className="text-center space-y-4">
                  <Button 
                    onClick={() => setShowQRCode(true)}
                    className="bg-gradient-to-r from-accent to-purple-400 hover:from-accent/90 hover:to-purple-400/90 text-white font-medium shadow-lg"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>
                  
                  <div className="space-y-2">
                    <p className="text-xs text-white/60">Or share this link:</p>
                    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg border border-white/10">
                      <span className="flex-1 text-xs font-mono text-white/80 truncate">
                        {simpleUrl}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={copyToClipboard}
                        className="text-accent hover:text-accent hover:bg-accent/10 p-1 h-6 w-6"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {copySuccess && (
                      <p className="text-xs text-green-400 animate-fade-in">✓ Copied to clipboard!</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-fit p-3 bg-white rounded-xl shadow-lg">
                    <img 
                      src={qrCodeUrl} 
                      alt="QR Code for Charlie's Birthday Constellation"
                      className="w-48 h-48 sm:w-56 sm:h-56"
                      onError={() => setShowQRCode(false)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm text-white font-medium">Scan to Add Words</p>
                    <p className="text-xs text-white/60">
                      Guests can quickly add words to the constellation
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => setShowQRCode(false)}
                      className="flex-1 text-white/80 border-white/20 hover:bg-white/10 text-sm"
                    >
                      Hide QR Code
                    </Button>
                    <Button 
                      onClick={copyToClipboard}
                      className="flex-1 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 text-sm"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy Link
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Live Stats & Event Management */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
            <CardContent className="p-4">
              {currentStats.totalWords > 0 ? (
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div>
                    <div className="text-lg font-bold text-primary">{currentStats.totalWords}</div>
                    <div className="text-xs text-white/60">Words</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-accent">{currentStats.lettersCompleted}/7</div>
                    <div className="text-xs text-white/60">Letters</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-400">{currentStats.contributors}</div>
                    <div className="text-xs text-white/60">Contributors</div>
                  </div>
                </div>
              ) : (
                <div className="text-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    🌟 Ready for Charlie's birthday constellation!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share the QR code to start collecting words
                  </p>
                </div>
              )}
              
              {/* Party Management Controls */}
              <div className="pt-3 border-t border-primary/20 space-y-2">
                <div className="flex gap-2">
                  <Button 
                    onClick={handleDebugInfo}
                    variant="ghost"
                    className="flex-1 text-xs text-blue-400/70 hover:text-blue-400 hover:bg-blue-400/5 font-mono"
                  >
                    🔍 Debug Info
                  </Button>
                  <Button 
                    onClick={() => window.open('/zk-moments/zkbirthday/constellation', '_blank')}
                    variant="ghost"
                    className="flex-1 text-xs text-purple-400/70 hover:text-purple-400 hover:bg-purple-400/5 font-mono"
                  >
                    ✨ View Constellation
                  </Button>
                </div>
                
                {currentStats.totalWords > 0 && (
                  <Button 
                    onClick={handleEventReset}
                    variant="ghost"
                    className="w-full text-xs text-red-400/70 hover:text-red-400 hover:bg-red-400/5 font-mono"
                  >
                    🚨 Reset Constellation ({currentStats.totalWords} words)
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* How It Works */}
        <Card className="border border-border shadow-minimal bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-mono text-foreground flex items-center gap-2">
              <Heart className="w-5 h-5 text-destructive" />
              How the Ritual Works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-primary font-mono font-bold">1</span>
                </div>
                <h3 className="font-mono text-sm font-semibold text-foreground">Letter Assignment</h3>
                <p className="text-xs text-muted-foreground">
                  Each person gets assigned the next letter in CHARLIE (C→H→A→R→L→I→E→C→...)
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-accent/10 rounded-lg flex items-center justify-center">
                  <span className="text-accent font-mono font-bold">2</span>
                </div>
                <h3 className="font-mono text-sm font-semibold text-foreground">Word Contribution</h3>
                <p className="text-xs text-muted-foreground">
                  Share one word that you associate with Charlie for your assigned letter
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-success/10 rounded-lg flex items-center justify-center">
                  <span className="text-success font-mono font-bold">3</span>
                </div>
                <h3 className="font-mono text-sm font-semibold text-foreground">Constellation Grows</h3>
                <p className="text-xs text-muted-foreground">
                  Words orbit around their letters, creating a beautiful memory constellation
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-6">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                <span className="font-mono text-primary">Privacy-First Design:</span> All words are stored locally in your browser. 
                No cloud storage, no external tracking. Pure, ephemeral birthday magic.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground font-sans">
            Built with <span className="text-destructive">♥</span> using <span className="font-mono text-primary">KairOS</span> - 
            Wearable protocols for a new civics
          </p>
        </div>
      </div>
    </div>
  )
} 