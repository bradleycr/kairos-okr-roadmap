// --- Root Layout: The Soul of KairOS ---
// This layout wraps the entire application in a poetic, cross-platform shell.
import type { Metadata } from 'next'
import './globals.css'
import Footer from '@/components/ui/footer'
import DevToolsPanel from '@/components/ui/DevToolsPanel'

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
        <div style={{ minHeight: '100vh', paddingBottom: 'var(--footer-height, 2.7rem)' }} className="relative">
          {children}
        </div>
        <DevToolsPanel />
        <Footer />
      </body>
    </html>
  )
}
