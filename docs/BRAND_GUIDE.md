# KairOS Brand Guide

## Core Principles

KairOS is designed with elegance, minimalism, and sophistication in mind. The interface should feel advanced yet approachable, representing a **decentralized edge computing system** with **Her-inspired aesthetics**.

## Visual Identity

### Typography
- Use the system font stack for maximum performance and native feel
- Headers: Bold, clean with adequate spacing - use `font-mono` for tech/retro feel
- Body text: Regular weight, high readability - use `font-sans` for readability

### Color Palette - Her-Inspired Warm Technology
```css
/* Primary - Her-inspired warm peach */
--primary: 245 181 145;               /* Main brand color - warm, inviting */
--primary-foreground: 79 70 59;       /* Dark text on primary background */

/* Secondary - Sophisticated sage */
--secondary: 168 184 157;             /* Muted sage green - calming */
--secondary-foreground: 45 42 38;     /* Warm dark text on secondary */

/* Accent - Elegant dusty teal */
--accent: 144 193 196;                /* Dusty teal - perfect complement */
--accent-foreground: 45 42 38;        /* Consistent warm dark text */

/* Neutrals */
--background: 252 250 247;            /* Warm white - never pure white */
--foreground: 45 42 38;               /* Warm dark text - never pure black */
--muted: 248 246 242;                 /* Very light warm gray */
--muted-foreground: 115 110 100;      /* Medium warm gray text */
--border: 234 227 218;                /* Warm light border */

/* Semantic Colors */
--success: 149 189 152;               /* Sage green - natural success */
--warning: 245 181 145;               /* Orange - less alarming warning */
--destructive: 237 164 154;           /* Warm coral - gentle error */
```

## UI Elements

### Icons
- **IMPORTANT: Only use Lucide icons throughout the application**
- Icons should be sleek, minimal and consistent
- Icons should complement text, not replace it
- Use appropriate sizing: 16px for inline, 20-24px for UI elements
- Maintain consistent stroke width

### Buttons
- Use gradient backgrounds for primary actions
- Outline style for secondary actions
- Ghost style for tertiary actions
- Include icons with text for better affordance

### Cards & Containers
- Subtle shadows for depth
- Minimal borders
- Clean corners (slight rounding)
- Adequate padding

## Brand Restrictions

### Emoji Usage
- **NEVER use emojis in the application**
- Emojis are off-brand and disrupt the sleek, professional aesthetic
- Always use proper Lucide icons instead of emojis
- This applies to all UI elements, modals, toasts, and notifications

### Color Usage Restrictions
- Never use colors that are too vibrant or "childish"
- **NEVER use pure blues**: `#0000FF`, `#007BFF`, `rgb(0 123 255)` - Too harsh, not on-brand
- **NEVER use bright cyans**: `#00FFFF`, `#17A2B8` - Too neon, breaks sophistication
- **NEVER use pure reds**: `#FF0000`, `#DC3545` - Too aggressive, use warm coral instead
- Don't use rainbow gradients
- Avoid using more than two gradients in a single view

## Voice & Tone

### Writing Style
- Clear, concise, and direct
- Professional but not cold
- Technical but approachable
- Focus on **decentralized edge computing** and **sophisticated simplicity**
- Avoid slang, colloquialisms, and trendy phrases

### Terminology
- Use "Community" instead of "Users"
- Use "Collective" instead of "Group"
- Use "Memories" instead of "Posts" or "Content"
- Use "Authentication" instead of "Login"
- Use "Nodes" instead of "Devices"
- Use "Edge Computing" for local processing
- Use "Decentralized" not "Distributed"

## Implementation Guidelines

### Responsiveness
- Design mobile-first
- Optimize for all screen sizes
- Maintain consistent spacing across breakpoints

### Accessibility
- Maintain WCAG 2.1 AA compliance minimum
- Ensure proper color contrast
- Provide text alternatives for non-text content
- Design for keyboard navigation

This guide should be followed for all aspects of the KairOS application, ensuring a consistent, professional, and sophisticated experience inspired by the movie "Her" - warm, human-centered technology. 