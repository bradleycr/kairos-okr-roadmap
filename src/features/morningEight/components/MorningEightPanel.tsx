"use client";

import React, { useState } from 'react';
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
  Play
} from 'lucide-react';

import { useVoiceDump } from '../hooks/useVoiceDump';
import { useMorningMemory } from '../hooks/useMorningMemory';
import { useMorningEightSettings } from '../hooks/useMorningEightSettings';

interface MorningEightPanelProps {
  onRoutineSelect?: (routine: Routine) => void;
}

export function MorningEightPanel({ onRoutineSelect }: MorningEightPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscription, setShowTranscription] = useState(false);
  const { toast } = useToast();

  // Hooks
  const voiceDump = useVoiceDump();
  const memory = useMorningMemory();
  const settings = useMorningEightSettings();

  // Handle voice recording
  const handleRecord = async () => {
    try {
      if (voiceDump.isRecording) {
        voiceDump.stop();
      } else {
        const transcription = await voiceDump.record();
        if (transcription) {
          setShowTranscription(true);
          toast({
            title: "Recording Complete",
            description: "Voice transcribed successfully",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Recording Failed",
        description: error instanceof Error ? error.message : "Failed to record voice",
        variant: "destructive",
      });
    }
  };

  // Add transcription to memory
  const handleAddToMemory = async () => {
    if (!voiceDump.lastTranscription) return;

    try {
      await memory.addDump(voiceDump.lastTranscription);
      voiceDump.clear();
      setShowTranscription(false);
      toast({
        title: "Added to Memory",
        description: "Voice dump added to your morning memory",
      });
    } catch (error) {
      toast({
        title: "Failed to Save",
        description: "Could not save voice dump to memory",
        variant: "destructive",
      });
    }
  };

  // Generate new routine
  const handleGenerateRoutine = async () => {
    try {
      await memory.generateRoutine();
      toast({
        title: "Routine Generated",
        description: "Your personalized morning routine is ready",
      });
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

  const getRecordingStateColor = () => {
    switch (voiceDump.recordingState) {
      case 'recording': return 'bg-red-500';
      case 'processing': return 'bg-yellow-500';
      case 'complete': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-primary';
    }
  };

  const getRecordingStateText = () => {
    switch (voiceDump.recordingState) {
      case 'recording': return 'Recording...';
      case 'processing': return 'Transcribing...';
      case 'complete': return 'Complete';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const handleRoutineAction = (routine: Routine) => {
    if (onRoutineSelect) {
      onRoutineSelect(routine);
    } else {
      setSelectedRoutine(routine);
      setShowRoutineView(true);
    }
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

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <CardTitle>Morning Eight</CardTitle>
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

      <CardContent className="space-y-4">
        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-dashed">
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-time" className="text-xs">Start Time</Label>
                      <Input
                        id="start-time"
                        type="time"
                        value={settings.settings.startTime}
                        onChange={(e) => settings.updateSettings({ startTime: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-time" className="text-xs">End Time</Label>
                      <Input
                        id="end-time"
                        type="time"
                        value={settings.settings.endTime}
                        onChange={(e) => settings.updateSettings({ endTime: e.target.value })}
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-nfc" className="text-sm">Require NFC for auto-routing</Label>
                    <Switch
                      id="require-nfc"
                      checked={settings.settings.requireNFC}
                      onCheckedChange={(requireNFC) => settings.updateSettings({ requireNFC })}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice Recording Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Voice Recording</h3>
            <Badge variant="secondary" className="text-xs">
              {getRecordingStateText()}
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRecord}
              disabled={voiceDump.recordingState === 'processing'}
              className={`w-12 h-12 rounded-full ${getRecordingStateColor()}`}
            >
              {voiceDump.isRecording ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </Button>
            
            <div className="flex-1">
              {voiceDump.recordingState === 'processing' && (
                <Progress value={undefined} className="w-full h-2" />
              )}
              {voiceDump.error && (
                <p className="text-xs text-destructive">{voiceDump.error}</p>
              )}
              {voiceDump.recordingState === 'idle' && (
                <p className="text-xs text-muted-foreground">
                  Tap to start recording your thoughts
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Transcription Preview */}
        <AnimatePresence>
          {showTranscription && voiceDump.lastTranscription && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-2">
                    <Label className="text-xs text-muted-foreground">Transcription</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTranscription(false)}
                    >
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-sm mb-3 leading-relaxed">
                    {voiceDump.lastTranscription}
                  </p>
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleAddToMemory}>
                      Add to Memory
                    </Button>
                    <Button size="sm" variant="outline" onClick={voiceDump.clear}>
                      Discard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Memory & Routine Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Morning Routine</h3>
            <div className="flex items-center space-x-2">
              {memory.memory?.latestRoutine && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  {memory.memory.latestRoutine.date}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearMemory}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              onClick={handleGenerateRoutine}
              disabled={!memory.memory?.dumps.length || memory.isGeneratingRoutine}
              className="flex-1"
            >
              {memory.isGeneratingRoutine ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Routine
                </>
              )}
            </Button>
          </div>

          {memory.memory?.latestRoutine && (
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Latest routine ({memory.memory.latestRoutine.steps.length} steps)
                </p>
                <div className="space-y-1">
                  {memory.memory.latestRoutine.steps.slice(0, 3).map((step, index) => (
                    <p key={index} className="text-xs text-muted-foreground">
                      {index + 1}. {step.length > 50 ? `${step.substring(0, 50)}...` : step}
                    </p>
                  ))}
                  {memory.memory.latestRoutine.steps.length > 3 && (
                    <p className="text-xs text-muted-foreground italic">
                      ...and {memory.memory.latestRoutine.steps.length - 3} more steps
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Status Info */}
        {settings.settings.enabled && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              Active {settings.settings.startTime} - {settings.settings.endTime}
              {settings.isWithinMorningWindow() && (
                <Badge variant="secondary" className="ml-2 text-xs">Now Active</Badge>
              )}
            </span>
          </div>
        )}

        {/* Generated Routines */}
        {memory.memory?.latestRoutine && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Your Rituals</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/30"
                  onClick={() => handleRoutineAction(memory.memory.latestRoutine)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{memory.memory.latestRoutine.date}</p>
                        <p className="text-sm text-muted-foreground">
                          {memory.memory.latestRoutine.steps.length} steps • Based on your voice notes
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="mt-3 text-sm">
                      <p className="line-clamp-2 text-muted-foreground">
                        {memory.memory.latestRoutine.steps[0]}...
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
} 