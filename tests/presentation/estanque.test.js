import { describe, it, expect } from 'vitest'
import { etapaPara } from '../../src/presentation/components/Estanque.jsx'

describe('etapaPara', () => {
  it('acerca los patos conforme avanza la relacion', () => {
    const orden = ['conociendose', 'poniendose_serio', 'ya_casi', 'somos_pareja', 'casados']
    const separaciones = orden.map((id) => etapaPara(id).separacion)

    expect(separaciones).toEqual([...separaciones].sort((a, b) => b - a))
    expect(new Set(separaciones).size).toBe(orden.length)
  })

  it('hace crecer la onda comun hasta compartir una sola', () => {
    expect(etapaPara('conociendose').ondaComun).toBe(0)
    expect(etapaPara('ya_casi').ondaComun).toBeGreaterThan(0)
    expect(etapaPara('casados').ondaComun).toBe(1)
  })

  it('los patos se miran solo a partir de «somos pareja»', () => {
    expect(etapaPara('ya_casi').mirandose).toBeUndefined()
    expect(etapaPara('somos_pareja').mirandose).toBe(true)
    expect(etapaPara('casados').mirandose).toBe(true)
  })

  it('ubica un estado personalizado por su orden', () => {
    const statuses = [{ id: 'custom_mejor_amigues', label: 'Mejor amigues', order: 4 }]

    expect(etapaPara('custom_mejor_amigues', statuses)).toEqual(etapaPara('somos_pareja'))
  })

  it('la onda comun y las propias se reparten la escena', () => {
    // Al final queda una sola onda: las propias se apagan conforme crece la comun.
    for (const id of ['conociendose', 'poniendose_serio', 'ya_casi', 'somos_pareja', 'casados']) {
      const { ondaComun } = etapaPara(id)
      expect(ondaComun + (1 - ondaComun)).toBe(1)
      expect(ondaComun).toBeGreaterThanOrEqual(0)
      expect(ondaComun).toBeLessThanOrEqual(1)
    }
    expect(1 - etapaPara('casados').ondaComun).toBe(0)
    expect(1 - etapaPara('conociendose').ondaComun).toBe(1)
  })

  it('los picos nunca se atraviesan cuando los patos se miran', () => {
    // Un pato ocupa de x-26 a x+27. Al mirarse, los picos apuntan al centro:
    // con separacion s, la punta de cada pico queda a s-27 del centro.
    const mirandose = ['somos_pareja', 'casados']

    for (const id of mirandose) {
      const { separacion } = etapaPara(id)
      expect(separacion - 27).toBeGreaterThan(0)
    }
  })

  it('los dos patos caben dentro del lienzo', () => {
    const CENTRO = 100
    const ANCHO = 200

    for (const id of ['conociendose', 'poniendose_serio', 'ya_casi', 'somos_pareja', 'casados']) {
      const { separacion } = etapaPara(id)
      expect(CENTRO - separacion - 26).toBeGreaterThanOrEqual(0)
      expect(CENTRO + separacion + 27).toBeLessThanOrEqual(ANCHO)
    }
  })

  it('nunca rompe ante un estado desconocido', () => {
    expect(etapaPara('no_existe', [])).toEqual(etapaPara('conociendose'))
    expect(etapaPara(undefined)).toEqual(etapaPara('conociendose'))
  })

  it('recorta un orden fuera de rango en vez de fallar', () => {
    const statuses = [
      { id: 'a', label: 'A', order: 99 },
      { id: 'b', label: 'B', order: 0 },
    ]

    expect(etapaPara('a', statuses)).toEqual(etapaPara('casados'))
    expect(etapaPara('b', statuses)).toEqual(etapaPara('conociendose'))
  })
})
