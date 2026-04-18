/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['var(--font-mono)', 'Courier New', 'monospace'],
      },
      colors: {
        'cream': '#f0ebe0',
        'dark': '#2b2b2b',
        'rose': '#b85476',
        'plum': '#7a5a90',
      },
      boxShadow: {
        'card': '4px 4px 0px #2b2b2b',
        'card-sm': '2px 2px 0px #2b2b2b',
      },
    },
  },
  plugins: [],
}
