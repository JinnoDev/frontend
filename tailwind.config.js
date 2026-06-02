/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0d0d0d',
          secondary: '#141414',
          card: '#1a1a1a',
          hover: '#222222',
          border: '#2a2a2a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e4c46a',
          dark: '#a88830',
        },
        accent: '#c9a84c',
        online: '#22c55e',
      },
      fontFamily: {
        sans: ['var(--font-geist)', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: '#2a2a2a',
      },
    },
  },
  plugins: [],
};
