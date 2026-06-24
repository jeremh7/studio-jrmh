'use client'
import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

export default function Cursor() {
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const sx = useSpring(x, { stiffness: 500, damping: 40 })
  const sy = useSpring(y, { stiffness: 500, damping: 40 })
  const rx = useSpring(x, { stiffness: 120, damping: 22 })
  const ry = useSpring(y, { stiffness: 120, damping: 22 })

  useEffect(() => {
    const move = (e: MouseEvent) => { x.set(e.clientX); y.set(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [x, y])

  return (
    <>
      <motion.div
        style={{
          position: 'fixed', left: sx, top: sy, zIndex: 9999,
          width: 8, height: 8, background: 'var(--white)', borderRadius: '50%',
          pointerEvents: 'none', transform: 'translate(-50%, -50%)',
          mixBlendMode: 'difference',
        }}
      />
      <motion.div
        style={{
          position: 'fixed', left: rx, top: ry, zIndex: 9998,
          width: 32, height: 32,
          border: '0.5px solid rgba(240,240,240,0.25)',
          borderRadius: '50%',
          pointerEvents: 'none',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </>
  )
}
