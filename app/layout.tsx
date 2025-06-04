// --- Root Layout: The Soul of KairOS ---
// This layout wraps the entire application in a poetic, cross-platform shell.
import type { Metadata } from 'next'
import './globals.css'

// --- Universal Metadata: Crafted with intention ---
export const metadata: Metadata = {
  title: 'KairOS',
  description: 'Brought to you by MELD and Bradley C Royes',
  generator: 'MELD x Bradley C Royes',
}

// --- RootLayout: The elegant entrypoint for all pages ---
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh' }} className="relative">
          {/* Main Content */}
          {children}
        </div>
      </body>
    </html>
  )
}
