/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyan: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
          600: '#06b6d4',
          500: '#06d6d4',
          400: '#67e8f9',
          300: '#a5f3fc',
          200: '#cffafe',
          100: '#ecfeff'
        },
        purple: {
          900: '#1e1b4b',
          800: '#2e1065',
          700: '#4c1d95',
          600: '#7c3aed',
          500: '#a78bfa',
          400: '#c4b5fd'
        },
        pink: {
          600: '#ec4899',
          500: '#f472b6',
          400: '#fba1d0'
        },
        yellow: {
          400: '#fbbf24'
        }
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 20s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fadeIn': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-30px) rotate(8deg)' }
        },
        glow: {
          from: { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' },
          to: { boxShadow: '0 0 45px rgba(168, 85, 247, 0.8)' }
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' }
        }
      },
      backgroundImage: {
        grid: 'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)'
      },
      backgroundSize: {
        grid: '60px 60px'
      }
    },
  },
  plugins: [],
}
