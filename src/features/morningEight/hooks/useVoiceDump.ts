import { useState, useCallback, useRef } from 'react';
import type { VoiceDumpHook, RecordingState, TranscriptionResult } from '../types';

export function useVoiceDump(): VoiceDumpHook {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [lastTranscription, setLastTranscription] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // Start recording
  const record = useCallback(async (): Promise<string | null> => {
    try {
      setError(null);
      setRecordingState('recording');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        }
      });
      
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
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setRecordingState('processing');
        
        try {
          // Use the MIME type that was supported, or fallback
          const mimeType = (mediaRecorderOptions as any).mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
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
  }, [transcribeAudio]);

  // Stop recording
  const stop = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Clear state
  const clear = useCallback(() => {
    setRecordingState('idle');
    setError(null);
    setLastTranscription(null);
    if (mediaRecorderRef.current && isRecording) {
      stop();
    }
  }, [isRecording, stop]);

  return {
    isRecording,
    recordingState,
    error,
    lastTranscription,
    record,
    stop,
    clear,
  };
} 