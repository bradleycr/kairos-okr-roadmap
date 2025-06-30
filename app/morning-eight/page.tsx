"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';

import { RoutineView } from '@/src/features/morningEight/components/RoutineView';
import { useMorningMemory } from '@/src/features/morningEight/hooks/useMorningMemory';
import { useMorningEightSettings } from '@/src/features/morningEight/hooks/useMorningEightSettings';

export default function MorningEightPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const memory = useMorningMemory();
  const settings = useMorningEightSettings();

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user should be here
  useEffect(() => {
    if (!isClient) return;

    // If feature is disabled, redirect to profile
    if (!settings.settings.enabled) {
      router.push('/profile');
      return;
    }

    // If no routine exists, redirect to profile
    if (!memory.memory?.latestRoutine) {
      router.push('/profile');
      return;
    }
  }, [isClient, settings.settings.enabled, memory.memory?.latestRoutine, router]);

  const handleClose = () => {
    router.push('/profile');
  };

  // Loading state
  if (!isClient || memory.loading || settings.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Morning Eight</span>
                </div>
                <p className="text-xs text-muted-foreground">Loading your routine...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No routine available
  if (!memory.memory?.latestRoutine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-8 space-y-4">
            <Sparkles className="w-12 h-12 text-muted-foreground mx-auto" />
            <div className="space-y-2">
              <h2 className="text-lg font-medium">No Routine Available</h2>
              <p className="text-sm text-muted-foreground">
                Create voice dumps and generate your morning routine first.
              </p>
            </div>
            <Button asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Feature disabled
  if (!settings.settings.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="text-center py-8 space-y-4">
            <div className="w-12 h-12 border-2 border-dashed border-muted-foreground rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-medium">Morning Eight Disabled</h2>
              <p className="text-sm text-muted-foreground">
                Enable Morning Eight in your profile to access this feature.
              </p>
            </div>
            <Button asChild>
              <Link href="/profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the routine
  return (
    <RoutineView
      routine={memory.memory.latestRoutine}
      onClose={handleClose}
      autoStart={settings.isWithinMorningWindow()}
    />
  );
} 