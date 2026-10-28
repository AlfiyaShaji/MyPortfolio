import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { PlaneGeometry } from 'three'
import { BROWSER, palette, smooth } from './config'
import { createPanelMaterial } from './materials'
import { useDisposable } from './useDisposable'

// Responsive previews that slide out from behind the browser in stage 2.
const DEVICES = [
  { w: 1.1, h: 1.5, to: [1.55, -0.5, -0.45], delay: 0 },
  { w: 0.56, h: 1.05, to: [2.15, -0.72, -0.22], delay: 0.25 },
]

/**
 * Stage 2: the editor panel behind the code grows a browser chrome, a
 * responsive grid and device previews. The browser panel itself later becomes
 * the frontend layer of the full-stack stack (it lives in the same group).
 */
export function WebDevelopmentStage({ journey, showDevices }) {
  const deviceRefs = useRef([])

  const res = useDisposable(() => {
    const browserGeometry = new PlaneGeometry(BROWSER.w, BROWSER.h)
    const browserMaterial = createPanelMaterial({
      colorHex: palette.blue,
      width: BROWSER.w,
      height: BROWSER.h,
      chromeHeight: BROWSER.chrome,
    })
    const deviceGeometries = DEVICES.map((d) => new PlaneGeometry(d.w, d.h))
    const deviceMaterials = DEVICES.map((d) =>
      createPanelMaterial({ colorHex: palette.violet, width: d.w, height: d.h, chromeHeight: 0 }),
    )
    return { browserGeometry, browserMaterial, deviceGeometries, deviceMaterials }
  }, [])

  useFrame(() => {
    const j = journey
    const u = res.browserMaterial.uniforms
    // An editor surface appears as code assembles; the chrome arrives in stage 2.
    u.uOpacity.value = Math.max(smooth(j.assemble) * 0.7, j.browser)
    u.uFill.value = 0.55 + j.browser * 0.2
    u.uEdge.value = 0.2 + j.browser * 0.65
    u.uChrome.value = j.browser * (1 - j.stack * 0.6)
    u.uGrid.value = j.devices * 0.8 + j.separate * 0.25

    if (!showDevices) return
    DEVICES.forEach((d, i) => {
      const g = deviceRefs.current[i]
      if (!g) return
      const p = smooth((j.devices - d.delay) / (1 - d.delay))
      g.visible = p > 0.001
      g.position.set(d.to[0] * p, d.to[1] * p, d.to[2] * p - 0.1 * (1 - p))
      g.scale.setScalar(0.6 + 0.4 * p)
      const m = res.deviceMaterials[i].uniforms
      m.uOpacity.value = p
      m.uFill.value = 0.82
      m.uGrid.value = 0.9
      m.uEdge.value = 0.9
    })
  })

  return (
    <group>
      <mesh geometry={res.browserGeometry} material={res.browserMaterial} renderOrder={1} />
      {showDevices &&
        DEVICES.map((d, i) => (
          <mesh
            key={i}
            ref={(el) => (deviceRefs.current[i] = el)}
            geometry={res.deviceGeometries[i]}
            material={res.deviceMaterials[i]}
            renderOrder={0}
            visible={false}
          />
        ))}
    </group>
  )
}
