import { useState, useCallback, useRef } from 'react';
import type { Routine } from '../types';

interface AudioRitualHook {
  isGeneratingAudio: boolean;
  isPlaying: boolean;
  audioUrl: string | null;
  currentTime: number;
  duration: number;
  error: string | null;
  generateAudio: (routine: Routine, voice?: string) => Promise<void>;
  playAudio: () => void;
  pauseAudio: () => void;
  seekTo: (time: number) => void;
  clearAudio: () => void;
}

export function useAudioRitual(): AudioRitualHook {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate audio from routine steps
  const generateAudio = useCallback(async (routine: Routine, voice: string = 'nova') => {
    setIsGeneratingAudio(true);
    setError(null);

    try {
      const response = await fetch('/api/morning-eight/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steps: routine.steps,
          voice: voice,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      
      // Clean up previous audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(url);
      
      // Create audio element for playback control
      const audio = new Audio(url);
      audioRef.current = audio;
      
      audio.addEventListener('loadedmetadata', () => {
        setDuration(audio.duration);
      });
      
      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });
      
      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      
      audio.addEventListener('play', () => {
        setIsPlaying(true);
      });
      
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });
      
    } catch (err) {
      console.error('Audio generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate audio');
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [audioUrl]);

  // Play audio with mobile compatibility
  const playAudio = useCallback(() => {
    if (audioRef.current) {
      // Reset to beginning if ended
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      
      // Handle mobile autoplay restrictions
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio playback started successfully');
        }).catch(err => {
          console.error('Failed to play audio:', err);
          if (err.name === 'NotAllowedError') {
            setError('Tap to enable audio playback');
          } else {
            setError('Failed to play audio - try tapping the play button again');
          }
        });
      }
    }
  }, []);

  // Pause audio  
  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  // Seek to specific time
  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  // Clear audio and cleanup
  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
  }, [audioUrl]);

  return {
    isGeneratingAudio,
    isPlaying,
    audioUrl,
    currentTime,
    duration,
    error,
    generateAudio,
    playAudio,
    pauseAudio,
    seekTo,
    clearAudio,
  };
} 