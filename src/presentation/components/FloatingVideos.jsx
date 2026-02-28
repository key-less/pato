import { useState, useRef } from 'react'

const POSITIONS = [
  { top: '18%', left: '12%', size: 160, delay: 200 },
  { top: '22%', right: '15%', size: 140, delay: 600 },
  { top: '55%', left: '6%', size: 150, delay: 400 },
  { top: '58%', right: '10%', size: 130, delay: 800 },
  { top: '82%', left: '18%', size: 145, delay: 300 },
  { top: '85%', right: '6%', size: 135, delay: 700 },
  { top: '38%', right: '3%', size: 120, delay: 500 },
  { top: '70%', left: '22%', size: 125, delay: 100 },
]

/**
 * Vídeos flotantes tipo pop-up: sin controles, al terminar se quedan ahí; un toque para repetir.
 */
export function FloatingVideos({ media }) {
  const videos = media.filter((m) => m.type === 'video')
  if (videos.length === 0) return null

  return (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none">
      {videos.map((m, i) => {
        const pos = POSITIONS[i % POSITIONS.length]
        return (
          <div
            key={m.id}
            className="absolute rounded-2xl overflow-hidden shadow-lg border-2 border-white/50 animate-fade-in pointer-events-auto cursor-pointer"
            style={{
              width: pos.size,
              height: pos.size,
              top: pos.top,
              left: pos.left,
              right: pos.right,
              animationDelay: `${i * 120}ms`,
            }}
          >
            <FloatingVideoItem src={m.src} poster={m.thumbnail} />
          </div>
        )
      })}
    </div>
  )
}

function FloatingVideoItem({ src, poster }) {
  const ref = useRef(null)

  const handleClick = () => {
    const el = ref.current
    if (!el) return
    if (el.ended) {
      el.currentTime = 0
      el.play().catch(() => {})
    }
  }

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      playsInline
      muted
      autoPlay
      loop={false}
      className="w-full h-full object-cover"
      onClick={handleClick}
      style={{ pointerEvents: 'auto' }}
      aria-label="Video; toque para repetir cuando termine"
    />
  )
}
