import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paper field-notebook palette
        paper: 'var(--paper)',
        kraft: 'var(--kraft)',
        manila: 'var(--manila)',
        ink: 'var(--ink)',
        soil: 'var(--soil)',
        marker: 'var(--marker)',
        moss: 'var(--moss)',
        rust: 'var(--rust)',
        slateblue: 'var(--slateblue)',
        // Legacy tokens, mapped onto the paper palette in globals.css.
        // Unported pages keep working; remove once every page uses the
        // palette names above.
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
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-plex-mono)', 'Courier New', 'Courier', 'monospace'],
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
  plugins: [typography],
}
export default config
