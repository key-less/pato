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
          coral: '#D4664F',
          sage: '#c4d4c4',
          ink: '#5c4a4a',
          muted: '#7a6565',
          // Ancla fría. Toda la paleta era cálida —crema, miel, melocotón, coral— así que
          // nada tenía contra qué leerse como cálido y el conjunto se aplanaba en un rosa
          // uniforme. Este es además el color del texto: el negro puro sobre crema es
          // duro, y esta app no debería tener nada duro. Ver «Aguas tranquilas».
          agua: '#1F3A3D',
          'agua-clara': '#2B514D',

          ivory: '#fbf5ec',
          // Borde/divisor con suficiente valor para leerse tanto sobre la crema
          // clara como sobre el rosa del final del degradado. `rose` no lo lograba:
          // es casi el mismo color que el fondo en ese tramo.
          line: '#d9b3a8',
          shell: '#f1e3d7',
          terra: '#b87560',
          plum: '#8b5a6b',
          charcoal: '#1F3A3D',
          smoke: '#8A7A72',
        },
      },
      fontFamily: {
        // Fraunces para lo que emociona (contador, títulos, fechas, citas);
        // Karla para lo que se usa (botones, etiquetas, formularios, texto corrido).
        display: ['"Fraunces"', 'Georgia', 'serif'],
        body: ['"Karla"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      backgroundImage: {
        'glass-romantic': 'linear-gradient(135deg, #fbf5ec 0%, #f3e0d4 40%, #f0c8c4 100%)',
        'glass-card': 'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.35) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        // Escala de profundidad en tres niveles claramente distintos. Los valores
        // anteriores eran casi idénticos entre sí, así que una tarjeta, un panel y un
        // elemento elevado se veían igual y la jerarquía se perdía.
        //
        // Cada nivel combina una sombra de contacto (corta y más opaca, ancla el
        // elemento al fondo) con una sombra ambiental (larga y difusa, da la altura).
        // Con una sola sombra difusa, como estaba, los bordes flotan sin apoyarse.
        'glass': [
          '0 1px 2px -1px rgba(122, 74, 60, 0.16)',
          '0 8px 24px -12px rgba(122, 74, 60, 0.22)',
          'inset 0 1px 0 rgba(255, 255, 255, 0.75)',
        ].join(', '),
        'glass-lg': [
          '0 2px 4px -2px rgba(122, 74, 60, 0.20)',
          '0 20px 48px -20px rgba(122, 74, 60, 0.30)',
          'inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        ].join(', '),
        'soft': '0 1px 3px -1px rgba(122, 74, 60, 0.14), 0 4px 12px -6px rgba(122, 74, 60, 0.16)',
        // Acciones principales: la sombra toma el tono del propio botón, no gris.
        'action': '0 1px 2px -1px rgba(160, 84, 64, 0.35), 0 8px 20px -8px rgba(180, 100, 78, 0.45)',
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
