import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { LandingPage } from './pages/LandingPage'
import { MediaModule } from './pages/MediaModule'
import { PartnerProfileModule } from './pages/PartnerProfileModule'
import { PlaylistsModule } from './pages/PlaylistsModule'
import { LettersModule } from './pages/LettersModule'
import { SettingsModule } from './pages/SettingsModule'
import { HistorialModule } from './pages/HistorialModule'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/fotos" element={<MediaModule />} />
          <Route path="/perfil-pareja" element={<PartnerProfileModule />} />
          <Route path="/playlists" element={<PlaylistsModule />} />
          <Route path="/cartas" element={<LettersModule />} />
          <Route path="/historial" element={<HistorialModule />} />
          <Route path="/configuracion" element={<SettingsModule />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
