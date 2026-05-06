/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pato: {
          // Existing palette (preserved for backward compat)
          cream: '#fdf8f0',
          butter: '#fef3d9',
          honey: '#f5e6c8',
          peach: '#f8d7c4',
          rose: '#f2c4c4',
          blush: '#e8b4b4',
          coral: '#d4897a',
          sage: '#c4d4c4',
          ink: '#5c4a4a',
          muted: '#7a6565',
          // New tokens for glass redesign
          ivory: '#fbf5ec',
          shell: '#f1e3d7',
          terra: '#b87560',
          plum: '#8b5a6b',
          charcoal: '#2d2424',
          smoke: '#6a5a5a',
        },
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        body: ['"Geist"', '"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'glass-romantic': 'linear-gradient(135deg, #fbf5ec 0%, #f3e0d4 40%, #f0c8c4 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.35) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px -8px rgba(184, 117, 96, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.55)',
        'glass-lg': '0 24px 60px -20px rgba(184, 117, 96, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'soft': '0 4px 20px -8px rgba(184, 117, 96, 0.15)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fadeIn 0.8s ease-out forwards',
        'shimmer': 'shimmer 12s ease-in-out infinite',
        'slide-up': 'slideUp 0.35s ease-out both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      padding: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
    },
  },
  plugins: [],
}
