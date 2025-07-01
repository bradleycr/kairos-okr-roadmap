import { useState, useCallback, useRef, useEffect } from 'react';
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
  downloadAudio: () => void;
}

// Detect best audio format for the current device
function detectBestAudioFormat(): string {
  const audio = document.createElement('audio');
  
  // Check format support in order of preference
  if (audio.canPlayType('audio/mpeg') === 'probably') {
    return 'mp3';
  } else if (audio.canPlayType('audio/aac') === 'probably') {
    return 'aac';
  } else if (audio.canPlayType('audio/ogg; codecs="opus"') === 'probably') {
    return 'opus';
  } else if (audio.canPlayType('audio/mpeg') === 'maybe') {
    return 'mp3'; // fallback to mp3 even if only "maybe"
  }
  
  return 'mp3'; // final fallback
}

export function useAudioRitual(): AudioRitualHook {
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Generate audio from routine steps with format fallback
  const generateAudio = useCallback(async (routine: Routine, voice: string = 'nova') => {
    setIsGeneratingAudio(true);
    setError(null);

    // Detect best format for this device
    const preferredFormat = detectBestAudioFormat();
    console.log(`🎵 Using preferred audio format: ${preferredFormat}`);

    try {
      let audioBlob: Blob | null = null;
      let finalFormat = preferredFormat;

      // Try preferred format first, then fallback formats
      const formatsToTry = [preferredFormat, 'mp3', 'aac'];
      
      for (const format of formatsToTry) {
        try {
          console.log(`Attempting to generate ${format} audio...`);
          
          const response = await fetch('/api/morning-eight/speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              steps: routine.steps,
              voice: voice,
              format: format,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed with ${format} format`);
          }

          audioBlob = await response.blob();
          finalFormat = format;
          console.log(`✅ Successfully generated ${format} audio: ${audioBlob.size} bytes`);
          break;
          
        } catch (formatError) {
          console.warn(`Failed to generate ${format} format:`, formatError);
          if (format === formatsToTry[formatsToTry.length - 1]) {
            throw formatError; // Last format failed, throw error
          }
          continue; // Try next format
        }
      }

      if (!audioBlob) {
        throw new Error('Failed to generate audio in any supported format');
      }

      // Verify the blob is actually audio
      if (audioBlob.size === 0) {
        throw new Error('Generated audio file is empty');
      }

      // Store blob reference for download
      audioBlobRef.current = audioBlob;
      
      // Clean up previous audio
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      // Create audio element with better error handling
      const audio = new Audio();
      audioRef.current = audio;
      
      // Set up event listeners before setting src
      audio.addEventListener('loadedmetadata', () => {
        console.log(`Audio loaded: ${audio.duration} seconds`);
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
        setError(null); // Clear any previous errors
      });
      
      audio.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('Audio playback failed - please try regenerating');
        setIsPlaying(false);
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('Audio can play through without buffering');
      });
      
      // Set audio properties for better mobile compatibility
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      
      // Set the source after all listeners are attached
      audio.src = url;
      
      console.log(`🎧 Audio URL created: ${url.substring(0, 50)}...`);
      
    } catch (err) {
      console.error('Audio generation failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate audio';
      setError(errorMessage);
    } finally {
      setIsGeneratingAudio(false);
    }
  }, [audioUrl]);

  // Play audio with comprehensive mobile handling
  const playAudio = useCallback(async () => {
    if (!audioRef.current) {
      setError('No audio available to play');
      return;
    }

    try {
      // Reset to beginning if ended
      if (audioRef.current.ended) {
        audioRef.current.currentTime = 0;
      }
      
      // Clear any previous errors
      setError(null);
      
      // For mobile devices, we need to handle user gesture requirements
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('Audio playback started successfully');
      }
      
    } catch (err: any) {
      console.error('Failed to play audio:', err);
      
      if (err.name === 'NotAllowedError') {
        setError('Please tap the play button to start audio (required by your browser)');
      } else if (err.name === 'NotSupportedError') {
        setError('Audio format not supported - please try regenerating');
      } else if (err.name === 'AbortError') {
        setError('Audio playback was interrupted');
      } else {
        setError('Playback failed - please try again or regenerate audio');
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
      audioRef.current.currentTime = Math.max(0, Math.min(time, audioRef.current.duration || 0));
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  // Download audio file
  const downloadAudio = useCallback(() => {
    if (audioBlobRef.current) {
      const url = URL.createObjectURL(audioBlobRef.current);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'morning-ritual.mp3';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, []);

  // Clear audio and cleanup
  const clearAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    
    audioBlobRef.current = null;
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
    downloadAudio,
  };
} 