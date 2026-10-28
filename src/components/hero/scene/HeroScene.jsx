import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { stages } from '../../../content/hero'
import { CareerEnvironment } from './CareerEnvironment'
import { getBudget } from './config'

const projectName = stages.find((s) => s.project)?.project.name ?? ''

// Reports readiness after the first frames have actually rendered, and
// surfaces WebGL context loss so the hero can switch to its static version.
function Lifecycle({ onReady, onError }) {
  const frames = useRef(0)
  const gl = useThree((s) => s.gl)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 3) onReady?.()
  })
  useEffect(() => {
    const el = gl.domElement
    const lost = (e) => {
      e.preventDefault()
      onError?.(new Error('WebGL context lost'))
    }
    el.addEventListener('webglcontextlost', lost)
    return () => el.removeEventListener('webglcontextlost', lost)
  }, [gl, onError])
  return null
}

/**
 * The WebGL canvas. Loaded lazily so the HTML hero renders before three.js
 * has even downloaded. Rendering stops entirely while the hero is off-screen.
 */
export default function HeroScene({ journey, tier, lowPower, active, onReady, onError }) {
  const budget = getBudget(tier, lowPower)
  return (
    <Canvas
      style={{ position: 'absolute', inset: 0 }}
      dpr={budget.dpr}
      frameloop={active ? 'always' : 'never'}
      camera={{ fov: 38, near: 0.1, far: 80, position: [0, 0.3, 10.8] }}
      gl={{ antialias: tier !== 'mobile', alpha: true, powerPreference: 'high-performance', stencil: false }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <Lifecycle onReady={onReady} onError={onError} />
      <CareerEnvironment journey={journey} tier={tier} budget={budget} projectName={projectName} />
    </Canvas>
  )
}
