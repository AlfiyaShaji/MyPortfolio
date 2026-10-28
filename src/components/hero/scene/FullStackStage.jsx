import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  EdgesGeometry,
  LineBasicMaterial,
  MeshBasicMaterial,
  PlaneGeometry,
  SpriteMaterial,
} from 'three'
import { layerLabels } from '../../../content/hero'
import { BROWSER, CONNECTORS, LAYER_COLORS, LAYER_GAP, LAYER_SCALE, mulberry32, palette, smooth } from './config'
import { createGlowPointsMaterial, createPanelMaterial, createTextTexture } from './materials'
import { useDisposable } from './useDisposable'

const SPAN = LAYER_GAP * (LAYER_SCALE.length - 1)

/**
 * Stage 3: the browser separates into frontend, API, backend and database
 * layers. Layer 0 is the browser panel itself (WebDevelopmentStage); this
 * component adds the layers behind it, the connectors and the data pulses.
 */
export function FullStackStage({ journey, pulseCount, showLabels, projectName }) {
  const layers = useRef([])
  const labels = useRef([])
  const connectorGroup = useRef()
  const project = useRef()

  const res = useDisposable(() => {
    const rand = mulberry32(5)
    const panelGeometry = new PlaneGeometry(BROWSER.w, BROWSER.h)
    const panelMaterials = LAYER_COLORS.slice(1).map((hex) =>
      createPanelMaterial({ colorHex: hex, width: BROWSER.w, height: BROWSER.h }),
    )

    // Vertical connectors from the frontend down to the database layer.
    const linePos = new Float32Array(CONNECTORS.length * 6)
    CONNECTORS.forEach(([x, y], i) => linePos.set([x, y, 0, x, y, -SPAN], i * 6))
    const lineGeometry = new BufferGeometry()
    lineGeometry.setAttribute('position', new BufferAttribute(linePos, 3))
    const lineMaterial = new LineBasicMaterial({ color: palette.cyan, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false })

    // Pulses: requests travel down, responses travel back up.
    const pulsePos = new Float32Array(pulseCount * 3)
    const pulseCol = new Float32Array(pulseCount * 3)
    const pulseScale = new Float32Array(pulseCount)
    const pulseMeta = []
    const up = new Color(palette.cyan)
    const down = new Color(palette.orchid)
    for (let i = 0; i < pulseCount; i++) {
      const dir = i % 2 === 0 ? 1 : -1
      ;(dir > 0 ? up : down).toArray(pulseCol, i * 3)
      pulseScale[i] = 0.8 + rand() * 0.6
      pulseMeta.push({ c: i % CONNECTORS.length, speed: 0.18 + rand() * 0.22, offset: rand(), dir })
    }
    const pulseGeometry = new BufferGeometry()
    pulseGeometry.setAttribute('position', new BufferAttribute(pulsePos, 3))
    pulseGeometry.setAttribute('aColor', new BufferAttribute(pulseCol, 3))
    pulseGeometry.setAttribute('aScale', new BufferAttribute(pulseScale, 1))
    const pulseMaterial = createGlowPointsMaterial({ size: 3.2, opacity: 0 })

    // Database: three stacked disks, the familiar storage silhouette.
    const diskGeometry = new CylinderGeometry(0.36, 0.36, 0.11, 40)
    const diskEdges = new EdgesGeometry(diskGeometry, 30)
    const diskMaterial = new MeshBasicMaterial({ color: '#2a1f66', transparent: true, opacity: 0, depthWrite: false })
    const diskLineMaterial = new LineBasicMaterial({ color: palette.violet, transparent: true, opacity: 0 })

    const labelTextures = showLabels ? layerLabels.map((t) => createTextTexture(t.toUpperCase(), { size: 44, weight: 500, tracking: 6, color: '#aab6dd' })) : []
    const labelMaterials = labelTextures.map((map) => new SpriteMaterial({ map, transparent: true, depthWrite: false, depthTest: false, opacity: 0 }))
    const projectTexture = createTextTexture(projectName, { size: 96, weight: 600, color: '#eef1fb' })
    const projectMaterial = new SpriteMaterial({ map: projectTexture, transparent: true, depthWrite: false, opacity: 0 })

    return {
      panelGeometry, panelMaterials, lineGeometry, lineMaterial, pulseGeometry, pulseMaterial, pulseMeta,
      diskGeometry, diskEdges, diskMaterial, diskLineMaterial, labelTextures, labelMaterials, projectTexture, projectMaterial,
    }
  }, [pulseCount, showLabels, projectName])

  useFrame((state) => {
    const j = journey
    const t = state.clock.elapsedTime
    const sep = j.separate

    for (let k = 1; k < LAYER_SCALE.length; k++) {
      const g = layers.current[k]
      if (!g) continue
      const p = smooth((sep - (k - 1) * 0.12) / 0.76)
      g.position.z = -k * LAYER_GAP * sep
      g.visible = p > 0.001
      const u = res.panelMaterials[k - 1].uniforms
      u.uOpacity.value = p
      u.uFill.value = 0.5
      u.uGrid.value = 0.55
      u.uEdge.value = 0.85
    }

    const label = smooth((sep - 0.6) / 0.4) * (1 - j.network * 0.65)
    res.labelMaterials.forEach((m, k) => {
      m.opacity = label * 0.9
      const s = labels.current[k]
      const h = 0.17 / LAYER_SCALE[k]
      s?.scale.set(h * (res.labelTextures[k].userData.aspect || 4), h, 1)
    })

    connectorGroup.current.scale.z = Math.max(sep, 1e-3)
    connectorGroup.current.visible = j.flow > 0.001
    res.lineMaterial.opacity = j.flow * 0.32
    const pu = res.pulseMaterial.uniforms
    pu.uOpacity.value = j.flow
    pu.uPixelRatio.value = state.gl.getPixelRatio()
    const pos = res.pulseGeometry.attributes.position.array
    res.pulseMeta.forEach((m, i) => {
      let f = (t * m.speed + m.offset) % 1
      if (m.dir > 0) f = 1 - f
      const [x, y] = CONNECTORS[m.c]
      pos[i * 3] = x
      pos[i * 3 + 1] = y
      pos[i * 3 + 2] = -SPAN * f
    })
    res.pulseGeometry.attributes.position.needsUpdate = true

    const db = smooth((sep - 0.5) / 0.5)
    res.diskMaterial.opacity = db * 0.55
    res.diskLineMaterial.opacity = db * 0.9

    res.projectMaterial.opacity = j.project
    const aspect = res.projectTexture.userData.aspect || 4
    project.current.scale.set(0.42 * aspect, 0.42, 1)
    project.current.position.y = BROWSER.h / 2 + 0.25 + (1 - j.project) * 0.2
  })

  const s3 = LAYER_SCALE[3]
  return (
    <group>
      {LAYER_SCALE.map((scale, k) => (
        <group key={k} ref={(el) => (layers.current[k] = el)} scale={[scale, scale, 1]}>
          {k > 0 && <mesh geometry={res.panelGeometry} material={res.panelMaterials[k - 1]} renderOrder={1} />}
          {showLabels && (
            <sprite
              ref={(el) => (labels.current[k] = el)}
              material={res.labelMaterials[k]}
              position={[-BROWSER.w / 2 - 0.12, -BROWSER.h / 2 + 0.2, 0]}
              center={[1, 0.5]}
              renderOrder={10}
            />
          )}
          {k === 3 &&
            [0, 1, 2].map((d) => (
              <group key={d} position={[-0.95 / s3, 0.05, 0.08 + d * 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                <mesh geometry={res.diskGeometry} material={res.diskMaterial} />
                <lineSegments geometry={res.diskEdges} material={res.diskLineMaterial} />
              </group>
            ))}
        </group>
      ))}
      <group ref={connectorGroup} visible={false}>
        <lineSegments geometry={res.lineGeometry} material={res.lineMaterial} />
        <points geometry={res.pulseGeometry} material={res.pulseMaterial} frustumCulled={false} />
      </group>
      <sprite ref={project} material={res.projectMaterial} position={[0, BROWSER.h / 2 + 0.25, 0.1]} center={[0.5, 0]} />
    </group>
  )
}
