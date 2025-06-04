// --- Sample NFC Pendant Installation Data for MELD Node ---
// This simulates different NFC pendants that can be "tapped" on the ESP32 device
// In real hardware: pendants would be physical NFC tags with DID:key stored

import { generateKeypair, createDIDFromPublicKey } from '@/lib/crypto/keys'

export interface PendantInstallation {
  id: string
  name: string
  location: string
  publicKey: Uint8Array
  did: string
  description: string
  type: 'personal' | 'location' | 'event' | 'art'
  color: string
  icon: string
}

// --- Pre-generated sample pendants for consistent simulation ---
export const sampleInstallations: PendantInstallation[] = [
  {
    id: 'pendant-1',
    name: 'Coffee Shop',
    location: 'Downtown Cafe',
    publicKey: new Uint8Array([
      32, 45, 67, 89, 12, 156, 234, 78, 
      90, 123, 45, 67, 189, 234, 56, 78,
      90, 123, 145, 167, 89, 234, 56, 78,
      190, 23, 45, 67, 89, 234, 156, 78
    ]),
    did: 'did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
    description: 'Your favorite morning coffee spot',
    type: 'location',
    color: '#8B4513',
    icon: '☕'
  },
  {
    id: 'pendant-2', 
    name: 'Art Gallery',
    location: 'Modern Art Museum',
    publicKey: new Uint8Array([
      156, 78, 90, 123, 45, 67, 189, 234,
      56, 78, 90, 123, 145, 167, 89, 234,
      32, 45, 67, 89, 12, 156, 234, 78,
      56, 78, 190, 23, 45, 67, 89, 234
    ]),
    did: 'did:key:z6MkfrCyUE6vSNP8i4z8ZQkr9mDMDQYpnMGKJjPGm8yNQb7s',
    description: 'Inspiring contemporary art exhibition',
    type: 'art',
    color: '#9B59B6',
    icon: '🎨'
  },
  {
    id: 'pendant-3',
    name: 'Park Bench',
    location: 'Central Park',
    publicKey: new Uint8Array([
      67, 189, 234, 56, 78, 90, 123, 145,
      167, 89, 234, 32, 45, 67, 89, 12,
      156, 234, 78, 156, 78, 90, 123, 45,
      56, 78, 190, 23, 45, 67, 89, 234
    ]),
    did: 'did:key:z6MkgCxD8UKvHGjVQ3zMsKn6pJtgQm7k3sPWbDQnH8fYxR2v',
    description: 'Peaceful moment by the lake',
    type: 'location',
    color: '#27AE60',
    icon: '🌳'
  },
  {
    id: 'pendant-4',
    name: 'Concert Venue',
    location: 'Red Rocks Amphitheatre',
    publicKey: new Uint8Array([
      89, 234, 32, 45, 67, 89, 12, 156,
      234, 78, 156, 78, 90, 123, 45, 67,
      189, 234, 56, 78, 90, 123, 145, 167,
      56, 78, 190, 23, 45, 67, 89, 234
    ]),
    did: 'did:key:z6MkhBvFqKoJdGt8xNmP7sRu3kT9wA5qM2nD4bYvCx6jL8pZ',
    description: 'Unforgettable live music experience',
    type: 'event',
    color: '#E74C3C',
    icon: '🎵'
  },
  {
    id: 'pendant-5',
    name: 'Personal Journal',
    location: 'Your Desk',
    publicKey: new Uint8Array([
      123, 145, 167, 89, 234, 32, 45, 67,
      89, 12, 156, 234, 78, 156, 78, 90,
      123, 45, 67, 189, 234, 56, 78, 90,
      56, 78, 190, 23, 45, 67, 89, 234
    ]),
    did: 'did:key:z6MkdSxGt3KpL9nA5rY7vF2jB8wQ6mR4hN3iC9sP2eTxU4oV',
    description: 'Private thoughts and reflections',
    type: 'personal',
    color: '#34495E',
    icon: '📝'
  }
]

// --- Dynamic pendant generator for testing ---
export async function generateRandomPendant(): Promise<PendantInstallation> {
  const { privateKey, publicKey } = await generateKeypair()
  const did = createDIDFromPublicKey(publicKey)
  
  const names = ['Bookstore', 'Library', 'Playground', 'Beach', 'Mountain', 'Studio']
  const locations = ['Downtown', 'Uptown', 'Seaside', 'Hillside', 'Campus', 'Historic District']
  const types: Array<'personal' | 'location' | 'event' | 'art'> = ['location', 'event', 'art']
  const icons = ['📚', '🏖️', '⛰️', '🎭', '🏛️', '🌅']
  const colors = ['#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#E67E22', '#1ABC9C']
  
  const randomIndex = Math.floor(Math.random() * names.length)
  
  return {
    id: `pendant-${Date.now()}`,
    name: names[randomIndex],
    location: `${locations[randomIndex]} ${names[randomIndex]}`,
    publicKey,
    did,
    description: `Generated pendant for ${names[randomIndex]}`,
    type: types[Math.floor(Math.random() * types.length)],
    color: colors[randomIndex],
    icon: icons[randomIndex]
  }
}

// --- Get pendant by ID ---
export function getPendantById(id: string): PendantInstallation | undefined {
  return sampleInstallations.find(pendant => pendant.id === id)
}

// --- ESP32 Hardware Abstraction ---
// These functions simulate what the ESP32 NFC reader would do
export const NFC_Simulation = {
  // Simulate scanning for nearby NFC tags
  scanForTags: async (): Promise<PendantInstallation[]> => {
    // In real ESP32: this would use PN532 or similar NFC chip
    // Return random subset to simulate "pendants in range"
    const available = [...sampleInstallations]
    const count = Math.floor(Math.random() * 3) + 1 // 1-3 pendants
    return available.slice(0, count)
  },
  
  // Simulate reading data from a specific pendant
  readPendant: async (pendantId: string): Promise<PendantInstallation | null> => {
    // In real ESP32: this would read NDEF data from NFC tag
    const pendant = getPendantById(pendantId)
    return pendant || null
  },
  
  // Simulate writing data to a pendant (for setup)
  writePendant: async (pendantData: Partial<PendantInstallation>): Promise<boolean> => {
    // In real ESP32: this would write NDEF data to NFC tag
    console.log('Would write to NFC tag:', pendantData)
    return true
  }
} 