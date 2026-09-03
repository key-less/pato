import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TabBar } from './TabBar'
import { NowPlayingWidget } from './NowPlayingWidget'
import { InstallHint } from './InstallHint'
import { useHaptics } from '../hooks/useHaptics.js'
import { container } from '../../infrastructure/di/container.js'

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const location = useLocation()
  const haptic = useHaptics()

  useEffect(() => {
    const refresh = () => {
      container.getPartnerProfiles().then((p) => {
        setProfilePhotoUrl(p?.[0]?.profilePhotoUrl || null)
      })
    }
    refresh()
    window.addEventListener('pato:profile-updated', refresh)
    return () => window.removeEventListener('pato:profile-updated', refresh)
  }, [])

  // El menú se cierra al navegar: en móvil la pestaña "Más" lo abre y la
  // selección debe devolver el control a la pantalla, como en iOS.
  useEffect(() => {
    setSidebarOpen(false)
  }, [location.pathname])

  return (
    <div
      className="min-h-[100dvh] flex relative overflow-x-hidden"
      style={{ background: 'var(--app-bg)', backgroundAttachment: 'fixed' }}
    >
      {/* Orbes decorativos difuminados */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0" aria-hidden="true">
        <div
          className="absolute -top-32 -right-20 w-[36rem] h-[36rem] rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f2c4c4 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-32 -left-24 w-[32rem] h-[32rem] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, #f8d7c4 0%, transparent 70%)' }}
        />
      </div>

      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
        currentHash={location.hash}
      />

      <main
        className="flex-1 relative min-w-0 sm:pl-16 z-10"
        style={{
          paddingTop: 'max(3.5rem, var(--safe-top))',
          // En móvil la barra de pestañas ocupa la parte baja; en escritorio
          // basta con el respiro habitual.
          paddingBottom: 'calc(var(--tabbar-h) + 1.5rem)',
          paddingLeft: 'var(--safe-left)',
          paddingRight: 'var(--safe-right)',
        }}
      >
        {/* Esquina superior izquierda. El botón de menú solo aparece en
            escritorio: en móvil esa función la cubre la pestaña "Más". La foto
            de perfil se mantiene en ambos. */}
        <div
          className="fixed z-30 flex items-center gap-2 pato-chrome"
          style={{ left: 'max(0.75rem, var(--safe-left))', top: 'max(1rem, var(--safe-top))' }}
        >
          <button
            type="button"
            onClick={() => {
              haptic('light')
              setSidebarOpen(true)
            }}
            className="hidden sm:flex items-center justify-center p-3 hit-44 rounded-2xl text-pato-charcoal hover:scale-105 tappable glass-2"
            aria-label="Abrir menú"
            aria-expanded={sidebarOpen}
          >
            <MenuIcon />
          </button>
          {profilePhotoUrl && (
            <img
              src={profilePhotoUrl}
              alt="Perfil"
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full object-cover border-2 border-white/70 shadow-soft"
            />
          )}
        </div>

        <NowPlayingWidget />

        {/* La transición se reinicia con la ruta: cada pantalla entra como en
            una pila de navegación nativa. */}
        <div key={location.pathname} className="page-enter">
          {children}
        </div>
      </main>

      <TabBar
        currentPath={location.pathname}
        menuOpen={sidebarOpen}
        onOpenMenu={() => setSidebarOpen(true)}
      />

      <InstallHint />
    </div>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
