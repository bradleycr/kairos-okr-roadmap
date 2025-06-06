// --- Root Layout: The Soul of KairOS ---
// Minimal dark-first design with Apple-inspired aesthetics and modern best practices.

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'

const inter = Inter({ subsets: ['latin'] })

// --- Universal Metadata: Crafted with intention ---
export const metadata: Metadata = {
  title: 'KairOS - Cryptographic NFC Interaction Platform',
  description: 'Open-source cryptographic NFC interaction system for events, art installations, and digital experiences.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
}

// --- Viewport Configuration: Modern Next.js best practices ---
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' }
  ]
}

// --- RootLayout: The elegant entrypoint for all pages ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <div style={{ minHeight: '100vh' }} className="relative">
            {/* Navigation */}
            <Navigation />
            
            {/* Main Content */}
            <main className="pt-16 relative">
              {children}
            </main>
            
            {/* Toast Notifications */}
            <Toaster />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
