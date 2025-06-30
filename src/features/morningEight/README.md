# Morning Eight Feature

A voice-driven 8-minute morning ritual generator that creates personalized routines based on daily voice reflections.

## Overview

Morning Eight allows users to:
1. Record daily voice reflections using device microphone
2. Automatically transcribe speech using Whisper (WASM + API fallback)  
3. Build a persistent memory store of voice dumps in IndexedDB
4. Generate personalized 8-minute morning routines using OpenAI GPT-4o
5. Auto-route to morning routine during configured time windows
6. Complete guided 8-minute morning rituals with timer

## Features

- Voice recording with real-time transcription
- IndexedDB storage for offline persistence
- OpenAI-powered routine generation  
- NFC-triggered auto-routing
- Timed 8-step morning ritual interface
- Mobile-responsive design
- Modular architecture for easy extraction

## File Structure

```
src/features/morningEight/
├── components/
│   ├── MorningEightPanel.tsx    # Main profile panel
│   ├── RoutineView.tsx          # 8-step routine display  
│   └── NFCGate.tsx              # NFC detection & routing
├── hooks/
│   ├── useVoiceDump.ts          # Voice recording
│   ├── useMorningMemory.ts      # Memory management
│   ├── useMorningEightSettings.ts # Settings
│   └── useIndexedDbState.ts     # IndexedDB utility
├── types.ts                     # TypeScript definitions
├── index.ts                     # Exports
└── README.md                    # Documentation

app/
├── api/morning-eight/
│   ├── whisper/route.ts         # Transcription API
│   └── routine/route.ts         # Routine generation API
└── morning-eight/page.tsx       # Standalone routine page
```

## Integration

Added to profile page as new tab with background NFC detection.

## Environment Variables

```env
OPENAI_API_KEY=your_openai_api_key_here
```

## Tech Stack

- React + TypeScript + Next.js 15
- Whisper.cpp WASM + OpenAI Whisper API  
- IndexedDB for local storage
- OpenAI GPT-4o for routine generation
- Web NFC API for auto-routing
- Framer Motion + Tailwind CSS + Radix UI 