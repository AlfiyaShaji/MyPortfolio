import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  IcosahedronGeometry,
  InstancedBufferAttribute,
  MeshBasicMaterial,
  Object3D,
  ShaderMaterial,
  SpriteMaterial,
} from 'three'
import { CONNECTORS, mulberry32, palette, smooth, stagger } from './config'
import { createGlowPointsMaterial, getGlowTexture } from './materials'
import { useDisposable } from './useDisposable'

const RING_Y = [1.05, 1.85, 2.6, 3.25]
const RING_R = [1.95, 1.6, 1.15, 0.62]
const LINKS_PER_NODE = 3
const dummy = new Object3D()

function buildNetwork(rings, pulseCount) {
  const rand = mulberry32(11)
  const nodes = []
  rings.forEach((n, L) => {
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + L * 0.37
      nodes.push({ ring: L, angle, r: RING_R[L] * (0.92 + rand() * 0.16), y: RING_Y[L] + (rand() - 0.5) * 0.14, delay: L / rings.length + rand() * 0.12 })
    }
  })

  // Each node links to its nearest neighbours (by angle) on the next ring;
  // the first ring also links down to a connector on the frontend layer.
  const edges = []
  nodes.forEach((a, ai) => {
    if (a.ring === 0) edges.push({ from: -1 - (ai % CONNECTORS.length), to: ai, delay: 0 })
    const next = nodes
      .map((b, bi) => ({ bi, b }))
      .filter(({ b }) => b.ring === a.ring + 1)
      .sort((p, q) => angDist(a.angle, p.b.angle) - angDist(a.angle, q.b.angle))
      .slice(0, LINKS_PER_NODE)
    next.forEach(({ bi }) => edges.push({ from: ai, to: bi, delay: (a.ring + 1) * 0.25 }))
  })

  const pulses = Array.from({ length: pulseCount }, () => ({
    edge: Math.floor(rand() * edges.length),
    speed: 0.22 + rand() * 0.3,
    offset: rand(),
  }))
  return { nodes, edges, pulses }
}

function angDist(a, b) {
  const d = Math.abs(a - b) % (Math.PI * 2)
  return d > Math.PI ? Math.PI * 2 - d : d
}

