"use client"

// --- ZKBirthday Quick Add: Mobile-Optimized Party Experience ---
// Streamlined interface for quick word contributions via QR code
// Perfect for party guests to instantly add words to the constellation

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Heart, Check, Sparkles, Users, Star, ArrowRight, Zap } from 'lucide-react'

// --- Types ---
interface WordData {
  id: string
  word: string
  contributor: string
  timestamp: number
}

interface ApiResponse {
  success: boolean
  data?: any
  error?: string
}

// --- Quick Add Component ---
export default function QuickAddPage() {
  const [inputWord, setInputWord] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assignedLetter, setAssignedLetter] = useState<string>('')
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    letter?: string
    word?: string
    error?: string
  } | null>(null)
  const [recentWords, setRecentWords] = useState<WordData[]>([])
  const [totalWords, setTotalWords] = useState(0)

  const CHARLIE_LETTERS = ['C', 'H', 'A', 'R', 'L', 'I', 'E']
  const sessionId = 'charlies-birthday-2024' // Could be dynamic for different events

  // Load existing data and assign letter on mount
  useEffect(() => {
    loadRecentWords()
    assignUserLetter()
  }, [])

  const generateFriendlyName = () => {
    const adjectives = ['Happy', 'Joyful', 'Bright', 'Cheerful', 'Wonderful', 'Amazing', 'Brilliant', 'Fantastic']
    const nouns = ['Friend', 'Guest', 'Visitor', 'Contributor', 'Helper', 'Buddy', 'Pal', 'Companion']
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const num = Math.floor(Math.random() * 100)
    return `${adj}${noun}${num}`
  }

  const loadRecentWords = async () => {
    try {
      const response = await fetch(`/api/zkbirthday/words?sessionId=${sessionId}`)
      const result: ApiResponse = await response.json()
      
      if (result.success && result.data) {
        // Flatten all words and get recent ones
        const allWords = Object.values(result.data.words)
          .flat()
          .sort((a: any, b: any) => b.timestamp - a.timestamp)
          .slice(0, 8)
        
        setRecentWords(allWords as WordData[])
        setTotalWords(result.data.stats.totalWords)
      }
    } catch (error) {
      console.error('Failed to load recent words:', error)
    }
  }

  const assignUserLetter = async () => {
    try {
      // Get the last assigned letter for this user to avoid repeats
      const lastLetter = localStorage.getItem('zkBirthdayLastLetter')
      
      // Get current distribution to avoid overloading any letter
      const response = await fetch(`/api/zkbirthday/words?sessionId=${sessionId}`)
      let availableLetters = [...CHARLIE_LETTERS]
      
      if (response.ok) {
        const result: ApiResponse = await response.json()
        
        if (result.success && result.data) {
          const wordsData = result.data.words
          
          // Find letters that are significantly overloaded (more than 3 extra words than average)
          const letterCounts = CHARLIE_LETTERS.map(letter => ({
            letter,
            count: wordsData[letter]?.length || 0
          }))
          
          const totalWords = letterCounts.reduce((sum, item) => sum + item.count, 0)
          const averagePerLetter = totalWords / CHARLIE_LETTERS.length
          const maxReasonable = Math.floor(averagePerLetter + 3)
          
          // Filter out overloaded letters if we have enough alternatives
          const notOverloaded = letterCounts.filter(item => item.count <= maxReasonable)
          if (notOverloaded.length >= 3) {
            availableLetters = notOverloaded.map(item => item.letter)
          }
        }
      }
      
      // Remove the last letter from available options to avoid consecutive repeats
      if (lastLetter && availableLetters.length > 1) {
        availableLetters = availableLetters.filter(letter => letter !== lastLetter)
      }
      
      // Randomly select from available letters
      const randomIndex = Math.floor(Math.random() * availableLetters.length)
      const chosenLetter = availableLetters[randomIndex]
      
      // Store this letter as the last assigned
      localStorage.setItem('zkBirthdayLastLetter', chosenLetter)
      
      setAssignedLetter(chosenLetter)
      
    } catch (error) {
      console.error('Failed to assign letter:', error)
      
      // Fallback: random letter avoiding last one
      const lastLetter = localStorage.getItem('zkBirthdayLastLetter')
      let availableLetters = [...CHARLIE_LETTERS]
      
      if (lastLetter && availableLetters.length > 1) {
        availableLetters = availableLetters.filter(letter => letter !== lastLetter)
      }
      
      const randomIndex = Math.floor(Math.random() * availableLetters.length)
      const chosenLetter = availableLetters[randomIndex]
      
      localStorage.setItem('zkBirthdayLastLetter', chosenLetter)
      setAssignedLetter(chosenLetter)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputWord.trim() || !assignedLetter) return

    setIsSubmitting(true)
    setSubmissionResult(null)

    try {
      // Auto-generate a friendly contributor name
      const autoContributor = generateFriendlyName()
      
      // Submit the word
      const response = await fetch('/api/zkbirthday/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          letter: assignedLetter,
          word: inputWord.trim(),
          contributor: autoContributor,
          sessionId
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmissionResult({
          success: true,
          letter: assignedLetter,
          word: inputWord.trim()
        })
        setInputWord('')
        await loadRecentWords()
        // Get new letter assignment for next word
        await assignUserLetter()
      } else {
        setSubmissionResult({
          success: false,
          error: result.error || 'Failed to submit word'
        })
      }

    } catch (error) {
      console.error('Submission error:', error)
      setSubmissionResult({
        success: false,
        error: 'Network error. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAnother = () => {
    setSubmissionResult(null)
    setInputWord('')
  }

  const goToConstellation = () => {
    window.open(`/zk-moments/zkbirthday/constellation?session=${sessionId}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 p-4 pb-8 pt-16">
        <div className="max-w-md mx-auto space-y-6">
          
          {/* Stats Badge */}
          {totalWords > 0 && (
            <div className="text-center">
              <Badge variant="outline" className="text-sm font-mono bg-primary/10 text-primary border-primary/30">
                {totalWords} words of friendship ✨
              </Badge>
            </div>
          )}

          {/* Letter Assignment Display */}
          {assignedLetter && (
            <Card className="border border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-purple-500/5 backdrop-blur-sm">
              <CardContent className="text-center pt-6 pb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 bg-primary/20 border-2 border-primary/40 rounded-xl flex items-center justify-center animate-gentle-pulse shadow-lg">
                    <span className="text-5xl font-mono font-bold text-primary drop-shadow-sm">
                      {assignedLetter}
                    </span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-2">
                  Add a word starting with <span className="font-mono font-bold text-primary">{assignedLetter}</span> that reminds you of Charlie
                </p>
                <p className="text-xs text-muted-foreground">
                  Examples: {assignedLetter === 'C' ? 'Creative, Caring, Cheerful' : 
                           assignedLetter === 'H' ? 'Happy, Helpful, Hilarious' :
                           assignedLetter === 'A' ? 'Amazing, Artistic, Awesome' :
                           assignedLetter === 'R' ? 'Radiant, Reliable, Remarkable' :
                           assignedLetter === 'L' ? 'Loving, Loyal, Lively' :
                           assignedLetter === 'I' ? 'Inspiring, Incredible, Intelligent' :
                           assignedLetter === 'E' ? 'Energetic, Empathetic, Extraordinary' : 'Creative, Kind, Fun'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submission Result */}
          {submissionResult && (
            <Card className={`border-2 ${submissionResult.success 
              ? 'border-green-400/50 bg-green-950/20' 
              : 'border-red-400/50 bg-red-950/20'
            }`}>
              <CardContent className="p-4 text-center">
                {submissionResult.success ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center">
                      <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Perfect! ✨</p>
                      <p className="text-sm text-white/80">
                        "<span className="font-mono text-primary">{submissionResult.word}</span>" 
                        added to letter <span className="font-bold text-accent">{submissionResult.letter}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddAnother}
                        className="flex-1 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40"
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Add Another
                      </Button>
                      <Button 
                        onClick={goToConstellation}
                        variant="outline"
                        className="flex-1 border-accent/40 text-accent hover:bg-accent/10"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        View Stars
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-red-400 font-medium">Oops!</p>
                    <p className="text-sm text-white/80">{submissionResult.error}</p>
                    <Button 
                      onClick={handleAddAnother}
                      variant="outline"
                      className="border-red-400/40 text-red-400 hover:bg-red-400/10"
                    >
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Word Input Form */}
          {!submissionResult && (
            <Card className="border border-border shadow-minimal bg-card/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Word Input */}
                  <div className="space-y-3">
                    <Input
                      type="text"
                      value={inputWord}
                      onChange={(e) => setInputWord(e.target.value)}
                      placeholder={assignedLetter ? `Enter a word starting with "${assignedLetter}"...` : 'Enter a word...'}
                      className="text-lg h-12 border-border focus:border-primary transition-colors text-center"
                      disabled={isSubmitting || !assignedLetter}
                      maxLength={50}
                      autoFocus
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-base"
                    disabled={!inputWord.trim() || isSubmitting || !assignedLetter}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-foreground border-t-transparent mr-2"></div>
                        Adding your word...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5 mr-2" />
                        Add "{assignedLetter}" Word to Constellation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Recent Words Preview */}
          {recentWords.length > 0 && !submissionResult && (
            <Card className="border-accent/20 bg-black/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-center text-white/80 flex items-center justify-center gap-2">
                  <Users className="w-4 h-4" />
                  Recent Additions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {recentWords.slice(0, 6).map((word, index) => (
                    <div 
                      key={word.id || index}
                      className="text-center p-2 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="text-sm font-mono text-primary">{word.word}</div>
                      <div className="text-xs text-white/50">{word.contributor}</div>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={goToConstellation}
                  variant="ghost"
                  className="w-full mt-3 text-accent hover:text-accent hover:bg-accent/5 text-sm"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  View Full Constellation
                </Button>
              </CardContent>
            </Card>
          )}

        </div>
      </div>

      {/* Custom CSS for safe area */}
      <style jsx global>{`
        .safe-top {
          padding-top: env(safe-area-inset-top, 0px);
        }
      `}</style>
    </div>
  )
} 