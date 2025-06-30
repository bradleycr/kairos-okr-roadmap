"use client"

// --- ZKBirthday Add Word: Letter Assignment & Contribution ---
// Interface for adding words to Charlie's memory constellation
// Handles letter rotation and localStorage management

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Heart, Check, ArrowLeft, Sparkles, Users } from 'lucide-react'
import { getNextLetter, saveWord, loadGroupedWords } from '../utils'

// --- Add Word Component ---
export default function AddWordPage() {
  const [currentLetter, setCurrentLetter] = useState('')
  const [inputWord, setInputWord] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [recentWords, setRecentWords] = useState<Array<{letter: string, word: string, timestamp: number}>>([])
  const [contributor, setContributor] = useState('')

  const CHARLIE_LETTERS = ['C', 'H', 'A', 'R', 'L', 'I', 'E']

  // Get assigned letter on mount
  useEffect(() => {
    console.log('AddWordPage: Getting next letter...')
    
    // Use random letter assignment instead of sequential
    const getRandomLetter = () => {
      const lastLetter = localStorage.getItem('zkBirthdayLastLetter')
      let availableLetters = [...CHARLIE_LETTERS]
      
      // Avoid giving the same letter twice in a row
      if (lastLetter && availableLetters.length > 1) {
        availableLetters = availableLetters.filter(letter => letter !== lastLetter)
      }
      
      const randomIndex = Math.floor(Math.random() * availableLetters.length)
      const chosenLetter = availableLetters[randomIndex]
      
      // Store this letter as the last assigned
      localStorage.setItem('zkBirthdayLastLetter', chosenLetter)
      
      return chosenLetter
    }
    
    const letter = getRandomLetter()
    console.log('AddWordPage: Assigned letter:', letter)
    setCurrentLetter(letter)
    
    // Load recent words for preview
    const grouped = loadGroupedWords()
    console.log('AddWordPage: Loaded grouped words:', grouped)
    const recent = Object.entries(grouped)
      .flatMap(([letter, words]) => 
        words.map(word => ({ letter, word: word.word, timestamp: word.timestamp }))
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)
    setRecentWords(recent)
    console.log('AddWordPage: Recent words:', recent)

    // Generate a simple contributor ID (in a real app, this could be from authentication)
    const storedContributor = localStorage.getItem('zkBirthdayContributor')
    if (storedContributor) {
      setContributor(storedContributor)
      console.log('AddWordPage: Using existing contributor:', storedContributor)
    } else {
      const newContributor = `friend_${Math.random().toString(36).substring(2, 8)}`
      localStorage.setItem('zkBirthdayContributor', newContributor)
      setContributor(newContributor)
      console.log('AddWordPage: Created new contributor:', newContributor)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('AddWordPage: Submit attempted with:', { 
      inputWord: inputWord.trim(), 
      currentLetter, 
      contributor,
      isSubmitting 
    })
    
    if (!inputWord.trim() || isSubmitting) {
      console.log('AddWordPage: Submit blocked - invalid input or already submitting')
      return
    }

    if (!currentLetter) {
      console.error('AddWordPage: No current letter assigned!')
      return
    }

    setIsSubmitting(true)

    try {
      console.log('AddWordPage: Saving word...')
      // Save the word - now properly awaiting the async function
      const success = await saveWord(currentLetter, inputWord.trim(), contributor)
      console.log('AddWordPage: Save result:', success)
      
      if (success) {
        console.log('AddWordPage: Word saved successfully!')
        setHasSubmitted(true)
        // Small delay for better UX
        setTimeout(() => {
          setInputWord('')
          setIsSubmitting(false)
        }, 1000)
      } else {
        console.error('AddWordPage: Failed to save word')
        setIsSubmitting(false)
        // You might want to show an error message here
      }
    } catch (error) {
      console.error('AddWordPage: Failed to save word:', error)
      setIsSubmitting(false)
      // You might want to show an error message here
    }
  }

  const handleAddAnother = () => {
    setHasSubmitted(false)
    setInputWord('')
    
    // Use random letter assignment for next word
    const getRandomLetter = () => {
      const lastLetter = localStorage.getItem('zkBirthdayLastLetter')
      let availableLetters = [...CHARLIE_LETTERS]
      
      // Avoid giving the same letter twice in a row
      if (lastLetter && availableLetters.length > 1) {
        availableLetters = availableLetters.filter(letter => letter !== lastLetter)
      }
      
      const randomIndex = Math.floor(Math.random() * availableLetters.length)
      const chosenLetter = availableLetters[randomIndex]
      
      // Store this letter as the last assigned
      localStorage.setItem('zkBirthdayLastLetter', chosenLetter)
      
      return chosenLetter
    }
    
    const newLetter = getRandomLetter()
    setCurrentLetter(newLetter)
  }

  const goToConstellation = () => {
    window.open('/zk-moments/zkbirthday/constellation', '_blank')
  }

  const goBack = () => {
    window.history.back()
  }

  if (hasSubmitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md border border-success/20 shadow-minimal bg-card/80 backdrop-blur-sm">
          <CardContent className="text-center space-y-6 pt-8">
            {/* Success Animation */}
            <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center animate-[bounceIn_0.5s_ease-out]">
              <Check className="w-8 h-8 text-success" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-mono font-bold text-foreground">
                Word Added to <span className="text-primary">"{currentLetter}"</span>!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your contribution is now part of Charlie's memory constellation
              </p>
            </div>

            <div className="flex gap-2 justify-center">
              <Button 
                onClick={handleAddAnother}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Add Another
              </Button>
              <Button 
                variant="outline"
                onClick={goToConstellation}
                className="border-accent/30 text-accent hover:bg-accent/5 font-mono"
              >
                View All
              </Button>
            </div>

            <Button 
              variant="ghost" 
              onClick={goBack}
              className="text-muted-foreground hover:text-foreground font-mono"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <Button 
            variant="ghost" 
            onClick={goBack}
            className="text-muted-foreground hover:text-foreground font-mono mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="space-y-2">
            <h1 className="text-2xl font-mono font-bold text-foreground">
              ZK<span className="text-primary">Birthday</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Memory Constellation for Charlie
            </p>
          </div>
        </div>

        {/* Main Input Card */}
        <Card className="border border-border shadow-minimal bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="font-mono text-foreground">
              Your Letter is
            </CardTitle>
            
            {/* Letter Display */}
            <div className="flex justify-center mt-4">
              <div className="w-20 h-20 bg-primary/10 border-2 border-primary/20 rounded-xl flex items-center justify-center animate-gentle-pulse">
                <span className="text-4xl font-mono font-bold text-primary">
                  {currentLetter || 'C'}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-2">
              What is one word you associate with Charlie?
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={inputWord}
                  onChange={(e) => setInputWord(e.target.value)}
                  placeholder="Enter your word..."
                  className="text-center text-lg font-sans border-primary/20 focus:border-primary"
                  maxLength={50}
                  autoFocus
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground text-center">
                  One word that reminds you of Charlie
                </p>
              </div>

              <Button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono"
                disabled={!inputWord.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                    Adding to Constellation...
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Add to Constellation
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Contributions Preview */}
        {recentWords.length > 0 && (
          <Card className="border border-border shadow-minimal bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="font-mono text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-accent" />
                Recent Contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {recentWords.map((item, index) => (
                  <div key={`${item.letter}-${item.timestamp}-${index}`} className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs bg-primary/5 text-primary border-primary/20"
                    >
                      {item.letter}
                    </Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {item.word}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button 
                variant="ghost" 
                onClick={goToConstellation}
                className="w-full mt-3 text-accent hover:text-accent hover:bg-accent/5 font-mono text-sm"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                View Full Constellation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground font-sans">
            Built with <span className="text-destructive">♥</span> using <span className="font-mono text-primary">KairOS</span>
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes gentle-pulse {
          0%, 100% {
            opacity: 0.8;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.1);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-gentle-pulse {
          animation: gentle-pulse 2s ease-in-out infinite;
        }
        
        .animate-bounceIn {
          animation: bounceIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
} 