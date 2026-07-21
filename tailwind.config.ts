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
        // Paper field-notebook palette. Hex literals, not var() refs:
        // Tailwind can't inject alpha into var() colors, so opacity
        // modifiers (text-ink/60, bg-moss/50) silently generate nothing.
        // Keep in sync with the :root block in globals.css.
        paper: '#f5f0e2',
        kraft: '#e9ddc1',
        manila: '#efe5cc',
        ink: '#26221a',
        soil: '#5a4630',
        marker: '#e4571f',
        moss: '#5c6b3c',
        rust: '#a8442a',
        slateblue: '#3f5d6b',
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
