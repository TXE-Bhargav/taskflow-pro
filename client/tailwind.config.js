/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Core surface system
        surface: {
          0:   '#0a0a0b',   // deepest background
          1:   '#111113',   // page background
          2:   '#18181b',   // card background
          3:   '#1f1f23',   // elevated card
          4:   '#27272c',   // hover state
          5:   '#2e2e35',   // active / selected
        },
        // Border system
        border: {
          1:   '#1f1f23',
          2:   '#27272c',
          3:   '#35353d',
        },
        // Text system
        ink: {
          1:   '#fafafa',   // primary text
          2:   '#a1a1aa',   // secondary text
          3:   '#71717a',   // tertiary / placeholder
          4:   '#52525b',   // disabled
        },
        // Accent — cold amber / gold
        accent: {
          DEFAULT: '#e8a045',
          50:  '#fdf6ec',
          100: '#faebd0',
          200: '#f4d49e',
          300: '#ecb865',
          400: '#e8a045',
          500: '#d4862a',
          600: '#b56b1e',
          700: '#8f5118',
          800: '#6b3c13',
          900: '#4a280d',
        },
        // Status
        success: { DEFAULT: '#22c55e', muted: '#14532d', text: '#4ade80' },
        warning: { DEFAULT: '#f59e0b', muted: '#451a03', text: '#fbbf24' },
        danger:  { DEFAULT: '#ef4444', muted: '#450a0a', text: '#f87171' },
        info:    { DEFAULT: '#3b82f6', muted: '#1e3a5f', text: '#60a5fa' },
        // primary maps to accent for backward compat
        primary: {
          50:  '#fdf6ec',
          100: '#faebd0',
          200: '#f4d49e',
          300: '#ecb865',
          400: '#e8a045',
          500: '#d4862a',
          600: '#b56b1e',
          700: '#8f5118',
          800: '#6b3c13',
          900: '#4a280d',
        },
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['DM Sans', 'system-ui', 'sans-serif'],
        mono:    ['DM Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        'sm':  '4px',
        DEFAULT: '6px',
        'md':  '8px',
        'lg':  '12px',
        'xl':  '16px',
        '2xl': '20px',
        '3xl': '24px',
      },
      boxShadow: {
        'glow-accent': '0 0 0 1px rgba(232,160,69,0.3), 0 0 20px rgba(232,160,69,0.08)',
        'glow-sm':     '0 0 0 1px rgba(232,160,69,0.2)',
        'card':        '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
        'card-hover':  '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.4)',
        'modal':       '0 24px 64px rgba(0,0,0,0.7), 0 8px 24px rgba(0,0,0,0.5)',
        'sidebar':     '1px 0 0 rgba(255,255,255,0.04)',
      },
      animation: {
        'fade-in':    'fadeIn 0.15s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'slide-in':   'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideIn: { from: { opacity: 0, transform: 'translateX(-8px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        progress:{ from: { width: '100%' }, to: { width: '0%' } },
      },
    },
  },
  plugins: [],
}