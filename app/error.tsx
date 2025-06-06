"use client"

import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-lg shadow-minimal">
        <h2 className="text-2xl font-mono font-bold gradient-text mb-4">
          Something went wrong
        </h2>
        <p className="text-sm text-foreground mb-6">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg shadow-sm hover:bg-primary/90 transition-all duration-200"
        >
          Try again
        </button>
      </div>
    </div>
  )
} 