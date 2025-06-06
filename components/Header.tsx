// --- KairOS Header: Poetic Brand Identity ---
// Beautiful branded header that adapts to dark mode
// Uses gradient text and earth tones for elegant branding

import React from "react"

/**
 * Header: The poetic, branded top section of KairOS
 * Now with dark mode support and beautiful earth tones
 */
export default function Header() {
  return (
    <div className="relative z-10 text-center mb-8">
      <h1 className="text-5xl font-mono font-bold gradient-text mb-3 tracking-tight">
        KairOS
      </h1>
      <p className="text-sm text-muted-foreground font-mono tracking-wide">
        Human-First Wearable OS.
      </p>
      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent mx-auto mt-3"></div>
    </div>
  )
} 