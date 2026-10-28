import { useEffect, useState } from 'react'

function detectWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    if (!gl) return false
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return true
  } catch {
    return false
  }
}

function getTier() {
  const w = window.innerWidth
  if (w < 640) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function getLowPower() {
  const cores = navigator.hardwareConcurrency || 8
  const memory = navigator.deviceMemory || 8
  return cores <= 4 || memory <= 4
}

const reducedQuery = '(prefers-reduced-motion: reduce)'

/**
 * Capabilities that decide which version of the hero to render.
 * Only changes state when a value actually changes (breakpoint crossings,
 * motion preference toggles), never per frame or per resize event.
 */
export function useHeroEnvironment() {
  const [env, setEnv] = useState(() => ({
    tier: getTier(),
    lowPower: getLowPower(),
    reducedMotion: window.matchMedia(reducedQuery).matches,
    webgl: detectWebGL(),
  }))

  useEffect(() => {
    const media = window.matchMedia(reducedQuery)
    const onMotion = () => setEnv((e) => ({ ...e, reducedMotion: media.matches }))
    let raf = 0
    const onResize = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const tier = getTier()
        setEnv((e) => (e.tier === tier ? e : { ...e, tier }))
      })
    }
    media.addEventListener('change', onMotion)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      media.removeEventListener('change', onMotion)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return env
}
