// --- KairOS Navigation: Elegant Minimal Glass Design ---
// Beautiful Apple-inspired navigation with earth tones and glass morphism
// Responsive and accessible with subtle animations + Dark Mode Support

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
import { ThemeToggle } from '@/components/theme-toggle'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Designer',
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
              <div className="relative p-2.5 bg-gradient-to-br from-primary/80 to-accent/80 rounded-pixel shadow-pixel border-2 border-primary/20">
                <div className="w-5 h-5 bg-primary-foreground rounded-pixel flex items-center justify-center">
                  <span className="text-primary text-xs font-mono font-black">K</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 dark:to-white/10 rounded-pixel"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-mono font-black tracking-wider text-primary">
                  KairOS
                </span>
                <span className="text-xs text-muted-foreground font-mono hidden sm:block tracking-wide">
                  `by MELD`
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
                    "group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-500 interactive focus-ring overflow-hidden",
                    isActive 
                      ? "bg-gradient-to-r from-primary/15 via-primary/10 to-accent/10 text-primary shadow-[0_0_20px_rgba(245,181,145,0.3)] backdrop-blur-sm border border-primary/30" 
                      : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-primary/8 hover:via-accent/5 hover:to-primary/8 hover:shadow-[0_0_15px_rgba(144,193,196,0.2),0_0_30px_rgba(245,181,145,0.1)] hover:backdrop-blur-md hover:border hover:border-primary/20 hover:scale-[1.02] hover:-translate-y-0.5"
                  )}
                  title={item.description}
                >
                  {/* Holographic shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                  
                  <span className={cn("relative z-10 transition-all duration-300", 
                    isActive ? "text-primary drop-shadow-sm" : "text-muted-foreground group-hover:text-foreground group-hover:drop-shadow-sm"
                  )}>
                    {item.icon}
                  </span>
                  <span className="relative z-10 hidden lg:block font-medium transition-all duration-300 group-hover:font-semibold">
                    {item.label}
                  </span>
                </Link>
              )
            })}
            
            {/* Theme Toggle */}
            <div className="ml-2 pl-2 border-l border-border/30">
              <ThemeToggle />
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex items-center gap-1">
              {navItems.slice(0, 4).map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative p-2.5 rounded-lg transition-all duration-500 interactive focus-ring overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-br from-primary/15 to-accent/10 text-primary shadow-[0_0_15px_rgba(245,181,145,0.25)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/8 hover:to-accent/5 hover:shadow-[0_0_10px_rgba(144,193,196,0.2)] hover:scale-105 hover:-translate-y-0.5"
                    )}
                    title={item.description}
                  >
                    {/* Mobile holographic shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-800 ease-out" />
                    <span className="relative z-10 transition-all duration-300 group-hover:drop-shadow-sm">
                      {item.icon}
                    </span>
                  </Link>
                )
              })}
            </div>
            
            {/* Mobile Theme Toggle */}
            <ThemeToggle />
            
            {/* Mobile Menu Indicator */}
            <div className="ml-2 w-1 h-6 bg-gradient-to-b from-primary/60 to-accent/60 rounded-full opacity-60"></div>
          </div>
        </div>
      </div>
      
      {/* Subtle bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
    </nav>
  )
} 