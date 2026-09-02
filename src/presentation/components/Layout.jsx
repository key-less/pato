import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { NowPlayingWidget } from './NowPlayingWidget'
import { StorageAlert } from './StorageAlert'
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
    <div
      className="min-h-[100dvh] flex relative overflow-x-hidden"
      style={{
        background: 'linear-gradient(135deg, #fbf5ec 0%, #f3e0d4 40%, #f0c8c4 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Decorative blurred orbs */}
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
        className="flex-1 relative min-w-0 pl-14 sm:pl-16 z-10"
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
            className="p-3 min-w-[44px] min-h-[44px] rounded-2xl text-pato-charcoal hover:scale-105 active:scale-95 transition-all touch-manipulation"
            style={{
              background: 'rgba(255, 255, 255, 0.65)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.7)',
              boxShadow: '0 8px 24px -8px rgba(184, 117, 96, 0.18), inset 0 1px 0 rgba(255,255,255,0.6)',
            }}
            aria-label="Abrir menú"
          >
            <MenuIcon />
          </button>
          {profilePhotoUrl && (
            <img
              src={profilePhotoUrl}
              alt="Perfil"
              className="w-8 h-8 rounded-full object-cover border-2 border-white/70 shadow-soft"
            />
          )}
        </div>
        <NowPlayingWidget />
        {children}
        <StorageAlert />
      </main>
    </div>
  )
}

function MenuIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}
