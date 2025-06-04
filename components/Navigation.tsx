// --- KairOS Navigation: Elegant Minimal Glass Design ---
// Beautiful Apple-inspired navigation with earth tones and glass morphism
// Responsive and accessible with subtle animations

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
  KeyIcon,
  UserIcon
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
    href: '/profile',
    label: 'Profile',
    icon: <UserIcon className="h-4 w-4" />,
    description: 'User profile and dashboard'
  },
  {
    href: '/zkMoments',
    label: 'ZK Moments',
    icon: <SparklesIcon className="h-4 w-4" />,
    description: 'Zero-knowledge moment viewer'
  },
  {
    href: '/cryptoDiagnostics',
    label: 'Diagnostics',
    icon: <SettingsIcon className="h-4 w-4" />,
    description: 'Cryptographic diagnostics'
  }
]

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav animate-fade-slide-up">
      <div className="container-adaptive">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center gap-3">
              <div className="relative p-2.5 bg-gradient-to-br from-sage-400 to-sage-600 rounded-xl shadow-float">
                <SparklesIcon className="h-5 w-5 text-white" />
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 rounded-xl"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold gradient-text">
                  KairOS
                </span>
                <span className="text-xs text-muted-foreground font-medium hidden sm:block">
                  by MELD
                </span>
              </div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 interactive focus-ring",
                    isActive 
                      ? "bg-sage-100/80 text-sage-700 shadow-minimal backdrop-blur-sm border border-sage-200/50" 
                      : "text-neutral-600 hover:text-sage-600 hover:bg-white/60 hover:backdrop-blur-sm hover:border hover:border-white/30"
                  )}
                  title={item.description}
                >
                  <span className={cn("transition-colors", 
                    isActive ? "text-sage-600" : "text-neutral-500"
                  )}>
                    {item.icon}
                  </span>
                  <span className="hidden lg:block font-medium">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="flex items-center gap-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "p-2.5 rounded-lg transition-all duration-300 interactive focus-ring",
                      isActive 
                        ? "bg-sage-100/80 text-sage-700 shadow-minimal" 
                        : "text-neutral-600 hover:text-sage-600 hover:bg-white/60"
                    )}
                    title={item.description}
                  >
                    {item.icon}
                  </Link>
                )
              })}
              
              {/* Mobile Menu Indicator */}
              <div className="ml-2 w-1 h-6 bg-gradient-to-b from-sage-300 to-terracotta-300 rounded-full opacity-60"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sage-200/50 to-transparent"></div>
    </nav>
  )
} 