/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",  // Tell Tailwind to scan ALL React files
  ],
  theme: {
    extend: {
      colors: {
        // Azerbaijan brand colors (inspired by flag: blue, red, green)
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',  // Main brand blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        success: {
          500: '#10b981', // Green (like Azerbaijan flag)
          600: '#059669',
        },
        danger: {
          500: '#ef4444', // Red (like Azerbaijan flag)
          600: '#dc2626',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Mobile-first spacing (44px minimum for touch targets)
      spacing: {
        'touch': '44px', // Minimum iOS/Android touch target
      },
    },
  },
  plugins: [],
}