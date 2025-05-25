import type { Config } from 'tailwindcss';

const config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '', // Matches components.json
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        slideInFromBottom: {
          '0%': {
            transform: 'translateY(100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideInFromTop: {
          '0%': {
            transform: 'translateY(-100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        slideInFromLeft: {
          '0%': {
            transform: 'translateX(-100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        slideInFromRight: {
          '0%': {
            transform: 'translateX(100px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1',
          },
        },
        fadeInScale: {
          '0%': {
            transform: 'scale(0.9)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-200px 0',
          },
          '100%': {
            backgroundPosition: 'calc(200px + 100%) 0',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0px)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        'pulse-soft': {
          '0%, 100%': {
            opacity: '1',
          },
          '50%': {
            opacity: '0.8',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'slide-in-bottom': 'slideInFromBottom 0.6s ease-out',
        'slide-in-top': 'slideInFromTop 0.6s ease-out',
        'slide-in-left': 'slideInFromLeft 0.6s ease-out',
        'slide-in-right': 'slideInFromRight 0.6s ease-out',
        'fade-in-scale': 'fadeInScale 0.4s ease-out',
        shimmer: 'shimmer 2s infinite',
        float: 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      backgroundSize: {
        '200': '200%',
      },
      backgroundPosition: {
        '0': '0%',
        '100': '100%',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    function ({ addUtilities }: any) {
      const newUtilities = {
        '.bg-size-200': {
          'background-size': '200%',
        },
        '.bg-pos-0': {
          'background-position': '0%',
        },
        '.bg-pos-100': {
          'background-position': '100%',
        },
        '.delay-1000': {
          'animation-delay': '1000ms',
        },
        '.delay-2000': {
          'animation-delay': '2000ms',
        },
      };
      addUtilities(newUtilities);
    },
  ],
} satisfies Config;

export default config;
