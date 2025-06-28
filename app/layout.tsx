// --- Root Layout: The Soul of KairOS ---
// Minimal dark-first design with Apple-inspired aesthetics and modern best practices.

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { PageLoader } from '@/components/ui/page-loader'
import { LoadingProvider } from '@/app/context/loading-provider'
import { Suspense } from 'react'

const inter = Inter({ subsets: ['latin'] })

// --- Universal Metadata: Crafted with intention ---
export const metadata: Metadata = {
  title: 'kairOS by MELD - Cryptographic NFC Interaction Platform',
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

// --- Service Worker Registration Script ---
const ServiceWorkerScript = () => (
  <script
    dangerouslySetInnerHTML={{
      __html: `
        // Register service worker for PWA functionality
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', async () => {
            try {
              const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
              });
              
              console.log('🚀 KairOS Service Worker registered:', registration.scope);
              
              // Listen for updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'activated') {
                      console.log('✅ New service worker activated');
                    }
                  });
                }
              });
              
            } catch (error) {
              console.warn('⚠️ Service Worker registration failed:', error);
            }
          });
        }
      `
    }}
  />
)

// --- RootLayout: The elegant entrypoint for all pages ---
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ServiceWorkerScript />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          <LoadingProvider>
            <div style={{ minHeight: '100vh' }} className="relative">
              {/* Minimal page loader for slow operations only */}
              <Suspense fallback={null}>
                <PageLoader />
              </Suspense>
              
              {/* Navigation */}
              <Navigation />
              
              {/* Main Content with smoother transitions */}
              <main className="pt-16 relative transition-opacity duration-200 ease-in-out">
                {children}
              </main>
              
              {/* Toast Notifications */}
              <Toaster />
            </div>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
