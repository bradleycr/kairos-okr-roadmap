import { useState, useCallback, useRef } from 'react';
import type { VoiceDumpHook, RecordingState, TranscriptionResult } from '../types';

export function useVoiceDump(): VoiceDumpHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastTranscription, setLastTranscription] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Constants for recording limits
  const MAX_RECORDING_DURATION = 90; // 90 seconds max for good transcription
  const WAVEFORM_SAMPLES = 50; // Number of waveform bars

  // Audio level monitoring for waveform
  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate average audio level
    const average = dataArray.reduce((acc, val) => acc + val, 0) / dataArray.length;
    const normalizedLevel = Math.min(100, (average / 255) * 100);
    setAudioLevel(normalizedLevel);
    
    // Update waveform data
    setWaveformData(prev => {
      const newData = [...prev, normalizedLevel];
      return newData.slice(-WAVEFORM_SAMPLES); // Keep only recent samples
    });

    if (isRecording) {
      animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
    }
  }, [isRecording]);

  // Transcribe audio using Whisper WASM (with API fallback)
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<TranscriptionResult> => {
    // Try WASM first (if available)
    try {
      // Note: WASM whisper.cpp integration would go here
      // For now, we'll go straight to API fallback
      throw new Error('WASM not available');
    } catch (wasmError) {
      console.log('WASM transcription failed, falling back to API');
      
      // Fallback to API
      try {
        const formData = new FormData();
        // Determine file extension based on MIME type
        let extension = 'webm';
        if (audioBlob.type.includes('mp4')) extension = 'mp4';
        else if (audioBlob.type.includes('ogg')) extension = 'ogg';
        else if (audioBlob.type.includes('wav')) extension = 'wav';
        
        formData.append('audio', audioBlob, `recording.${extension}`);
        
        const response = await fetch('/api/morning-eight/whisper', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'API transcription failed');
        }
        
        const result = await response.json();
        return {
          text: result.text,
          method: 'api',
          timestamp: result.timestamp,
        };
      } catch (apiError) {
        console.error('API transcription failed:', apiError);
        throw new Error('Both WASM and API transcription failed');
      }
    }
  }, []);

  // Start recording with enhanced feedback
  const record = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setRecordingState('recording');
      setRecordingDuration(0);
      setWaveformData([]);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      
      streamRef.current = stream;
      
      // Set up audio analysis for waveform
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      // Start monitoring audio level
      monitorAudioLevel();
      
      // Try different MIME types for better mobile compatibility
      let mediaRecorderOptions = {};
      
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/mp4;codecs=aac',  // Better iOS support
        'audio/mp4',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/wav'  // Fallback for older devices
      ];
      
      // Find the first supported MIME type
      for (const mimeType of supportedTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          mediaRecorderOptions = { mimeType };
          console.log(`Using MIME type: ${mimeType}`);
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Duration tracking with auto-stop at limit
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_RECORDING_DURATION) {
            console.log('Auto-stopping recording at max duration');
            stop();
          }
          return newDuration;
        });
      }, 1000);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setRecordingState('processing');
        
        // Cleanup
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        
        try {
          // Use the MIME type that was supported, or fallback
          const mimeType = (mediaRecorderOptions as any).mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          
          console.log(`🎤 Transcribing ${audioBlob.size} bytes of audio (${recordingDuration}s)`);
          
          const transcriptionResult = await transcribeAudio(audioBlob);
          
          setLastTranscription(transcriptionResult.text);
          setRecordingState('complete');
          
          // Stop all tracks
          stream.getTracks().forEach(track => track.stop());
          
          return transcriptionResult.text;
        } catch (transcriptionError) {
          console.error('Transcription failed:', transcriptionError);
          setError(transcriptionError instanceof Error ? transcriptionError.message : 'Transcription failed');
          setRecordingState('error');
          return null;
        }
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      
      return new Promise((resolve) => {
        const originalOnStop = mediaRecorder.onstop;
        mediaRecorder.onstop = async (event) => {
          const result = await originalOnStop?.(event);
          resolve(result as string | null);
        };
      });
      
    } catch (recordingError) {
      console.error('Recording failed:', recordingError);
      setError(recordingError instanceof Error ? recordingError.message : 'Recording failed');
      setRecordingState('error');
      return null;
    }
  }, [monitorAudioLevel]);

  // Stop recording with cleanup
  const stop = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // Cleanup audio monitoring
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setAudioLevel(0);
  }, [isRecording]);

  // Clear state
  const clear = useCallback(() => {
    setRecordingState('idle');
    setError(null);
    setLastTranscription(null);
    setRecordingDuration(0);
    setAudioLevel(0);
    setWaveformData([]);
    if (mediaRecorderRef.current && isRecording) {
      stop();
    }
  }, [isRecording, stop]);

  return {
    isRecording,
    recordingState,
    error,
    lastTranscription,
    recordingDuration,
    audioLevel,
    waveformData,
    maxDuration: MAX_RECORDING_DURATION,
    record,
    stop,
    clear,
  };
} 