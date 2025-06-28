// --- KairOS Navigation: Elegant Minimal Glass Design ---
// Beautiful Apple-inspired navigation with earth tones and glass morphism
// Responsive and accessible with subtle animations + Dark Mode Support

"use client"

import React, { useState, useEffect } from 'react'
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
  NetworkIcon,
  XIcon,
  LayersIcon,
  GlobeIcon,
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
    href: '/didkey-demo',
    label: 'DID:Key Demo',
    icon: <KeyIcon className="h-4 w-4" />,
    description: 'Simplified DID:Key authentication demo'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Show floating icon on ALL pages on mobile (since we're hiding the nav bar completely)
  const shouldShowFloatingIcon = true // Always show on mobile
  
  // Close menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false)
    setOpenDropdown(null)
  }, [pathname])
  
  const isNavItemActive = (item: NavItemWithChildren) => {
    if (item.href === pathname) return true
    if (item.children?.some(child => child.href === pathname)) return true
    return false
  }
  
  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label)
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }
  
  return (
    <>
      {/* Mobile Menu Toggle Button - Hide when menu is open */}
      <div className={cn(
        "md:hidden fixed top-4 right-4 z-[60] transition-all duration-500",
        shouldShowFloatingIcon && !mobileMenuOpen
          ? "opacity-80 scale-100" 
          : "opacity-0 scale-0 pointer-events-none"
      )}>
        <button
          onClick={toggleMobileMenu}
          className={cn(
            "group relative p-3 rounded-full transition-all duration-300 touch-manipulation",
            "bg-background/70 dark:bg-background/85 backdrop-blur-lg",
            "border border-primary/15 shadow-md shadow-primary/8",
            "hover:shadow-lg hover:shadow-primary/12 hover:scale-105 hover:bg-background/85",
            "active:scale-95",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-background"
          )}
          aria-label="Open navigation menu"
        >
          {/* Subtle holographic background effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/8 via-accent/4 to-primary/8 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Network Icon - Clean and professional */}
          <div className="relative z-10">
            <NetworkIcon className="h-4 w-4 text-primary/70 transition-all duration-300" />
            
            {/* Subtle pulsing rings */}
            <div className="absolute inset-0 rounded-full border border-primary/20 scale-100 opacity-50 animate-pulse" />
            <div className="absolute inset-0 rounded-full border border-accent/15 scale-125 opacity-30 animate-pulse" style={{ animationDelay: '0.5s' }} />
          </div>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "md:hidden fixed inset-0 z-[55] transition-all duration-400",
        mobileMenuOpen 
          ? "opacity-100 pointer-events-auto" 
          : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/60"
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menu Panel */}
        <div className={cn(
          "absolute top-0 right-0 h-full w-80 max-w-[90vw]",
          "bg-background border-l border-border/40",
          "shadow-2xl shadow-black/30 dark:shadow-black/60",
          "transition-all duration-400 ease-out",
          "overscroll-behavior-contain", // Prevent scroll issues
          mobileMenuOpen 
            ? "translate-x-0" 
            : "translate-x-full"
        )}>
          {/* Header with proper spacing */}
          <div className="flex items-center justify-between p-6 border-b border-border/40">
            <div className="flex flex-col">
              <span className="text-xl font-mono font-light tracking-wider text-foreground">
                kairOS
              </span>
              <span className="text-xs font-mono text-muted-foreground/80 -mt-0.5">
                collective intelligence
              </span>
            </div>
            
            {/* Close button with proper z-index */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="relative z-20 group p-2 rounded-lg transition-all duration-200 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label="Close navigation menu"
            >
              <XIcon className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </button>
          </div>
          
          {/* Navigation Items - Professional spacing and animations */}
          <div className="flex flex-col p-6 space-y-3 h-[calc(100vh-120px)] overflow-y-auto overscroll-behavior-contain">
            {/* Home */}
            <CustomLink
              href="/"
              className={cn(
                "group flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                "hover:bg-muted/40 active:bg-muted/60",
                "border border-transparent hover:border-border/40",
                pathname === "/" && "bg-muted/50 border-border/60 shadow-sm"
              )}
              onClick={() => setMobileMenuOpen(false)}
              style={{ 
                animationDelay: '0ms',
                animation: mobileMenuOpen ? 'slideInRight 0.4s ease-out forwards' : 'none'
              }}
            >
              <span className={cn(
                "transition-colors duration-200",
                pathname === "/" ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
              )}>
                <HomeIcon className="h-4 w-4" />
              </span>
              <span className={cn(
                "font-medium transition-colors duration-200",
                pathname === "/" ? "text-foreground" : "text-foreground/90"
              )}>
                Home
              </span>
            </CustomLink>

            {/* All navigation items with consistent spacing */}
            {navItems.map((item, index) => {
              const isActive = isNavItemActive(item)
              const actualIndex = index + 1
              
              if (item.children) {
                const isDropdownOpen = openDropdown === item.label
                
                return (
                  <div key={item.label} className="space-y-2">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={cn(
                        "group w-full flex items-center justify-between p-4 rounded-xl transition-all duration-200",
                        "hover:bg-muted/40 active:bg-muted/60",
                        "border border-transparent hover:border-border/40",
                        isActive && "bg-muted/50 border-border/60 shadow-sm"
                      )}
                      style={{ 
                        animationDelay: `${actualIndex * 80}ms`,
                        animation: mobileMenuOpen ? 'slideInRight 0.4s ease-out forwards' : 'none'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "transition-colors duration-200",
                          isActive ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                        )}>
                          {item.icon}
                        </span>
                        <span className={cn(
                          "font-medium transition-colors duration-200",
                          isActive ? "text-foreground" : "text-foreground/90"
                        )}>
                          {item.label}
                        </span>
                      </div>
                      <ChevronDownIcon className={cn(
                        "h-4 w-4 transition-transform duration-200 text-foreground/50",
                        isDropdownOpen ? "rotate-180" : "rotate-0"
                      )} />
                    </button>
                    
                    {/* Dropdown with smooth animation */}
                    <div className={cn(
                      "overflow-hidden transition-all duration-300",
                      isDropdownOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
                    )}>
                      <div className="ml-6 space-y-2">
                        {item.children.map(child => {
                          const isChildActive = pathname === child.href
                          return (
                            <CustomLink
                              key={child.href}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                                isChildActive
                                  ? "bg-muted/40 text-foreground border border-border/30"
                                  : "text-foreground/70 hover:text-foreground hover:bg-muted/30"
                              )}
                              onClick={() => {
                                setMobileMenuOpen(false)
                                setOpenDropdown(null)
                              }}
                            >
                              <span className="text-primary/70">{child.icon}</span>
                              <span className="text-sm">{child.label}</span>
                            </CustomLink>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              }
              
              // Regular navigation items
              return (
                <CustomLink
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 p-4 rounded-xl transition-all duration-200",
                    "hover:bg-muted/40 active:bg-muted/60",
                    "border border-transparent hover:border-border/40",
                    isActive && "bg-muted/50 border-border/60 shadow-sm"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ 
                    animationDelay: `${actualIndex * 80}ms`,
                    animation: mobileMenuOpen ? 'slideInRight 0.4s ease-out forwards' : 'none'
                  }}
                >
                  <span className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-primary" : "text-foreground/70 group-hover:text-foreground"
                  )}>
                    {item.icon}
                  </span>
                  <span className={cn(
                    "font-medium transition-colors duration-200",
                    isActive ? "text-foreground" : "text-foreground/90"
                  )}>
                    {item.hideLabel ? 'Diagnostics' : item.label}
                  </span>
                </CustomLink>
              )
            })}
            
            {/* Theme Toggle Section */}
            <div className="pt-6 mt-6 border-t border-border/40">
              <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/40">
                <span className="text-sm font-medium text-foreground">Appearance</span>
                <ThemeToggle variant="simple" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Navigation - Always visible */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 glass-nav animate-fade-slide-up transition-all duration-500",
        "hidden md:block" // Only show on desktop
      )}>
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
            
            {/* Desktop Navigation Items */}
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
                      
                      {/* Desktop Dropdown Menu */}
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
          </div>
        </div>
        
        {/* Subtle bottom border gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
      </nav>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  )
} 