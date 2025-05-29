"use client"

import React, { useState } from "react"

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      aria-label={`Copy ${label}`}
      className={`ml-2 px-2 py-0.5 rounded font-mono text-xs border border-gray-300 bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200`}
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1200)
      }}
      type="button"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  )
} 