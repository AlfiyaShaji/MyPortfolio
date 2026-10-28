import { useFrame } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Color } from 'three'
import { mulberry32, palette } from './config'
import { createGlowPointsMaterial } from './materials'
import { useDisposable } from './useDisposable'

// Atmospheric dust that gives the world depth. Drift runs on the GPU; the
// timeline only changes opacity and the blue -> purple palette mix.
export function ParticleField({ journey, count }) {
  const { geometry, material } = useDisposable(() => {
    const rand = mulberry32(21)
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const scale = new Float32Array(count)
    const tints = [new Color(palette.blue), new Color(palette.cyan), new Color(palette.violet), new Color(palette.mist)]
    for (let i = 0; i < count; i++) {
      // Wide shell around the journey path, thinner near the camera line.
      const r = 3 + Math.pow(rand(), 0.7) * 17
      const theta = rand() * Math.PI * 2
      const y = (rand() - 0.5) * 18
      pos[i * 3] = Math.cos(theta) * r
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = Math.sin(theta) * r - 4
      const c = tints[Math.floor(rand() * tints.length)]
      const dim = 0.35 + rand() * 0.65
      col[i * 3] = c.r * dim
      col[i * 3 + 1] = c.g * dim
      col[i * 3 + 2] = c.b * dim
      scale[i] = 0.3 + Math.pow(rand(), 3) * 1.4
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aColor', new BufferAttribute(col, 3))
    geometry.setAttribute('aScale', new BufferAttribute(scale, 1))
    const material = createGlowPointsMaterial({ size: 3, drift: 0.35, opacity: 0.6 })
    return { geometry, material }
  }, [count])

  useFrame((state) => {
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uPixelRatio.value = state.gl.getPixelRatio()
    u.uOpacity.value = 0.6 + journey.glow * 0.35
    u.uMix.value = journey.aiMix
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
