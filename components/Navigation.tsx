// --- KairOS Navigation: Elegant Cross-Platform Menu ---
// Beautiful navigation component for accessing all KairOS features
// Mobile-first design with smooth animations

"use client"

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  NfcIcon, 
  TestTubeIcon, 
  SettingsIcon,
  SparklesIcon,
  KeyIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'KairOS',
    icon: <HomeIcon className="h-4 w-4" />,
    description: 'Main simulation dashboard'
  },
  {
    href: '/nfc',
    label: 'NFC Auth',
    icon: <NfcIcon className="h-4 w-4" />,
    description: 'NFC authentication endpoint'
  },
  {
    href: '/nfc-test',
    label: 'NFC Test',
    icon: <TestTubeIcon className="h-4 w-4" />,
    description: 'NFC testing laboratory'
  },
  {
    href: '/chip-config',
    label: 'Chip Config',
    icon: <KeyIcon className="h-4 w-4" />,
    description: 'NTAG424 chip configuration'
  },
  {
    href: '/zkMoments',
    label: 'ZK Moments',
    icon: <SparklesIcon className="h-4 w-4" />,
    description: 'Zero-knowledge moment viewer'
  },
  {
    href: '/cryptoDiagnostics',
    label: 'Crypto Diagnostics',
    icon: <SettingsIcon className="h-4 w-4" />,
    description: 'Cryptographic diagnostics'
  }
]

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                <SparklesIcon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                KairOS
              </span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive 
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-purple-600 dark:hover:text-purple-400"
                  )}
                  title={item.description}
                >
                  {item.icon}
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              )
            })}
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <div className="flex items-center gap-1">
              {navItems.slice(0, 3).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "p-2 rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300" 
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                    )}
                    title={item.description}
                  >
                    {item.icon}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
} 