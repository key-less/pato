import { describe, it, expect } from 'vitest'
import { decodeDataUrl, bufferToDataUrl } from '../../src/infrastructure/media/dataUrl.js'

describe('dataUrl', () => {
  it('decodifica un data URL base64 con su tipo', () => {
    const decoded = decodeDataUrl('data:image/png;base64,aG9sYQ==')

    expect(decoded.type).toBe('image/png')
    expect(new TextDecoder().decode(decoded.buffer)).toBe('hola')
  })

  it('decodifica un data URL sin base64', () => {
    const decoded = decodeDataUrl('data:text/plain,hola%20mundo')

    expect(new TextDecoder().decode(decoded.buffer)).toBe('hola mundo')
  })

  it('asume octet-stream cuando no hay tipo', () => {
    expect(decodeDataUrl('data:;base64,aG9sYQ==').type).toBe('application/octet-stream')
  })

  it('devuelve null ante una entrada que no es data URL', () => {
    expect(decodeDataUrl('https://ejemplo.com/foto.jpg')).toBeNull()
    expect(decodeDataUrl(null)).toBeNull()
    expect(decodeDataUrl('data:image/png;base64,%%%')).toBeNull()
  })

  it('hace round-trip de buffer a data URL', () => {
    const original = 'data:image/jpeg;base64,aG9sYQ=='
    const { buffer, type } = decodeDataUrl(original)

    expect(bufferToDataUrl(buffer, type)).toBe(original)
  })

  it('codifica archivos grandes sin desbordar la pila', () => {
    const big = new Uint8Array(300_000).fill(65)

    const dataUrl = bufferToDataUrl(big.buffer, 'video/mp4')

    expect(dataUrl.startsWith('data:video/mp4;base64,')).toBe(true)
    expect(decodeDataUrl(dataUrl).buffer.byteLength).toBe(300_000)
  })
})
