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
        'theme-main': 'var(--text-primary)',
        'theme-bg': 'var(--bg-primary)',
        'theme-sub': 'var(--bg-secondary)',
        'theme-accent': 'var(--accent)',
        'theme-secondary': 'var(--text-secondary)',
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      boxShadow: {
        'brutalist-lg': '8px 8px 0px 0px var(--shadow-color)',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
