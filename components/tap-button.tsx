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