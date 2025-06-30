// Morning Eight Feature Exports
// Modular design for easy extraction and reuse

// Core Components
export { MorningEightPanel } from './components/MorningEightPanel';
export { RoutineView } from './components/RoutineView';
export { NFCGate, useMorningEightNFCGate } from './components/NFCGate';

// Hooks
export { useVoiceDump } from './hooks/useVoiceDump';
export { useMorningMemory } from './hooks/useMorningMemory';
export { useMorningEightSettings } from './hooks/useMorningEightSettings';
export { useIndexedDbState } from './hooks/useIndexedDbState';

// Types
export type {
  VoiceDump,
  Routine,
  MemoryDoc,
  MorningEightSettings,
  RecordingState,
  TranscriptionMethod,
  TranscriptionResult,
  VoiceDumpHook,
  MorningMemoryHook,
  MorningEightSettingsHook,
} from './types';

// Feature metadata for easy extraction
export const MORNING_EIGHT_FEATURE = {
  name: 'Morning Eight',
  version: '1.0.0',
  description: 'Voice-driven 8-minute morning ritual generator',
  dependencies: [
    'react',
    'next',
    'framer-motion',
    'lucide-react',
    '@radix-ui/react-*',
  ],
  apiRoutes: [
    '/api/morning-eight/whisper',
    '/api/morning-eight/routine',
  ],
  pages: [
    '/morning-eight',
  ],
  envVars: [
    'OPENAI_API_KEY',
  ],
} as const; 