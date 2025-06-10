'use client';

import { useContext } from 'react';
import { LoadingContext } from '../context/loading-provider';

/**
 * @hook usePageLoading
 * @description A custom hook for accessing the page loading state and controls.
 * It provides a clean and simple API for components to interact with the
 * global loading indicator. Throws an error if used outside of a LoadingProvider.
 */
export function usePageLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('usePageLoading must be used within a LoadingProvider');
  }
  return context;
} 