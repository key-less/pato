import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // happy-dom aporta `localStorage`, que los repositorios usan directamente.
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    coverage: {
      include: ['src/domain/**', 'src/application/**', 'src/infrastructure/**'],
      // La presentación (React) queda fuera: se prueba en la Fase 5 con Playwright.
      exclude: ['src/presentation/**'],
    },
  },
})
