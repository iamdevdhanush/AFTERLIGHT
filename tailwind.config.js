/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: '#080B10',
        space: {
          900: '#080B10',
          800: '#0E131B',
          700: '#171E28',
          600: '#232C3A',
          500: '#344155',
        },
        starlight: '#E8E3D9',
        dust: '#A5A7A9',
        gold: {
          DEFAULT: '#D99A63',
          light: '#E5B183',
          dark: '#B87A44',
        },
        emerald: {
          accent: '#63F0C8',
        }
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.25em',
        ultra: '0.35em',
      }
    },
  },
  plugins: [],
}

