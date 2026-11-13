/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // SIGNAL & STONE PALETTE
        obsidian: '#111416',
        meteorite: '#343A39',
        bone: '#EEE7D9',
        surface: {
          DEFAULT: '#1B2020',
          raised: '#252B29',
          border: '#343A39',
        },
        stone: {
          primary: '#EEE7D9',
          secondary: '#B8B3A8',
          muted: '#85877F',
        },
        signal: {
          DEFAULT: '#F05A38',
          vermilion: '#F05A38',
          hover: '#D94928',
        },
        lunar: {
          DEFAULT: '#B9C96A',
          lichen: '#B9C96A',
        },
        oxidized: {
          DEFAULT: '#28645F',
          teal: '#28645F',
        },

        // Backward-compatible mappings seamlessly re-anchored to Signal & Stone
        void: '#111416', // Now mapped to Obsidian
        starlight: '#EEE7D9', // Now mapped to Archive Bone
        dust: '#85877F', // Now mapped to Text Muted
        gold: {
          DEFAULT: '#F05A38', // Re-anchored to Signal Vermilion for primary actions
          light: '#F87A5E',
          dark: '#D94928',
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        widest: '0.22em',
        ultra: '0.3em',
      }
    },
  },
  plugins: [],
}
