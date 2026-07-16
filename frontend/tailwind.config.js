/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          paramount: '#002f6c',
          accent: '#49b1ea',
          lightBg: '#ebf3fc',
        },
        neutral: {
          darkGray: '#b2b2b2',
          lightGray: '#f9f9f9',
          obsidian: '#1a2332',
          cardDark: '#222e43',
        }
      },
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}