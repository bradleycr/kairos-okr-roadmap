// Morning Eight Feature Exports
// Modular design for easy extraction and reuse

// Core Components
export { MorningEightPanel } from './components/MorningEightPanel';
export { RoutineView } from './components/RoutineView';
export { NFCGate } from './components/NFCGate';
export { AudioRitualView } from './components/AudioRitualView';

// Hooks
export { useMorningMemory } from './hooks/useMorningMemory';
export { useMorningEightSettings } from './hooks/useMorningEightSettings';
export { useVoiceDump } from './hooks/useVoiceDump';
export { useIndexedDbState } from './hooks/useIndexedDbState';
export { useAudioRitual } from './hooks/useAudioRitual';

// Types
export type * from './types';

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