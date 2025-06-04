// --- KairOS Navigation: Elegant Cross-Platform Menu ---
// Beautiful navigation component for accessing all KairOS features
// Mobile-first design with smooth animations

"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Home, 
  Shield, 
  Stethoscope, 
  Sparkles, 
  Menu, 
  X,
  ChevronRight
} from 'lucide-react'

// --- Navigation Items (Streamlined for Microcontroller Focus) ---
const navigationItems = [
  {
    href: '/',
    label: 'Home',
    description: 'Main KairOS wearable simulation',
    icon: Home,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900'
  },
  {
    href: '/zkMoments',
    label: 'ZK Moments',
    description: 'Privacy-preserving event experiences',
    icon: Shield,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900',
    badge: 'ESP32 Ready'
  },
  {
    href: '/cryptoDiagnostics',
    label: 'Crypto Diagnostics',
    description: 'Test cryptographic primitives',
    icon: Stethoscope,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900'
  }
]

interface NavigationProps {
  className?: string
  variant?: 'full' | 'compact' | 'mobile'
}

export default function Navigation({ className = '', variant = 'full' }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const renderNavigationItem = (item: typeof navigationItems[0], index: number) => {
    const isActive = pathname === item.href
    const IconComponent = item.icon

    if (variant === 'compact') {
      return (
        <Link key={item.href} href={item.href}>
          <Button
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            className="flex items-center gap-2"
          >
            <IconComponent className="w-4 h-4" />
            {item.label}
            {item.badge && (
              <Badge variant="secondary" className="text-xs">
                {item.badge}
              </Badge>
            )}
          </Button>
        </Link>
      )
    }

    return (
      <Link key={item.href} href={item.href}>
        <Card 
          className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg group ${
            isActive ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${item.bgColor}`}>
              <IconComponent className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{item.label}</h3>
                {item.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {item.description}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
          </div>
        </Card>
      </Link>
    )
  }

  if (variant === 'mobile') {
    return (
      <div className={className}>
        {/* Mobile Menu Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
        >
          {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span className="ml-2">Menu</span>
        </Button>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-900 shadow-xl p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">KairOS</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {navigationItems.map((item, index) => (
                  <div key={item.href} onClick={() => setIsOpen(false)}>
                    {renderNavigationItem(item, index)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {navigationItems.map(renderNavigationItem)}
      </div>
    )
  }

  // Full variant
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          KairOS Features
        </h2>
      </div>
      {navigationItems.map(renderNavigationItem)}
    </div>
  )
}

// --- Compact Navigation Hook ---
export function useNavigation() {
  const pathname = usePathname()
  
  const currentPage = navigationItems.find(item => item.href === pathname)
  
  return {
    currentPage,
    navigationItems,
    isActive: (href: string) => pathname === href
  }
} 