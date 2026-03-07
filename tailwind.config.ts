import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg0: '#080b10',
        bg1: '#0d1117',
        bg2: '#111820',
        bg3: '#162030',
        cyan: '#63b3ed',
        sol: '#9945ff',
        green: '#48bb78',
        red: '#fc8181',
        yellow: '#f6e05e',
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
        display: ['"Bebas Neue"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
export default config
