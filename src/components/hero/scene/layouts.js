import { Color } from 'three'
import { BROWSER, LAYER_SCALE, mulberry32, palette } from './config'

// Procedural target layouts for the "code bars": the instanced blocks that
// start as floating code fragments, assemble into lines of code, become the
// blocks of a website layout, and finally spread across the full-stack layers.
// All coordinates are local to the browser / frontend panel (centered at 0).

const tmp = new Color()

function rect(left, y, w, h, hex, z = 0.035) {
  return { x: left + w / 2, y, w, h, hex, z }
}

const CODE_COLORS = [palette.violet, palette.cyan, palette.mist, palette.sky, palette.mist, palette.muted]

function codeLayout(count, rand) {
  const top = BROWSER.h / 2 - BROWSER.chrome - 0.16
  const bottom = -BROWSER.h / 2 + 0.2
  const rows = Math.max(8, Math.ceil(count / 2.3))
  const lineH = (top - bottom) / rows
  const barH = Math.min(0.06, lineH * 0.48)
  const left = -BROWSER.w / 2 + 0.32
  const right = BROWSER.w / 2 - 0.25
  const out = []
  let indent = 0
  for (let r = 0; out.length < count; r++) {
    const row = r % rows
    const y = top - row * lineH
    if (row > 0) indent = Math.max(0, Math.min(3, indent + (rand() < 0.35 ? 1 : rand() < 0.45 ? -1 : 0)))
    let x = left + indent * 0.2
    const tokens = row === 0 ? 3 : 1 + Math.floor(rand() * 4)
    for (let t = 0; t < tokens && out.length < count; t++) {
      const w = row === 0 ? [0.32, 0.5, 0.22][t] : 0.1 + rand() * 0.48
      if (x + w > right) break
      const hex = t === 0 ? (rand() < 0.6 ? palette.violet : palette.cyan) : CODE_COLORS[Math.floor(rand() * CODE_COLORS.length)]
      out.push({ ...rect(x, y, w, barH, hex), row, z: 0.035 + (r >= rows ? 0.01 : 0) })
      x += w + 0.07
    }
  }
  return out
}

// A small website: nav, hero copy, call-to-action, media block, three cards.
function uiLayout() {
  const L = -BROWSER.w / 2 + 0.18
  const top = BROWSER.h / 2 - BROWSER.chrome
  const r = []
  const navY = top - 0.13
  r.push(rect(L, navY, 0.3, 0.08, palette.white))
  for (let i = 0; i < 4; i++) r.push(rect(0.2 + i * 0.27, navY, 0.18, 0.035, palette.muted))
  r.push(rect(1.32, navY, 0.28, 0.1, palette.blue))

  r.push(rect(L, top - 0.45, 1.55, 0.13, palette.white))
  r.push(rect(L, top - 0.63, 1.12, 0.13, palette.white))
  r.push(rect(L, top - 0.8, 1.35, 0.035, palette.muted))
  r.push(rect(L, top - 0.88, 1.18, 0.035, palette.muted))
  r.push(rect(L, top - 0.96, 0.9, 0.035, palette.muted))
  r.push(rect(L, top - 1.13, 0.44, 0.12, palette.blue))
  r.push(rect(L + 0.52, top - 1.13, 0.4, 0.12, palette.dim))
  r.push(rect(0.15, top - 0.72, 1.45, 0.82, '#2c2166', 0.022))

  const cardW = 1.0
  const cardY = -BROWSER.h / 2 + 0.36
  for (let c = 0; c < 3; c++) {
    const cl = L + c * (cardW + 0.12)
    r.push(rect(cl, cardY, cardW, 0.5, '#141c44', 0.022))
    r.push(rect(cl + 0.08, cardY + 0.13, 0.48, 0.055, palette.mist))
    r.push(rect(cl + 0.08, cardY + 0.01, 0.8, 0.03, palette.muted))
    r.push(rect(cl + 0.08, cardY - 0.07, 0.62, 0.03, palette.muted))
  }
  return r
}

// Layer contents for API routes, backend services and database tables.
function apiLayout(count, rand, s) {
  const out = []
  const methods = [palette.cyan, palette.blue, palette.violet, palette.sky]
  const left = (-BROWSER.w / 2 + 0.25) * s
  for (let i = 0; out.length < count; i++) {
    const col = Math.floor(i / 7)
    const y = (BROWSER.h / 2 - 0.35 - (i % 7) * 0.26) * s
    const x = left + col * 1.7 * s
    out.push(rect(x, y, 0.24 * s, 0.08 * s, methods[i % methods.length]))
    if (out.length < count) out.push(rect(x + 0.32 * s, y, (0.55 + rand() * 0.7) * s, 0.045 * s, '#8fa3d6'))
  }
  return out
}

