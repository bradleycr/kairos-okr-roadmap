"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MorningEightPanel } from '@/src/features/morningEight/components/MorningEightPanel';
import { AudioRitualView } from '@/src/features/morningEight/components/AudioRitualView';
import { useMorningMemory } from '@/src/features/morningEight/hooks/useMorningMemory';
import { PageLoader } from '@/components/ui/page-loader';
import type { Routine } from '@/src/features/morningEight/types';

function MorningEightContent() {
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [showAudioRitual, setShowAudioRitual] = useState(false);
  const [isAuto, setIsAuto] = useState(false);
  const { generateRoutine, isGenerating } = useMorningMemory();

  useEffect(() => {
    // Check for auto parameter on client side only
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsAuto(urlParams.get('auto') === 'true');
    }
  }, []);

  // Auto-generate routine if we're in auto mode
  useEffect(() => {
    if (isAuto && !currentRoutine && !isGenerating) {
      generateRoutine().then(routine => {
        if (routine) {
          setCurrentRoutine(routine);
          setShowAudioRitual(true);
        }
      });
    }
  }, [isAuto, currentRoutine, isGenerating, generateRoutine]);

  // Handle routine selection from panel
  const handleRoutineSelect = (routine: Routine) => {
    setCurrentRoutine(routine);
    setShowAudioRitual(true);
  };

  // Show audio ritual view directly in auto mode or when routine is selected
  if (showAudioRitual && currentRoutine) {
    return (
      <AudioRitualView
        routine={currentRoutine}
        onClose={() => {
          setShowAudioRitual(false);
          setCurrentRoutine(null);
        }}
        autoStart={isAuto}
      />
    );
  }

  // Show loading if generating routine in auto mode
  if (isAuto && isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/10 to-primary/5">
        <div className="text-center space-y-4">
          <PageLoader />
          <div className="space-y-2">
            <h2 className="text-xl font-light text-primary">Preparing Your Morning Ritual</h2>
            <p className="text-sm text-muted-foreground">Creating your personalized 8-minute experience...</p>
          </div>
        </div>
      </div>
    );
  }

  // Default panel view
  return <MorningEightPanel onRoutineSelect={handleRoutineSelect} />;
}

export default function MorningEightPage() {
  return <MorningEightContent />;
} 