"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Clock, 
  Settings, 
  Trash2, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Play,
  Edit3,
  Volume2,
  RotateCcw,
  Zap,
  BarChart3,
  Square
} from 'lucide-react';

import { useVoiceDump } from '../hooks/useVoiceDump';
import { useMorningMemory } from '../hooks/useMorningMemory';
import { useMorningEightSettings } from '../hooks/useMorningEightSettings';
import { AudioRitualView } from './AudioRitualView';
import type { Routine } from '../types';

interface MorningEightPanelProps {
  onRoutineSelect: (routine: Routine) => void;
}

// Enhanced Waveform Visualization Component
function WaveformVisualization({ 
  waveformData, 
  audioLevel, 
  isRecording, 
  duration, 
  maxDuration 
}: {
  waveformData: number[];
  audioLevel: number;
  isRecording: boolean;
  duration: number;
  maxDuration: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw waveform bars
    const barCount = 50;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * waveformData.length);
      const barHeight = waveformData[dataIndex] || 0;
      
      // Create gradient based on app colors
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      if (isRecording) {
        // Use primary color (warm orange) for recording
        gradient.addColorStop(0, 'rgba(245, 181, 145, 0.8)');
        gradient.addColorStop(0.5, 'rgba(245, 181, 145, 0.9)');
        gradient.addColorStop(1, 'rgba(245, 181, 145, 1)');
      } else {
        // Use accent color (dusty teal) for idle
        gradient.addColorStop(0, 'rgba(144, 193, 196, 0.6)');
        gradient.addColorStop(0.5, 'rgba(144, 193, 196, 0.8)');
        gradient.addColorStop(1, 'rgba(144, 193, 196, 1)');
      }
      
      ctx.fillStyle = gradient;
      
      const normalizedHeight = (barHeight / 100) * height * 0.8;
      const y = height - normalizedHeight;
      
      ctx.fillRect(i * barWidth, y, barWidth - 1, normalizedHeight);
    }

    // Draw audio level indicator
    if (isRecording && audioLevel > 0) {
      const levelHeight = (audioLevel / 100) * height * 0.3;
      ctx.fillStyle = `rgba(245, 181, 145, ${0.4 + (audioLevel / 100) * 0.4})`;
      ctx.fillRect(0, height - levelHeight, width, levelHeight);
    }

    // Draw time progress
    const progress = duration / maxDuration;
    const progressWidth = width * progress;
    
    ctx.fillStyle = 'rgba(245, 181, 145, 0.3)';
    ctx.fillRect(0, height - 2, progressWidth, 2);
    
  }, [waveformData, audioLevel, isRecording, duration, maxDuration]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={100}
        className="w-full h-24 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 border border-border"
      />
      <div className="absolute top-2 right-2 text-xs font-mono text-muted-foreground">
        {duration}s / {maxDuration}s
      </div>
      {isRecording && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          Recording
        </div>
      )}
    </div>
  );
}

