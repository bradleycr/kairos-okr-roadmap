// Core data structures for Morning Eight feature

export interface VoiceDump {
  id: string;
  text: string;
  date: string;
  timestamp: number;
  duration?: number; // Recording duration in seconds
}

export interface Routine {
  id: string;
  date: string; // YYYY-MM-DD format
  steps: string[];
  generatedAt: string;
  memoryLength: number;
}

export interface MemoryDoc {
  dumps: VoiceDump[];
  mergedMemory: string;
  latestRoutine: Routine | null;
  lastUpdated: string;
}

export interface MorningEightSettings {
  enabled: boolean;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  requireNFC: boolean;
}

// Voice recording states
export type RecordingState = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

// Transcription method
export type TranscriptionMethod = 'wasm' | 'api' | 'failed';

export interface TranscriptionResult {
  text: string;
  method: TranscriptionMethod;
  timestamp: string;
  duration?: number;
}

// Hook return types
export interface VoiceDumpHook {
  isRecording: boolean;
  recordingState: RecordingState;
  error: string | null;
  lastTranscription: string | null;
  record: () => Promise<string | null>;
  stop: () => void;
  clear: () => void;
}

export interface MorningMemoryHook {
  memory: MemoryDoc | null;
  loading: boolean;
  error: string | null;
  addDump: (text: string) => Promise<void>;
  generateRoutine: () => Promise<void>;
  clearMemory: () => Promise<void>;
  isGeneratingRoutine: boolean;
}

export interface MorningEightSettingsHook {
  settings: MorningEightSettings;
  loading: boolean;
  updateSettings: (updates: Partial<MorningEightSettings>) => Promise<void>;
  isWithinMorningWindow: () => boolean;
} 