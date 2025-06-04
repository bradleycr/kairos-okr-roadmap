// --- Root Layout: The Soul of KairOS ---
// This layout wraps the entire application in a minimal, elegant shell.
import type { Metadata } from 'next'
import './globals.css'

// --- Universal Metadata: Crafted with intention ---
export const metadata: Metadata = {
  title: 'KairOS',
  description: 'Human first wearable OS | Ritual design system',
  generator: 'MELD x Bradley C Royes',
}

// --- RootLayout: The minimal entrypoint for all pages ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-white">
          {/* Minimal frame wrapper */}
          <div className="minimal-frame-inner">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="heading-primary">KairOS</h1>
                <span className="badge-minimal">beta</span>
              </div>
              <p className="heading-secondary">Human first wearable OS | Ritual design system</p>
            </header>
            
            {/* Main Content */}
            <main className="minimal-frame">
              {children}
            </main>
            
            {/* Footer */}
            <footer className="mt-8 pt-4 border-t border-gray-200">
              <p className="mono-text text-center text-gray-500">
                Simulation brought to you by MELD
              </p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
