"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMorningEightSettings } from '../hooks/useMorningEightSettings';

interface NFCGateProps {
  className?: string;
}

export function NFCGate({ className }: NFCGateProps) {
  const router = useRouter();
  const { settings, isInTimeWindow } = useMorningEightSettings();

  useEffect(() => {
    // Only set up auto-routing if feature is enabled and we're in time window
    if (!settings.enabled || !isInTimeWindow) {
      return;
    }

    // Listen for successful NFC authentication events
    const handleNFCAuthentication = (event: CustomEvent) => {
      const { success, chipUID } = event.detail;
      
      if (success && chipUID) {
        console.log('NFC authentication successful during morning window, auto-routing to ritual');
        
        // Small delay to allow normal authentication flow to complete
        setTimeout(() => {
          router.push('/morning-eight?auto=true');
        }, 1000);
      }
    };

    // Listen for the NFC authentication completion event
    window.addEventListener('nfc-authentication-complete', handleNFCAuthentication as EventListener);

    return () => {
      window.removeEventListener('nfc-authentication-complete', handleNFCAuthentication as EventListener);
    };
  }, [settings.enabled, isInTimeWindow, router]);

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
    if (!memory.memory?.latestRoutine) return false;
    if (!settings.isWithinMorningWindow()) return false;
    if (settings.settings.requireNFC && !chipUID) return false;
    return true;
  }, [settings.settings, memory.memory, chipUID]);

  useEffect(() => {
    setShouldRedirect(checkAutoRoute());
  }, [checkAutoRoute]);

  return {
    shouldRedirect,
    isWithinMorningWindow: settings.isWithinMorningWindow(),
    hasRoutine: !!memory.memory?.latestRoutine,
    isEnabled: settings.settings.enabled,
    requiresNFC: settings.settings.requireNFC,
  };
} 