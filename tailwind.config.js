/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['var(--font-display)', 'system-ui', 'sans-serif'],
      },
      colors: {
        'fun': {
          'pink': '#FF6B9D',
          'orange': '#FF9F43',
          'yellow': '#FECA57',
          'green': '#5AD45B',
          'blue': '#45AAF2',
          'purple': '#A55EEA',
        }
      }
    },
  },
  plugins: [],
}
