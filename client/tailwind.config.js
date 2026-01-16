/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'grid-bg': 'var(--bg-primary)',
        'grid-line': 'var(--bg-secondary)',
        'grid-bar': 'var(--bg-tertiary)',
        'note-active': 'var(--note-active)',
        'note-accent': 'var(--note-accent)',
        'playhead': 'var(--playhead)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
