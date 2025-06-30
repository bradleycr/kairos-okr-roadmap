"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMorningEightSettings } from '../hooks/useMorningEightSettings';
import { useMorningMemory } from '../hooks/useMorningMemory';

interface NFCGateProps {
  chipUID?: string; // Current NFC chip UID if available
  onRoutineRedirect?: () => void;
}

export function NFCGate({ chipUID, onRoutineRedirect }: NFCGateProps) {
  const [isNFCDetected, setIsNFCDetected] = useState(false);
  const router = useRouter();
  const settings = useMorningEightSettings();
  const memory = useMorningMemory();

  // Check if conditions are met for auto-routing
  const shouldAutoRoute = useCallback(() => {
    // Feature must be enabled
    if (!settings.settings.enabled) return false;

    // Must have a routine generated
    if (!memory.memory?.latestRoutine) return false;

    // Must be within morning window
    if (!settings.isWithinMorningWindow()) return false;

    // If NFC is required, chip must be detected
    if (settings.settings.requireNFC && !chipUID && !isNFCDetected) return false;

    return true;
  }, [settings.settings, memory.memory, isNFCDetected, chipUID]);

  // Handle auto-routing when conditions are met
  useEffect(() => {
    if (shouldAutoRoute()) {
      console.log('Morning Eight: Auto-routing conditions met');
      
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        if (onRoutineRedirect) {
          onRoutineRedirect();
        } else {
          router.push('/morning-eight');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [shouldAutoRoute, router, onRoutineRedirect]);

  // Detect NFC cards (Web NFC API)
  useEffect(() => {
    if (typeof window === 'undefined' || !('NDEFReader' in window)) {
      return;
    }

    let ndefReader: NDEFReader;
    let isScanning = false;

    const startNFCScan = async () => {
      try {
        ndefReader = new NDEFReader();
        
        ndefReader.addEventListener('reading', (event) => {
          console.log('NFC card detected:', event.serialNumber);
          setIsNFCDetected(true);
          
          // Reset detection after a short delay
          setTimeout(() => {
            setIsNFCDetected(false);
          }, 5000);
        });

        ndefReader.addEventListener('readingerror', (event) => {
          console.warn('NFC reading error:', event);
        });

        await ndefReader.scan();
        isScanning = true;
        console.log('Morning Eight: NFC scanning started');
      } catch (error) {
        console.warn('Failed to start NFC scanning:', error);
      }
    };

    // Only start scanning if NFC is required and enabled
    if (settings.settings.enabled && settings.settings.requireNFC) {
      startNFCScan();
    }

    return () => {
      if (isScanning && ndefReader) {
        try {
          ndefReader.abort();
        } catch (error) {
          console.warn('Error stopping NFC scan:', error);
        }
      }
    };
  }, [settings.settings.enabled, settings.settings.requireNFC]);

  // Update NFC detection based on chipUID prop
  useEffect(() => {
    if (chipUID) {
      setIsNFCDetected(true);
      console.log('Morning Eight: NFC detected via chipUID:', chipUID);
    }
  }, [chipUID]);

  // This component doesn't render anything visible
  // It works as a background service
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