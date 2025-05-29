"use client"

import type React from "react"
import { useState } from "react"

interface EmailFormProps {
  onSendEmail: (email: string) => void
  disabled: boolean
}

export default function EmailForm({ onSendEmail, disabled }: EmailFormProps) {
  const [email, setEmail] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && !disabled) {
      onSendEmail(email)
      setEmail("")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        className="w-full p-4 border-2 border-gray-300 rounded-2xl font-mono text-sm bg-white shadow-inner focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
        disabled={disabled}
      />
      <button
        type="submit"
        disabled={!email || disabled}
        className="w-full py-4 px-4 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white font-mono rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-500 hover:via-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl border-2 border-blue-500"
      >
        📧 Send Me My Moments
      </button>
    </form>
  )
}
