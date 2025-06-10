// --- KairOS Navigation: Elegant Minimal Glass Design ---
// Beautiful Apple-inspired navigation with earth tones and glass morphism
// Responsive and accessible with subtle animations + Dark Mode Support

"use client"

import React, { useState } from 'react'
import CustomLink from '@/components/ui/custom-link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  NfcIcon, 
  TestTubeIcon, 
  SettingsIcon,
  SparklesIcon,
  KeyIcon,
  UserIcon,
  ChevronDownIcon,
  PencilRulerIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

// KairOS Navigation Structure
// Defines the navigation items for the application.
// The order of items in this array determines their order in the navigation bar.
// `hideLabel: true` will render the item as an icon-only button on the right.
interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  description: string
  hideLabel?: boolean
}

interface NavItemWithChildren extends NavItem {
  children?: NavItem[]
}

const navItems: NavItemWithChildren[] = [
  {
    href: '#',
    label: 'NFC',
    icon: <NfcIcon className="h-4 w-4" />,
    description: 'NFC tools and configuration',
    children: [
      {
        href: '/nfc',
        label: 'Auth',
        icon: <NfcIcon className="h-4 w-4" />,
        description: 'NFC authentication endpoint'
      },
      {
        href: '/nfc-test',
        label: 'Test',
        icon: <TestTubeIcon className="h-4 w-4" />,
        description: 'NFC testing laboratory'
      },
      {
        href: '/chip-config',
        label: 'Config',
        icon: <KeyIcon className="h-4 w-4" />,
        description: 'NTAG424 chip configuration'
      }
    ]
  },
  {
    href: '/ritual-designer',
    label: 'Designer',
    icon: <PencilRulerIcon className="h-4 w-4" />,
    description: 'Main simulation dashboard'
  },
  {
    href: '/zkMoments',
    label: 'ZK Moments (demo)',
    icon: <SparklesIcon className="h-4 w-4" />,
    description: 'Zero-knowledge moment viewer'
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: <UserIcon className="h-4 w-4" />,
    description: 'User profile and dashboard'
  },
  {
    href: '/cryptoDiagnostics',
    label: 'Diagnostics',
    icon: <SettingsIcon className="h-4 w-4" />,
    description: 'Cryptographic diagnostics',
    hideLabel: true
  }
]

