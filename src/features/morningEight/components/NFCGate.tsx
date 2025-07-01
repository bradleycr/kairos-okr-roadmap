"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMorningEightSettings } from '../hooks/useMorningEightSettings';
import { useMorningMemory } from '../hooks/useMorningMemory';

interface NFCGateProps {
  className?: string;
}

export function NFCGate({ className }: NFCGateProps) {
  const router = useRouter();
  const { settings, isWithinMorningWindow } = useMorningEightSettings();
  const { currentRoutine, generateRoutine } = useMorningMemory();

  useEffect(() => {
    // Only set up auto-routing if feature is enabled and we're in time window
    if (!settings.enabled || !isWithinMorningWindow()) {
      return;
    }

    // Listen for successful NFC authentication events
    const handleNFCAuthentication = async (event: CustomEvent) => {
      const { success, chipUID } = event.detail;
      
      if (success && chipUID) {
        console.log('🌅 NFC authentication successful during morning window, checking for ritual...');
        
        // Check if we have a routine
        if (currentRoutine) {
          console.log('✅ Cached ritual found, auto-routing to morning eight');
          setTimeout(() => {
            router.push('/morning-eight?auto=true');
          }, 1000);
        } else {
          console.log('⚡ No ritual found, checking if we can generate one...');
          // Try to generate a routine if we don't have one
          try {
            const newRoutine = await generateRoutine();
            if (newRoutine) {
              console.log('✅ Generated new ritual, auto-routing to morning eight');
              setTimeout(() => {
                router.push('/morning-eight?auto=true');
              }, 1000);
            } else {
              console.log('❌ Could not generate ritual - no voice dumps available');
              // Show user friendly message about needing voice dumps
              setTimeout(() => {
                router.push('/morning-eight?message=need-dumps');
              }, 1000);
            }
          } catch (error) {
            console.log('❌ Failed to generate ritual:', error);
            setTimeout(() => {
              router.push('/morning-eight?message=generation-failed');
            }, 1000);
          }
        }
      }
    };

    // Listen for the NFC authentication completion event
    window.addEventListener('nfc-authentication-complete', handleNFCAuthentication as EventListener);

    return () => {
      window.removeEventListener('nfc-authentication-complete', handleNFCAuthentication as EventListener);
    };
  }, [settings.enabled, isWithinMorningWindow, router, currentRoutine, generateRoutine]);

  // This component is invisible - it just listens for events
  return null;
}

// Hook for integrating NFC gate functionality
export function useMorningEightNFCGate(chipUID?: string) {
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const settings = useMorningEightSettings();
  const memory = useMorningMemory();

  const checkAutoRoute = useCallback(() => {
    if (!settings.settings.enabled) return false;
    if (!memory.currentRoutine) return false;
    if (!settings.isWithinMorningWindow()) return false;
    if (settings.settings.requireNFC && !chipUID) return false;
    return true;
  }, [settings.settings, memory.currentRoutine, chipUID, settings.isWithinMorningWindow]);

  useEffect(() => {
    setShouldRedirect(checkAutoRoute());
  }, [checkAutoRoute]);

  return {
    shouldRedirect,
    isWithinMorningWindow: settings.isWithinMorningWindow(),
    hasRoutine: !!memory.currentRoutine,
    isEnabled: settings.settings.enabled,
    requiresNFC: settings.settings.requireNFC,
  };
} 