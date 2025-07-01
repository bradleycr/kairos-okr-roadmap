"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download,
  Sparkles,
  Waves,
  X,
  Eye,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { SkipBack, SkipForward, Sunrise } from 'lucide-react';

import type { Routine } from '../types';
import { useAudioRitual } from '../hooks/useAudioRitual';

interface AudioRitualViewProps {
  routine: Routine;
  onClose?: () => void;
  autoStart?: boolean;
}

export function AudioRitualView({ routine, onClose, autoStart = false }: AudioRitualViewProps) {
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [showSteps, setShowSteps] = useState(true); // Show by default
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const {
    isGeneratingAudio,
    isPlaying,
    audioUrl,
    currentTime,
    duration,
    error,
    generateAudio,
    playAudio,
    pauseAudio,
    seekTo,
    clearAudio,
    downloadAudio,
  } = useAudioRitual();

  const voices = [
    { id: 'nova', name: 'Nova', description: 'Warm and engaging' },
    { id: 'alloy', name: 'Alloy', description: 'Neutral and clear' },
    { id: 'echo', name: 'Echo', description: 'Calm and soothing' },
    { id: 'fable', name: 'Fable', description: 'Expressive and warm' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and grounding' },
    { id: 'shimmer', name: 'Shimmer', description: 'Gentle and melodic' },
  ];

  useEffect(() => {
    if (autoStart && !audioUrl && !isGeneratingAudio) {
      generateAudio(routine, selectedVoice);
    }
  }, [autoStart, routine, selectedVoice, generateAudio]);

  useEffect(() => {
    if (autoStart && audioUrl && !isPlaying) {
      const timer = setTimeout(() => {
        playAudio();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, audioUrl, isPlaying, playAudio]);

  // Calculate current step based on audio progress
  useEffect(() => {
    if (duration > 0 && currentTime > 0) {
      // Rough calculation: intro (30s) + steps evenly distributed + outro (30s)
      const introTime = 30;
      const outroTime = 30;
      const stepTime = (duration - introTime - outroTime) / routine.steps.length;
      
      if (currentTime < introTime) {
        setCurrentStepIndex(-1); // Intro
      } else if (currentTime > duration - outroTime) {
        setCurrentStepIndex(routine.steps.length); // Outro
      } else {
        const stepIndex = Math.floor((currentTime - introTime) / stepTime);
        setCurrentStepIndex(Math.min(stepIndex, routine.steps.length - 1));
      }
    }
  }, [currentTime, duration, routine.steps.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 
    ? (currentTime / duration) * 100 
    : 0;

  // Handle mobile play button with user gesture
  const handlePlayClick = () => {
    if (!isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-primary/5 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 opacity-20">
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgb(var(--primary)) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 50%, rgb(var(--primary)) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 50%, rgb(var(--primary)) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="relative z-10 min-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{ duration: 8, repeat: isPlaying ? Infinity : 0, ease: "linear" }}
            >
              <Sparkles className="w-8 h-8 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-light text-primary">Guided Morning Ritual</h1>
              <p className="text-sm text-muted-foreground">
                {routine.date} • 8 minutes • Personalized for you
              </p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6">
          {/* Main Audio Player */}
          <div className="flex-1">
            <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 text-center space-y-6">
                
                {/* Error Display */}
                {error && (
                  <Alert className="mb-6 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <AlertDescription className="text-red-800 dark:text-red-200">
                      {error}
                      {error.includes('regenerating') && (
                        <Button
                          variant="link"
                          size="sm"
                          className="ml-2 h-auto p-0 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          onClick={() => generateAudio(routine, selectedVoice)}
                        >
                          Try Again
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Voice Selection & Audio Generation */}
                {!audioUrl && !isGeneratingAudio && !error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    <div className="text-center space-y-4">
                      <h3 className="text-lg font-medium">Generate Audio Ritual</h3>
                      <p className="text-sm text-muted-foreground">
                        Choose a voice to guide you through your 8-minute morning ritual
                      </p>
                      
                      {/* Voice Selection */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
                        {voices.map((voice) => (
                          <Button
                            key={voice.id}
                            variant={selectedVoice === voice.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedVoice(voice.id)}
                            className="flex flex-col h-auto p-3"
                          >
                            <span className="font-medium">{voice.name}</span>
                            <span className="text-xs text-muted-foreground">{voice.description}</span>
                          </Button>
                        ))}
                      </div>
                      
                      {/* Generate Button */}
                      <Button
                        onClick={() => generateAudio(routine, selectedVoice)}
                        size="lg"
                        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-8 py-3"
                      >
                        <Volume2 className="w-5 h-5 mr-2" />
                        Generate Audio Ritual
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Loading State */}
                {isGeneratingAudio && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                      <Waves className="w-8 h-8 text-white animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">Creating Your Audio Ritual</h3>
                      <p className="text-sm text-muted-foreground">
                        Using {voices.find(v => v.id === selectedVoice)?.name} voice • This may take 30-60 seconds
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Audio Controls */}
                {audioUrl && !error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-6"
                  >
                    {/* Audio Visualization */}
                    <div className="relative h-32 bg-gradient-to-r from-orange-100/50 via-amber-100/50 to-yellow-100/50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20 rounded-xl overflow-hidden">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-orange-400/20 to-amber-400/20"
                        animate={{
                          scale: isPlaying ? [1, 1.02, 1] : 1,
                          opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.3,
                        }}
                        transition={{
                          duration: 3,
                          repeat: isPlaying ? Infinity : 0,
                          ease: "easeInOut"
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.div
                          animate={{
                            rotate: isPlaying ? 360 : 0,
                          }}
                          transition={{
                            duration: 20,
                            repeat: isPlaying ? Infinity : 0,
                            ease: "linear"
                          }}
                        >
                          <Sunrise className="w-12 h-12 text-orange-500" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div className="relative">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-orange-400 to-amber-400"
                            style={{
                              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%'
                            }}
                            transition={{ duration: 0.1 }}
                          />
                        </div>
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={(e) => seekTo(Number(e.target.value))}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex items-center justify-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => seekTo(Math.max(0, currentTime - 30))}
                        className="rounded-full"
                      >
                        <SkipBack className="w-4 h-4" />
                        <span className="ml-1 text-xs">30s</span>
                      </Button>

                      <Button
                        onClick={isPlaying ? pauseAudio : playAudio}
                        size="lg"
                        className="rounded-full w-16 h-16 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6 ml-1" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => seekTo(Math.min(duration, currentTime + 30))}
                        className="rounded-full"
                      >
                        <SkipForward className="w-4 h-4" />
                        <span className="ml-1 text-xs">30s</span>
                      </Button>
                    </div>

                    {/* Download & Voice Change Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadAudio}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Audio
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAudio}
                        className="text-primary hover:bg-primary/10"
                      >
                        <Volume2 className="w-4 h-4 mr-2" />
                        Change Voice
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Additional Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4">
              <Button
                variant="outline"
                onClick={() => setShowSteps(!showSteps)}
              >
                {showSteps ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showSteps ? 'Hide Steps' : 'Show Steps'}
              </Button>
            </div>
          </div>

          {/* Ritual Steps Display */}
          {showSteps && (
            <div className="lg:w-96">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Your Ritual Steps</h3>
                    {isPlaying && (
                      <Badge variant="outline" className="text-xs">
                        {currentStepIndex === -1 ? 'Introduction' : 
                         currentStepIndex >= routine.steps.length ? 'Closing' :
                         `Step ${currentStepIndex + 1} of ${routine.steps.length}`}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Introduction */}
                    <motion.div
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        currentStepIndex === -1 && isPlaying 
                          ? 'bg-primary/20 border border-primary/30' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs font-medium text-accent">○</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Welcome</p>
                          <p className="text-xs text-muted-foreground">Getting centered and ready</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Steps */}
                    {routine.steps.map((step, index) => (
                      <motion.div
                        key={index}
                        className={`p-3 rounded-lg transition-all duration-300 ${
                          index === currentStepIndex && isPlaying 
                            ? 'bg-primary/20 border border-primary/30' 
                            : 'bg-muted/30'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            index === currentStepIndex && isPlaying
                              ? 'bg-primary/30 animate-pulse'
                              : 'bg-primary/20'
                          }`}>
                            <span className="text-xs font-medium text-primary">{index + 1}</span>
                          </div>
                          <p className="text-sm leading-relaxed">{step}</p>
                        </div>
                      </motion.div>
                    ))}

                    {/* Closing */}
                    <motion.div
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        currentStepIndex >= routine.steps.length && isPlaying 
                          ? 'bg-primary/20 border border-primary/30' 
                          : 'bg-muted/30'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-xs font-medium text-accent">✓</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">Complete</p>
                          <p className="text-xs text-muted-foreground">Carrying the energy forward</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 