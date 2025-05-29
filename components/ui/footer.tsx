import React from 'react';

/**
 * Footer — A minimal, elegant, and on-brand sticky footer for KairOS.
 * Always visible, overlays content only when needed, and never breaks the design.
 * Cross-platform, mobile-first, and beautifully modular.
 */
export const Footer: React.FC = () => {
  return (
    <footer
      className="w-full left-0 bottom-0 z-50 flex justify-center items-center py-3 px-2 text-xs md:text-sm text-neutral-500 select-none bg-white/70 dark:bg-black/60 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 fixed"
      style={{
        fontFamily: 'inherit',
        letterSpacing: '0.02em',
        boxShadow: '0 -2px 16px 0 rgba(0,0,0,0.03)',
        minHeight: '2.5rem',
        height: 'var(--footer-height, 2.7rem)',
        '--footer-height': '2.7rem',
      } as React.CSSProperties}
      role="contentinfo"
    >
      {/* Elegant divider for subtle separation (now handled by border-t) */}
      <span className="relative z-10">
        Brought to you by{' '}
        <a
          href="https://github.com/meldtech"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 decoration-neutral-400 hover:decoration-neutral-700 transition-colors duration-200 font-semibold text-neutral-700 hover:text-black dark:text-neutral-200 dark:hover:text-white"
        >
          MELD
        </a>
      </span>
    </footer>
  );
};

export default Footer; 