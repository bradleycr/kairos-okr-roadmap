// --- ZKBirthday Utilities ---
// Letter rotation logic and localStorage management
// Privacy-first data handling with no external dependencies

// --- Constants ---
export const CHARLIE_LETTERS = ['C', 'H', 'A', 'R', 'L', 'I', 'E'] as const
export const STORAGE_KEY = 'zkCharlieWords'
export const INDEX_KEY = 'zkCharlieLastIndex'

// --- Types ---
export interface WordEntry {
  letter: string
  word: string
  timestamp: number
  contributor?: string
}

export interface GroupedWords {
  [letter: string]: {
    word: string
    timestamp: number
    contributor: string
  }[]
}

// --- Letter Assignment Logic ---

/**
 * Get the next letter in the CHARLIE sequence
 * Rotates through C → H → A → R → L → I → E → C → ...
 */
export function getNextLetter(): string {
  if (typeof window === 'undefined') return 'C'
  
  try {
    // Get current index from localStorage
    const lastIndexStr = localStorage.getItem(INDEX_KEY)
    const lastIndex = lastIndexStr ? parseInt(lastIndexStr, 10) : -1
    
    // Calculate next index (with wraparound)
    const nextIndex = (lastIndex + 1) % CHARLIE_LETTERS.length
    
    // Store the new index
    localStorage.setItem(INDEX_KEY, nextIndex.toString())
    
    return CHARLIE_LETTERS[nextIndex]
  } catch (error) {
    console.error('Failed to get next letter:', error)
    return 'C' // Fallback to first letter
  }
}

/**
 * Get the current letter assignment without advancing the counter
 */
export function getCurrentLetter(): string {
  if (typeof window === 'undefined') return 'C'
  
  try {
    const lastIndexStr = localStorage.getItem(INDEX_KEY)
    const lastIndex = lastIndexStr ? parseInt(lastIndexStr, 10) : -1
    const currentIndex = (lastIndex + 1) % CHARLIE_LETTERS.length
    
    return CHARLIE_LETTERS[currentIndex]
  } catch (error) {
    console.error('Failed to get current letter:', error)
    return 'C'
  }
}

/**
 * Reset the letter rotation to start from 'C' again
 */
export function resetLetterRotation(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(INDEX_KEY, '-1')
  } catch (error) {
    console.error('Failed to reset letter rotation:', error)
  }
}

// --- Word Storage Logic ---

/**
 * Save a word to the API only
 * Let the API handle all storage layers for consistency
 */
export async function saveWord(letter: string, word: string, contributor: string = 'anonymous'): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    // Validate inputs
    if (!letter || !word.trim()) {
      console.error('Invalid letter or word provided')
      return false
    }
    
    if (!CHARLIE_LETTERS.includes(letter as any)) {
      console.error('Invalid letter:', letter)
      return false
    }

    const sessionId = new URLSearchParams(window.location.search).get('session') || 'charlies-birthday-2024'
    
    console.log(`saveWord: Saving "${word}" to letter "${letter}" for session "${sessionId}"`)
    
    // Save to API - let the API handle all storage layers
    const response = await fetch('/api/zkbirthday/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        letter: letter.toUpperCase(),
        word: word.trim(),
        contributor,
        sessionId
      })
    })
    
    const result = await response.json()
    
    if (result.success) {
      console.log('saveWord: Word saved successfully to API:', result.data)
      return true
    } else {
      console.error('saveWord: API save failed:', result.error)
      return false
    }
    
  } catch (error) {
    console.error('saveWord: Failed to save word:', error)
    return false
  }
}

/**
 * Load all words from localStorage
 */
export function loadWords(): WordEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const words = JSON.parse(stored) as WordEntry[]
    
    // Validate and clean the data
    return words.filter(word => 
      word && 
      typeof word.letter === 'string' && 
      typeof word.word === 'string' && 
      typeof word.timestamp === 'number' &&
      CHARLIE_LETTERS.includes(word.letter as any)
    )
  } catch (error) {
    console.error('Failed to load words:', error)
    return []
  }
}

/**
 * Load words grouped by letter
 */
