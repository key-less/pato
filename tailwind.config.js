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
          // --- Sistema actual (rediseño en cristal) ---
          ivory: '#fbf5ec',      // superficie base
          shell: '#f1e3d7',      // superficie secundaria
          rose: '#f2c4c4',       // acento decorativo (separadores, orbes)
          coral: '#d4897a',      // acción primaria
          terra: '#b87560',      // acción primaria en hover, acento de texto
          plum: '#8b5a6b',       // acento secundario
          charcoal: '#2d2424',   // texto principal
          smoke: '#6a5a5a',      // texto secundario
          // --- Obsoletos ---
          // Quedan definidos para no romper nada que aún los importe, pero no
          // deben usarse en código nuevo: pertenecen a la paleta opaca previa
          // al rediseño. Equivalencias: ink -> charcoal, muted -> smoke,
          // cream/butter/honey/peach -> superficies de cristal (.glass*),
          // blush -> rose, sage -> terra.
          cream: '#fdf8f0',
          butter: '#fef3d9',
          honey: '#f5e6c8',
          peach: '#f8d7c4',
          blush: '#e8b4b4',
          sage: '#c4d4c4',
          ink: '#5c4a4a',
          muted: '#7a6565',
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