// Enhanced Routine Display Component
function CurrentRoutineDisplay({ routine, onEdit, onPlay }: {
  routine: any;
  onEdit: () => void;
  onPlay: () => void;
}) {
  if (!routine) {
    return (
      <Card className="border-dashed border-2 border-muted">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            No Routine Generated
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Record some voice dumps and generate your personalized 8-minute morning ritual
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card/80 to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Your Morning Ritual</CardTitle>
              <p className="text-sm text-muted-foreground">
                Generated {routine.date} • {routine.steps.length} steps • 8 minutes
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button size="sm" onClick={onPlay}>
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {routine.steps.slice(0, 3).map((step: string, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-3 p-3 rounded-lg bg-background/50"
            >
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-primary">{index + 1}</span>
              </div>
              <p className="text-sm leading-relaxed">{step}</p>
            </motion.div>
          ))}
          
          {routine.steps.length > 3 && (
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                +{routine.steps.length - 3} more steps
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function MorningEightPanel({ onRoutineSelect }: MorningEightPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const [showRoutineView, setShowRoutineView] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<any>(null);
  const [editMode, setEditMode] = useState<'record' | 'edit'>('record');
  const { toast } = useToast();

  // Hooks
  const voiceDump = useVoiceDump();
  const memory = useMorningMemory();
  const settings = useMorningEightSettings();

  // Handle new transcriptions
  useEffect(() => {
    if (voiceDump.lastTranscription && voiceDump.recordingState === 'complete') {
      setShowTranscription(true);
    }
  }, [voiceDump.lastTranscription, voiceDump.recordingState]);

  // Main recording handler - now properly handles stop
  const handleRecord = async () => {
    if (voiceDump.isRecording) {
      // Stop recording
      voiceDump.stop();
      return;
    }

    // Start recording
    try {
      const result = await voiceDump.record();
      if (result) {
        toast({
          title: "Recording Complete",
          description: "Voice transcribed successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: error instanceof Error ? error.message : "Could not record audio",
        variant: "destructive",
      });
    }
  };

  const handleVoiceEdit = async () => {
    setEditMode('edit');
    handleRecord();
  };

  const handleAddToMemory = async () => {
    if (!voiceDump.lastTranscription) return;

    try {
      await memory.addDump(voiceDump.lastTranscription);
      voiceDump.clear();
      setShowTranscription(false);
      setEditMode('record');

      toast({
        title: "Added to Memory",
        description: "Voice dump saved successfully",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Could not save voice dump",
        variant: "destructive",
      });
    }
  };

  const handleGenerateRoutine = async () => {
    try {
      const routine = await memory.generateRoutine();
      if (routine) {
        toast({
          title: "Ritual Generated",
          description: "Your personalized 8-minute morning ritual is ready",
        });
        // Trigger the routine selection flow
        onRoutineSelect(routine);
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate routine",
        variant: "destructive",
      });
    }
  };

  // Clear all data
  const handleClearMemory = async () => {
    if (!confirm('This will clear all your voice dumps and routine. Continue?')) return;

    try {
      await memory.clearMemory();
      voiceDump.clear();
      toast({
        title: "Memory Cleared",
        description: "All voice dumps and routine have been cleared",
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Could not clear memory data",
        variant: "destructive",
      });
    }
  };

  const handleRoutineAction = (routine: any) => {
    setSelectedRoutine(routine);
    setShowRoutineView(true);
  };

  const getRecordingButtonState = () => {
    if (editMode === 'edit') {
      return {
        color: voiceDump.isRecording 
          ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
          : 'bg-accent hover:bg-accent/90 text-accent-foreground',
        icon: voiceDump.isRecording ? Square : Edit3,
        text: voiceDump.isRecording ? 'Stop Editing' : 'Voice Edit Ritual'
      };
    }
    
    return {
      color: voiceDump.isRecording 
        ? 'bg-secondary hover:bg-secondary/90 text-secondary-foreground' 
        : 'bg-primary hover:bg-primary/90 text-primary-foreground',
      icon: voiceDump.isRecording ? Square : Mic,
      text: voiceDump.isRecording 
        ? `Stop Recording (${voiceDump.recordingDuration || 0}s)` 
        : 'Record Voice Dump'
    };
  };

  if (memory.loading || settings.loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">Loading Morning Eight...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showRoutineView && selectedRoutine) {
    return (
      <AudioRitualView
        routine={selectedRoutine}
        onClose={() => setShowRoutineView(false)}
        autoStart={false}
      />
    );
  }

  const buttonState = getRecordingButtonState();
  const ButtonIcon = buttonState.icon;

  return (
    <div className="space-y-6">
      {/* Current Routine Display */}
      <CurrentRoutineDisplay
        routine={memory.currentRoutine}
        onEdit={handleVoiceEdit}
        onPlay={() => memory.currentRoutine && handleRoutineAction(memory.currentRoutine)}
      />

      {/* Enhanced Voice Recording Card */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle>Voice Input</CardTitle>
              <Badge variant="outline" className="text-xs">
                {memory.memory?.dumps.length || 0} dumps
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={settings.settings.enabled}
                onCheckedChange={(enabled) => settings.updateSettings({ enabled })}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Waveform Visualization */}
          {(voiceDump.isRecording || voiceDump.waveformData?.length) && (
            <WaveformVisualization
              waveformData={voiceDump.waveformData || []}
              audioLevel={voiceDump.audioLevel || 0}
              isRecording={voiceDump.isRecording}
              duration={voiceDump.recordingDuration || 0}
              maxDuration={voiceDump.maxDuration || 90}
            />
          )}

          {/* Recording Button */}
          <div className="text-center space-y-4">
            <Button
              onClick={handleRecord}
              disabled={voiceDump.recordingState === 'processing'}
              size="lg"
              className={`${buttonState.color} transition-all duration-300 px-8 py-3 shadow-md hover:shadow-lg`}
            >
              <ButtonIcon className="w-5 h-5 mr-2" />
              {buttonState.text}
            </Button>
            
            {voiceDump.recordingState === 'processing' && (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground">Transcribing audio...</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={handleGenerateRoutine}
              disabled={!memory.memory?.dumps.length || memory.generating}
              variant="outline"
              size="sm"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              <Zap className="w-4 h-4 mr-2" />
              {memory.generating ? 'Generating...' : 'Generate Ritual'}
            </Button>

            {memory.memory?.dumps.length > 0 && (
              <Button
                onClick={handleClearMemory}
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 border-destructive/30"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transcription Review */}
      <AnimatePresence>
        {showTranscription && voiceDump.lastTranscription && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-accent/30 bg-gradient-to-br from-accent/5 to-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-accent">
                  Transcription Ready
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-background/50 rounded-lg border border-border">
                  <p className="text-sm leading-relaxed">{voiceDump.lastTranscription}</p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleAddToMemory} 
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Add to Memory
                  </Button>
                  <Button
                    onClick={() => {
                      voiceDump.clear();
                      setShowTranscription(false);
                    }}
                    variant="outline"
                    size="sm"
                    className="border-muted text-muted-foreground hover:bg-muted/10"
                  >
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 