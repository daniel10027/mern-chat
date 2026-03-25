/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B7F79',
          light: '#2EBFB3',
          dark: '#0D5C58',
        },
        accent: '#F4A261',
        danger: '#E63946',
        success: '#2DC653',
        dark: {
          DEFAULT: '#0D1B2A',
          card: '#1A2235',
          border: '#243048',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}