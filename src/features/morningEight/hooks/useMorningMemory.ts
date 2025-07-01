import { useState, useCallback } from 'react';
import { useIndexedDbState } from './useIndexedDbState';
import type { MemoryDoc, VoiceDump, Routine, MorningMemoryHook } from '../types';

const DEFAULT_MEMORY: MemoryDoc = {
  dumps: [],
  mergedMemory: '',
  latestRoutine: null,
  lastUpdated: new Date().toISOString(),
};

export function useMorningMemory(): MorningMemoryHook {
  const [isGeneratingRoutine, setIsGeneratingRoutine] = useState(false);
  const { data: memory, loading, error, save } = useIndexedDbState<MemoryDoc>('memory', DEFAULT_MEMORY);

  // Add a new voice dump to memory
  const addDump = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const newDump: VoiceDump = {
      id: `dump_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      date: new Date().toISOString().split('T')[0],
      timestamp: Date.now(),
    };

    const currentMemory = memory || DEFAULT_MEMORY;
    const updatedDumps = [...currentMemory.dumps, newDump];
    
    // Rebuild merged memory from all dumps
    const mergedMemory = updatedDumps
      .map(dump => `[${dump.date}] ${dump.text}`)
      .join('\n\n');

    const updatedMemory: MemoryDoc = {
      ...currentMemory,
      dumps: updatedDumps,
      mergedMemory,
      lastUpdated: new Date().toISOString(),
    };

    await save(updatedMemory);
  }, [memory, save]);

  // Generate a new morning routine
  const generateRoutine = useCallback(async (): Promise<Routine> => {
    if (!memory || memory.dumps.length === 0) {
      throw new Error('No voice dumps available to generate routine');
    }

    setIsGeneratingRoutine(true);

    try {
      const response = await fetch('/api/morning-eight/routine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memory: memory.mergedMemory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate routine');
      }

      const result = await response.json();
      
      const newRoutine: Routine = {
        id: `routine_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        steps: result.steps,
        generatedAt: result.generatedAt,
        memoryLength: result.memoryLength,
      };

      const updatedMemory: MemoryDoc = {
        ...memory,
        latestRoutine: newRoutine,
        lastUpdated: new Date().toISOString(),
      };

      await save(updatedMemory);
      return newRoutine;
    } finally {
      setIsGeneratingRoutine(false);
    }
  }, [memory, save]);

  // Clear all memory data
  const clearMemory = useCallback(async () => {
    await save(DEFAULT_MEMORY);
  }, [save]);

  return {
    memory,
    loading,
    error,
    addDump,
    generateRoutine,
    clearMemory,
    isGeneratingRoutine,
    // Convenience getter for current routine
    currentRoutine: memory?.latestRoutine || null,
    // Alias for consistency
    generating: isGeneratingRoutine,
  };
} 