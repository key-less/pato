import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { NowPlayingWidget } from './NowPlayingWidget'
import { container } from '../../infrastructure/di/container.js'

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null)
  const location = useLocation()

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

  return (
    <div className="min-h-[100dvh] bg-pato-cream flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} currentPath={location.pathname} currentHash={location.hash} />
      <main
        className="flex-1 relative min-w-0 pl-14 sm:pl-16"
        style={{
          paddingTop: 'max(3.5rem, env(safe-area-inset-top, 0px))',
          paddingBottom: 'max(5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <div
          className="fixed z-30 flex items-center gap-2"
          style={{ left: '0.75rem', top: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-3 min-w-[44px] min-h-[44px] rounded-xl bg-pato-butter shadow-md border border-pato-honey/60 text-pato-ink hover:bg-pato-peach hover:border-pato-coral/40 transition-all touch-manipulation"
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </button>
          {profilePhotoUrl && (
            <img
              src={profilePhotoUrl}
              alt="Perfil"
              className="w-8 h-8 rounded-full object-cover border-2 border-pato-honey/60 shadow-sm"
            />
          )}
        </div>
        <NowPlayingWidget />
        {children}
      </main>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
