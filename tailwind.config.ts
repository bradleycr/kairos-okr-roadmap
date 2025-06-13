/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      colors: {
        border: "rgb(var(--border))",
        input: "rgb(var(--input))",
        ring: "rgb(var(--ring))",
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: {
          DEFAULT: "rgb(var(--primary))",
          foreground: "rgb(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary))",
          foreground: "rgb(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive))",
          foreground: "rgb(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--muted))",
          foreground: "rgb(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--accent))",
          foreground: "rgb(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--popover))",
          foreground: "rgb(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "rgb(var(--card))",
          foreground: "rgb(var(--card-foreground))",
        },
        success: {
          DEFAULT: "rgb(var(--success))",
          foreground: "rgb(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "rgb(var(--warning))",
          foreground: "rgb(var(--warning-foreground))",
        },
        'cyber-cyan': 'rgb(0 255 255)',
        'neon-magenta': 'rgb(255 0 255)',
        'steampunk-brass': 'rgb(205 127 50)',
        'industrial-copper': 'rgb(184 115 51)',
        'holographic-blue': 'rgb(0 191 255)',
        'plasma-green': 'rgb(57 255 20)',
        'vintage-amber': 'rgb(255 191 0)',
        'her-orange': {
          50: 'rgb(254 251 248)',   /* Lightest warm cream */
          100: 'rgb(252 245 237)',  /* Very light peachy */
          200: 'rgb(248 234 220)',  /* Light peach */
          300: 'rgb(245 218 191)',  /* Soft peach */
          400: 'rgb(245 181 145)',  /* Main Her orange */
          500: 'rgb(231 156 118)',  /* Deeper warm orange */
          600: 'rgb(214 130 93)',   /* Rich orange */
          700: 'rgb(186 106 73)',   /* Deep warm orange */
          800: 'rgb(147 82 57)',    /* Very deep orange */
          900: 'rgb(79 70 59)',     /* Darkest warm brown */
        },
        'retro-sage': {
          50: 'rgb(247 249 245)',   /* Very light sage */
          100: 'rgb(238 242 234)',  /* Light sage */
          200: 'rgb(220 228 211)',  /* Soft sage */
          300: 'rgb(198 213 185)',  /* Medium sage */
          400: 'rgb(168 184 157)',  /* Main sage */
          500: 'rgb(149 189 152)',  /* Retro sage */
          600: 'rgb(127 156 130)',  /* Deep sage */
          700: 'rgb(102 125 105)',  /* Darker sage */
          800: 'rgb(78 95 81)',     /* Very dark sage */
          900: 'rgb(54 66 56)',     /* Darkest sage */
        },
        'retro-teal': {
          50: 'rgb(246 251 251)',   /* Very light teal */
          100: 'rgb(234 246 247)',  /* Light teal */
          200: 'rgb(207 236 238)',  /* Soft teal */
          300: 'rgb(173 219 222)',  /* Medium teal */
          400: 'rgb(144 193 196)',  /* Main dusty teal */
          500: 'rgb(115 167 170)',  /* Deeper teal */
          600: 'rgb(93 134 137)',   /* Rich teal */
          700: 'rgb(72 104 107)',   /* Deep teal */
          800: 'rgb(52 76 78)',     /* Very dark teal */
          900: 'rgb(32 47 48)',     /* Darkest teal */
        },
        'retro-lavender': {
          50: 'rgb(251 248 252)',   /* Very light lavender */
          100: 'rgb(245 239 248)',  /* Light lavender */
          200: 'rgb(232 218 240)',  /* Soft lavender */
          300: 'rgb(213 190 227)',  /* Medium lavender */
          400: 'rgb(186 162 195)',  /* Main lavender */
          500: 'rgb(159 134 163)',  /* Deeper lavender */
          600: 'rgb(132 107 131)',  /* Rich lavender */
          700: 'rgb(105 84 104)',   /* Deep lavender */
          800: 'rgb(78 63 77)',     /* Very dark lavender */
          900: 'rgb(51 42 50)',     /* Darkest lavender */
        },
        'retro-coral': {
          50: 'rgb(253 248 247)',   /* Very light coral */
          100: 'rgb(250 238 236)',  /* Light coral */
          200: 'rgb(244 215 210)',  /* Soft coral */
          300: 'rgb(241 190 182)',  /* Medium coral */
          400: 'rgb(237 164 154)',  /* Main coral */
          500: 'rgb(223 137 126)',  /* Deeper coral */
          600: 'rgb(198 110 99)',   /* Rich coral */
          700: 'rgb(164 86 77)',    /* Deep coral */
          800: 'rgb(123 65 58)',    /* Very dark coral */
          900: 'rgb(82 43 39)',     /* Darkest coral */
        },
        'retro-slate': {
          50: 'rgb(248 249 251)',   /* Very light slate */
          100: 'rgb(241 243 246)',  /* Light slate */
          200: 'rgb(226 230 235)',  /* Soft slate */
          300: 'rgb(203 209 217)',  /* Medium slate */
          400: 'rgb(147 155 171)',  /* Main slate */
          500: 'rgb(120 129 145)',  /* Deeper slate */
          600: 'rgb(96 104 118)',   /* Rich slate */
          700: 'rgb(75 82 94)',     /* Deep slate */
          800: 'rgb(55 61 70)',     /* Very dark slate */
          900: 'rgb(35 39 45)',     /* Darkest slate */
        },
        'warm-gray': {
          50: 'rgb(252 250 247)',   /* Warm white */
          100: 'rgb(248 246 242)',  /* Very light warm gray */
          200: 'rgb(234 227 218)',  /* Light warm gray */
          300: 'rgb(202 191 178)',  /* Medium warm gray */
          400: 'rgb(168 163 156)',  /* Main warm gray */
          500: 'rgb(134 129 122)',  /* Deeper warm gray */
          600: 'rgb(109 107 102)',  /* Rich warm gray */
          700: 'rgb(84 82 78)',     /* Deep warm gray */
          800: 'rgb(67 60 53)',     /* Very dark warm gray */
          900: 'rgb(45 42 38)',     /* Darkest warm gray */
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'minimal': 'var(--shadow-minimal)',
        'float': 'var(--shadow-float)',
        'lift': 'var(--shadow-lift)',
        'neon': '0 0 10px rgb(0 255 255), 0 0 20px rgb(0 255 255), 0 0 30px rgb(0 255 255)',
        'brass': '0 4px 16px rgba(255 191 0 / 0.3)',
        'cyber': '0 8px 32px rgba(0 255 255 / 0.4)',
        'her-warm': '0 4px 20px rgba(245 181 145 / 0.25), 0 2px 8px rgba(245 181 145 / 0.15)',
        'her-elegant': '0 8px 32px rgba(245 181 145 / 0.2)',
        'retro-sophisticated': '0 4px 16px rgba(144 193 196 / 0.15), 0 2px 8px rgba(186 162 195 / 0.1)',
        'retro-warm': '0 6px 24px rgba(237 164 154 / 0.2)',
        'retro-depth': '0 8px 32px rgba(168 184 157 / 0.15)',
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'cyber-pulse': 'cyber-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'neon-flicker': 'neon-flicker 4s ease-in-out infinite',
        'holographic': 'holographic-shimmer 3s ease-in-out infinite',
        'gentle-pulse': 'cyber-pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'fade-slide-up': {
          from: {
            opacity: '0',
            transform: 'translateY(12px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'cyber-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
          '50%': {
            opacity: '0.8',
            transform: 'scale(1.02)',
          },

        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '2%, 8%, 12%, 20%': { opacity: '0.8' },
          '4%, 16%': { opacity: '0.9' },
        },
        'holographic-shimmer': {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
        // Organic breathing animations for k-hole feeling
        'breathe': {
          '0%, 100%': { 
            opacity: '0.6',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.03)',
          },
        },
        'breathe-glow': {
          '0%, 100%': { 
            opacity: '0.4',
            transform: 'scale(0.95)',
            boxShadow: '0 0 20px rgba(var(--primary), 0.2)',
          },
          '50%': { 
            opacity: '0.9',
            transform: 'scale(1.1)',
            boxShadow: '0 0 40px rgba(var(--primary), 0.4)',
          },
        },
        'breathe-ring': {
          '0%, 100%': { 
            opacity: '0.3',
            transform: 'scale(0.98)',
            borderWidth: '1px',
          },
          '50%': { 
            opacity: '0.8',
            transform: 'scale(1.02)',
            borderWidth: '2px',
          },
        },
        'breathe-inner': {
          '0%, 100%': { 
            opacity: '0.5',
            transform: 'scale(1)',
          },
          '50%': { 
            opacity: '0.9',
            transform: 'scale(1.05)',
          },
        },
        'breathe-indicator': {
          '0%, 100%': { 
            opacity: '0.6',
            transform: 'scale(0.9)',
          },
          '50%': { 
            opacity: '1',
            transform: 'scale(1.1)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'holographic': 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent)',
        'brass-gradient': 'linear-gradient(135deg, rgba(205, 127, 50, 0.1), rgba(255, 191, 0, 0.1))',
        'her-gradient': 'linear-gradient(135deg, rgba(245, 181, 145, 0.1), rgba(231, 156, 118, 0.1))',
        'her-warm': 'linear-gradient(135deg, rgba(254, 251, 248, 0.8), rgba(245, 181, 145, 0.4))',
        'retro-sophisticated': 'linear-gradient(135deg, rgba(144, 193, 196, 0.08), rgba(186, 162, 195, 0.06))',
        'retro-warm-coral': 'linear-gradient(135deg, rgba(253, 248, 247, 0.7), rgba(237, 164, 154, 0.3))',
        'retro-sage-mist': 'linear-gradient(135deg, rgba(247, 249, 245, 0.8), rgba(168, 184, 157, 0.2))',
        'retro-teal-flow': 'linear-gradient(135deg, rgba(246, 251, 251, 0.9), rgba(144, 193, 196, 0.25))',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '400': '400ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

