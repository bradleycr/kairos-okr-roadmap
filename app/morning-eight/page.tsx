"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MorningEightPanel } from '@/src/features/morningEight/components/MorningEightPanel';
import { AudioRitualView } from '@/src/features/morningEight/components/AudioRitualView';
import { useMorningMemory } from '@/src/features/morningEight/hooks/useMorningMemory';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Sparkles, Brain, Mic2 } from 'lucide-react';
import type { Routine } from '@/src/features/morningEight/types';

// Error boundary component
class MorningEightErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.log('Morning Eight Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <MorningEightErrorFallback />;
    }

    return this.props.children;
  }
}

// Error fallback component
function MorningEightErrorFallback() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20">
      <div className="max-w-md mx-auto text-center space-y-6 p-8">
        <div className="w-16 h-16 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
          <Brain className="w-8 h-8 text-orange-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-sm text-gray-600">
            We're having trouble loading your morning ritual. Let's try again.
          </p>
        </div>
        <div className="flex flex-col space-y-3">
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="border-orange-200 text-orange-600 hover:bg-orange-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}

// Safe URL parameter hook
function useAutoMode() {
  const [isAuto, setIsAuto] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      setIsAuto(urlParams.get('auto') === 'true');
      setMessage(urlParams.get('message'));
    }
  }, []);

  return { isAuto: isClient ? isAuto : false, message, isClient };
}

// Main content component
function MorningEightContent() {
  const [currentRoutine, setCurrentRoutine] = useState<Routine | null>(null);
  const [showAudioRitual, setShowAudioRitual] = useState(false);
  const { isAuto, message } = useAutoMode();
  const { generateRoutine, generating } = useMorningMemory();
  const { toast } = useToast();

  // Handle message parameters from NFC auto-trigger
  useEffect(() => {
    if (message) {
      if (message === 'need-dumps') {
        toast({
          title: "Voice Dumps Required",
          description: "Record some voice reflections first to generate your morning ritual",
          variant: "destructive",
        });
      } else if (message === 'generation-failed') {
        toast({
          title: "Generation Failed",
          description: "Unable to create your ritual. Please try again manually",
          variant: "destructive",
        });
      }
      // Clear the message from URL to prevent repeated toasts
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('message');
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [message, toast]);

  // Auto-generate routine if we're in auto mode
  useEffect(() => {
    if (isAuto && !currentRoutine && !generating) {
      generateRoutine().then(routine => {
        if (routine) {
          setCurrentRoutine(routine);
          setShowAudioRitual(true);
        }
      }).catch(error => {
        console.error('Failed to generate routine:', error);
      });
    }
  }, [isAuto, currentRoutine, generating, generateRoutine]);

  // Handle routine selection from panel
  const handleRoutineSelect = (routine: Routine) => {
    setCurrentRoutine(routine);
    setShowAudioRitual(true);
  };

  // Show audio ritual view directly in auto mode or when routine is selected
  if (showAudioRitual && currentRoutine) {
    return (
      <MorningEightErrorBoundary>
        <AudioRitualView
          routine={currentRoutine}
          onClose={() => {
            setShowAudioRitual(false);
            setCurrentRoutine(null);
          }}
          autoStart={isAuto}
        />
      </MorningEightErrorBoundary>
    );
  }

  // Default panel view
  return (
    <MorningEightErrorBoundary>
      <MorningEightPanel onRoutineSelect={handleRoutineSelect} />
    </MorningEightErrorBoundary>
  );
}

// Main page component
export default function MorningEightPage() {
  return <MorningEightContent />;
} 