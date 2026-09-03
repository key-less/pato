import { beforeEach } from 'vitest'

// Cada test arranca con el almacenamiento vacío: sin esto, un test que guarda datos
// contamina al siguiente y los fallos dependen del orden de ejecución.
beforeEach(() => {
  localStorage.clear()
})
