/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grid-bg': '#0a0a0f',
        'grid-line': '#1a1a2e',
        'grid-bar': '#2d2d44',
        'note-active': '#00d4ff',
        'note-accent': '#ff00aa',
        'playhead': '#ffff00',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
