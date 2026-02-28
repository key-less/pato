import { useState, useEffect } from 'react'

const POSITIONS = [
  { top: '10%', left: '5%', size: 150, delay: 0 },
  { top: '15%', right: '8%', size: 120, delay: 400 },
  { top: '45%', left: '2%', size: 135, delay: 800 },
  { top: '50%', right: '5%', size: 105, delay: 1200 },
  { top: '75%', left: '10%', size: 128, delay: 200 },
  { top: '80%', right: '12%', size: 142, delay: 600 },
  { top: '25%', left: '15%', size: 112, delay: 1000 },
  { top: '60%', left: '8%', size: 98, delay: 300 },
  { top: '35%', right: '10%', size: 132, delay: 500 },
  { top: '90%', left: '20%', size: 108, delay: 700 },
]

/**
 * Muestra fotos alrededor de la página de forma gradual (staggered).
 * Solo fotos (no videos) para no saturar.
 */
export function FloatingPhotos({ media }) {
  const photos = media.filter((m) => m.type === 'photo')
  const [visibleCount, setVisibleCount] = useState(0)

  useEffect(() => {
    if (photos.length === 0) return
    const step = 1
    const interval = 600
    let idx = 0
    const id = setInterval(() => {
      idx += step
      setVisibleCount((prev) => Math.min(prev + step, photos.length))
      if (idx >= photos.length) clearInterval(id)
    }, interval)
    return () => clearInterval(id)
  }, [photos.length])

  const toShow = photos.slice(0, visibleCount)

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {toShow.map((m, i) => {
        const pos = POSITIONS[i % POSITIONS.length]
        const style = {
          width: pos.size,
          height: pos.size,
          top: pos.top,
          left: pos.left,
          right: pos.right,
          animationDelay: `${pos.delay}ms`,
        }
        return (
          <div
            key={m.id}
            className="absolute rounded-2xl overflow-hidden shadow-lg border-2 border-white/50 animate-fade-in"
            style={{
              ...style,
              animationDelay: `${i * 150}ms`,
            }}
          >
            <img
              src={m.src}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )
      })}
    </div>
  )
}
