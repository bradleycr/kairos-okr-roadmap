import React from "react"

/**
 * Header: The poetic, branded top section of KairOS
 */
export default function Header() {
  return (
    <div className="relative z-10 text-center mb-8">
      <h1 className="text-5xl font-mono font-bold bg-gradient-to-r from-gray-800 via-teal-700 to-gray-800 bg-clip-text text-transparent mb-3 tracking-tight">
        KairOS
      </h1>
      <p className="text-sm text-gray-600 font-mono tracking-wide">Human-First Wearable OS.</p>
      <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent mx-auto mt-3"></div>
    </div>
  )
} 