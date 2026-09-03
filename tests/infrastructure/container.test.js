import { describe, it, expect } from 'vitest'
import { container } from '../../src/infrastructure/di/container.js'

/**
 * El contenedor es el único punto donde las páginas obtienen sus casos de uso. Si uno
 * queda sin registrar, la app compila igual y falla en tiempo de ejecución al pulsar el
 * botón correspondiente. Esta lista es la barrera contra eso.
 *
 * Al añadir un caso de uso hay que añadirlo también aquí: es deliberado, obliga a no
 * olvidar el registro en el contenedor.
 */
const EXPECTED_USE_CASES = [
  'getAppState', 'updateAppState',
  'getMediaList', 'addMedia', 'updateMedia', 'deleteMedia',
  'getLetters', 'saveLetter', 'deleteLetter', 'buildMailtoUrl',
  'getCitas', 'addCita', 'removeCita',
  'getSentLetterLogs', 'logSentLetter', 'removeSentLetterLog',
  'getPartnerProfiles', 'savePartnerProfile', 'clearPartnerProfile',
  'getPlaylists', 'addPlaylist', 'removePlaylist',
  'addActivityEvent', 'getActivityEvents', 'removeActivityEvent',
]

describe('contenedor de dependencias', () => {
  it.each(EXPECTED_USE_CASES)('expone %s como función', (name) => {
    expect(container[name]).toBeTypeOf('function')
  })

  it('no expone nada de más sin declararlo en esta lista', () => {
    expect(Object.keys(container).sort()).toEqual([...EXPECTED_USE_CASES].sort())
  })

  it('los repositorios quedaron construidos: una operación real funciona de extremo a extremo', async () => {
    const antes = await container.getCitas()
    const cita = await container.addCita({ date: '2026-05-01', lugar: 'Playa' })
    expect((await container.getCitas()).map((c) => c.id)).toContain(cita.id)
    await container.removeCita(cita.id)
    expect(await container.getCitas()).toHaveLength(antes.length)
  })

  it('el feed registra y devuelve eventos a través del contenedor', async () => {
    // Se mide la diferencia, no el total. El contenedor es un singleton de módulo y sus
    // repositorios llevan caché en memoria, que `localStorage.clear()` no vacía: dar por
    // supuesto que el feed empieza vacío haría que este test dependiese del orden de
    // ejecución.
    const antes = await container.getActivityEvents()
    const creado = await container.addActivityEvent({ type: 'cita_added', description: 'Añadió una cita' })
    const despues = await container.getActivityEvents()

    expect(despues).toHaveLength(antes.length + 1)
    expect(despues.map((e) => e.id)).toContain(creado.id)

    await container.removeActivityEvent(creado.id)
    expect(await container.getActivityEvents()).toHaveLength(antes.length)
  })
})
