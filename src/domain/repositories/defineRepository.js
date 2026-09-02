/**
 * Fábrica de contratos de repositorio.
 *
 * Antes, cada contrato era una función identidad (`function createX(deps) { return deps }`)
 * que no comprobaba nada: la forma del repositorio vivía únicamente en un comentario
 * JSDoc. Mientras solo hubo una implementación (localStorage) daba igual. En cuanto haya
 * dos —localStorage y Supabase— ese es el punto exacto donde se desincronizan, porque
 * nada obliga a que cumplan la misma forma.
 *
 * `defineRepository` convierte el contrato en una comprobación real: la implementación se
 * valida al construirse, no al llamar a un método que no existe en mitad de una pantalla.
 *
 * @param {string} name Nombre del contrato, usado en los mensajes de error.
 * @param {string[]} requiredMethods Métodos que toda implementación debe ofrecer.
 * @returns {(implementation: object) => object} Función que valida y devuelve la implementación.
 */
export function defineRepository(name, requiredMethods) {
  return function createRepository(implementation) {
    if (implementation === null || typeof implementation !== 'object') {
      const received = implementation === null ? 'null' : typeof implementation
      throw new TypeError(
        `${name}: se esperaba un objeto con la implementación, se recibió ${received}.`
      )
    }

    const missing = requiredMethods.filter((method) => typeof implementation[method] !== 'function')
    if (missing.length > 0) {
      throw new TypeError(
        `${name}: falta implementar ${missing.join(', ')}. ` +
          `El contrato exige: ${requiredMethods.join(', ')}.`
      )
    }

    return implementation
  }
}