function createEdgeMaterial() {
  return new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { uDraw: { value: 0 }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aT;
      attribute float aDelay;
      attribute vec3 aColor;
      varying float vT;
      varying float vDelay;
      varying vec3 vColor;
      void main() {
        vT = aT; vDelay = aDelay; vColor = aColor;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uDraw;
      uniform float uOpacity;
      varying float vT;
      varying float vDelay;
      varying vec3 vColor;
      void main() {
        float local = clamp((uDraw * 1.75 - vDelay) / 0.75, 0.0, 1.0);
        if (vT > local || local <= 0.0) discard;
        float tip = smoothstep(local - 0.25, local, vT) * (1.0 - step(0.999, local));
        gl_FragColor = vec4(vColor, uOpacity * (0.45 + tip * 0.9));
      }
    `,
  })
}

/**
 * Stage 4: neural rings rise out of the application layers. Lives in the
 * yaw space shared with the full-stack stack so connectors line up.
 */
export function AIStage({ journey, rings, pulseCount }) {
  const nodesMesh = useRef()
  const crown = useRef()

  const res = useDisposable(() => {
    const net = buildNetwork(rings, pulseCount)
    const N = net.nodes.length
    const E = net.edges.length

    const nodeGeometry = new IcosahedronGeometry(1, 2)
    const nodeMaterial = new MeshBasicMaterial({ toneMapped: false })
    const nodeColors = new Float32Array(N * 3)
    const nodePos = new Float32Array(N * 3)
    const haloScale = new Float32Array(N)
    const ringColor = (L) => new Color(palette.cyan).lerp(new Color(palette.orchid), L / Math.max(1, rings.length - 1))
    net.nodes.forEach((n, i) => {
      ringColor(n.ring).toArray(nodeColors, i * 3)
      haloScale[i] = 1.6 + n.ring * 0.25
    })
    const haloGeometry = new BufferGeometry()
    haloGeometry.setAttribute('position', new BufferAttribute(nodePos, 3))
    haloGeometry.setAttribute('aColor', new BufferAttribute(nodeColors, 3))
    haloGeometry.setAttribute('aScale', new BufferAttribute(haloScale, 1))
    const haloMaterial = createGlowPointsMaterial({ size: 3.4, opacity: 0 })

    const edgeGeometry = new BufferGeometry()
    const edgePos = new Float32Array(E * 6)
    const edgeT = new Float32Array(E * 2)
    const edgeDelay = new Float32Array(E * 2)
    const edgeCol = new Float32Array(E * 6)
    net.edges.forEach((e, i) => {
      edgeT.set([0, 1], i * 2)
      edgeDelay.set([e.delay, e.delay], i * 2)
      const c0 = e.from < 0 ? new Color(palette.cyan) : ringColor(net.nodes[e.from].ring)
      const c1 = ringColor(net.nodes[e.to].ring)
      c0.multiplyScalar(0.8).toArray(edgeCol, i * 6)
      c1.multiplyScalar(0.8).toArray(edgeCol, i * 6 + 3)
    })
    edgeGeometry.setAttribute('position', new BufferAttribute(edgePos, 3))
    edgeGeometry.setAttribute('aT', new BufferAttribute(edgeT, 1))
    edgeGeometry.setAttribute('aDelay', new BufferAttribute(edgeDelay, 1))
    edgeGeometry.setAttribute('aColor', new BufferAttribute(edgeCol, 3))
    const edgeMaterial = createEdgeMaterial()

    const P = net.pulses.length
    const pulseGeometry = new BufferGeometry()
    const pulseCol = new Float32Array(P * 3)
    const pulseScale = new Float32Array(P)
    net.pulses.forEach((p, i) => {
      new Color(i % 3 ? palette.sky : palette.orchid).toArray(pulseCol, i * 3)
      pulseScale[i] = 0.7 + (i % 5) * 0.12
    })
    pulseGeometry.setAttribute('position', new BufferAttribute(new Float32Array(P * 3), 3))
    pulseGeometry.setAttribute('aColor', new BufferAttribute(pulseCol, 3))
    pulseGeometry.setAttribute('aScale', new BufferAttribute(pulseScale, 1))
    const pulseMaterial = createGlowPointsMaterial({ size: 2.6, opacity: 0 })

    const crownMaterial = new SpriteMaterial({ map: getGlowTexture(), color: palette.purple, blending: AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 })

    return {
      net, nodeGeometry, nodeMaterial, nodeColors, nodePos, haloGeometry, haloMaterial,
      edgeGeometry, edgeMaterial, pulseGeometry, pulseMaterial, crownMaterial,
    }
  }, [rings, pulseCount])

  useLayoutEffect(() => {
    nodesMesh.current.instanceColor = new InstancedBufferAttribute(res.nodeColors, 3)
  }, [res])

  useFrame((state) => {
    const j = journey
    const t = state.clock.elapsedTime
    const { nodes, edges, pulses } = res.net
    const pos = res.nodePos
    const sway = Math.sin(t * 0.15) * 0.08
    const cosT = Math.cos(j.tilt)
    const sinT = Math.sin(j.tilt)
    const pr = state.gl.getPixelRatio()
    const visible = j.network > 0.001
    nodesMesh.current.parent.visible = visible
    if (!visible) return

    nodes.forEach((n, i) => {
      const p = stagger(j.network, n.delay, 0.7)
      const a = n.angle + sway * (n.ring % 2 ? -1 : 1)
      const tx = Math.cos(a) * n.r
      const tz = Math.sin(a) * n.r * 0.85
      const ty = n.y + Math.sin(t * 0.6 + i) * 0.03
      // Nodes rise from the frontend layer to their ring.
      pos[i * 3] = tx * (0.4 + 0.6 * p)
      pos[i * 3 + 1] = ty * p
      pos[i * 3 + 2] = tz * (0.4 + 0.6 * p)
      const s = (0.045 + n.ring * 0.008) * smooth(p * 1.4) * (1 + Math.sin(t * 2 + i * 1.7) * 0.12 * p)
      dummy.position.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])
      dummy.scale.setScalar(Math.max(s, 1e-4))
      dummy.updateMatrix()
      nodesMesh.current.setMatrixAt(i, dummy.matrix)
    })
    nodesMesh.current.instanceMatrix.needsUpdate = true
    res.haloGeometry.attributes.position.needsUpdate = true

    const ep = res.edgeGeometry.attributes.position.array
    edges.forEach((e, i) => {
      if (e.from < 0) {
        // Connector point on the tilted frontend layer, expressed in yaw space.
        const [cx, cy] = CONNECTORS[-1 - e.from]
        ep[i * 6] = cx
        ep[i * 6 + 1] = cy * cosT
        ep[i * 6 + 2] = cy * sinT
      } else {
        ep[i * 6] = pos[e.from * 3]
        ep[i * 6 + 1] = pos[e.from * 3 + 1]
        ep[i * 6 + 2] = pos[e.from * 3 + 2]
      }
      ep[i * 6 + 3] = pos[e.to * 3]
      ep[i * 6 + 4] = pos[e.to * 3 + 1]
      ep[i * 6 + 5] = pos[e.to * 3 + 2]
    })
    res.edgeGeometry.attributes.position.needsUpdate = true
    res.edgeMaterial.uniforms.uDraw.value = j.connect
    res.edgeMaterial.uniforms.uOpacity.value = 0.55 * j.network

    const pp = res.pulseGeometry.attributes.position.array
    pulses.forEach((p, i) => {
      const f = (t * p.speed + p.offset) % 1
      const o = p.edge * 6
      pp[i * 3] = ep[o] + (ep[o + 3] - ep[o]) * f
      pp[i * 3 + 1] = ep[o + 1] + (ep[o + 4] - ep[o + 1]) * f
      pp[i * 3 + 2] = ep[o + 2] + (ep[o + 5] - ep[o + 2]) * f
    })
    res.pulseGeometry.attributes.position.needsUpdate = true

    const hu = res.haloMaterial.uniforms
    hu.uOpacity.value = 0.85 * j.network
    hu.uPixelRatio.value = pr
    const pu = res.pulseMaterial.uniforms
    pu.uOpacity.value = smooth((j.connect - 0.35) / 0.65)
    pu.uPixelRatio.value = pr

    res.crownMaterial.opacity = 0.45 * smooth(j.connect)
    crown.current.scale.setScalar(2.5 + j.connect * 3 + Math.sin(t * 0.8) * 0.15)
  })

  return (
    <group visible={false}>
      <lineSegments geometry={res.edgeGeometry} material={res.edgeMaterial} frustumCulled={false} />
      <instancedMesh ref={nodesMesh} args={[res.nodeGeometry, res.nodeMaterial, res.net.nodes.length]} frustumCulled={false} key={res.net.nodes.length} />
      <points geometry={res.haloGeometry} material={res.haloMaterial} frustumCulled={false} />
      <points geometry={res.pulseGeometry} material={res.pulseMaterial} frustumCulled={false} />
      <sprite ref={crown} material={res.crownMaterial} position={[0, RING_Y[RING_Y.length - 1] - 0.3, 0]} />
    </group>
  )
}
