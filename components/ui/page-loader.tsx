"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { usePageLoading } from '@/app/hooks/use-page-loading';
import { Loader } from 'lucide-react';

/**
 * @module PageLoader
 * @description An elegant page loader that provides immediate feedback for navigation
 * while being fast enough to not feel sluggish. Strikes the perfect balance.
 */
export function PageLoader() {
  const { isPageLoading, stopPageLoad } = usePageLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [showCentralLoader, setShowCentralLoader] = useState(false);

  // Start loading with immediate feedback but smart timing
  useEffect(() => {
    if (isPageLoading) {
      setIsVisible(true);
      setProgress(0);

      // Immediate initial progress for responsiveness
      const initialTimer = setTimeout(() => setProgress(25), 50);
      
      // Gradual progress that feels natural
      const progressTimer = setTimeout(() => {
        setProgress(prev => Math.max(prev, 50 + Math.random() * 20));
      }, 200);
      
      const progressTimer2 = setTimeout(() => {
        setProgress(prev => Math.max(prev, 75 + Math.random() * 15));
      }, 500);

      // Show central loader for longer transitions
      const centralTimer = setTimeout(() => {
        setShowCentralLoader(true);
      }, 300);

      return () => {
        clearTimeout(initialTimer);
        clearTimeout(progressTimer);
        clearTimeout(progressTimer2);
        clearTimeout(centralTimer);
      };
    }
  }, [isPageLoading]);

  // Complete loading when route changes
  useEffect(() => {
    if (isVisible) {
      setProgress(100);
      
      // Quick but not jarring completion
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setShowCentralLoader(false);
        stopPageLoad();
        setProgress(0);
      }, 250);

      return () => clearTimeout(hideTimer);
    }
  }, [pathname, searchParams, isVisible, stopPageLoad]);

  return (
    <>
      {/* Top progress bar */}
      <div
        className={cn(
          "fixed top-0 left-0 w-full z-50 transition-opacity duration-300",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ pointerEvents: 'none' }}
      >
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Subtle central loader for longer transitions */}
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center bg-background/30 backdrop-blur-sm z-40 transition-opacity duration-200",
          showCentralLoader ? "opacity-100" : "opacity-0",
          !showCentralLoader && "pointer-events-none"
        )}
      >
        <div className="relative w-16 h-16">
          {/* Simple elegant spinner */}
          <div className="absolute inset-0 animate-spin">
            <div className="w-4 h-4 bg-primary rounded-full absolute top-0 left-1/2 -translate-x-1/2 opacity-75" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}>
            <div className="w-3 h-3 bg-accent rounded-full absolute bottom-0 left-1/2 -translate-x-1/2 opacity-60" />
          </div>
          
          {/* Central kairOS logo */}
          <div className="absolute inset-0 flex items-center justify-center animate-gentle-pulse">
            <div className="relative p-2 bg-gradient-to-br from-primary/70 to-accent/70 rounded-pixel shadow-lg border border-primary/30">
              <div className="w-6 h-6 bg-primary-foreground rounded-pixel flex items-center justify-center">
                <span className="text-primary text-lg font-mono font-black">k</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 dark:to-white/10 rounded-pixel"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 