export default function Navigation() {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  
  const isNavItemActive = (item: NavItemWithChildren) => {
    if (item.href === pathname) return true
    if (item.children?.some(child => child.href === pathname)) return true
    return false
  }
  
  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label)
  }
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav animate-fade-slide-up">
      <div className="container-adaptive">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Identity - Minimal kairOS Logo */}
          <CustomLink href="/" className="group transition-all duration-300 hover:opacity-90">
            <div className="flex flex-col items-start">
              <span className="text-xl font-mono font-light tracking-wider text-foreground/90 group-hover:text-primary transition-colors duration-300">
                kairOS
              </span>
              <span className="text-xs font-mono text-muted-foreground/50 -mt-1 group-hover:text-muted-foreground/70 transition-colors duration-300">
                by MELD
              </span>
            </div>
          </CustomLink>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.filter(item => !item.hideLabel).map((item) => {
              const isActive = isNavItemActive(item)
              
              if (item.children) {
                const isDropdownOpen = openDropdown === item.label
                
                return (
                  <div key={item.label} className="relative group">
                    <button
                      onClick={() => toggleDropdown(item.label)}
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
                      <ChevronDownIcon className={cn(
                        "h-3 w-3 transition-transform duration-300",
                        isDropdownOpen ? "rotate-180" : "rotate-0"
                      )} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-1 w-44 rounded-xl overflow-hidden border border-primary/20 bg-background/95 backdrop-blur-md shadow-lg shadow-primary/10 animate-in fade-in-50 zoom-in-95 duration-200 origin-top">
                        <div className="py-2">
                          {item.children.map(child => {
                            const isChildActive = pathname === child.href
                            return (
                              <CustomLink
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  "flex items-center gap-2 px-4 py-2 text-sm transition-colors duration-200",
                                  isChildActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-foreground hover:bg-primary/5"
                                )}
                                onClick={() => setOpenDropdown(null)}
                              >
                                <span className="text-primary/70">{child.icon}</span>
                                <span>{child.label}</span>
                              </CustomLink>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }
              
              return (
                <CustomLink
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
                </CustomLink>
              )
            })}
            
            {/* Diagnostics Icon and Theme Toggle */}
            <div className="ml-2 pl-2 border-l border-border/30 flex items-center gap-2">
              {navItems.filter(item => item.hideLabel).map((item) => {
                const isActive = pathname === item.href
                return (
                  <CustomLink
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative p-2 rounded-lg transition-all duration-300 interactive focus-ring overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-br from-primary/15 to-accent/10 text-primary shadow-[0_0_15px_rgba(245,181,145,0.25)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/8 hover:to-accent/5 hover:shadow-[0_0_10px_rgba(144,193,196,0.2)] hover:scale-105"
                    )}
                    title={item.description}
                  >
                    <span className="relative z-10 transition-all duration-300 group-hover:drop-shadow-sm">
                      {item.icon}
                    </span>
                  </CustomLink>
                )
              })}
              <ThemeToggle />
            </div>
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-2">
            <div className="flex items-center gap-1">
              {/* Show only first 3 main items in mobile */}
              {navItems.slice(0, 3).map((item) => {
                const isActive = isNavItemActive(item)
                
                // Special handling for NFC dropdown in mobile
                if (item.children) {
                  const isDropdownOpen = openDropdown === item.label
                  
                  return (
                    <div key={item.label} className="relative">
                      <button
                        onClick={() => toggleDropdown(item.label)}
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
                        <span className="relative z-10 transition-all duration-300 group-hover:drop-shadow-sm flex items-center">
                          {item.icon}
                        </span>
                      </button>
                      
                      {/* Mobile Dropdown */}
                      {isDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-36 rounded-xl overflow-hidden border border-primary/20 bg-background/95 backdrop-blur-md shadow-lg shadow-primary/10 animate-in fade-in-50 zoom-in-95 duration-200 origin-top">
                          <div className="py-2">
                            {item.children.map(child => {
                              const isChildActive = pathname === child.href
                              return (
                                <CustomLink
                                  key={child.href}
                                  href={child.href}
                                  className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 text-xs transition-colors duration-200",
                                    isChildActive
                                      ? "bg-primary/10 text-primary"
                                      : "text-foreground hover:bg-primary/5"
                                  )}
                                  onClick={() => setOpenDropdown(null)}
                                >
                                  <span className="text-primary/70">{child.icon}</span>
                                  <span>{child.label}</span>
                                </CustomLink>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }
                
                return (
                  <CustomLink
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
                  </CustomLink>
                )
              })}
            </div>
            
            {/* Mobile Theme Toggle and Diagnostics */}
            <div className="flex items-center gap-1">
              {navItems.filter(item => item.hideLabel).map((item) => {
                const isActive = pathname === item.href
                return (
                  <CustomLink
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative p-2 rounded-lg transition-all duration-300 interactive focus-ring overflow-hidden",
                      isActive 
                        ? "bg-gradient-to-br from-primary/15 to-accent/10 text-primary shadow-[0_0_15px_rgba(245,181,145,0.25)]" 
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-br hover:from-primary/8 hover:to-accent/5 hover:shadow-[0_0_10px_rgba(144,193,196,0.2)] hover:scale-105"
                    )}
                    title={item.description}
                  >
                    <span className="relative z-10 transition-all duration-300 group-hover:drop-shadow-sm">
                      {item.icon}
                    </span>
                  </CustomLink>
                )
              })}
              <ThemeToggle />
            </div>
            
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