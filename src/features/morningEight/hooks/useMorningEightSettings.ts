import { useCallback } from 'react';
import { useIndexedDbState } from './useIndexedDbState';
import type { MorningEightSettings, MorningEightSettingsHook } from '../types';

const DEFAULT_SETTINGS: MorningEightSettings = {
  enabled: false,
  startTime: '06:00',
  endTime: '10:00',
  requireNFC: true,
};

export function useMorningEightSettings(): MorningEightSettingsHook {
  const { data: settings, loading, save } = useIndexedDbState<MorningEightSettings>('settings', DEFAULT_SETTINGS);

  // Update settings
  const updateSettings = useCallback(async (updates: Partial<MorningEightSettings>) => {
    const currentSettings = settings || DEFAULT_SETTINGS;
    const updatedSettings = { ...currentSettings, ...updates };
    await save(updatedSettings);
  }, [settings, save]);

  // Check if current time is within morning window
  const isWithinMorningWindow = useCallback((): boolean => {
    if (!settings?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const startTime = settings.startTime;
    const endTime = settings.endTime;
    
    // Handle case where end time is before start time (spans midnight)
    if (endTime < startTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }, [settings]);

  return {
    settings: settings || DEFAULT_SETTINGS,
    loading,
    updateSettings,
    isWithinMorningWindow,
  };
} 