export function loadGroupedWords(): GroupedWords {
  const words = loadWords()
  const grouped: GroupedWords = {}
  
  // Initialize empty arrays for all letters
  CHARLIE_LETTERS.forEach(letter => {
    grouped[letter] = []
  })
  
  // Group words by letter
  words.forEach(word => {
    const letter = word.letter.toUpperCase()
    if (grouped[letter]) {
      grouped[letter].push({
        word: word.word,
        timestamp: word.timestamp,
        contributor: word.contributor || 'anonymous'
      })
    }
  })
  
  // Sort words within each letter by timestamp (newest first)
  Object.keys(grouped).forEach(letter => {
    grouped[letter].sort((a, b) => b.timestamp - a.timestamp)
  })
  
  return grouped
}

/**
 * Get words for a specific letter
 */
export function getWordsForLetter(letter: string): WordEntry[] {
  const words = loadWords()
  return words.filter(word => word.letter.toUpperCase() === letter.toUpperCase())
}

/**
 * Get total word count
 */
export function getTotalWordCount(): number {
  return loadWords().length
}

/**
 * Get unique contributor count
 */
export function getUniqueContributorCount(): number {
  const words = loadWords()
  const contributors = new Set(words.map(word => word.contributor || 'anonymous'))
  return contributors.size
}

/**
 * Get statistics about the constellation
 */
export function getConstellationStats() {
  const words = loadWords()
  const grouped = loadGroupedWords()
  
  const lettersWithWords = CHARLIE_LETTERS.filter(letter => 
    grouped[letter] && grouped[letter].length > 0
  ).length
  
  const contributors = new Set(words.map(word => word.contributor || 'anonymous'))
  
  // Calculate time spans
  const timestamps = words.map(word => word.timestamp).sort((a, b) => a - b)
  const firstWord = timestamps[0]
  const lastWord = timestamps[timestamps.length - 1]
  const timeSpan = lastWord - firstWord
  
  return {
    totalWords: words.length,
    lettersCompleted: lettersWithWords,
    totalLetters: CHARLIE_LETTERS.length,
    uniqueContributors: contributors.size,
    timeSpan,
    firstWordTime: firstWord,
    lastWordTime: lastWord,
    completionPercentage: (lettersWithWords / CHARLIE_LETTERS.length) * 100
  }
}

/**
 * Clear all data (useful for testing or reset)
 */
export function clearAllData(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(INDEX_KEY)
    localStorage.removeItem('zkBirthdayContributor')
  } catch (error) {
    console.error('Failed to clear data:', error)
  }
}

/**
 * Export data for backup or sharing
 */
export function exportData(): string {
  const data = {
    words: loadWords(),
    stats: getConstellationStats(),
    exportTime: Date.now(),
    version: '1.0'
  }
  
  return JSON.stringify(data, null, 2)
}

/**
 * Import data from backup
 */
export function importData(jsonData: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const data = JSON.parse(jsonData)
    
    // Validate structure
    if (!data.words || !Array.isArray(data.words)) {
      throw new Error('Invalid data format')
    }
    
    // Validate each word entry
    const validWords = data.words.filter((word: any) => 
      word && 
      typeof word.letter === 'string' && 
      typeof word.word === 'string' && 
      typeof word.timestamp === 'number' &&
      CHARLIE_LETTERS.includes(word.letter.toUpperCase() as any)
    )
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validWords))
    
    return true
  } catch (error) {
    console.error('Failed to import data:', error)
    return false
  }
}

// --- Utility Functions for UI ---

/**
 * Format timestamp for display
 */
export function formatTimestamp(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now'
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  }
  
  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours === 1 ? '' : 's'} ago`
  }
  
  // More than 1 day
  const days = Math.floor(diff / 86400000)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/**
 * Get a random color for word visualization
 */
export function getWordColor(letter: string): string {
  const colors = {
    'C': 'text-her-orange-500',
    'H': 'text-retro-teal-500',
    'A': 'text-retro-sage-500',
    'R': 'text-retro-lavender-500',
    'L': 'text-retro-coral-500',
    'I': 'text-retro-slate-500',
    'E': 'text-accent'
  }
  
  return colors[letter as keyof typeof colors] || 'text-primary'
}

/**
 * Check if constellation is complete (all letters have at least one word)
 */
export function isConstellationComplete(): boolean {
  const grouped = loadGroupedWords()
  return CHARLIE_LETTERS.every(letter => grouped[letter] && grouped[letter].length > 0)
} 