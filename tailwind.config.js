/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a237e',
          dark: '#0d1459',
          light: '#3949ab',
        },
        accent: {
          DEFAULT: '#ffc107',
          dark: '#ffb300',
          light: '#ffd54f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


