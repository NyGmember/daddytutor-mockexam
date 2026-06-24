/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: '#FAF7F0',
        brand: '#E27B58',
        brandHover: '#D16B48',
        charcoal: '#2D2D2D',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'sans-serif'],
        thai: ['var(--font-thai)', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

