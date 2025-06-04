import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			// Apple-inspired minimal palette with earth tones
  			neutral: {
  				50: '#fafafa',
  				100: '#f5f5f5',
  				150: '#f0f0f0',
  				200: '#e5e5e5',
  				250: '#d4d4d4',
  				300: '#a3a3a3',
  				400: '#737373',
  				500: '#525252',
  				600: '#404040',
  				700: '#262626',
  				800: '#171717',
  				900: '#0a0a0a'
  			},
  			sage: {
  				50: '#f6f7f6',
  				100: '#e3e7e3',
  				200: '#c7d2c7',
  				300: '#9db59d',
  				400: '#769676',
  				500: '#5a7a5a',
  				600: '#486248',
  				700: '#3c503c',
  				800: '#334233',
  				900: '#2d372d'
  			},
  			sand: {
  				50: '#faf9f7',
  				100: '#f2f0ec',
  				200: '#e7e2d9',
  				300: '#d6cdc0',
  				400: '#c2b5a3',
  				500: '#b09d87',
  				600: '#9c8a6f',
  				700: '#82735d',
  				800: '#6b604f',
  				900: '#574f42'
  			},
  			terracotta: {
  				50: '#fdf7f4',
  				100: '#fbece4',
  				200: '#f6d7c8',
  				300: '#efbaa0',
  				400: '#e69473',
  				500: '#dc764f',
  				600: '#ca5d34',
  				700: '#a84a29',
  				800: '#8a3f26',
  				900: '#713524'
  			},
  			lavender: {
  				50: '#faf9fc',
  				100: '#f3f1f7',
  				200: '#e9e4f0',
  				300: '#d8cee5',
  				400: '#c1b0d6',
  				500: '#a892c4',
  				600: '#8e75ad',
  				700: '#756392',
  				800: '#625378',
  				900: '#524563'
  			},
  			glass: {
  				white: 'rgba(255, 255, 255, 0.7)',
  				'white-10': 'rgba(255, 255, 255, 0.1)',
  				'white-20': 'rgba(255, 255, 255, 0.2)',
  				'white-30': 'rgba(255, 255, 255, 0.3)',
  				'white-40': 'rgba(255, 255, 255, 0.4)',
  				'white-50': 'rgba(255, 255, 255, 0.5)',
  				'black': 'rgba(0, 0, 0, 0.1)',
  				'black-10': 'rgba(0, 0, 0, 0.1)',
  				'black-20': 'rgba(0, 0, 0, 0.2)',
  				'black-30': 'rgba(0, 0, 0, 0.3)'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'xl': '1rem',
  			'2xl': '1.5rem',
  			'3xl': '2rem'
  		},
  		backdropBlur: {
  			xs: '2px',
  			'md': '12px',
  			'lg': '16px',
  			'xl': '24px',
  			'2xl': '40px'
  		},
  		boxShadow: {
  			'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
  			'glass-lg': '0 20px 60px rgba(0, 0, 0, 0.15)',
  			'float': '0 4px 20px rgba(0, 0, 0, 0.08)',
  			'float-lg': '0 8px 40px rgba(0, 0, 0, 0.12)',
  			'inner-glass': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
  			'minimal': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: '0',
  					transform: 'translateY(8px)'
  				},
  				'100%': {
  					opacity: '1',
  					transform: 'translateY(0)'
  				}
  			},
  			'glass-shine': {
  				'0%': {
  					transform: 'translateX(-100%)',
  					opacity: '0'
  				},
  				'50%': {
  					opacity: '1'
  				},
  				'100%': {
  					transform: 'translateX(100%)',
  					opacity: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in': 'fade-in 0.3s ease-out',
  			'glass-shine': 'glass-shine 2s ease-in-out infinite'
  		},
  		fontFamily: {
  			sans: [
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'sans-serif'
  			],
  			mono: [
  				'SF Mono',
  				'Monaco',
  				'Inconsolata',
  				'Roboto Mono',
  				'source-code-pro',
  				'Menlo',
  				'monospace'
  			]
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
