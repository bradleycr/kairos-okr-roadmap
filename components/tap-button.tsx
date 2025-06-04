"use client"

import { useState } from "react"
import { HAL } from "@/lib/hardwareAbstraction"

interface TapButtonProps {
  onTap: () => void
  disabled: boolean
}

export default function TapButton({ onTap, disabled }: TapButtonProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleTap = () => {
    if (disabled) return

    setIsAnimating(true)
    onTap()

    // --- Cross-platform vibration using HAL ---
    HAL.vibration.vibrate(100)

    // Reset animation state
    setTimeout(() => {
      setIsAnimating(false)
    }, 300)
  }

  return (
    <button
      onClick={handleTap}
      disabled={disabled}
      className={`
        relative inline-flex items-center justify-center
        px-8 py-4 text-lg font-semibold text-white
        bg-gradient-to-r from-teal-500 to-blue-600
        rounded-xl shadow-lg transition-all duration-200
        hover:from-teal-600 hover:to-blue-700 hover:shadow-xl
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        ${isAnimating ? 'animate-pulse' : ''}
      `}
    >
      Tap to Connect
    </button>
  )
}