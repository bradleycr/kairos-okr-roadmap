/**
 * Shared Storage for NFC Data
 * 
 * This ensures that in-memory storage is consistent across all API endpoints
 * Supports multiple data types with type-safe operations
 */

import type { DatabaseAccountRecord } from '@/lib/nfc/accountManager'

// Generic storage interface
interface StorageData {
  [key: string]: any
}

// Shared in-memory storage instance
const sharedMemoryStorage = new Map<string, StorageData>()

export function getSharedMemoryStorage(): Map<string, StorageData> {
  return sharedMemoryStorage
}

// Type-safe getter
export function getStorageItem<T = any>(key: string): T | undefined {
  return sharedMemoryStorage.get(key) as T | undefined
}

// Type-safe setter
export function setStorageItem<T = any>(key: string, value: T): void {
  sharedMemoryStorage.set(key, value as StorageData)
}

// Account-specific functions for backward compatibility
export function getAllAccountsFromMemory(): DatabaseAccountRecord[] {
  const accounts: DatabaseAccountRecord[] = []
  
  // Iterate through the map and only include chipUID-based keys (not ID-based duplicates)
  for (const [key, value] of sharedMemoryStorage.entries()) {
    // Skip the ID-based duplicate entries and non-account entries
    if (!key.startsWith('id:') && !key.startsWith('bond:') && !key.startsWith('bonds:') && !key.startsWith('session:') && !key.startsWith('active-session:')) {
      accounts.push(value as DatabaseAccountRecord)
    }
  }
  
  return accounts
}

export function clearMemoryStorage(): void {
  sharedMemoryStorage.clear()
}

export function getMemoryStorageStats() {
  const allKeys = Array.from(sharedMemoryStorage.keys())
  const chipUIDKeys = allKeys.filter(key => !key.startsWith('id:') && !key.startsWith('bond:') && !key.startsWith('bonds:') && !key.startsWith('session:') && !key.startsWith('active-session:'))
  const idKeys = allKeys.filter(key => key.startsWith('id:'))
  const bondKeys = allKeys.filter(key => key.startsWith('bond:'))
  const sessionKeys = allKeys.filter(key => key.startsWith('session:'))
  
  return {
    totalKeys: allKeys.length,
    chipUIDKeys: chipUIDKeys.length,
    idKeys: idKeys.length,
    bondKeys: bondKeys.length,
    sessionKeys: sessionKeys.length,
    accounts: chipUIDKeys.length // This is the actual number of unique accounts
  }
} 