"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  Volume2, 
  Download,
  Sparkles,
  Waves,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

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
  const audioRitual = useAudioRitual();

  const voices = [
    { id: 'nova', name: 'Nova', description: 'Warm and engaging' },
    { id: 'alloy', name: 'Alloy', description: 'Neutral and clear' },
    { id: 'echo', name: 'Echo', description: 'Calm and soothing' },
    { id: 'fable', name: 'Fable', description: 'Expressive and warm' },
    { id: 'onyx', name: 'Onyx', description: 'Deep and grounding' },
    { id: 'shimmer', name: 'Shimmer', description: 'Gentle and melodic' },
  ];

  useEffect(() => {
    if (autoStart && !audioRitual.audioUrl && !audioRitual.isGeneratingAudio) {
      audioRitual.generateAudio(routine, selectedVoice);
    }
  }, [autoStart, routine, selectedVoice, audioRitual]);

  useEffect(() => {
    if (autoStart && audioRitual.audioUrl && !audioRitual.isPlaying) {
      const timer = setTimeout(() => {
        audioRitual.playAudio();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart, audioRitual.audioUrl, audioRitual.isPlaying, audioRitual]);

  // Calculate current step based on audio progress
  useEffect(() => {
    if (audioRitual.duration > 0 && audioRitual.currentTime > 0) {
      // Rough calculation: intro (30s) + steps evenly distributed + outro (30s)
      const introTime = 30;
      const outroTime = 30;
      const stepTime = (audioRitual.duration - introTime - outroTime) / routine.steps.length;
      
      if (audioRitual.currentTime < introTime) {
        setCurrentStepIndex(-1); // Intro
      } else if (audioRitual.currentTime > audioRitual.duration - outroTime) {
        setCurrentStepIndex(routine.steps.length); // Outro
      } else {
        const stepIndex = Math.floor((audioRitual.currentTime - introTime) / stepTime);
        setCurrentStepIndex(Math.min(stepIndex, routine.steps.length - 1));
      }
    }
  }, [audioRitual.currentTime, audioRitual.duration, routine.steps.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = audioRitual.duration > 0 
    ? (audioRitual.currentTime / audioRitual.duration) * 100 
    : 0;

  // Handle mobile play button with user gesture
  const handlePlayClick = () => {
    if (!audioRitual.isPlaying) {
      audioRitual.playAudio();
    } else {
      audioRitual.pauseAudio();
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
              animate={{ rotate: audioRitual.isPlaying ? 360 : 0 }}
              transition={{ duration: 8, repeat: audioRitual.isPlaying ? Infinity : 0, ease: "linear" }}
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
                
                {/* Audio Visualization */}
                <motion.div 
                  className="relative w-48 h-48 mx-auto"
                  animate={{ scale: audioRitual.isPlaying ? [1, 1.05, 1] : 1 }}
                  transition={{ duration: 2, repeat: audioRitual.isPlaying ? Infinity : 0 }}
                >
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm border border-primary/30" />
                  <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm" />
                  <div className="absolute inset-8 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center">
                    <motion.div
                      animate={{ scale: audioRitual.isPlaying ? [1, 1.2, 1] : 1 }}
                      transition={{ duration: 1.5, repeat: audioRitual.isPlaying ? Infinity : 0 }}
                    >
                      <Waves className="w-16 h-16 text-primary" />
                    </motion.div>
                  </div>
                  
                  <AnimatePresence>
                    {audioRitual.isPlaying && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border border-primary/30"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border border-accent/30"
                          initial={{ scale: 1, opacity: 0.5 }}
                          animate={{ scale: 1.8, opacity: 0 }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        />
                      </>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Status and Progress */}
                <div className="space-y-3">
                  {audioRitual.isGeneratingAudio && (
                    <div className="space-y-3">
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Badge variant="secondary">Generating your 8-minute guided ritual...</Badge>
                      </motion.div>
                      <Progress value={undefined} className="h-2" />
                    </div>
                  )}

                  {audioRitual.audioUrl && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Progress value={progressPercentage} className="h-3" />
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{formatTime(audioRitual.currentTime)}</span>
                          <span>{formatTime(audioRitual.duration)}</span>
                        </div>
                      </div>
                      <Badge variant={audioRitual.isPlaying ? "default" : "outline"}>
                        {audioRitual.isPlaying ? 'Playing your ritual' : 'Ready to begin'}
                      </Badge>
                    </div>
                  )}

                  {audioRitual.error && (
                    <Badge variant="destructive">{audioRitual.error}</Badge>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center space-x-4">
                  {!audioRitual.audioUrl ? (
                    <div className="space-y-4">
                      <Button
                        onClick={() => audioRitual.generateAudio(routine, selectedVoice)}
                        disabled={audioRitual.isGeneratingAudio}
                        size="lg"
                        className="px-8"
                      >
                        {audioRitual.isGeneratingAudio ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-5 h-5 mr-2" />
                            Create 8-Minute Audio Ritual
                          </>
                        )}
                      </Button>
                      
                      {!audioRitual.isGeneratingAudio && (
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">Choose your guide's voice:</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {voices.map((voice) => (
                              <Button
                                key={voice.id}
                                variant={selectedVoice === voice.id ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedVoice(voice.id)}
                                className="text-xs"
                              >
                                {voice.name}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => audioRitual.seekTo(Math.max(0, audioRitual.currentTime - 30))}
                      >
                        -30s
                      </Button>
                      
                      <Button
                        onClick={handlePlayClick}
                        size="lg"
                        className="w-16 h-16 rounded-full"
                      >
                        {audioRitual.isPlaying ? (
                          <Pause className="w-6 h-6" />
                        ) : (
                          <Play className="w-6 h-6" />
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => audioRitual.seekTo(Math.min(audioRitual.duration, audioRitual.currentTime + 30))}
                      >
                        +30s
                      </Button>
                    </>
                  )}
                </div>
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
              
              {audioRitual.audioUrl && (
                <Button
                  variant="outline"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = audioRitual.audioUrl;
                    a.download = 'morning-ritual.mp3';
                    a.click();
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </div>

          {/* Ritual Steps Display */}
          {showSteps && (
            <div className="lg:w-96">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm h-full">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Your Ritual Steps</h3>
                    {audioRitual.isPlaying && (
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
                        currentStepIndex === -1 && audioRitual.isPlaying 
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
                          index === currentStepIndex && audioRitual.isPlaying 
                            ? 'bg-primary/20 border border-primary/30' 
                            : 'bg-muted/30'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
                            index === currentStepIndex && audioRitual.isPlaying
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
                        currentStepIndex >= routine.steps.length && audioRitual.isPlaying 
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