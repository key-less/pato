import { describe, it, expect } from 'vitest'
import { formatBytes } from '../../src/presentation/utils/formatBytes.js'

describe('formatBytes', () => {
  it('muestra bytes sueltos', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(512)).toBe('512 B')
  })

  it('sube de unidad al pasar el umbral', () => {
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB')
    expect(formatBytes(3 * 1024 ** 3)).toBe('3.0 GB')
  })

  it('quita decimales cuando el numero ya es grande', () => {
    expect(formatBytes(120 * 1024 * 1024)).toBe('120 MB')
  })

  it('no inventa un tamano cuando no lo hay', () => {
    expect(formatBytes(null)).toBe('—')
    expect(formatBytes(-1)).toBe('—')
  })
})
