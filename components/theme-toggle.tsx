// --- KairOS Theme Toggle: Beautiful Cross-Platform Switch ---
// Elegant theme switcher with smooth animations and proper accessibility
// Optimized for both mobile and desktop with haptic feedback support

"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { SunIcon, MoonIcon, MonitorIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  variant?: "icon" | "full"
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
          "h-9 w-9 rounded-xl transition-all duration-300",
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
  const isSystem = theme === "system"

  const handleThemeChange = (newTheme: string) => {
    // Add haptic feedback for mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(50)
    }
    setTheme(newTheme)
  }

  if (variant === "full") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "glass-button justify-start gap-3 px-4 py-2.5 h-auto",
              "bg-background/60 hover:bg-background/80 border-0",
              "backdrop-blur-md rounded-xl transition-all duration-300",
              "focus-ring shadow-sm hover:shadow-md",
              className
            )}
          >
            <div className="relative">
              {isDark && (
                <MoonIcon className="h-4 w-4 text-foreground animate-in fade-in-0 duration-300" />
              )}
              {!isDark && (
                <SunIcon className="h-4 w-4 text-foreground animate-in fade-in-0 duration-300" />
              )}
              {isSystem && (
                <MonitorIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">
                {isDark ? "Dark Mode" : "Light Mode"}
              </span>
              <span className="text-xs text-muted-foreground">
                {isSystem ? "System preference" : "Manual selection"}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end" 
          className="glass-card border-0 backdrop-blur-md min-w-48"
        >
          <DropdownMenuItem
            onClick={() => handleThemeChange("light")}
            className={cn(
              "gap-3 py-2.5 px-3 rounded-lg cursor-pointer",
              "focus:bg-background/80 transition-colors",
              theme === "light" && "bg-accent/20 text-accent-foreground"
            )}
          >
            <SunIcon className="h-4 w-4" />
            <div className="flex-1">
              <div className="text-sm font-medium">Light</div>
              <div className="text-xs text-muted-foreground">Clean & minimal</div>
            </div>
            {theme === "light" && (
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => handleThemeChange("dark")}
            className={cn(
              "gap-3 py-2.5 px-3 rounded-lg cursor-pointer",
              "focus:bg-background/80 transition-colors",
              theme === "dark" && "bg-accent/20 text-accent-foreground"
            )}
          >
            <MoonIcon className="h-4 w-4" />
            <div className="flex-1">
              <div className="text-sm font-medium">Dark</div>
              <div className="text-xs text-muted-foreground">Easy on the eyes</div>
            </div>
            {theme === "dark" && (
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => handleThemeChange("system")}
            className={cn(
              "gap-3 py-2.5 px-3 rounded-lg cursor-pointer",
              "focus:bg-background/80 transition-colors",
              theme === "system" && "bg-accent/20 text-accent-foreground"
            )}
          >
            <MonitorIcon className="h-4 w-4" />
            <div className="flex-1">
              <div className="text-sm font-medium">System</div>
              <div className="text-xs text-muted-foreground">Matches device</div>
            </div>
            {theme === "system" && (
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "glass-button border-0 backdrop-blur-md",
            "h-9 w-9 rounded-xl transition-all duration-300",
            "bg-background/60 hover:bg-background/80",
            "shadow-sm hover:shadow-md focus-ring",
            "hover:scale-105 active:scale-95",
            className
          )}
        >
          <div className="relative">
            <SunIcon 
              className={cn(
                "h-4 w-4 transition-all duration-300",
                isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
              )} 
            />
            <MoonIcon 
              className={cn(
                "absolute inset-0 h-4 w-4 transition-all duration-300",
                isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
              )} 
            />
          </div>
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="glass-card border-0 backdrop-blur-md"
      >
        <DropdownMenuItem
          onClick={() => handleThemeChange("light")}
          className="gap-2 cursor-pointer focus:bg-background/80"
        >
          <SunIcon className="h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("dark")}
          className="gap-2 cursor-pointer focus:bg-background/80"
        >
          <MoonIcon className="h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleThemeChange("system")}
          className="gap-2 cursor-pointer focus:bg-background/80"
        >
          <MonitorIcon className="h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 