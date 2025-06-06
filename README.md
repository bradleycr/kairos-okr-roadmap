# KairOS - The Future of Cryptographic Authentication

> Elegant NFC-based cryptographic authentication and zero-knowledge proof system with a beautiful dark-first design.

## 🌙 Dark-First Design System

KairOS features a modern, dark-first design system optimized for 2025 web standards. The interface defaults to dark mode while providing an elegant light mode option.

### Theme Features

- **Dark Mode Default**: Beautiful dark theme with rich earth tones
- **Cross-Platform**: Optimized for desktop, tablet, and mobile
- **Glass Morphism**: Modern glass effects with backdrop blur
- **Smooth Transitions**: Seamless theme switching with animations
- **Accessibility**: High contrast support and reduced motion options
- **Modern Typography**: System font stack with proper font features

### Color Palette

#### Dark Mode (Default)
- **Background**: Deep charcoal (`#0a0a0a`)
- **Primary**: Sage green (`#9db59d`)
- **Accent**: Warm terracotta (`#e6946b`)
- **Text**: Pure white (`#fafafa`)

#### Light Mode (Optional)
- **Background**: Very light neutral (`#fafafa`)
- **Primary**: Deep sage green (`#5a7a5a`)
- **Accent**: Rich terracotta (`#c86e4b`)
- **Text**: Almost black (`#0f0f0f`)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/kairos.git
cd kairos

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Theme Customization

The theme system uses CSS variables for easy customization. Edit `app/globals.css` to modify colors:

```css
:root {
  /* Dark mode (default) */
  --background: 10 10 10;
  --foreground: 250 250 250;
  --primary: 157 181 157;
  --accent: 230 148 115;
}

.light {
  /* Light mode */
  --background: 250 250 250;
  --foreground: 15 15 15;
  --primary: 90 122 90;
  --accent: 200 110 75;
}
```

## 🎨 Design System

### Components

All components are built with dark mode in mind:

- **Glass Cards**: Translucent cards with backdrop blur
- **Theme Toggle**: Smooth theme switching with haptic feedback
- **Navigation**: Elegant glass navigation with earth tone accents
- **Buttons**: Interactive elements with hover animations
- **Forms**: Dark-optimized inputs and controls

### Utilities

- `.glass-card` - Glass morphism effect
- `.gradient-text` - Gradient text with theme colors
- `.animate-theme-transition` - Smooth theme transitions
- `.text-balance` - Balanced text wrapping
- `.focus-ring` - Accessible focus indicators

## 🔧 Development

### Theme Provider

The app uses `next-themes` for theme management:

```tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Theme Toggle

Use the theme toggle component anywhere:

```tsx
import { ThemeToggle } from '@/components/theme-toggle'

// Icon variant (default)
<ThemeToggle />

// Full variant with labels
<ThemeToggle variant="full" />
```

## 📱 Cross-Platform Support

- **Responsive Design**: Mobile-first approach
- **Touch Optimized**: Proper touch targets and gestures
- **PWA Ready**: Web app manifest with theme colors
- **Font Optimization**: System fonts for best performance
- **Reduced Motion**: Respects user accessibility preferences

## 🎯 Best Practices

### 2025 Web Standards

- **CSS Variables**: Semantic color system
- **Modern Animations**: GPU-accelerated transitions
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: Optimized for Core Web Vitals
- **Progressive Enhancement**: Works without JavaScript

### Component Guidelines

1. Always use CSS variables for colors
2. Include dark mode considerations in design
3. Use semantic HTML elements
4. Provide proper ARIA labels
5. Test with reduced motion preferences

## 🛠 Architecture

### File Structure

```
app/
├── globals.css          # Dark-first design system
├── layout.tsx           # Root layout with theme provider
└── page.tsx            # Main application

components/
├── theme-provider.tsx   # Theme context provider
├── theme-toggle.tsx     # Theme switching component
├── Navigation.tsx       # Glass navigation bar
└── ui/                 # Reusable UI components

lib/
└── utils.ts            # Utility functions
```

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with CSS variables
- **Theme**: next-themes for theme management
- **Components**: Radix UI primitives
- **Icons**: Lucide React
- **Fonts**: System font stack

## 🌟 Features

- **NFC Authentication**: Secure NFC-based authentication
- **Zero-Knowledge Proofs**: Privacy-preserving cryptography
- **Real-time Simulation**: Interactive MELD node simulation
- **Cryptographic Diagnostics**: Built-in crypto testing tools
- **Beautiful UI**: Modern glass morphism design
- **Dark Mode**: Elegant dark-first interface

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

**Built with ❤️ by MELD and Bradley C Royes** 