/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#090507',
          900: '#0f080c',
          850: '#150c11',
          800: '#1d1017',
          700: '#2c1823',
          600: '#3d2231'
        },
        hextra: {
          red: '#ff1e27',
          'red-bright': '#ff3d44',
          'red-dark': '#b31118',
          'red-glow': 'rgba(255, 30, 39, 0.45)',
          'red-subtle': 'rgba(255, 30, 39, 0.12)'
        }
      },
      boxShadow: {
        'neon': '0 0 15px rgba(255, 30, 39, 0.35)',
        'neon-strong': '0 0 25px rgba(255, 30, 39, 0.65)',
        'neon-subtle': '0 0 8px rgba(255, 30, 39, 0.2)'
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}

