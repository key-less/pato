/**
 * Canal de avisos para fallos de escritura.
 * La presentación se suscribe para que un fallo llegue al usuario aunque
 * quien llamó al caso de uso no lo capture.
 */

const listeners = new Set()

export function onStorageFailure(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function emitStorageFailure(error) {
  for (const listener of [...listeners]) listener(error)
}
