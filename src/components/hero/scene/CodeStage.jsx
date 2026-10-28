import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  InstancedBufferAttribute,
  MeshBasicMaterial,
  Object3D,
  SpriteMaterial,
} from 'three'
import { LAYER_GAP, palette, smooth, stagger } from './config'
import { getGlowTexture } from './materials'
import { useDisposable } from './useDisposable'

const dummy = new Object3D()
const lerp = (a, b, t) => a + (b - a) * t

/**
 * Stage 1 owner of the "code bars": one InstancedMesh whose instances move
 * through four target layouts (scatter -> code -> UI -> full-stack layers).
 * The same objects carry the story through every stage, so nothing cuts.
 */
export function CodeStage({ journey, layout }) {
  const mesh = useRef()
  const cursor = useRef()
  const beam = useRef()
  const core = useRef()

  const res = useDisposable(() => {
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ toneMapped: false })
    const cursorMaterial = new MeshBasicMaterial({ color: palette.cyan, transparent: true, toneMapped: false })
    const glow = getGlowTexture()
    const beamMaterial = new SpriteMaterial({ map: glow, color: palette.cyan, blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })
    const coreMaterial = new SpriteMaterial({ map: glow, color: palette.blue, blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })
    return { geometry, material, cursorMaterial, beamMaterial, coreMaterial }
  }, [])

  const colorBuffer = useRef()
  useLayoutEffect(() => {
    const attr = new InstancedBufferAttribute(new Float32Array(layout.count * 3), 3)
    mesh.current.instanceColor = attr
    colorBuffer.current = attr
  }, [layout])

  const tmpA = useRef(new Color()).current

  useFrame((state) => {
    const j = journey
    const t = state.clock.elapsedTime
    const L = layout
    const m = mesh.current
    const colors = colorBuffer.current.array

    for (let i = 0; i < L.count; i++) {
      const d = L.delay[i]
      const first = L.firstLine[i] === 1
      const a = first ? 1 : stagger(j.assemble, d)
      const u = stagger(j.ui, d * 0.7, 0.35)
      const s = stagger(j.stack, d * 0.7, 0.35)
      const vis = first ? 1 : smooth((j.reveal - d * 0.72) / 0.28)
      const free = 1 - a

      const i3 = i * 3
      const i4 = i * 4
      let x = lerp(L.scatter[i3], L.code[i4], a)
      let y = lerp(L.scatter[i3 + 1] + Math.sin(t * 0.5 + L.phase[i]) * 0.14 * free, L.code[i4 + 1], a)
      let z = lerp(L.scatter[i3 + 2], L.z[i3], a)
      let w = L.code[i4 + 2]
      let h = L.code[i4 + 3] * (1 + free * 0.6)

      x = lerp(x, L.ui[i4], u)
      y = lerp(y, L.ui[i4 + 1], u)
      z = lerp(z, L.z[i3 + 1], u)
      w = lerp(w, L.ui[i4 + 2], u)
      h = lerp(h, L.ui[i4 + 3], u)

      const layerZ = L.z[i3 + 2] - L.layer[i] * LAYER_GAP * j.separate
      x = lerp(x, L.stack[i4], s)
      y = lerp(y, L.stack[i4 + 1], s)
      z = lerp(z, layerZ, s)
      w = lerp(w, L.stack[i4 + 2], s)
      h = lerp(h, L.stack[i4 + 3], s)

      dummy.position.set(x, y, z)
      dummy.rotation.set(
        (L.scatterRot[i3] + Math.sin(t * 0.3 + L.phase[i]) * 0.25) * free,
        (L.scatterRot[i3 + 1] + Math.cos(t * 0.25 + L.phase[i]) * 0.3) * free,
        L.scatterRot[i3 + 2] * free,
      )
      dummy.scale.set(Math.max(w * vis, 1e-4), Math.max(h * vis, 1e-4), 0.022)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)

      // Colour follows the same chain: syntax colours -> UI tones -> layer tones.
      const c9 = i * 9
      const k1 = u * (1 - s)
      const k0 = (1 - u) * (1 - s)
      // Floating fragments are dimmer until they lock into place.
      const bright = 0.55 + 0.45 * a
      tmpA.setRGB(
        (L.colors[c9] * k0 + L.colors[c9 + 3] * k1 + L.colors[c9 + 6] * s) * bright,
        (L.colors[c9 + 1] * k0 + L.colors[c9 + 4] * k1 + L.colors[c9 + 7] * s) * bright,
        (L.colors[c9 + 2] * k0 + L.colors[c9 + 5] * k1 + L.colors[c9 + 8] * s) * bright,
      )
      colors[i3] = tmpA.r
      colors[i3 + 1] = tmpA.g
      colors[i3 + 2] = tmpA.b
    }
    m.instanceMatrix.needsUpdate = true
    colorBuffer.current.needsUpdate = true

    // Blinking cursor at the end of the first line of code.
    const blink = Math.sin(t * 5.2) > -0.2 ? 1 : 0.15
    res.cursorMaterial.opacity = blink * (1 - smooth(j.ui * 2.5))
    cursor.current.visible = res.cursorMaterial.opacity > 0.01

    // Electric-blue guide light behind the code, leading into the browser.
    const b = j.beam
    beam.current.scale.set(1.2 + b * 9, 0.18 + b * 0.25, 1)
    res.beamMaterial.opacity = 0.08 + b * 0.32
    core.current.scale.setScalar(2 + b * 3.5 + j.glow * 2)
    res.coreMaterial.opacity = 0.1 + b * 0.22 + j.glow * 0.12
    res.coreMaterial.color.set(palette.blue).lerp(tmpA.set(palette.purple), j.aiMix * 0.7)
  })

  const cur = layout.cursor
  return (
    <group>
      <sprite ref={core} material={res.coreMaterial} position={[0, 0.1, -0.7]} />
      <sprite ref={beam} material={res.beamMaterial} position={[0, 0.25, -0.35]} />
      <instancedMesh
        key={layout.count}
        ref={mesh}
        args={[res.geometry, res.material, layout.count]}
        frustumCulled={false}
      />
      <mesh ref={cursor} geometry={res.geometry} material={res.cursorMaterial} position={[cur.x, cur.y, 0.04]} scale={[0.035, cur.h, 0.02]} />
    </group>
  )
}
