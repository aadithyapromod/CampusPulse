/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f172a',
        surface: '#1e293b',
        primary: '#8b5cf6',
        secondary: '#10b981',
        text: '#f1f5f9',
        muted: '#94a3b8'
      }
    },
  },
  plugins: [],
}
