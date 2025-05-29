"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global error:", error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-teal-50">
          <div className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-mono font-bold bg-gradient-to-r from-gray-800 via-teal-700 to-gray-800 bg-clip-text text-transparent mb-4">
              Something went wrong
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              The application encountered a critical error. Please try refreshing the page.
            </p>
            <button
              onClick={reset}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium rounded-lg shadow-sm hover:from-teal-600 hover:to-teal-700 transition-all duration-200"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
} 