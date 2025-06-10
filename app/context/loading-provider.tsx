'use client';

import React, { createContext, useState, ReactNode, useCallback } from 'react';

/**
 * @context LoadingContext
 * @description Provides a global state for managing page loading indicators.
 * This context allows any component to trigger the start and end of the
 * loading animation, ensuring that feedback is immediate upon user action,
 * rather than waiting for the new page to begin rendering.
 */
interface LoadingContextType {
  isPageLoading: boolean;
  startPageLoad: () => void;
  stopPageLoad: () => void;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

/**
 * @provider LoadingProvider
 * @description The provider component that encapsulates the application and
 * provides the loading state and controls to all descendant components.
 */
export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isPageLoading, setIsPageLoading] = useState(false);

  // useCallback ensures that these functions have a stable identity
  // and won't cause unnecessary re-renders for consumers of the context.
  const startPageLoad = useCallback(() => {
    setIsPageLoading(true);
  }, []);

  const stopPageLoad = useCallback(() => {
    setIsPageLoading(false);
  }, []);

  const value = { isPageLoading, startPageLoad, stopPageLoad };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
} 