// Renderiza la hoja de vista previa y el icono 1024 de la app (requiere Playwright).
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
const here = dirname(fileURLToPath(import.meta.url))
const out = process.argv[2] ?? here
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1180, height: 800 }, deviceScaleFactor: 2 })
await p.goto('file://' + join(here, 'preview.html'))
await p.screenshot({ path: join(out, 'patos-preview.png'), fullPage: true })
const i = await b.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 })
await i.setContent(`<style>*{margin:0}</style>${readFileSync(join(here, 'app-icon.svg'), 'utf8')}`)
const iconDir = join(here, '..', 'Pato', 'Resources', 'Assets.xcassets', 'AppIcon.appiconset')
mkdirSync(iconDir, { recursive: true })
await i.screenshot({ path: join(iconDir, 'AppIcon.png'), clip: { x: 0, y: 0, width: 1024, height: 1024 } })
writeFileSync(join(iconDir, 'Contents.json'), JSON.stringify({ images: [{ filename: 'AppIcon.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }], info: { author: 'xcode', version: 1 } }, null, 2) + '\n')
await b.close()
