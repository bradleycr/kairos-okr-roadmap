// KairOS Theme Toggle: Cross-Platform Switch
// Elegant theme switcher with smooth animations and proper accessibility
// Optimized for both mobile and desktop with haptic feedback support

"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "icon" | "full" | "simple"
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ThemeToggle({ 
  variant = "icon", 
  size = "md",
  className 
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Handle hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "icon" : "default"}
        className={cn(
          "glass-button border-0 backdrop-blur-md",
          "h-10 w-10 rounded-xl transition-all duration-300",
          "bg-background/60 hover:bg-background/80",
          className
        )}
        disabled
      >
        <MonitorIcon className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === "dark"

  const handleThemeToggle = () => {
    // Add haptic feedback for mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50)
    }
    
    // Simple toggle between light and dark
    setTheme(isDark ? "light" : "dark")
  }

  // Simple variant for mobile navigation
  if (variant === "simple") {
    return (
      <button
        onClick={handleThemeToggle}
        className={cn(
          "relative p-3 rounded-xl transition-all duration-300 ease-out",
          "bg-muted/30 hover:bg-muted/50 active:bg-muted/60",
          "border border-muted/30 hover:border-primary/30",
          "focus:outline-none focus:ring-2 focus:ring-primary/30",
          "hover:scale-105 active:scale-95",
          "touch-manipulation select-none", // Better mobile interaction
          className
        )}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-5 h-5 flex items-center justify-center">
          <SunIcon 
            className={cn(
              "absolute w-5 h-5 transition-all duration-500 ease-out",
              isDark 
                ? "rotate-90 scale-0 opacity-0" 
                : "rotate-0 scale-100 opacity-100"
            )} 
          />
          <MoonIcon 
            className={cn(
              "absolute w-5 h-5 transition-all duration-500 ease-out",
              isDark 
                ? "rotate-0 scale-100 opacity-100" 
                : "-rotate-90 scale-0 opacity-0"
            )} 
          />
        </div>
        
        {/* Subtle background animation */}
        <div className={cn(
          "absolute inset-0 rounded-xl transition-all duration-500",
          "bg-gradient-to-br opacity-0 group-hover:opacity-100",
          isDark 
            ? "from-blue-500/10 to-purple-500/10" 
            : "from-yellow-400/10 to-orange-500/10"
        )} />
      </button>
    )
  }

  // Full variant with more detailed options
  if (variant === "full") {
    const options = [
      { value: "light", icon: SunIcon, label: "Light", desc: "Clean & minimal" },
      { value: "dark", icon: MoonIcon, label: "Dark", desc: "Easy on the eyes" },
      { value: "system", icon: MonitorIcon, label: "System", desc: "Matches device" }
    ]

    return (
      <div className={cn("flex flex-col space-y-2", className)}>
        <span className="text-sm font-medium text-muted-foreground px-1">Theme</span>
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ value, icon: Icon, label, desc }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl",
                "transition-all duration-300 ease-out touch-manipulation",
                "border border-muted/30 hover:border-primary/30",
                "bg-muted/20 hover:bg-muted/40 active:bg-muted/50",
                "focus:outline-none focus:ring-2 focus:ring-primary/30",
                theme === value && "border-primary/50 bg-primary/10 text-primary"
              )}
              aria-label={`Set ${label.toLowerCase()} theme`}
            >
              <Icon className="w-5 h-5" />
              <div className="text-center">
                <div className="text-xs font-medium">{label}</div>
                <div className="text-[10px] text-muted-foreground">{desc}</div>
              </div>
              
              {/* Selection indicator */}
              {theme === value && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Default icon variant
  return (
    <button
      onClick={handleThemeToggle}
      className={cn(
        "relative p-2.5 rounded-xl transition-all duration-300 ease-out",
        "bg-background/60 hover:bg-background/80 active:bg-background/90",
        "border border-muted/20 hover:border-primary/30",
        "backdrop-blur-md shadow-sm hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary/30",
        "hover:scale-105 active:scale-95",
        "touch-manipulation select-none", // Better mobile interaction
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <SunIcon 
          className={cn(
            "absolute w-4 h-4 transition-all duration-500 ease-out",
            isDark 
              ? "rotate-90 scale-0 opacity-0" 
              : "rotate-0 scale-100 opacity-100"
          )} 
        />
        <MoonIcon 
          className={cn(
            "absolute w-4 h-4 transition-all duration-500 ease-out",
            isDark 
              ? "rotate-0 scale-100 opacity-100" 
              : "-rotate-90 scale-0 opacity-0"
          )} 
        />
      </div>
    </button>
  )
} 