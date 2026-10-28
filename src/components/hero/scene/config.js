import { Color } from 'three'

export const palette = {
  navy: '#05070f',
  blue: '#3d8bff',
  cyan: '#4cc9ff',
  sky: '#7dd3fc',
  purple: '#8b5cf6',
  violet: '#a78bfa',
  orchid: '#c084fc',
  white: '#e6e9f5',
  mist: '#c7d0ea',
  muted: '#5b678f',
  dim: '#3a4470',
}

export const color = (hex) => new Color(hex)

// The browser panel, which later becomes the frontend layer.
export const BROWSER = { w: 3.6, h: 2.3, chrome: 0.28 }
// Distance between the full-stack layers once separated (local Z).
export const LAYER_GAP = 0.95
export const LAYER_SCALE = [1, 0.94, 0.88, 0.82]
export const LAYER_COLORS = [palette.blue, palette.cyan, palette.purple, palette.violet]
// Points on the panels (local X/Y) where data connectors run between layers.
// The AI stage also links its first ring of nodes to these.
export const CONNECTORS = [
  [-1.25, 0.55], [0.85, 0.62], [-0.35, -0.15], [1.3, -0.55], [-1.45, -0.72], [0.25, 0.2],
]

// Responsive camera framing. Offsets are fractions of the viewport and move
// the rendered scene away from the HTML copy; `distance` pulls the camera back.
export const framing = {
  desktop: { offsetX: -0.17, offsetY: 0, distance: 1 },
  tablet: { offsetX: 0, offsetY: 0.26, distance: 1.18 },
  mobile: { offsetX: 0, offsetY: 0.27, distance: 1.04 },
}

// Per-tier budgets. Everything that costs GPU/CPU time scales from here.
export const budgets = {
  desktop: { dpr: [1, 1.75], particles: 2600, bars: 64, rings: [8, 10, 8, 5], pulses: 70, devices: true, labels: true, parallax: true },
  tablet: { dpr: [1, 1.5], particles: 1500, bars: 52, rings: [7, 8, 7, 4], pulses: 48, devices: true, labels: false, parallax: false },
  mobile: { dpr: [1, 1.5], particles: 800, bars: 40, rings: [6, 7, 5, 3], pulses: 30, devices: false, labels: false, parallax: false },
}

export function getBudget(tier, lowPower) {
  const base = budgets[tier] ?? budgets.desktop
  if (!lowPower) return base
  return {
    ...base,
    dpr: [1, Math.min(base.dpr[1], 1.25)],
    particles: Math.round(base.particles * 0.6),
    pulses: Math.round(base.pulses * 0.6),
  }
}

// Shared helpers
export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
export const smooth = (v) => {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}
// Per-instance stagger: maps global progress g to a local 0..1 with delay d.
export const stagger = (g, d, spread = 0.45) => smooth((g * (1 + spread) - d * spread) / 1)

export function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
