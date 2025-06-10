/**
 * Shared Storage for NFC Accounts
 * 
 * This ensures that in-memory storage is consistent across all API endpoints
 * Both /api/nfc/accounts and /api/nfc/accounts/all use the same Map instance
 */

import type { DatabaseAccountRecord } from '@/lib/nfc/accountManager'

// Shared in-memory storage instance
const sharedMemoryStorage = new Map<string, DatabaseAccountRecord>()

export function getSharedMemoryStorage(): Map<string, DatabaseAccountRecord> {
  return sharedMemoryStorage
}

export function getAllAccountsFromMemory(): DatabaseAccountRecord[] {
  const accounts: DatabaseAccountRecord[] = []
  
  // Iterate through the map and only include chipUID-based keys (not ID-based duplicates)
  for (const [key, value] of sharedMemoryStorage.entries()) {
    // Skip the ID-based duplicate entries
    if (!key.startsWith('id:')) {
      accounts.push(value)
    }
  }
  
  return accounts
}

export function clearMemoryStorage(): void {
  sharedMemoryStorage.clear()
}

export function getMemoryStorageStats() {
  const allKeys = Array.from(sharedMemoryStorage.keys())
  const chipUIDKeys = allKeys.filter(key => !key.startsWith('id:'))
  const idKeys = allKeys.filter(key => key.startsWith('id:'))
  
  return {
    totalKeys: allKeys.length,
    chipUIDKeys: chipUIDKeys.length,
    idKeys: idKeys.length,
    accounts: chipUIDKeys.length // This is the actual number of unique accounts
  }
} 