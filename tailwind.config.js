/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#06142B',
          900: '#0F2044',
          800: '#1B3A6B',
          700: '#234D8A',
          600: '#2E5FA3',
          500: '#3B72BD',
          400: '#5A8ECC',
          300: '#7FAADA',
          200: '#AACAE8',
          100: '#D4E6F5',
          50: '#E8EEF7',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F8FC',
          tertiary: '#EBF1F8',
        }
      },
      fontFamily: {
        display: ['faustina', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'navy-sm': '0 1px 3px rgba(15,32,68,0.08), 0 1px 2px rgba(15,32,68,0.06)',
        'navy': '0 4px 12px rgba(15,32,68,0.10), 0 2px 4px rgba(15,32,68,0.06)',
        'navy-lg': '0 12px 32px rgba(15,32,68,0.14), 0 4px 8px rgba(15,32,68,0.08)',
        'navy-xl': '0 24px 64px rgba(15,32,68,0.18), 0 8px 16px rgba(15,32,68,0.10)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 1.8s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
        shimmer: { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      }
    }
  },
  plugins: []
}
