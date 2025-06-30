import { useState, useEffect, useCallback } from 'react';

// IndexedDB utilities for Morning Eight
const DB_NAME = 'morningEight';
const DB_VERSION = 1;
const STORE_NAME = 'data';

interface IndexedDbState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  save: (data: T) => Promise<void>;
  clear: () => Promise<void>;
}

// Initialize IndexedDB
const initDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Generic IndexedDB hook
export function useIndexedDbState<T>(key: string, defaultValue: T): IndexedDbState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load data from IndexedDB
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      return new Promise<T>((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          resolve(result !== undefined ? result : defaultValue);
        };
      });
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      setError('Failed to load data');
      return defaultValue;
    } finally {
      setLoading(false);
    }
  }, [key, defaultValue]);

  // Save data to IndexedDB
  const save = useCallback(async (newData: T) => {
    try {
      setError(null);
      
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.put(newData, key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      
      setData(newData);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
      setError('Failed to save data');
      throw error;
    }
  }, [key]);

  // Clear data from IndexedDB
  const clear = useCallback(async () => {
    try {
      setError(null);
      
      const db = await initDB();
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
      
      setData(null);
    } catch (error) {
      console.error('Failed to clear from IndexedDB:', error);
      setError('Failed to clear data');
      throw error;
    }
  }, [key]);

  // Load data on mount
  useEffect(() => {
    loadData().then(setData);
  }, [loadData]);

  return {
    data,
    loading,
    error,
    save,
    clear,
  };
} 