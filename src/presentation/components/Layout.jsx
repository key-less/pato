import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { NowPlayingWidget } from './NowPlayingWidget'

export function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

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
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed z-30 p-3 min-w-[44px] min-h-[44px] rounded-xl bg-pato-butter shadow-md border border-pato-honey/60 text-pato-ink hover:bg-pato-peach hover:border-pato-coral/40 transition-all touch-manipulation"
          style={{ left: '0.75rem', top: 'max(1rem, env(safe-area-inset-top))' }}
          aria-label="Abrir menú"
        >
          <MenuIcon />
        </button>
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
