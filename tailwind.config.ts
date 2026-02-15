import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
        },
        foreground: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
        },
        accent: 'var(--accent)',
        border: {
          primary: 'var(--border-primary)',
        },
        terminal: {
          glow: 'var(--terminal-glow)',
        },
        // Keeping legacy names for compatibility during transition
        'theme-main': 'var(--text-primary)',
        'theme-bg': 'var(--bg-primary)',
        'theme-sub': 'var(--bg-secondary)',
        'theme-accent': 'var(--accent)',
        'theme-secondary': 'var(--text-secondary)',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'Courier New', 'Courier', 'monospace'],
        hand: ['var(--font-hand)', 'Caveat', 'cursive'],
      },
      boxShadow: {
        'brutalist-sm': '2px 2px 0px 0px var(--shadow-color)',
        'brutalist': '4px 4px 0px 0px var(--shadow-color)',
        'brutalist-lg': '8px 8px 0px 0px var(--shadow-color)',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'condensation': 'condensation-glitch 28s infinite ease-in-out',
        'scan': 'scan-flash 35s infinite',
        'drip': 'drip 18s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
