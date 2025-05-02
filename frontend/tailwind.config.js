/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // We'll use class strategy for dark mode
  theme: {
    extend: {
      colors: {
        'primary': {
          DEFAULT: '#3b82f6', // blue-500
          '50': '#eff6ff',
          '100': '#dbeafe',
          '200': '#bfdbfe',
          '300': '#93c5fd',
          '400': '#60a5fa',
          '500': '#3b82f6',
          '600': '#2563eb',
          '700': '#1d4ed8',
          '800': '#1e40af',
          '900': '#1e3a8a',
          '950': '#172554',
        },
        'dark': {
          DEFAULT: '#111827', // gray-900
          'lighter': '#1f2937', // gray-800
          'light': '#374151', // gray-700
          'border': '#4b5563', // gray-600
        },
      },
      fontFamily: {
        sans: ['Inter var', 'sans-serif'],
      },
      boxShadow: {
        'top': '0 -1px 3px 0 rgba(0, 0, 0, 0.1), 0 -1px 2px 0 rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
} 