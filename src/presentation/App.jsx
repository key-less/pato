import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const MediaModule = lazy(() => import('./pages/MediaModule'))
const PartnerProfileModule = lazy(() => import('./pages/PartnerProfileModule'))
const PlaylistsModule = lazy(() => import('./pages/PlaylistsModule'))
const LettersModule = lazy(() => import('./pages/LettersModule'))
const SettingsModule = lazy(() => import('./pages/SettingsModule'))
const HistorialModule = lazy(() => import('./pages/HistorialModule'))

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <span className="text-pato-muted">Cargando…</span>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/fotos" element={<MediaModule />} />
            <Route path="/perfil-pareja" element={<PartnerProfileModule />} />
            <Route path="/playlists" element={<PlaylistsModule />} />
            <Route path="/cartas" element={<LettersModule />} />
            <Route path="/historial" element={<HistorialModule />} />
            <Route path="/configuracion" element={<SettingsModule />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  )
}
