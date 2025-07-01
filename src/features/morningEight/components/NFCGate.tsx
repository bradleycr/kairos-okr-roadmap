"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  
  // State for handling rapid taps and processing
  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);

  const handleNFCAuthentication = useCallback(async (event: CustomEvent) => {
    const { success, chipUID, sessionToken } = event.detail;
    const now = Date.now();
    
    // Comprehensive validation
    if (!success || !chipUID) {
      console.log('❌ Invalid NFC authentication event');
      return;
    }
    
    // Debounce rapid taps (prevent duplicate processing)
    if (now - lastTapTime < 3000) {
      console.log('🔄 Ignoring rapid NFC tap (debounced)');
      return;
    }
    setLastTapTime(now);
    
    // Check if already processing
    if (processingRef.current || isProcessing) {
      console.log('🔄 Already processing NFC event, ignoring duplicate');
      return;
    }
    
    // Check prerequisites
    if (!settings.enabled) {
      console.log('⚠️ Morning Eight auto-routing disabled');
      return;
    }
    
    if (!isWithinMorningWindow()) {
      const currentTime = new Date().toLocaleTimeString();
      console.log(`⏰ Outside morning window (${settings.startTime}-${settings.endTime}), current: ${currentTime}`);
      return;
    }
    
    // Set processing state
    setIsProcessing(true);
    processingRef.current = true;
    
    try {
      console.log('🌅 NFC authentication successful during morning window');
      console.log(`   Chip: ${chipUID.slice(-8)}`);
      console.log(`   Session: ${sessionToken?.slice(-8) || 'none'}`);
      
      if (currentRoutine) {
        console.log('✅ Existing routine found, routing to morning eight');
        
        // Add gentle delay for user feedback
        setTimeout(() => {
          router.push('/morning-eight?auto=true&source=nfc&routine=existing');
          setIsProcessing(false);
          processingRef.current = false;
        }, 1200);
        
      } else {
        console.log('⚡ No routine found, attempting generation...');
        
        try {
          const newRoutine = await generateRoutine();
          
          if (newRoutine) {
            console.log('✅ Generated new routine, routing to morning eight');
            setTimeout(() => {
              router.push('/morning-eight?auto=true&source=nfc&routine=generated');
              setIsProcessing(false);
              processingRef.current = false;
            }, 1500);
          } else {
            console.log('❌ Could not generate routine - insufficient voice data');
            setTimeout(() => {
              router.push('/morning-eight?message=need-dumps&source=nfc');
              setIsProcessing(false);
              processingRef.current = false;
            }, 1000);
          }
        } catch (generationError) {
          console.error('❌ Routine generation failed:', generationError);
          setTimeout(() => {
            router.push('/morning-eight?message=generation-failed&source=nfc');
            setIsProcessing(false);
            processingRef.current = false;
          }, 1000);
        }
      }
      
    } catch (error) {
      console.error('❌ Morning Eight auto-routing failed:', error);
      setTimeout(() => {
        router.push('/morning-eight?message=routing-failed&source=nfc');
        setIsProcessing(false);
        processingRef.current = false;
      }, 1000);
    }
  }, [settings, isWithinMorningWindow, router, currentRoutine, generateRoutine, lastTapTime, isProcessing]);

  // Enhanced event listener with cleanup
  useEffect(() => {
    const abortController = new AbortController();
    
    // Add event listener with abort signal
    window.addEventListener('nfc-authentication-complete', handleNFCAuthentication as EventListener, {
      signal: abortController.signal,
      passive: true
    });

    // Cleanup on unmount
    return () => {
      abortController.abort();
      processingRef.current = false;
      setIsProcessing(false);
    };
  }, [handleNFCAuthentication]);

  // Reset processing state if stuck
  useEffect(() => {
    if (isProcessing) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Auto-routing timeout, resetting processing state');
        setIsProcessing(false);
        processingRef.current = false;
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [isProcessing]);

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