function backendLayout(count, s) {
  const out = []
  const cols = 3
  const bw = 0.95 * s
  const bh = 0.6 * s
  const left = (-BROWSER.w / 2 + 0.2) * s
  for (let i = 0; out.length < count; i++) {
    const c = i % cols
    const r = Math.floor(i / cols) % 2
    const x = left + c * (bw + 0.14 * s)
    const y = (0.45 - r * 0.85) * s
    out.push(rect(x, y, bw, bh, '#251a58', 0.022))
    if (out.length < count) out.push(rect(x + 0.1 * s, y + 0.14 * s, 0.5 * s, 0.06 * s, palette.violet))
    if (out.length < count) out.push(rect(x + 0.1 * s, y - 0.04 * s, 0.7 * s, 0.035 * s, palette.muted))
  }
  return out
}

function databaseLayout(count, s) {
  const out = []
  const left = 0.0 * s
  for (let i = 0; out.length < count; i++) {
    const c = i % 3
    const r = Math.floor(i / 3) % 8
    const y = (0.75 - r * 0.2) * s
    out.push(rect(left + c * 0.52 * s, y, 0.44 * s, r === 0 ? 0.07 * s : 0.045 * s, r === 0 ? palette.violet : '#7c6cf0'))
  }
  return out
}

export function buildBarLayouts(count, seed = 7) {
  const rand = mulberry32(seed)
  const code = codeLayout(count, rand)
  const ui = uiLayout()
  const extra = Math.max(0, count - ui.length)
  const apiCount = Math.ceil(extra * 0.36)
  const backCount = Math.ceil(extra * 0.32)
  const dbCount = extra - apiCount - backCount
  const stack = [
    ...ui.map((r) => ({ ...r, layer: 0 })),
    ...apiLayout(apiCount, rand, LAYER_SCALE[1]).map((r) => ({ ...r, layer: 1 })),
    ...backendLayout(backCount, LAYER_SCALE[2]).map((r) => ({ ...r, layer: 2 })),
    ...databaseLayout(dbCount, LAYER_SCALE[3]).map((r) => ({ ...r, layer: 3 })),
  ]

  const data = {
    count,
    scatter: new Float32Array(count * 3),
    scatterRot: new Float32Array(count * 3),
    delay: new Float32Array(count),
    phase: new Float32Array(count),
    firstLine: new Uint8Array(count),
    code: new Float32Array(count * 4), // x, y, w, h
    ui: new Float32Array(count * 4),
    stack: new Float32Array(count * 4),
    z: new Float32Array(count * 3), // code z, ui z, stack z (before layer offset)
    layer: new Uint8Array(count),
    colors: new Float32Array(count * 9), // code rgb, ui rgb, stack rgb
  }

  for (let i = 0; i < count; i++) {
    const c = code[i]
    const u = ui[i]
    const s = stack[i]
    data.firstLine[i] = c.row === 0 && i < 3 ? 1 : 0
    // Scattered fragments fill a wide volume around and behind the panel.
    data.scatter[i * 3] = (rand() - 0.5) * 12
    data.scatter[i * 3 + 1] = (rand() - 0.5) * 7
    data.scatter[i * 3 + 2] = -8 + rand() * 10.5
    data.scatterRot[i * 3] = (rand() - 0.5) * 1.2
    data.scatterRot[i * 3 + 1] = (rand() - 0.5) * 1.6
    data.scatterRot[i * 3 + 2] = (rand() - 0.5) * 0.8
    data.delay[i] = rand()
    data.phase[i] = rand() * Math.PI * 2

    data.code.set([c.x, c.y, c.w, c.h], i * 4)
    // Bars without a UI role collapse in place and reappear on a lower layer.
    data.ui.set(u ? [u.x, u.y, u.w, u.h] : [c.x, c.y, 0, 0], i * 4)
    data.stack.set([s.x, s.y, s.w, s.h], i * 4)
    data.z.set([c.z, u ? u.z : c.z, s.z], i * 3)
    data.layer[i] = s.layer

    tmp.set(c.hex).toArray(data.colors, i * 9)
    tmp.set(u ? u.hex : c.hex).toArray(data.colors, i * 9 + 3)
    tmp.set(s.hex).toArray(data.colors, i * 9 + 6)
  }

  const first = code.filter((c, i) => data.firstLine[i])
  const last = first[first.length - 1]
  data.cursor = { x: last.x + last.w / 2 + 0.08, y: last.y, h: 0.11 }
  return data
}
