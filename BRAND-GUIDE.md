# 🎨 KairOS Brand & Design System Guide

> **For AI Assistant**: Always reference this guide when making design decisions, choosing colors, or implementing UI components to maintain brand consistency.

## 🎯 Brand Identity

**KairOS** is a sophisticated retro-futuristic cryptographic platform inspired by the movie "Her" - warm, elegant, human-centered technology with a vintage computing aesthetic.

### Core Values
- **Sophisticated Simplicity**: Elegant, uncluttered interfaces
- **Warm Technology**: Human-centered design with warm colors
- **Retro-Futuristic**: Vintage computing meets modern cryptography
- **Premium Feel**: High-quality, polished experiences

## 🎨 Color Palette

### Primary Colors (ALWAYS USE THESE)
```css
/* Primary - Her-inspired warm orange */
--primary: 245 181 145;               /* Main brand color - warm peach */
--primary-foreground: 79 70 59;       /* Dark text on primary */

/* Secondary - Sophisticated sage */
--secondary: 168 184 157;             /* Muted sage green */
--secondary-foreground: 45 42 38;     /* Warm dark text */

/* Accent - Elegant dusty teal */
--accent: 144 193 196;                /* Dusty teal - complement to orange */
--accent-foreground: 45 42 38;        /* Warm dark text */
```

### Background & Surfaces
```css
/* Light Theme */
--background: 252 250 247;            /* Warm white background */
--foreground: 45 42 38;               /* Warm dark text */
--card: 255 255 255;                  /* Pure white cards */
--muted: 248 246 242;                 /* Very light warm gray */
--border: 234 227 218;                /* Warm light border */

/* Dark Theme */
--background: 22 20 18;               /* Deep warm dark */
--foreground: 252 250 247;            /* Warm light text */
--card: 37 33 29;                     /* Warm dark cards */
--muted: 52 47 42;                    /* Dark warm surfaces */
--border: 67 60 53;                   /* Warm subtle lines */
```

### Semantic Colors
```css
--success: 149 189 152;               /* Sage green */
--warning: 245 181 145;               /* Orange (less alarming) */
--destructive: 237 164 154;           /* Warm coral */
```

## ❌ Colors to NEVER Use

- **Pure Blues**: `#0000FF`, `#007BFF`, rgb(0 123 255)` - Too harsh, not on-brand
- **Bright Cyans**: `#00FFFF`, `#17A2B8` - Too neon, breaks sophistication
- **Pure Reds**: `#FF0000`, `#DC3545` - Too aggressive, use warm coral instead
- **Pure Grays**: `#808080`, `#6C757D` - Too cold, use warm grays instead
- **Neon Colors**: Any overly saturated colors that break the sophisticated palette

## 🎨 Color Usage Rules

### ✅ DO:
- Use `text-primary` for accent text and icons
- Use `bg-primary/10` for subtle backgrounds
- Use `border-primary/20` for subtle borders
- Use `text-accent` for complementary highlights
- Use `text-muted-foreground` for secondary text

### ❌ DON'T:
- Use hardcoded colors like `text-blue-500`, `bg-amber-600`
- Mix non-brand colors (blues, cyans, pure reds)
- Use overly saturated colors
- Use colors that clash with the warm, sophisticated palette

## 🎯 Typography

### Font Stack
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
--font-mono: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
```

### Font Usage
- **Headers**: `font-mono` for tech/retro feel
- **Body Text**: `font-sans` for readability
- **UI Elements**: `font-mono` for buttons, labels, technical content

## 🧩 Component Patterns

### Buttons
```tsx
// Primary Action
<Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono">

// Secondary Action  
<Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/5 font-mono">

// Subtle Action
<Button variant="ghost" className="text-muted-foreground hover:text-primary font-mono">
```

### Cards
```tsx
<Card className="border border-border shadow-lg bg-card/80 backdrop-blur-sm">
```

### Icons
```tsx
// Always use consistent icon colors
<NfcIcon className="h-4 w-4 text-primary" />
<WifiIcon className="h-6 w-6 text-accent" />
<CheckIcon className="h-5 w-5 text-success" />
```

### Status Indicators
```tsx
// Success State
<div className="bg-success/10 border border-success/20">
  <CheckCircleIcon className="text-success" />
</div>

// Warning State  
<div className="bg-warning/10 border border-warning/20">
  <AlertTriangleIcon className="text-warning" />
</div>

// Error State
<div className="bg-destructive/10 border border-destructive/20">
  <XCircleIcon className="text-destructive" />
</div>
```

## 🎨 Design Principles

### Visual Hierarchy
1. **Primary**: Orange/peach (`text-primary`)
2. **Secondary**: Sage green (`text-accent`)
3. **Tertiary**: Dusty teal (`text-secondary`)
4. **Neutral**: Warm grays (`text-muted-foreground`)

### Spacing
- Use consistent spacing scales: `space-y-2`, `space-y-3`, `space-y-4`
- Prefer `gap-2`, `gap-3` for flex layouts
- Use `px-3 py-4` for card padding

### Animations
```css
/* Preferred animations */
animate-[fadeIn_0.8s_ease-out]
animate-pulse (sparingly)
transition-all duration-300

/* Avoid */
Overly bouncy or attention-grabbing animations
```

## 🚫 Common Mistakes to Avoid

1. **Using hardcoded blue colors** (`bg-blue-500`, `text-blue-600`)
2. **Mixing cold and warm palettes** (blues with oranges in wrong context)
3. **Over-saturated colors** that break the sophisticated aesthetic
4. **Inconsistent icon colors** - always use semantic color classes
5. **Pure grays** instead of warm grays
6. **Too many different colors** in one interface

## ✅ Brand-Compliant Examples

### Good Color Combinations
```tsx
// Primary with neutral
<div className="bg-primary text-primary-foreground">
<div className="text-primary bg-primary/10">

// Accent combinations
<div className="text-accent border-accent/20">
<div className="bg-accent/5 text-accent">

// Muted backgrounds
<div className="bg-muted text-muted-foreground">
```

### Status States
```tsx
// Loading/Processing
<div className="text-primary animate-pulse">
  <LoaderIcon className="text-primary" />
</div>

// Success
<div className="text-success bg-success/10">
  <CheckCircleIcon className="text-success" />
</div>

// Warning/Setup Required
<div className="text-warning bg-warning/10">
  <AlertTriangleIcon className="text-warning" />
</div>
```

## 🎯 Quick Reference

**When in doubt, use:**
- `text-primary` for important elements
- `text-accent` for secondary highlights  
- `text-muted-foreground` for supporting text
- `bg-primary/10` for subtle colored backgrounds
- `border-primary/20` for subtle colored borders
- `font-mono` for technical/UI text
- `font-sans` for readable body text

**Never use:**
- Blue colors (`blue-500`, `cyan-400`, etc.)
- Pure grays (`gray-500`, `slate-600`)
- Neon or overly bright colors
- Colors outside the defined palette

---

> **Remember**: KairOS is sophisticated, warm, and human-centered. Every color choice should reinforce this brand identity. 